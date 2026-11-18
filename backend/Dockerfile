# ==============================================================================
# DOCKERFILE CHO BACKEND API (FastAPI + SQLAlchemy + Alembic)
# Giải thích từng dòng để phục vụ bảo vệ đồ án ĐG2:
# - Vì sao không chạy container bằng quyền `root`?
#   Nếu chạy ứng dụng bằng `root` (UID 0), khi kẻ tấn công khai thác được lỗ hổng
#   RCE (Remote Code Execution) hoặc Container Escape, họ sẽ có toàn quyền `root`
#   trên container và có nguy cơ leo thang đặc quyền sang máy chủ vật lý (Host).
#   Chạy bằng user thường (`appuser`, UID 1000) tuân thủ nguyên tắc Đặc quyền tối
#   thiểu (Principle of Least Privilege), cô lập phạm vi ảnh hưởng nếu bị tấn công.
# ==============================================================================

# 1. Sử dụng base image Python 3.12 bản slim (nhẹ, giảm bề mặt tấn công so với bản full)
FROM python:3.12-slim

# 2. Thiết lập các biến môi trường cho Python:
# - PYTHONDONTWRITEBYTECODE=1: Không sinh file .pyc ra đĩa
# - PYTHONUNBUFFERED=1: Log in trực tiếp ra stdout/stderr theo thời gian thực cho Docker logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Thiết lập thư mục làm việc chính bên trong container
WORKDIR /app

# 4. Cài đặt các gói hệ thống cần thiết (libpq-dev, gcc cho psycopg2, curl cho healthcheck)
# và xóa cache apt ngay trong cùng 1 layer để giảm dung lượng image
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 5. Tạo group `appuser` (GID 1000) và user `appuser` (UID 1000) không có quyền root
RUN groupadd -g 1000 appuser && \
    useradd -r -u 1000 -g appuser -d /app -s /sbin/nologin appuser

# 6. Sao chép file requirements.txt trước để tận dụng cơ chế Docker Layer Caching
# (Chỉ cài lại thư viện khi requirements.txt thay đổi, không cài lại khi sửa code)
COPY requirements.txt .

# 7. Cài đặt các thư viện Python từ requirements.txt và không lưu cache pip
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 8. Sao chép toàn bộ mã nguồn backend vào thư mục /app
COPY . .

# 9. Đảm bảo thư mục uploads tồn tại, cấp quyền thực thi cho entrypoint.sh
# và chuyển quyền sở hữu toàn bộ /app và /app/uploads cho `appuser`
RUN mkdir -p /app/uploads && \
    sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    chown -R appuser:appuser /app /app/uploads

# 10. Chuyển sang người dùng non-root `appuser` trước khi chạy ứng dụng
USER appuser

# 11. Mở cổng 8000 cho dịch vụ FastAPI
EXPOSE 8000

# 12. Chạy script khởi động (tự động migrate CSDL, seed dữ liệu mẫu và bật Uvicorn server)
ENTRYPOINT ["/app/entrypoint.sh"]
