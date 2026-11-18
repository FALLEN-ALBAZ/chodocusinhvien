# ==============================================================================
# DOCKERFILE MULTI-STAGE CHO FRONTEND (React + Vite) & NGINX REVERSE PROXY
# Giải thích từng dòng để phục vụ bảo vệ đồ án ĐG2:
# - Multi-stage build giúp tách biệt môi trường Build (cần Node.js, npm, node_modules
#   nặng hàng trăm MB) và môi trường Runtime (chỉ chứa các file tĩnh HTML/CSS/JS
#   đã đóng gói + Nginx nhẹ vài chục MB), giúp giảm kích thước image và tăng bảo mật.
# - Stage 2 sử dụng `nginxinc/nginx-unprivileged:alpine` chạy mặc định dưới user
#   non-root `nginx` (UID 101) trên cổng 8080.
# ==============================================================================

# --- STAGE 1: BUILD REACT FRONTEND ---
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc khi build
WORKDIR /app

# Truyền biến môi trường lúc build cho Vite
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Sao chép package.json và package-lock.json trước để tận dụng Docker Layer Cache
COPY frontend/package*.json ./

# Cài đặt dependencies của Frontend
RUN npm ci

# Sao chép các file cấu hình và mã nguồn Frontend (tránh copy đè node_modules/dist từ máy host)
COPY frontend/index.html frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js ./
COPY frontend/src ./src
RUN npm run build

# --- STAGE 2: SERVE VỚI NON-ROOT NGINX ---
FROM nginxinc/nginx-unprivileged:alpine

# Sao chép cấu hình Nginx Reverse Proxy vào container
COPY --chown=nginx:nginx nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép kết quả build tĩnh từ Stage 1 sang thư mục phục vụ web của Nginx
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

# Đảm bảo container chạy dưới user non-root `nginx` (UID 101)
USER nginx

# Mở cổng 8080 (cổng unprivileged của Nginx non-root)
EXPOSE 8080

# Khởi chạy Nginx ở chế độ foreground
CMD ["nginx", "-g", "daemon off;"]
