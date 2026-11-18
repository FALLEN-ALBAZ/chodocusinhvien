#!/usr/bin/env bash
# ==============================================================================
# Kịch bản khởi chạy nhanh Chợ Đồ Cũ Sinh Viên (chodocusinhvien) trên máy cục bộ
# Học phần: Lập trình mã nguồn mở (POS02024) - Đề tài 4
# Nhóm thực hiện: Nhóm 4 – Lớp CT2802 | GVHD: ThS. Đỗ Văn Tuyên
# Thành viên:
#   1. Nguyễn Hải Long (Trưởng nhóm, DevOps)
#   2. Nguyễn Đức Anh (Back-end API & Bảo mật)
#   3. Nguyễn Huy Hoàng (Front-end UI/UX)
#   4. Hoàng Nhật Thắng (CSDL & Kiểm thử QA)
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "======================================================================"
echo "  CHỢ ĐỒ CŨ SINH VIÊN (chodocusinhvien) - KHỞI CHẠY DEMO CỤC BỘ"
echo "  Học phần: POS02024 | Nhóm 4 – Lớp CT2802 | GVHD: ThS. Đỗ Văn Tuyên"
echo "======================================================================"
echo ""
echo "💡 Lưu ý: Để chạy bằng Docker (khuyến nghị chuẩn ĐG2), dùng lệnh:"
echo "   docker compose up --build -d"
echo ""

cleanup() {
    echo ""
    echo "🛑 Đang dừng các tiến trình Backend và Frontend..."
    if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Xác định trình thông dịch Python cho Backend
PYTHON_BIN="python3"
if [[ -x "$BACKEND_DIR/.venv/bin/python" ]]; then
    PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
elif [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
    PYTHON_BIN="$ROOT_DIR/.venv/bin/python"
fi

echo "🚀 [1/2] Khởi động FastAPI Backend trên cổng 8000 (SQLite + Auto-Seed)..."
(
    cd "$BACKEND_DIR"
    export AUTO_SEED=true
    "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

sleep 2

echo "🚀 [2/2] Khởi động React + Vite Frontend trên cổng 5173..."
(
    cd "$FRONTEND_DIR"
    if [[ ! -d "node_modules" ]]; then
        echo "📦 Đang cài đặt phụ thuộc npm cho Frontend..."
        npm install
    fi
    npm run dev -- --host 0.0.0.0 --port 5173
) &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "✅ HỆ THỐNG ĐÃ SẴN SÀNG PHỤC VỤ DEMO BẢO VỆ ĐG2:"
echo "   🌐 Giao diện Web (Vite Dev):     http://localhost:5173"
echo "   🌐 Giao diện Tích hợp (FastAPI): http://localhost:8000"
echo "   📘 Tài liệu Swagger UI (/docs):  http://localhost:8000/docs"
echo "   🩺 Kiểm tra Healthcheck:         http://localhost:8000/api/v1/health"
echo "======================================================================"
echo "Nhấn Ctrl+C để dừng đồng thời cả Backend và Frontend."
echo ""

wait
