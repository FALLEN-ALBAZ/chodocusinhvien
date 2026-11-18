import json
import logging
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import (
    auth,
    categories,
    listings,
    moderation,
    offers,
    reports,
    reviews,
    stats,
    uploads,
    users,
)
from app.seed import seed_database

# Cấu hình Structured Logging chuẩn JSON phục vụ quan sát vận hành (Observability - ĐG2)
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
)
logger = logging.getLogger("chodocusinhvien.api")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Khởi tạo cấu trúc bảng và nạp dữ liệu mẫu idempotent khi ứng dụng khởi động."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    except SQLAlchemyError as exc:
        logger.warning(json.dumps({"event": "seed_skipped", "detail": str(exc)}))
    finally:
        db.close()
    yield


OPENAPI_DESCRIPTION = """
## Hệ thống RESTful API — Chợ Đồ Cũ Sinh Viên (`chodocusinhvien`)

Nền tảng kết nối trao đổi, mua bán giáo trình, đồ điện tử, đồ gia dụng phòng trọ và phương tiện di chuyển dành riêng cho cộng đồng sinh viên.

### Các phân hệ nghiệp vụ chính:
1. **Xác thực & Phân quyền (`Auth & RBAC`)**: Đăng ký, đăng nhập JWT (`HS256`), băm mật khẩu `bcrypt`, phân quyền 3 cấp độ (`STUDENT`, `MODERATOR`, `ADMIN`).
2. **Danh mục & Đăng tin (`Categories & Listings`)**: Tìm kiếm đa tiêu chí, lọc khoảng giá, tình trạng, phân trang, kiểm soát giới hạn số tin đăng mới mỗi ngày (`DAILY_LISTING_LIMIT`).
3. **Danh sách Yêu thích (`Favorites N:N`)**: Lưu và bỏ lưu tin đăng quan tâm qua bảng trung gian `favorites`.
4. **Kiểm duyệt Nội dung & Báo cáo (`Moderation & Reports`)**: Quy trình duyệt tin (`PENDING` -> `APPROVED` / `REJECTED`) và xử lý báo cáo vi phạm.
5. **Đề nghị Mua hàng & Đánh giá Uy tín (`Offers & Reviews`)**: Trả giá, chốt đơn tự động khóa tin (`SOLD`) và tính điểm uy tín trung bình (`reputation_score`) của người bán.
"""

app = FastAPI(
    title="Chợ Đồ Cũ Sinh Viên API",
    description=OPENAPI_DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Cấu hình CORS cho phép Frontend SPA giao tiếp an toàn với Backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    """
    Middleware ghi Structured Log (JSON) cho mỗi HTTP Request:
    Ghi nhận timestamp, method, path, query, status_code và duration_ms.
    """
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    log_entry = {
        "timestamp": datetime.now(UTC).isoformat(),
        "level": "INFO" if response.status_code < 400 else "WARNING",
        "method": request.method,
        "path": request.url.path,
        "query": str(request.url.query) if request.url.query else "",
        "status_code": response.status_code,
        "duration_ms": duration_ms,
    }
    logger.info(json.dumps(log_entry, ensure_ascii=False))
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    return response


# Đảm bảo thư mục lưu trữ ảnh tải lên luôn tồn tại trước khi mount StaticFiles
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.get(
    "/api/v1/health",
    status_code=status.HTTP_200_OK,
    tags=["0. Kiểm tra Sức khỏe Hệ thống (Health Check)"],
    summary="Kiểm tra trạng thái hoạt động của dịch vụ Backend API",
    description="Endpoint dùng cho Docker Healthcheck, CI/CD Pipeline và hệ thống giám sát.",
)
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "chodocusinhvien-backend",
        "version": "1.0.0",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def root() -> dict[str, str]:
    return {
        "message": "Chào mừng đến với Chợ Đồ Cũ Sinh Viên API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


# Đăng ký toàn bộ các Routers nghiệp vụ dưới prefix /api/v1
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(uploads.router)
app.include_router(listings.router)
app.include_router(users.router)
app.include_router(moderation.router)
app.include_router(offers.router)
app.include_router(reviews.router)
app.include_router(reports.router)
app.include_router(stats.router)
