from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.category import CategoryCreateRequest, CategoryResponse
from app.security.auth import require_roles

router = APIRouter(prefix="/api/v1/categories", tags=["2. Danh mục sản phẩm (Categories)"])

StaffUserDep = Annotated[User, Depends(require_roles(UserRole.MODERATOR, UserRole.ADMIN))]


@router.get(
    "",
    response_model=list[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Danh sách toàn bộ danh mục đồ cũ",
    description="Trả về danh sách tất cả các danh mục sản phẩm hiện có trên hệ thống (Công khai).",
)
def list_categories(
    db: Annotated[Session, Depends(get_db)],
) -> list[CategoryResponse]:
    categories = db.query(Category).order_by(Category.id.asc()).all()
    return [CategoryResponse.model_validate(cat) for cat in categories]


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo danh mục sản phẩm mới (Kiểm duyệt viên / Quản trị viên)",
    description=(
        "Chỉ tài khoản có quyền `MODERATOR` hoặc `ADMIN` mới được phép thêm danh mục mới. "
        "Trả về `403 Forbidden` nếu Sinh viên (`STUDENT`) gọi API này, và `409 Conflict` nếu tên hoặc slug đã tồn tại."
    ),
)
def create_category(
    payload: CategoryCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    _current_user: StaffUserDep,
) -> CategoryResponse:
    clean_name = payload.name.strip()
    clean_slug = (payload.slug or "").strip()

    existing = (
        db.query(Category)
        .filter(
            or_(
                func.lower(Category.name) == clean_name.lower(),
                func.lower(Category.slug) == clean_slug.lower(),
            )
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Danh mục '{clean_name}' hoặc slug '{clean_slug}' đã tồn tại trên hệ thống.",
        )

    category = Category(
        name=clean_name,
        slug=clean_slug,
        description=payload.description.strip() if payload.description else None,
        icon=payload.icon or "Package",
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return CategoryResponse.model_validate(category)
