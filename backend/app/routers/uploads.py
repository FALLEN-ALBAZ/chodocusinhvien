import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import settings
from app.models.user import User
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/v1/uploads", tags=["3. Tải lên hình ảnh (Uploads)"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/images",
    status_code=status.HTTP_201_CREATED,
    summary="Tải lên hình ảnh minh họa cho tin đăng",
    description=(
        "Cho phép người dùng đã đăng nhập tải lên một hoặc nhiều tệp ảnh (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). "
        "Ảnh được đổi tên bằng UUID ngẫu nhiên để chống lỗ hổng Path Traversal và lưu vào thư mục tĩnh `/uploads`."
    ),
)
async def upload_images(
    files: Annotated[
        list[UploadFile],
        File(..., description="Danh sách tệp hình ảnh cần tải lên"),
    ],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, list[str]]:
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng chọn ít nhất một tệp ảnh để tải lên.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    image_urls: list[str] = []
    for file in files:
        filename = file.filename or ""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Định dạng tệp '{filename}' không được hỗ trợ. "
                    f"Chỉ chấp nhận các định dạng ảnh: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
                ),
            )

        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tệp '{filename}' rỗng.",
            )
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tệp '{filename}' vượt quá dung lượng tối đa 10MB.",
            )

        safe_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = upload_dir / safe_filename
        file_path.write_bytes(content)
        image_urls.append(f"/uploads/{safe_filename}")

    return {"image_urls": image_urls}
