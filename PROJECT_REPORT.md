# NHẬT KÝ & BÁO CÁO KIỂM THỬ DỰ ÁN: CHỢ ĐỒ CŨ SINH VIÊN (`chodocusinhvien`)

> **Tài liệu Minh bạch & Kiểm toán Chất lượng Dự án (QA & Project Audit Log)**  
> **Đơn vị thực hiện kiểm thử & lập báo cáo:** **Tác nhân Kiểm thử & Báo cáo** (Độc lập, Lấy Người dùng làm trung tâm)  
> **Kho lưu trữ (Repository):** `/home/antigravity/FALLEN-ALBAZ/chodocusinhvien`  
> **Chuẩn đối chiếu:** Yêu cầu Bài Tập Lớn ĐG2 (`DDG2_Bài_Tập_Lớn.docx`)

---

## 1. TỔNG QUAN DỰ ÁN & HỆ THỐNG CÁC TÁC NHÂN (AGENTS & ACTORS)

### 1.1. Tổng quan Dự án
**Chợ Đồ Cũ Sinh Viên (`chodocusinhvien`)** là nền tảng web thương mại điện tử C2C (Customer-to-Customer) chuyên biệt dành cho cộng đồng sinh viên trao đổi, mua bán giáo trình, đồ điện tử, đồ gia dụng phòng trọ, nội thất, phương tiện di chuyển và phụ kiện đã qua sử dụng. Dự án được thiết kế theo kiến trúc Full-stack hiện đại, đóng gói hoàn chỉnh bằng Docker & Docker Compose và tích hợp quy trình kiểm thử tự động CI/CD trên GitHub Actions nhằm đáp ứng tuyệt đối bộ tiêu chí chấm điểm Bài Tập Lớn ĐG2.

### 1.2. Cơ cấu Đội ngũ 5 Tác nhân Kỹ thuật (Lấy Người dùng làm Trung tâm)
Mọi bước triển khai trong dự án đều tuân thủ quy trình **Phê duyệt từng bước lấy Người dùng làm trung tâm** (Thực thi -> Kiểm thử độc lập -> Báo cáo minh bạch -> Trình Người dùng phê duyệt trước khi chuyển sang bước tiếp theo):

| STT | Tên Tác nhân Kỹ thuật | Vai trò & Trách nhiệm chính |
| :-: | :--- | :--- |
| **1** | **Tác nhân Trưởng nhóm & DevOps** | Thiết kế kiến trúc tổng thể, quản lý cấu trúc thư mục, cấu hình Docker multi-stage (non-root), `docker-compose.yml`, Nginx Reverse Proxy, `.env.example`, GitHub Actions CI/CD và tài liệu kỹ thuật/bảo vệ đồ án. |
| **2** | **Tác nhân Cơ sở dữ liệu** | Thiết kế ERD 8 bảng đạt chuẩn 3NF (`users`, `categories`, `listings`, `listing_images`, `favorites`, `offers`, `reviews`, `reports`), lập trình SQLAlchemy 2.0 ORM Models, cấu hình Alembic Migrations (`upgrade`/`downgrade`) và kịch bản Seed Data tự động. |
| **3** | **Tác nhân Phát triển Backend** | Xây dựng RESTful API với FastAPI, xác thực JWT + Bcrypt, phân quyền RBAC theo vai trò người dùng, kiểm chứng dữ liệu Pydantic v2, xử lý các quy tắc nghiệp vụ cốt lõi và upload đa ảnh an toàn. |
| **4** | **Tác nhân Phát triển Frontend** | Xây dựng giao diện SPA với React 18 + Vite + TailwindCSS, tích hợp Axios Interceptor, quản lý trạng thái xác thực, xử lý đầy đủ trạng thái giao diện (Loading/Error/Empty/Toast) và đáp ứng toàn bộ màn hình chức năng. |
| **5** | **Tác nhân Kiểm thử & Báo cáo** | Kiểm thử độc lập mọi hạng mục (Unit Test, Integration Test, Coverage ≥ 70%, cấu hình hạ tầng/bảo mật/CSDL/API), đối chiếu khắt khe với tiêu chí ĐG2 và duy trì nhật ký `PROJECT_REPORT.md` báo cáo trực tiếp cho Người dùng. |

### 1.3. Danh sách 5 Tác nhân Người dùng trên Hệ thống Nghiệp vụ
Hệ thống phục vụ 5 nhóm tác nhân người dùng thực tế trong môi trường đại học:

| STT | Tên Tác nhân Người dùng | Vai trò trong Hệ thống (`UserRole`) | Quyền hạn & Nghiệp vụ chính |
| :-: | :--- | :---: | :--- |
| **1** | **Khách vãng lai** | Chưa đăng nhập | Xem danh sách tin đăng đã duyệt (`APPROVED`), tìm kiếm theo từ khóa, lọc theo danh mục/khoảng giá/tình trạng, xem chi tiết sản phẩm, đăng ký và đăng nhập. |
| **2** | **Sinh viên Bán hàng** | `STUDENT` | Đăng tin bán đồ cũ (giới hạn tối đa 5 tin/ngày, trạng thái khởi tạo `PENDING`), tải lên nhiều hình ảnh minh họa, chỉnh sửa/xóa tin của mình, phản hồi đề nghị trả giá (`ACCEPTED`/`REJECTED`), đánh dấu đã bán (`SOLD`). |
| **3** | **Sinh viên Mua hàng** | `STUDENT` | Lưu tin yêu thích (`favorites` N:N), gửi đề nghị mua/trả giá (`offers`), viết đánh giá sao & nhận xét (`reviews` từ 1-5 sao) sau khi giao dịch thành công, gửi báo cáo tin vi phạm (`reports`). |
| **4** | **Kiểm duyệt viên** | `MODERATOR` | Kiểm duyệt các tin đăng chờ duyệt (`PENDING` -> `APPROVED` hoặc `REJECTED` kèm lý do từ chối), tiếp nhận và xử lý các báo cáo vi phạm cộng đồng (`RESOLVED`/`DISMISSED`). |
| **5** | **Quản trị viên** | `ADMIN` | Toàn quyền quản trị hệ thống: quản lý danh mục sản phẩm (`categories`), quản lý tài khoản người dùng (khóa/mở khóa, phân quyền), thống kê tổng quan và toàn bộ quyền kiểm duyệt. |

---

## 2. NHẬT KÝ TRIỂN KHAI DỰ ÁN (PROJECT TIMELINE)

### 📌 Bước 0: Khởi tạo Đội ngũ & Phê duyệt Kế hoạch Dự án v2.1
- **Thời điểm:** `2026-11-18`
- **Nội dung thực hiện:**
  1. Phân tích toàn diện tài liệu yêu cầu `DDG2_Bài_Tập_Lớn.docx`.
  2. Thành lập đội ngũ 5 Tác nhân Kỹ thuật chuyên trách và chuẩn hóa mô hình 5 Tác nhân Người dùng.
  3. Lập Kế hoạch Dự án bao phủ toàn bộ các hạng mục chấm điểm ĐG2 (CSDL 8 bảng chuẩn 3NF + Alembic Migration + Seed Data, Backend FastAPI phân tầng + RBAC + quy tắc nghiệp vụ, Kiểm thử tự động `pytest` ≥ 70% coverage, Frontend React + Vite, Docker non-root & Docker Compose 3 services).
- **Quyết định của Người dùng:** **ĐÃ PHÊ DUYỆT** Kế hoạch Dự án và cho phép triển khai tuần tự từng bước.

---

### 📌 Bước 1: Thiết lập Khung Dự Án, Docker (Non-root), Docker Compose 3 Services & CI/CD
- **Thời điểm:** `2026-11-18 09:18 - 09:22 UTC`
- **Tác nhân thực hiện:** **Tác nhân Trưởng nhóm & DevOps**
- **Tác nhân kiểm định độc lập:** **Tác nhân Kiểm thử & Báo cáo**

#### 2.1. Danh sách các Thư mục & Tập tin đã khởi tạo ở Bước 1

| STT | Đường dẫn Tập tin / Thư mục | Mô tả Chức năng | Dung lượng / Quyền |
| :-: | :--- | :--- | :---: |
| 1 | `.gitignore` | Loại trừ `.env`, `.env.*` (giữ lại `!.env.example`), `__pycache__/`, `node_modules/`, `dist/`, `.coverage`, `*.db`, `backend/uploads/*`. | `690 bytes` (`-rw-r--r--`) |
| 2 | `LICENSE` | Giấy phép mã nguồn mở MIT License (Copyright 2026 Chợ Đồ Cũ Sinh Viên Contributors). | `1114 bytes` (`-rw-r--r--`) |
| 3 | `.env.example` | Mẫu cấu hình biến môi trường đầy đủ: PostgreSQL, SQLAlchemy `DATABASE_URL`, JWT (`JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`), `DAILY_LISTING_LIMIT=5`, `APP_PORT=80`, `VITE_API_BASE_URL=/api/v1`. | `1202 bytes` (`-rw-r--r--`) |
| 4 | `backend/requirements.txt` | Danh sách thư viện Python cố định phiên bản: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `psycopg2-binary`, `pydantic[email]`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `bcrypt==4.0.1`, `python-multipart`, `pytest`, `pytest-cov`, `httpx`, `ruff`. | `301 bytes` (`-rw-r--r--`) |
| 5 | `backend/Dockerfile` | Dockerfile cho FastAPI sử dụng `python:3.12-slim`, tối ưu layer cache, tạo group/user `appuser` (UID/GID `1000`), phân quyền `/app` & `/app/uploads`, chạy dưới `USER appuser`. | `2957 bytes` (`-rw-r--r--`) |
| 6 | `backend/entrypoint.sh` | Script khởi động tự động 3 bước: `alembic upgrade head` -> `python -m app.seed` -> `exec uvicorn app.main:app --host 0.0.0.0 --port 8000`. | `719 bytes` (`-rwxr-xr-x`) |
| 7 | `nginx/nginx.conf` | Cấu hình Nginx lắng nghe cổng `8080` (non-root), phục vụ React SPA (`try_files $uri $uri/ /index.html`) và Reverse Proxy cho `/api/`, `/docs`, `/redoc`, `/openapi.json`, `/uploads/` sang `http://api:8000`. | `2590 bytes` (`-rw-r--r--`) |
| 8 | `frontend/Dockerfile` | Multi-stage Dockerfile: Stage 1 (`node:20-alpine`) build ứng dụng React/Vite; Stage 2 (`nginxinc/nginx-unprivileged:alpine`) chạy dưới `USER nginx` (UID `101`) tại cổng `8080`. | `1957 bytes` (`-rw-r--r--`) |
| 9 | `docker-compose.yml` | Định nghĩa 3 services (`db`, `api`, `frontend`), mạng nội bộ `chodocu_net`, persistent volumes (`postgres_data`, `uploads_data`), và `healthcheck` cho cả `db` (`pg_isready`) lẫn `api`. | `3461 bytes` (`-rw-r--r--`) |
| 10 | `.github/workflows/ci.yml` | Pipeline GitHub Actions gồm 3 jobs: `security-and-lint` (chặn commit `.env` + `ruff check .`), `backend-test` (PostgreSQL 16 service + Alembic `upgrade`/`downgrade`/`upgrade` + `pytest --cov-fail-under=70`), và `frontend-build` (`npm ci && npm run build`). | `4089 bytes` (`-rw-r--r--`) |

#### 2.2. Biên bản Kiểm thử Độc lập Bước 1 (Thực hiện bởi **Tác nhân Kiểm thử & Báo cáo**)

| Mã TC | Hạng mục Kiểm tra (Đối chiếu tiêu chí ĐG2) | Phương pháp Kiểm tra | Kết quả Thực tế | Đánh giá |
| :-: | :--- | :--- | :--- | :-: |
| **TC-1.01** | **Bảo mật biến môi trường (`.env`)** | Chạy `find . -name ".env*"` và kiểm tra `git status -u`, đọc nội dung `.gitignore` & `.env.example`. | Chỉ tồn tại duy nhất `.env.example`. `.gitignore` có quy tắc chặn `.env`, `.env.*` và ngoại lệ `!.env.example`. | ✅ **PASS** |
| **TC-1.02** | **Non-root Container ở Backend (`backend/Dockerfile`)** | Kiểm tra mã nguồn `backend/Dockerfile` (dòng 33-54). | Tạo `appuser` (UID/GID `1000`), cấp quyền sở hữu `/app` và `/app/uploads`, chuyển ngữ cảnh bằng chỉ thị `USER appuser`. | ✅ **PASS** |
| **TC-1.03** | **Quyền thực thi & Tự động hóa của `backend/entrypoint.sh`** | Kiểm tra `ls -la backend/entrypoint.sh` và đọc nội dung script. | Quyền file là `-rwxr-xr-x` (`chmod +x`). Thực thi tuần tự `alembic upgrade head`, `python -m app.seed`, và `exec uvicorn`. | ✅ **PASS** |
| **TC-1.04** | **Multi-stage & Non-root Container ở Frontend (`frontend/Dockerfile` + `nginx/nginx.conf`)** | Kiểm tra `frontend/Dockerfile` và `nginx/nginx.conf`. | Stage 1 dùng `node:20-alpine AS builder`; Stage 2 dùng `nginxinc/nginx-unprivileged:alpine` với chỉ thị `USER nginx` (cổng `8080`). | ✅ **PASS** |
| **TC-1.05** | **Kiến trúc `docker-compose.yml` ≥ 3 Services, Healthcheck & Persistent Volumes** | Kiểm tra nội dung `docker-compose.yml` và xác thực cú pháp YAML (`yaml.safe_load`). | Có đủ 3 services (`db`, `api`, `frontend`), `healthcheck` bằng `pg_isready`, `depends_on: service_healthy`, và 2 named volumes. | ✅ **PASS** |
| **TC-1.06** | **Quy trình CI/CD (`.github/workflows/ci.yml`)** | Kiểm tra nội dung `.github/workflows/ci.yml` và xác thực cú pháp YAML. | Đầy đủ 3 jobs: kiểm tra `.env` + `ruff check .`, Alembic `upgrade`/`downgrade`/`upgrade` + `pytest --cov-fail-under=70`, và `frontend-build`. | ✅ **PASS** |
| **TC-1.07** | **Thư viện Backend (`backend/requirements.txt`) & Giấy phép (`LICENSE`)** | Kiểm tra `backend/requirements.txt` và `LICENSE`. | Đã ghim `bcrypt==4.0.1` tương thích tốt với Python 3.12; có `LICENSE` chuẩn MIT. | ✅ **PASS** |

- **Quyết định của Người dùng cho Bước 1:** **ĐÃ PHÊ DUYỆT (APPROVED)**.

---

### 📌 Bước 2: Thiết kế CSDL 8 Bảng Chuẩn 3NF, SQLAlchemy Models, Alembic Migrations & Dữ Liệu Mẫu (Seed Data)
- **Thời điểm:** `2026-11-18 09:28 - 09:38 UTC`
- **Tác nhân thực hiện:** **Tác nhân Cơ sở dữ liệu**
- **Tác nhân kiểm định độc lập:** **Tác nhân Kiểm thử & Báo cáo**

#### 2.3. Danh sách các Tập tin đã khởi tạo ở Bước 2

| STT | Đường dẫn Tập tin | Mô tả Chức năng & Thiết kế CSDL |
| :-: | :--- | :--- |
| 1 | `backend/app/config.py` | Cấu hình trung tâm sử dụng `pydantic-settings` (`Settings`), đọc biến môi trường từ `.env` và hỗ trợ fallback an toàn cho môi trường dev/test. |
| 2 | `backend/app/database.py` | Khởi tạo SQLAlchemy `engine`, `SessionLocal`, `Base`, dependency `get_db()`, và sự kiện tự động bật `PRAGMA foreign_keys=ON` khi chạy trên SQLite. |
| 3 | `backend/app/models/enums.py` | Định nghĩa 5 lớp Enum chuẩn hóa trạng thái & phân quyền: `UserRole` (`STUDENT`, `MODERATOR`, `ADMIN`), `ItemCondition` (`NEW`, `LIKE_NEW`, `GOOD`, `FAIR`), `ListingStatus` (`PENDING`, `APPROVED`, `REJECTED`, `SOLD`), `OfferStatus` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`), `ReportStatus` (`PENDING`, `RESOLVED`, `DISMISSED`). |
| 4 | `backend/app/models/user.py` | Model `User` (bảng `users`): quản lý thông tin định danh, mật khẩu băm `password_hash`, vai trò `role`, điểm uy tín `reputation_score`, tổng đánh giá `total_reviews` và các mối quan hệ 1:N / N:N. |
| 5 | `backend/app/models/category.py` | Model `Category` (bảng `categories`): quản lý danh mục đồ cũ sinh viên (`name`, `slug` unique, `description`, `icon`). |
| 6 | `backend/app/models/listing.py` | Gồm 3 Models: `Listing` (bảng `listings` với `CheckConstraint("price >= 0")`), `ListingImage` (bảng `listing_images` quan hệ 1:N với `listings`), và `Favorite` (bảng trung gian `favorites` quan hệ N:N giữa `users` và `listings` với khóa chính tổ hợp `(user_id, listing_id)`). |
| 7 | `backend/app/models/offer.py` | Model `Offer` (bảng `offers`): quản lý đề nghị mua hàng/trả giá của Sinh viên Mua hàng với `CheckConstraint("offered_price > 0")`. |
| 8 | `backend/app/models/review.py` | Model `Review` (bảng `reviews`): quản lý đánh giá sau giao dịch (quan hệ 1:1 với `listings` qua `unique=True` trên `listing_id`) kèm `CheckConstraint("rating >= 1 AND rating <= 5")`. |
| 9 | `backend/app/models/report.py` | Model `Report` (bảng `reports`): quản lý báo cáo tin đăng vi phạm cộng đồng và ghi chú xử lý của Kiểm duyệt viên (`moderator_note`). |
| 10 | `backend/app/models/__init__.py` | Export tập trung toàn bộ 8 Models và 5 Enums phục vụ Alembic autogenerate và tầng Services/Routers. |
| 11 | `backend/alembic.ini` & `backend/alembic/env.py` | Cấu hình Alembic tự động lấy `settings.DATABASE_URL` và `Base.metadata`, hỗ trợ `render_as_batch` khi migrate. |
| 12 | `backend/alembic/versions/0001_initial_schema.py` | Bản migration khởi tạo đầy đủ 8 bảng, toàn bộ chỉ mục (`index`), khóa ngoại (`ForeignKeyConstraint` với `CASCADE`/`RESTRICT`) và ràng buộc toàn vẹn (`CheckConstraint`); hàm `downgrade()` xóa sạch 8 bảng theo đúng thứ tự ngược lại. |
| 13 | `backend/app/seed.py` | Kịch bản khởi tạo dữ liệu mẫu có tính chất **idempotent** (chạy nhiều lần không tạo trùng): tạo 4 tài khoản đại diện cho các tác nhân người dùng, 6 danh mục, 10 tin đăng (đủ các trạng thái `APPROVED`, `PENDING`, `SOLD`, `REJECTED`), 20 hình ảnh, 3 lượt yêu thích, 2 đề nghị trả giá, 1 đánh giá 5 sao và 1 báo cáo vi phạm. |

#### 2.4. Biên bản Kiểm thử Thực tế Độc lập Bước 2 (Thực hiện bởi **Tác nhân Kiểm thử & Báo cáo**)

| Mã TC | Hạng mục Kiểm tra | Lệnh / Kịch bản Thực thi | Kết quả Thực tế | Đánh giá |
| :-: | :--- | :--- | :--- | :-: |
| **TC-2.01** | **Kiểm tra `alembic downgrade base`** | Chạy `python3 -m alembic downgrade base` và kiểm tra danh sách bảng. | `AFTER_DOWNGRADE_TABLES: []` — Toàn bộ 8 bảng nghiệp vụ được thu hồi sạch sẽ. | ✅ **PASS** |
| **TC-2.02** | **Kiểm tra `alembic upgrade head`** | Chạy `python3 -m alembic upgrade head` và đối chiếu danh sách bảng trong CSDL. | Khởi tạo chính xác 8 bảng: `['categories', 'favorites', 'listing_images', 'listings', 'offers', 'reports', 'reviews', 'users']`. | ✅ **PASS** |
| **TC-2.03** | **Kiểm tra `python3 -m app.seed` & Tính Idempotent** | Chạy `python3 -m app.seed` 2 lần liên tiếp, đếm số lượng bản ghi từng bảng. | Lần 1 khởi tạo: `users: 4`, `categories: 6`, `listings: 10`, `listing_images: 20`, `favorites: 3`, `offers: 2`, `reviews: 1`, `reports: 1`. Lần 2 tự động bỏ qua, không sinh bản ghi trùng. | ✅ **PASS** |
| **TC-2.04** | **Kiểm tra 4 Tài khoản Demo & Mã hóa Mật khẩu `bcrypt` (`$2b$`)** | Truy vấn bảng `users`, kiểm tra tiền tố `$2b$` và xác thực bằng `bcrypt.checkpw()`. | Cả 4 tài khoản (`kiemduyet@sv.edu.vn`, `admin@sv.edu.vn`, `nguyenvana@sv.edu.vn`, `tranthib@sv.edu.vn`) đều khớp mật khẩu gốc 100%. | ✅ **PASS** |
| **TC-2.05** | **Kiểm tra Quan hệ `1:N` và `N:N` (`favorites`)** | Truy vấn ORM `seller.listings`, `listing.images`, và `buyer.favorite_listings`. | Truy xuất mượt mà: mỗi tin đăng liên kết đúng 2 ảnh; Sinh viên Mua hàng truy xuất đúng 2 tin yêu thích qua bảng `favorites`. | ✅ **PASS** |
| **TC-2.06** | **Kiểm tra Ràng buộc Toàn vẹn (`CheckConstraint`)** | Cố tình chèn bản ghi vi phạm: `Listing(price=-1000)`, `Offer(offered_price=0)`, `Review(rating=6)`. | Cả 3 trường hợp đều bị CSDL chặn ngay lập tức bằng `IntegrityError`. | ✅ **PASS** |
| **TC-2.07** | **Kiểm tra Chất lượng Mã nguồn PEP8 với `ruff`** | Chạy `python3 -m ruff check .` tại thư mục `backend`. | Kết quả: `All checks passed!` (0 lỗi). | ✅ **PASS** |

- **Quyết định của Người dùng cho Bước 2:** **ĐÃ PHÊ DUYỆT (APPROVED)** và cho phép triển khai **Bước 3**.

---

### 📌 Bước 3: Xây dựng RESTful API (FastAPI), Bảo mật JWT + RBAC & Luồng Nghiệp Vụ Cốt Lõi
- **Thời điểm:** `2026-11-18 09:42 - 10:01 UTC`
- **Tác nhân thực hiện:** **Tác nhân Phát triển Backend**
- **Tác nhân kiểm định độc lập:** **Tác nhân Kiểm thử & Báo cáo**

#### 2.5. Danh sách các Tập tin đã khởi tạo ở Bước 3

| STT | Đường dẫn Tập tin | Mô tả Chức năng & Nghiệp vụ Backend |
| :-: | :--- | :--- |
| 1 | `backend/app/security/auth.py` | Tầng bảo mật & phân quyền trung tâm: băm/kiểm tra mật khẩu `bcrypt`, sinh/giải mã JWT (`HS256`), trích xuất token linh hoạt (hỗ trợ cả JSON Bearer Token lẫn OAuth2 Form trên Swagger UI), dependencies `get_current_user`, `get_current_user_optional` và `require_roles(*allowed_roles)` (RBAC). |
| 2 | `backend/app/schemas/user.py` & `auth.py` | Pydantic v2 Schemas cho Đăng ký (`UserRegisterRequest` — khóa cứng không nhận trường `role` từ client để chống tự nâng quyền), Đăng nhập (`UserLoginRequest`), Hồ sơ công khai (`UserPublicResponse` — ẩn `password_hash`) và `TokenResponse`. |
| 3 | `backend/app/schemas/category.py` | Schemas cho Danh mục (`CategoryCreateRequest`, `CategoryResponse`), tích hợp bộ chuyển đổi `slugify_vietnamese` tự động sinh slug chuẩn từ tên danh mục tiếng Việt có dấu. |
| 4 | `backend/app/schemas/listing.py` | Schemas cho Tin đăng (`ListingCreateRequest` kiểm tra `price >= 0`, `title` ≥ 5 ký tự, `description` ≥ 10 ký tự; `ListingUpdateRequest`; `ModerationStatusRequest` bắt buộc nhập `rejection_reason` khi `REJECTED`; `ListingResponse`, `PaginatedListingResponse`, `FavoriteToggleResponse`). |
| 5 | `backend/app/schemas/offer.py` | Schemas cho Đề nghị mua hàng (`OfferCreateRequest` kiểm tra `offered_price > 0`, `OfferListingSummary`, `OfferResponse`). |
| 6 | `backend/app/schemas/review.py` | Schemas cho Đánh giá uy tín (`ReviewCreateRequest` kiểm tra `1 <= rating <= 5`, `ReviewResponse`). |
| 7 | `backend/app/schemas/report.py` | Schemas cho Báo cáo vi phạm (`ReportCreateRequest`, `ReportModerationRequest` kiểm tra trạng thái `RESOLVED`/`DISMISSED`, `ReportResponse`). |
| 8 | `backend/app/routers/auth.py` | Router `/api/v1/auth`: `POST /register` (`201`, chặn trùng email `409`, gán cứng `STUDENT`), `POST /login` (`200`, hỗ trợ cả JSON và OAuth2 Form), `GET /me` (`200`). |
| 9 | `backend/app/routers/categories.py` | Router `/api/v1/categories`: `GET ""` (`200`, công khai), `POST ""` (`201`, yêu cầu quyền `MODERATOR`/`ADMIN`, chặn trùng tên/slug `409`). |
| 10 | `backend/app/routers/uploads.py` | Router `/api/v1/uploads`: `POST /images` (`201`, tải lên nhiều file ảnh `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` tối đa 10MB/file, đổi tên bằng UUID chống Path Traversal). |
| 11 | `backend/app/routers/listings.py` | Router `/api/v1/listings`: Tìm kiếm đa tiêu chí + lọc khoảng giá + tình trạng + sắp xếp + phân trang (dùng `joinedload` & `selectinload` chống lỗi N+1); `GET /my`; `POST ""` (kiểm soát giới hạn `DAILY_LISTING_LIMIT=5` tin/ngày trả về `429 Too Many Requests`); `GET /{id}`; `PUT /{id}` (chặn sửa tin đã `SOLD`); `DELETE /{id}`; `POST /{id}/favorite` (toggle N:N). |
| 12 | `backend/app/routers/users.py` | Router `/api/v1/users`: `GET /me/favorites` (danh sách tin yêu thích của tôi), `GET /{user_id}` (hồ sơ công khai & điểm uy tín), `GET /{user_id}/reviews` (lịch sử đánh giá của người bán). |
| 13 | `backend/app/routers/moderation.py` | Router `/api/v1/moderation` (chỉ dành cho `MODERATOR`/`ADMIN`): `GET /listings`, `PATCH /listings/{id}/status` (`APPROVED`/`REJECTED`), `GET /reports`, `PATCH /reports/{id}` (xử lý báo cáo và tự động gỡ tin vi phạm sang `REJECTED`). |
| 14 | `backend/app/routers/offers.py` | Router `/api/v1` cho Đề nghị mua: `POST /listings/{id}/offers` (chặn tự trả giá tin của mình `400`, chặn trả giá tin chưa duyệt/đã bán `409`), `GET /offers/received`, `GET /offers/sent`, `PATCH /offers/{id}/accept` (Giao dịch nguyên tử: chấp nhận đề nghị + khóa tin sang `SOLD` + tự động từ chối các đề nghị đang chờ khác), `PATCH /offers/{id}/reject`. |
| 15 | `backend/app/routers/reviews.py` | Router `/api/v1/listings/{id}/reviews`: chỉ cho phép Sinh viên Mua hàng có đề nghị mua `ACCEPTED` trên tin đã `SOLD` đánh giá 1 lần duy nhất, tự động tính lại `reputation_score` và `total_reviews` của Sinh viên Bán hàng. |
| 16 | `backend/app/routers/reports.py` | Router `/api/v1/listings/{id}/reports`: gửi báo cáo vi phạm (chặn tự báo cáo tin của mình `400` và chặn gửi trùng báo cáo đang chờ `409`). |
| 17 | `backend/app/routers/stats.py` | Router `/api/v1/stats/overview`: thống kê tổng quan thời gian thực toàn bộ chỉ số hệ thống và phân bố tin đăng theo danh mục. |
| 18 | `backend/app/main.py` | Khởi tạo ứng dụng FastAPI, cấu hình CORS, Structured JSON Logging Middleware (ghi nhận `timestamp`, `method`, `path`, `status_code`, `duration_ms` và header `X-Process-Time-Ms`), mount thư mục tĩnh `/uploads`, endpoint `/api/v1/health` và nạp toàn bộ 10 routers. |

---

#### 2.6. Biên bản Kiểm thử Thực tế Độc lập Bước 3 (Thực hiện bởi **Tác nhân Kiểm thử & Báo cáo**)

**Tác nhân Kiểm thử & Báo cáo** đã thực thi kịch bản kiểm thử tích hợp độc lập bằng `FastAPI TestClient` kết hợp CSDL cô lập (không làm ảnh hưởng dữ liệu mẫu của `seed.py`). Dưới đây là kết quả kiểm định từng hạng mục:

| Mã TC | Hạng mục Kiểm tra (Đối chiếu tiêu chí ĐG2) | Kịch bản Kiểm thử Thực tế | Kết quả Thực tế | Đánh giá |
| :-: | :--- | :--- | :--- | :-: |
| **TC-3.01** | **Tài liệu OpenAPI (`/openapi.json`) & Healthcheck (`/api/v1/health`)** | Gọi `GET /openapi.json` và đối chiếu danh sách toàn bộ các đường dẫn API. | Trả về `200 OK` với đầy đủ **25 paths** thuộc 11 nhóm tags tiếng Việt rõ ràng; `/api/v1/health` trả về `{"status": "ok"}` kèm header `X-Process-Time-Ms`. | ✅ **PASS** |
| **TC-3.02** | **Xác thực JWT, Chống trùng Email & Chống Tự nâng quyền (Privilege Escalation)** | (1) `POST /api/v1/auth/register` truyền kèm `"role": "ADMIN"`; (2) Đăng ký lặp email; (3) `POST /api/v1/auth/login` đúng & sai mật khẩu; (4) `GET /api/v1/auth/me`. | (1) Trả về `201 Created` và `role` bị ép cứng về `"STUDENT"`; (2) Trùng email trả về `409 Conflict`; (3) Đăng nhập đúng trả `200 OK` kèm JWT, sai mật khẩu trả `401 Unauthorized`; (4) `/auth/me` trả `200 OK`. | ✅ **PASS** |
| **TC-3.03** | **Kiểm chứng dữ liệu đầu vào Pydantic v2 (`422 Unprocessable Entity`)** | Gửi dữ liệu vi phạm ràng buộc: (1) Đăng tin với `price: -50000`; (2) Đăng tin với `title: "Abc"` (< 5 ký tự); (3) Đánh giá với `rating: 6` (> 5 sao). | Cả 3 request đều bị chặn ở tầng Schema Validation và trả về đúng mã `422 Unprocessable Entity`. | ✅ **PASS** |
| **TC-3.04** | **Phân quyền RBAC (`403 Forbidden`) giữa Sinh viên và Kiểm duyệt viên** | Dùng token của **Sinh viên Bán hàng** (`STUDENT`) gọi `GET /api/v1/moderation/listings` và `POST /api/v1/categories`; sau đó dùng token của **Kiểm duyệt viên** (`MODERATOR`) gọi lại. | Tài khoản `STUDENT` bị từ chối với mã `403 Forbidden` ở cả 2 API; tài khoản `MODERATOR` thực thi thành công (`200 OK` & `201 Created`). | ✅ **PASS** |
| **TC-3.05** | **Luồng Nghiệp vụ Đề tài 4 Khép kín (End-to-End Workflow)** | Thực hiện liên hoàn 8 bước: (1) **Sinh viên Bán hàng** đăng tin kèm 2 ảnh -> (2) **Kiểm duyệt viên** duyệt tin (`APPROVED`) -> (3) **Khách vãng lai** tìm kiếm/lọc/sắp xếp/phân trang -> (4) **Sinh viên Mua hàng** lưu yêu thích N:N -> (5) 2 Sinh viên gửi 2 đề nghị trả giá -> (6) **Sinh viên Bán hàng** chấp nhận đề nghị #1 -> (7) **Sinh viên Mua hàng** đánh giá 4 sao -> (8) Báo cáo vi phạm & **Kiểm duyệt viên** xử lý báo cáo (`RESOLVED`). | (1) Tin mới có trạng thái `PENDING` (`201`); (2) Duyệt thành `APPROVED` (`200`); (3) Tìm thấy đúng tin theo từ khóa & khoảng giá (`200`); (4) Toggle yêu thích `is_favorited=True` (`200`); (5) Tạo 2 offers (`201`); (6) Chấp nhận offer #1 (`ACCEPTED`), tin tự động khóa sang `SOLD`, offer #2 tự động chuyển sang `REJECTED`; (7) Đánh giá thành công (`201`), điểm uy tín người bán tự động cập nhật từ `5.0` (1 đánh giá) thành `4.5` (2 đánh giá); (8) Xử lý báo cáo `RESOLVED` tự động chuyển tin vi phạm sang `REJECTED`. | ✅ **PASS** |
| **TC-3.06** | **Tính năng Nâng cao: Giới hạn Đăng tin (`429`), Upload Đa ảnh & Thống kê Tổng quan** | (1) Một sinh viên đăng liên tiếp 6 tin trong cùng 1 ngày (`DAILY_LISTING_LIMIT=5`); (2) Upload 2 ảnh `.png`/`.jpg` qua `POST /api/v1/uploads/images`; (3) Gọi `GET /api/v1/stats/overview`. | (1) 5 tin đầu trả về `201 Created`, tin thứ 6 bị chặn với mã `429 Too Many Requests`; (2) Upload 2 ảnh trả về `201 Created` với tên file UUID an toàn; (3) `/stats/overview` trả về đầy đủ số liệu thống kê theo danh mục và trạng thái. | ✅ **PASS** |
| **TC-3.07** | **Kiểm tra Chuẩn Mã nguồn PEP8 (`ruff check .`)** | Chạy `python3 -m ruff check .` trên toàn bộ thư mục `backend`. | Kết quả: `All checks passed!` (0 lỗi lint, 0 cảnh báo). | ✅ **PASS** |

---

#### 2.7. Nhận xét & Đánh giá của **Tác nhân Kiểm thử & Báo cáo** cho Bước 3
1. **Độ tuân thủ tiêu chí ĐG2:** Đạt **100% (7/7 nhóm kịch bản kiểm thử chuyên sâu đều PASS)**.
2. **Điểm cộng chất lượng kỹ thuật:**
   - **Vượt xa CRUD cơ bản:** Đã hiện thực hóa đầy đủ các quy tắc nghiệp vụ phức tạp: giới hạn số tin đăng mỗi ngày (`429 Too Many Requests`), giao dịch nguyên tử khi chốt đơn (tự động chuyển tin sang `SOLD` và từ chối các đề nghị trả giá khác), tự động tính lại điểm uy tín trung bình (`reputation_score`) sau mỗi đánh giá, và tự động gỡ tin khi báo cáo vi phạm được xác nhận (`RESOLVED`).
   - **Tối ưu hiệu năng CSDL & Observability:** Sử dụng `joinedload` và `selectinload` triệt tiêu hoàn toàn lỗi truy vấn `N+1` trên danh sách tin đăng; tích hợp sẵn Middleware ghi Structured Log định dạng JSON kèm thời gian xử lý `duration_ms`.
3. **Các vấn đề tồn đọng (Issues/Blockers):** **Không có (0 lỗi)**.
4. **Kiến nghị:** Đủ điều kiện chất lượng để trình **Người dùng phê duyệt hoàn tất Bước 3** và cho phép triển khai **Bước 4**.
- **Quyết định của Người dùng cho Bước 3:** **ĐÃ PHÊ DUYỆT (APPROVED)** và cho phép triển khai **Bước 4**.

---

### 📌 Bước 4: Xây dựng Bộ Kiểm thử Tự động `pytest` (Coverage 94.37% ≥ 70%) & Bộ `Postman Collection` v2.1
- **Thời điểm:** `2026-11-18 10:08 - 10:17 UTC`
- **Tác nhân thực hiện & kiểm định:** **Tác nhân Kiểm thử & Báo cáo**

#### 2.8. Danh sách các Tập tin đã khởi tạo ở Bước 4

| STT | Đường dẫn Tập tin | Mô tả Chức năng & Thiết kế Kiểm thử |
| :-: | :--- | :--- |
| 1 | `backend/tests/conftest.py` | Cấu hình môi trường kiểm thử độc lập: sử dụng CSDL SQLite tạm tại `/tmp/test_chodocu.db` và thư mục upload tạm `/tmp/test_chodocu_uploads` (đảm bảo cô lập 100%, không làm ảnh hưởng tới `chodocu.db` đã seed); nạp dữ liệu mẫu chuẩn bằng `seed_database()` và cung cấp các fixtures `client`, `db_session`, `seller_headers`, `buyer_headers`, `moderator_headers`, `admin_headers`. |
| 2 | `backend/tests/test_api.py` | Bộ **18 bài kiểm thử tự động (`pytest`)** kiểm tra toàn diện 10 phân hệ RESTful API, xác thực JWT, chống tự nâng quyền, phân quyền RBAC (`403`), kiểm chứng dữ liệu Pydantic v2 (`422`), giới hạn đăng tin mỗi ngày (`429`), luồng chốt đơn tự động khóa tin (`SOLD`), tự động tính lại điểm uy tín (`reputation_score`) và xử lý báo cáo vi phạm. |
| 3 | `postman/chodocusinhvien.postman_collection.json` | Bộ **Postman Collection chuẩn v2.1** gồm **7 thư mục / 24 requests** theo đúng kịch bản bảo vệ ĐG2, tích hợp biến `{{baseUrl}}` và các đoạn mã `pm.test()` + `pm.collectionVariables.set()` tự động trích xuất/lưu `{{studentSellerToken}}`, `{{studentBuyerToken}}`, `{{moderatorToken}}`, `{{createdListingId}}`, `{{createdOfferId}}`, `{{createdReportId}}`. |

---

#### 2.9. Biên bản Thực thi 18 Bài Kiểm thử Tự động `pytest` (Thực hiện bởi **Tác nhân Kiểm thử & Báo cáo**)

Lệnh thực thi thực tế tại `/home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend`:
```bash
python3 -m ruff check . && python3 -m pytest --cov=app --cov-report=term-missing --cov-fail-under=70 -v
```

| STT | Tên Hàm Kiểm thử (`backend/tests/test_api.py`) | Nội dung & Tác nhân Nghiệp vụ được Kiểm tra | Kết quả |
| :-: | :--- | :--- | :-: |
| 1 | `test_health_check` | Kiểm tra `GET /api/v1/health` (`200 OK`), `GET /` và sự hiện diện của header `X-Process-Time-Ms` từ Middleware. | ✅ **PASSED** |
| 2 | `test_register_student_and_prevent_role_escalation` | Đăng ký tài khoản mới (`201`), xác minh cố tình truyền `"role": "ADMIN"` vẫn bị khóa cứng về `"STUDENT"`, và kiểm tra trùng email trả về `409 Conflict`. | ✅ **PASSED** |
| 3 | `test_login_and_get_me` | Đăng nhập bằng JSON Body (`200`), đăng nhập bằng OAuth2 Form (`200`), sai mật khẩu (`401`), lấy hồ sơ `/api/v1/auth/me` (`200`), không có token hoặc token giả mạo (`401`). | ✅ **PASSED** |
| 4 | `test_validation_errors_422` | Kiểm tra nhập dữ liệu sai quy cách: email sai định dạng, giá bán âm (`price: -50000`), tiêu đề quá ngắn (`< 5` ký tự), đánh giá `rating: 6` (`> 5` sao), từ chối tin không nhập lý do -> đều trả về `422 Unprocessable Entity`. | ✅ **PASSED** |
| 5 | `test_rbac_forbidden_403` | Tài khoản **Sinh viên Bán hàng** (`STUDENT`) gọi các API của **Kiểm duyệt viên** (`GET/PATCH /api/v1/moderation/...`, `POST /api/v1/categories`) đều bị chặn với mã `403 Forbidden`. | ✅ **PASSED** |
| 6 | `test_categories_crud` | **Kiểm duyệt viên** tạo danh mục mới (`201 Created`, tự sinh slug tiếng Việt), kiểm tra chặn trùng tên/slug (`409 Conflict`), lấy danh sách danh mục công khai (`200 OK`). | ✅ **PASSED** |
| 7 | `test_upload_multiple_images` | Tải lên nhiều file ảnh `.png`/`.jpg` qua `POST /api/v1/uploads/images` (`201 Created`), chặn file script `.sh` không phải ảnh (`400`) và chặn file rỗng (`400`). | ✅ **PASSED** |
| 8 | `test_create_listing_and_moderation_flow` | **Sinh viên Bán hàng** đăng tin mới kèm 2 ảnh (`201`, trạng thái `PENDING`), xem `/api/v1/listings/my`, **Kiểm duyệt viên** duyệt tin (`APPROVED`) và từ chối tin (`REJECTED` kèm lý do). | ✅ **PASSED** |
| 9 | `test_search_filter_sort_pagination` | **Khách vãng lai** tìm kiếm theo từ khóa `q`, lọc `category_id`, `min_price`, `max_price`, `condition`, sắp xếp `price_asc`/`price_desc`/`newest` và phân trang `page`/`page_size`. | ✅ **PASSED** |
| 10 | `test_update_and_delete_listing` | Chủ tin cập nhật tin (`PUT /api/v1/listings/{id}` -> `200`), người dùng khác sửa/xóa bị chặn (`403`), chủ tin xóa tin (`DELETE` -> `204`), truy vấn lại trả `404`. | ✅ **PASSED** |
| 11 | `test_favorites_many_to_many` | **Sinh viên Mua hàng** bấm lưu yêu thích (`POST /api/v1/listings/{id}/favorite` -> `is_favorited=True`), xem `/api/v1/users/me/favorites`, bấm lần nữa để bỏ yêu thích (`is_favorited=False`). | ✅ **PASSED** |
| 12 | `test_offers_and_auto_sold_transition` | Chặn tự mua tin của chính mình (`400`); 2 người mua gửi 2 đề nghị trả giá (`201`); xem `/offers/sent` & `/offers/received`; **Sinh viên Bán hàng** chấp nhận đề nghị #1 -> tin tự động khóa sang `SOLD`, đề nghị #2 tự động chuyển sang `REJECTED`, và chặn sửa tin đã `SOLD` (`409`). | ✅ **PASSED** |
| 13 | `test_reject_offer` | **Sinh viên Bán hàng** từ chối đề nghị mua (`PATCH /api/v1/offers/{id}/reject` -> `200`), chặn người không phải chủ tin từ chối (`403`), chặn từ chối lại lần 2 (`409`). | ✅ **PASSED** |
| 14 | `test_review_and_seller_reputation_calculation` | Chặn người chưa mua đánh giá (`403`); **Sinh viên Mua hàng** (có đề nghị `ACCEPTED`) đánh giá 4 sao (`201`), kiểm tra `reputation_score` của người bán tự động cập nhật từ `5.0` thành `4.5` (`total_reviews = 2`), chặn đánh giá trùng lần 2 (`409`). | ✅ **PASSED** |
| 15 | `test_report_violation_and_moderation_resolution` | Chặn tự báo cáo tin của mình (`400`), gửi báo cáo vi phạm (`201`), chặn báo cáo trùng (`409`), **Kiểm duyệt viên** xem danh sách báo cáo và xử lý `RESOLVED` -> tự động gỡ tin vi phạm sang `REJECTED`. | ✅ **PASSED** |
| 16 | `test_daily_listing_rate_limit_429` | Kiểm tra quy tắc giới hạn số tin đăng mỗi ngày (`DAILY_LISTING_LIMIT=5`): đăng 5 tin đầu trả `201 Created`, tin thứ 6 trong ngày bị chặn với mã `429 Too Many Requests`. | ✅ **PASSED** |
| 17 | `test_stats_overview_and_user_profile` | Kiểm tra thống kê tổng quan `GET /api/v1/stats/overview` (`200`) và hồ sơ công khai `GET /api/v1/users/{id}` (`200` & `404`). | ✅ **PASSED** |
| 18 | `test_seed_database_idempotent` | Kiểm tra hàm `seed_database()` chạy an toàn, idempotent trên CSDL đã có dữ liệu (`seeded: False`) và khởi tạo đầy đủ trên CSDL mới (`seeded: True`). | ✅ **PASSED** |

---

#### 2.10. Bảng Độ Bao Phủ Mã Nguồn (`pytest-cov` Coverage Report)

| Tầng / Module (`backend/app/`) | Tổng số câu lệnh (`Stmts`) | Chưa chạy (`Miss`) | Độ bao phủ (`Cover`) | Đánh giá so với Mốc ĐG2 (≥ 70%) |
| :--- | :-: | :-: | :-: | :-: |
| `app/config.py` & `app/database.py` | 32 | 4 | **87.5%** | ✅ Vượt chuẩn |
| `app/main.py` | 58 | 2 | **97.0%** | ✅ Vượt chuẩn |
| `app/models/*` (8 bảng & 5 Enums) | 166 | 0 | **100.0%** | ✅ Tuyệt đối |
| `app/schemas/*` (Pydantic v2 Schemas) | 213 | 5 | **97.7%** | ✅ Vượt chuẩn |
| `app/routers/auth.py` | 59 | 6 | **90.0%** | ✅ Vượt chuẩn |
| `app/routers/categories.py` | 28 | 0 | **100.0%** | ✅ Tuyệt đối |
| `app/routers/uploads.py` | 32 | 2 | **94.0%** | ✅ Vượt chuẩn |
| `app/routers/listings.py` | 154 | 12 | **92.0%** | ✅ Vượt chuẩn |
| `app/routers/users.py` | 37 | 0 | **100.0%** | ✅ Tuyệt đối |
| `app/routers/moderation.py` | 60 | 2 | **97.0%** | ✅ Vượt chuẩn |
| `app/routers/offers.py` | 76 | 6 | **92.0%** | ✅ Vượt chuẩn |
| `app/routers/reviews.py` | 45 | 2 | **96.0%** | ✅ Vượt chuẩn |
| `app/routers/reports.py` | 30 | 1 | **97.0%** | ✅ Vượt chuẩn |
| `app/routers/stats.py` | 31 | 0 | **100.0%** | ✅ Tuyệt đối |
| `app/security/auth.py` | 74 | 17 | **77.0%** | ✅ Vượt chuẩn |
| `app/seed.py` | 55 | 6 | **89.0%** | ✅ Vượt chuẩn |
| **TỔNG CỘNG TOÀN BỘ BACKEND (`TOTAL`)** | **1154** | **65** | **94.37%** | 🏆 **VƯỢT MỐC 70% (+24.37%)** |

---

#### 2.11. Cấu trúc Bộ `Postman Collection` v2.1 (`postman/chodocusinhvien.postman_collection.json`)

| Thư mục Demo Bảo vệ ĐG2 | Số lượng Request | Biến Tự động Lưu & Kiểm định `pm.test()` |
| :--- | :-: | :--- |
| **1. Xác thực & Đăng nhập 3 Vai trò** | 5 | Kiểm tra `/api/v1/health` + `X-Process-Time-Ms`; đăng nhập **Sinh viên Bán hàng**, **Sinh viên Mua hàng**, **Kiểm duyệt viên**; tự động lưu `{{studentSellerToken}}`, `{{studentBuyerToken}}`, `{{moderatorToken}}`. |
| **2. Danh mục & Đăng tin bán kèm nhiều ảnh** | 3 | Lấy 6 danh mục; **Sinh viên Bán hàng** đăng tin mới kèm 2 ảnh (`201 Created`, trạng thái `PENDING`), tự động lưu `{{createdListingId}}`; xem `/api/v1/listings/my`. |
| **3. Kiểm duyệt viên duyệt tin & Chứng minh phân quyền (403)** | 3 | Chứng minh **Sinh viên Bán hàng** gọi API duyệt tin bị chặn `403 Forbidden`; **Kiểm duyệt viên** xem danh sách chờ duyệt và duyệt tin sang `APPROVED` (`200 OK`). |
| **4. Tìm kiếm, Lọc, Sắp xếp, Phân trang & Yêu thích (N:N)** | 3 | Tìm kiếm từ khóa + lọc khoảng giá + sắp xếp + phân trang; **Sinh viên Mua hàng** bấm lưu yêu thích (`is_favorited=true`) và xem `/api/v1/users/me/favorites`. |
| **5. Gửi đề nghị mua & Người bán chấp nhận (Chuyển sang Đã bán)** | 3 | **Sinh viên Mua hàng** gửi đề nghị trả giá (`201 Created`), tự động lưu `{{createdOfferId}}`; **Sinh viên Bán hàng** xem `/offers/received` và chấp nhận -> tin tự động chuyển sang `SOLD`. |
| **6. Đánh giá người bán (Cập nhật Điểm uy tín) & Báo cáo vi phạm** | 5 | **Sinh viên Mua hàng** đánh giá 5 sao (`201 Created`); kiểm tra điểm uy tín người bán cập nhật; gửi báo cáo vi phạm (`{{createdReportId}}`); **Kiểm duyệt viên** xử lý báo cáo; xem thống kê `/stats/overview`. |
| **7. Chứng minh kiểm chứng dữ liệu (422 Unprocessable Entity)** | 2 | Chứng minh nhập giá bán âm (`price: -150000`) và đánh giá vượt ngưỡng (`rating: 6`) đều bị chặn bởi Pydantic v2 với mã `422 Unprocessable Entity`. |

---

#### 2.12. Nhận xét & Kiến nghị của **Tác nhân Kiểm thử & Báo cáo** cho Bước 4
1. **Kết quả Kiểm thử Tự động:** Toàn bộ **18/18 bài kiểm thử `pytest` đều PASSED** trong `5.63s`, đạt độ bao phủ **94.37%** (vượt xa yêu cầu tối thiểu 70% để nhận trọn điểm cộng Testing trong rubric ĐG2).
2. **Chất lượng Mã nguồn:** Lệnh `python3 -m ruff check .` đạt `All checks passed!` (0 lỗi).
3. **Sẵn sàng cho Demo Bảo vệ:** File `postman/chodocusinhvien.postman_collection.json` đã tích hợp sẵn toàn bộ kịch bản 7 phần và `pm.test()` tự động hóa hoàn toàn.
4. **Kiến nghị:** Đủ điều kiện chất lượng để trình **Người dùng phê duyệt hoàn tất Bước 4** và cho phép triển khai **Bước 5 (Xây dựng Giao diện Frontend React + Vite + TailwindCSS)**.
- **Quyết định của Người dùng cho Bước 4:** **ĐÃ PHÊ DUYỆT (APPROVED)** và cho phép triển khai **Bước 5**.

---

### 📌 Bước 5: Xây dựng Giao diện Frontend (React 18 + Vite + TailwindCSS) & Trạm Kiểm Thử Trực Quan 8 Bước Bảo Vệ ĐG2
- **Thời điểm:** `2026-11-18 10:19 - 10:28 UTC`
- **Tác nhân thực hiện:** **Tác nhân Phát triển Frontend**
- **Tác nhân kiểm định độc lập:** **Tác nhân Kiểm thử & Báo cáo**

#### 2.13. Danh sách các Tập tin đã khởi tạo ở Bước 5

| STT | Đường dẫn Tập tin | Mô tả Chức năng & Thiết kế Giao diện |
| :-: | :--- | :--- |
| 1 | `frontend/package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html` | Cấu hình ứng dụng SPA với React 18, Vite 5, TailwindCSS 3 và bộ icon `lucide-react`; cấu hình Vite Dev Proxy chuyển tiếp `/api`, `/uploads`, `/docs`, `/openapi.json` sang FastAPI cổng `8000`. |
| 2 | `frontend/src/main.jsx` & `frontend/src/index.css` | Điểm khởi chạy React DOM và thiết lập stylesheet TailwindCSS kèm font chữ Tiếng Việt hiện đại. |
| 3 | `frontend/src/api.js` | Tầng giao tiếp API trung tâm: cấu hình `API_BASE` (`/api/v1`), hàm `apiRequest()` tự động đính kèm header `Authorization: Bearer <token>` và bóc tách lỗi chi tiết từ FastAPI (`400`/`401`/`403`/`404`/`409`/`422`/`429`), hàm `rawApiRequest()` đo thời gian phản hồi thực tế (`durationMs`, `X-Process-Time-Ms`), hàm `uploadImagesApi()` gửi `FormData` đa ảnh, cùng bộ hằng số 3 tài khoản Demo (`DEMO_ACCOUNTS`). |
| 4 | `frontend/src/components/Navbar.jsx` | Thanh điều hướng chính tích hợp thanh **Chuyển đổi nhanh 1-Click 3 Tác nhân Demo** (**Sinh viên Bán hàng**, **Sinh viên Mua hàng**, **Kiểm duyệt viên**), hiển thị số liệu thống kê thời gian thực, huy hiệu vai trò + điểm uy tín `reputation_score` và 6 tab chức năng. |
| 5 | `frontend/src/components/AuthModal.jsx` | Cửa sổ Đăng nhập & Đăng ký tài khoản sinh viên mới, tích hợp cả nút chọn nhanh tài khoản Demo 1-Click cho Giảng viên chấm bài. |
| 6 | `frontend/src/App.jsx` | Màn hình trung tâm quản lý trạng thái toàn cục, thông báo Toast nổi, trang **Khám phá Chợ Đồ Cũ** (Hero banner, chọn nhanh 6 danh mục bằng icon, tìm kiếm từ khóa `q`, lọc tình trạng `condition`, khoảng giá `min_price`–`max_price`, hiển thị cả tin `SOLD`, sắp xếp `newest`/`price_asc`/`price_desc`, phân trang `page`/`page_size`), và tab **Danh sách Tin Yêu thích (Quan hệ N:N)**. |
| 7 | `frontend/src/components/CreateListingView.jsx` | Màn hình **Đăng tin bán đồ cũ mới & Chỉnh sửa tin**: hiển thị trực quan bộ đếm **Hạn mức chống Spam (`5 tin/ngày`)**, nút **Điền nhanh dữ liệu mẫu (1-Click Demo)**, hỗ trợ tải lên nhiều file ảnh thật từ máy tính (`POST /api/v1/uploads/images`) hoặc thêm URL ảnh minh họa. |
| 8 | `frontend/src/components/ListingDetailModal.jsx` | Cửa sổ chi tiết món đồ cũ: Gallery xem nhiều ảnh (ảnh lớn + hàng ảnh thu nhỏ), hiển thị thông tin **Sinh viên Bán hàng** kèm điểm uy tín và lịch sử nhận xét (`GET /api/v1/users/{id}/reviews`), cùng 3 tab tương tác trực tiếp: **Đề nghị mua / Trả giá** (có nút gợi ý giá nhanh `-10%`, `-5%`, `Giá gốc`), **Đánh giá 1–5 sao**, và **Báo cáo tin vi phạm**. |
| 9 | `frontend/src/components/TransactionsView.jsx` | Màn hình **Quản lý Giao dịch & Cá nhân** gồm 3 phân khu: (1) *Tin đăng của tôi* (lọc theo `PENDING`, `APPROVED`, `SOLD`, `REJECTED` kèm hiển thị lý do từ chối, sửa/xóa tin); (2) *Đề nghị mua nhận được* (nút **Chấp nhận bán & Chốt đơn Đã bán** hoặc **Từ chối**); (3) *Đề nghị mua đã gửi* (tích hợp biểu mẫu đánh giá nhanh 1–5 sao ngay khi đề nghị được `ACCEPTED`). |
| 10 | `frontend/src/components/ModerationView.jsx` | **Bàn làm việc Kiểm duyệt viên**: kiểm tra phân quyền RBAC trên giao diện (nếu đang là Sinh viên sẽ hiển thị màn hình khóa RBAC kèm nút 1-Click chuyển sang Kiểm duyệt viên), duyệt tin `PENDING` -> `APPROVED`, từ chối tin -> `REJECTED` (bắt buộc nhập lý do), xử lý báo cáo vi phạm (`RESOLVED` tự động gỡ tin / `DISMISSED`), tạo danh mục mới và biểu đồ thống kê phân bố tin theo danh mục. |
| 11 | `frontend/src/components/DefenseLabView.jsx` | **Trạm Kiểm Thử Trực Quan 8 Bước Bảo Vệ ĐG2 (`Interactive Defense Demo Lab`)**: trang bị 2 nút bấm nổi bật chứng minh trực tiếp **Bước 3 Demo (`HTTP 403 Forbidden` khi Sinh viên gọi API Kiểm duyệt)** và **Bước 4 Demo (`HTTP 422 Unprocessable Entity` khi gửi giá âm `-50.000đ`)**, cùng chuỗi 8 bước End-to-End và màn hình `Live HTTP Response Inspector` hiển thị nguyên bản JSON + mã HTTP + thời gian xử lý `ms`. |

---

#### 2.14. Biên bản Kiểm thử Độc lập Bước 5 (Thực hiện bởi **Tác nhân Kiểm thử & Báo cáo**)

| Mã TC | Hạng mục Kiểm tra (Đối chiếu tiêu chí ĐG2) | Phương pháp & Lệnh Kiểm tra Thực tế | Kết quả Thực tế | Đánh giá |
| :-: | :--- | :--- | :--- | :-: |
| **TC-5.01** | **Kiểm tra Đóng gói Production (`npm run build`)** | Chạy `npm run build` (`vite build`) tại `/home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend`. | Build thành công trong `1.94s` (`1584 modules transformed`), xuất ra `dist/index.html` (`1.05 kB`), `dist/assets/index-*.css` (`38.93 kB`) và `dist/assets/index-*.js` (`283.81 kB`), **0 lỗi cú pháp, 0 cảnh báo**. | ✅ **PASS** |
| **TC-5.02** | **Đối chiếu Khớp nối Hợp đồng API (Frontend ↔ Backend OpenAPI)** | Kiểm tra chéo toàn bộ các lời gọi `apiRequest()` / `rawApiRequest()` / `uploadImagesApi()` trong `frontend/src/` với 25 đường dẫn trong `app.openapi()["paths"]`. | Khớp tuyệt đối 100% phương thức HTTP, đường dẫn (`/api/v1/...`), query params (`q`, `category_id`, `min_price`, `max_price`, `condition`, `include_sold`, `sort_by`, `page`, `page_size`) và cấu trúc JSON request/response body. | ✅ **PASS** |
| **TC-5.03** | **Thanh Chuyển đổi Nhanh 1-Click 3 Tác nhân Demo (`Navbar.jsx` & `AuthModal.jsx`)** | Kiểm tra `DEMO_ACCOUNTS` trong `api.js` và sự kiện `onQuickDemoLogin` trên `Navbar.jsx`. | Cấu hình chính xác 3 tài khoản seed: **Sinh viên Bán hàng** (`nguyenvana@sv.edu.vn`), **Sinh viên Mua hàng** (`tranthib@sv.edu.vn`), **Kiểm duyệt viên** (`kiemduyet@sv.edu.vn`), cho phép chuyển vai trò tức thì bằng 1 cú nhấp chuột. | ✅ **PASS** |
| **TC-5.04** | **Khám phá Chợ, Tìm kiếm Đa tiêu chí, Phân trang & Yêu thích N:N (`App.jsx`)** | Kiểm tra luồng state, xử lý trạng thái `Loading` (skeleton pulse), `Empty` (nút đặt lại bộ lọc), `Error` (Toast) và nút thả tim Yêu thích (`POST /listings/{id}/favorite`). | Đầy đủ bộ lọc từ khóa, danh mục, tình trạng, khoảng giá, sắp xếp, phân trang và đồng bộ danh sách Yêu thích N:N (`/users/me/favorites`). | ✅ **PASS** |
| **TC-5.05** | **Đăng tin Đa ảnh, Upload File thật & Hạn mức 5 tin/ngày (`CreateListingView.jsx`)** | Kiểm tra form tạo/sửa tin đăng, bộ đếm hạn mức chống spam `postedTodayCount / 5`, nút điền dữ liệu mẫu 1-Click và hàm `uploadImagesApi` (`/api/v1/uploads/images`). | Hỗ trợ đồng thời cả tải nhiều file ảnh từ máy tính (`.jpg`, `.png`, `.webp`, `.gif`), thêm URL ảnh và chọn nhanh ảnh mẫu theo chủ đề. | ✅ **PASS** |
| **TC-5.06** | **Chi tiết Tin đăng, Trả giá, Chốt đơn `SOLD` & Đánh giá Uy tín (`ListingDetailModal.jsx` & `TransactionsView.jsx`)** | Kiểm tra Gallery đa ảnh, gửi đề nghị mua, chấp nhận đề nghị mua (`PATCH /offers/{id}/accept`) và đánh giá 1–5 sao (`POST /listings/{id}/reviews`). | Chốt đơn tự động khóa tin sang `SOLD`, hiển thị nhãn `ĐÃ BÁN (SOLD)`, cho phép người mua gửi đánh giá sao và cập nhật ngay `reputation_score` của người bán. | ✅ **PASS** |
| **TC-5.07** | **Bàn làm việc Kiểm duyệt viên (`ModerationView.jsx`)** | Kiểm tra màn hình bảo vệ RBAC cho vai trò `MODERATOR`/`ADMIN`, duyệt tin `APPROVED`, từ chối `REJECTED` kèm lý do, xử lý báo cáo `RESOLVED`/`DISMISSED` và tạo danh mục mới. | Đầy đủ 4 phân mục quản trị: Duyệt tin đăng, Xử lý báo cáo vi phạm (tự động gỡ tin khi `RESOLVED`), Tạo danh mục mới và Biểu đồ phân bố tin theo danh mục. | ✅ **PASS** |
| **TC-5.08** | **Trạm Kiểm Thử Trực Quan 8 Bước Bảo Vệ ĐG2 (`DefenseLabView.jsx`)** | Kiểm tra 2 nút thử nghiệm trọng tâm (`runStep3RbacForbidden` -> `403` & `runStep4Validation422` -> `422`), chuỗi 8 bước kịch bản và bảng `Live HTTP Response Inspector`. | Gửi request thật tới FastAPI và hiển thị trực quan mã trạng thái (`HTTP 403 Forbidden`, `HTTP 422 Unprocessable Entity`, `HTTP 201 Created`, `HTTP 200 OK`), thời gian xử lý `ms` và JSON payload. | ✅ **PASS** |

---

#### 2.15. Nhận xét & Kiến nghị của **Tác nhân Kiểm thử & Báo cáo** cho Bước 5
1. **Độ hoàn thiện Giao diện & Trải nghiệm Người dùng (UX/UI):** Đạt **100% (8/8 hạng mục kiểm thử Frontend đều PASS)**. Giao diện được thiết kế hiện đại, rõ ràng, phản hồi mượt mà và xử lý trọn vẹn các trạng thái `Loading`, `Empty`, `Error` và `Success Toast`.
2. **Điểm cộng Đột phá khi Bảo vệ Đồ án ĐG2:**
   - Thanh **Chuyển nhanh Tác nhân Demo (1-Click)** trên đỉnh trang giúp Giảng viên hoặc Sinh viên bảo vệ chuyển đổi tức thì giữa **Sinh viên Bán hàng**, **Sinh viên Mua hàng** và **Kiểm duyệt viên** mà không cần gõ lại email/mật khẩu.
   - Tab **Trạm Kiểm Thử 8 Bước ĐG2 (`DefenseLabView.jsx`)** cho phép bấm nút chứng minh trực tiếp trên giao diện web cơ chế chặn phân quyền `403 Forbidden` và chặn dữ liệu bẩn `422 Unprocessable Entity` kèm cửa sổ Console hiển thị JSON phản hồi thời gian thực.
3. **Các vấn đề tồn đọng (Issues/Blockers):** **Không có (0 lỗi)**.
4. **Kiến nghị:** Đủ điều kiện chất lượng để trình **Người dùng phê duyệt hoàn tất Bước 5** và cho phép triển khai **Bước 6 (Kiểm thử Tích hợp Toàn diện End-to-End & Hoàn thiện Tài liệu Báo cáo / Bảo vệ ĐG2)**.
- **Quyết định của Người dùng cho Bước 5:** **ĐÃ PHÊ DUYỆT (APPROVED)** và cung cấp thông tin chính thức của **Nhóm 4 – Lớp CT2802** (GVHD: **ThS. Đỗ Văn Tuyên**) để triển khai **Bước 6**.

---

### 📌 Bước 6: Hoàn thiện Tài liệu (`README.md`, Báo cáo `.md`/`.docx`, Slide 12 trang `.pptx`, Cẩm nang Vấn đáp) & Nghiệm thu Cuối cùng
- **Thời điểm:** `2026-11-18 10:35 - 10:50 UTC`
- **Thông tin chính thức đã cập nhật đồng bộ 100% trên toàn bộ tài liệu:**
  - **Trường / Khoa:** Trường Đại học Quản lý và Công nghệ Hải Phòng – Khoa Công nghệ Thông tin
  - **Học phần:** Lập trình mã nguồn mở (`POS02024`) – Đánh giá 2 (ĐG2) – Đồ án nhóm (Capstone)
  - **Đề tài:** Đề tài số 4 — **Chợ đồ cũ sinh viên (`chodocusinhvien`)**
  - **Nhóm & Lớp:** **Nhóm 4 – Lớp CT2802**
  - **Giảng viên hướng dẫn:** **ThS. Đỗ Văn Tuyên**
  - **4 Thành viên & Tỷ lệ đóng góp (25% x 4 = 100%):**
    1. **Nguyễn Hải Long** — *Trưởng nhóm & DevOps* (`25%`)
    2. **Nguyễn Đức Anh** — *Back-end API & Bảo mật* (`25%`)
    3. **Nguyễn Huy Hoàng** — *Front-end UI/UX* (`25%`)
    4. **Hoàng Nhật Thắng** — *CSDL & Kiểm thử QA* (`25%`)

#### 2.16. Danh sách các Tài liệu & Sản phẩm Nộp đã Hoàn thiện ở Bước 6

| STT | Đường dẫn Tập tin | Mô tả Nội dung & Chuẩn Đối chiếu ĐG2 |
| :-: | :--- | :--- |
| 1 | [`README.md`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/README.md) | Tài liệu hướng dẫn trung tâm đạt 100% tiêu chí B2 (1,0 điểm): Bảng phân công 4 thành viên Nhóm 4 – CT2802, sơ đồ kiến trúc Mermaid (`Trình duyệt -> Nginx -> FastAPI -> PostgreSQL`), bảng giấy phép mã nguồn mở (MIT, BSD, Apache 2.0, PostgreSQL), sơ đồ ERD 8 bảng (`1:N`, `N:N`, `1:1`), lệnh khởi chạy 1 bước (`docker compose up --build -d`), bảng 4 tài khoản Demo, bảng 25 RESTful API endpoints và hướng dẫn 8 bước Demo bắt buộc. |
| 2 | [`docs/BAO_CAO_DO_AN.md`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docs/BAO_CAO_DO_AN.md) | Bản thảo Báo cáo Đồ án đầy đủ 8 Chương kèm Phiếu đăng ký đề tài & phân công nhiệm vụ, phân tích 5 tác nhân người dùng, 6 tính năng nâng cao, đặc tả 8 bảng CSDL 3NF, 25 endpoints, bảo mật JWT/bcrypt/RBAC, Docker non-root, kết quả 18 tests `pytest` (Coverage `94.37%`) và mục kê khai minh bạch công cụ AI hỗ trợ (theo Mục VII ĐG2). |
| 3 | [`docs/BAO_CAO_DO_AN.docx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docs/BAO_CAO_DO_AN.docx) | Tập tin Báo cáo Đồ án định dạng Microsoft Word (`.docx`, dung lượng `52 KB`) được định dạng trang A4 chuẩn mực, phông chữ Times New Roman, hệ thống bảng biểu chuyên nghiệp sẵn sàng in ấn và nộp ĐG2. |
| 4 | [`docs/SLIDE_THUYET_TRINH.pptx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docs/SLIDE_THUYET_TRINH.pptx) | Tập tin Slide thuyết trình PowerPoint (`.pptx`, dung lượng `65 KB`) gồm **đúng 12 Slides** theo quy định tại Mục 6.1 của `DDG2_Bài_Tập_Lớn.docx`, phân bổ rõ người trình bày trên từng slide cho cả 4 thành viên. |
| 5 | [`docs/CAM_NANG_VAN_DAP.md`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docs/CAM_NANG_VAN_DAP.md) | Cẩm nang trả lời chi tiết toàn bộ **9 chủ đề câu hỏi vấn đáp tham khảo (Mục 6.3 ĐG2)**, chia theo đúng vai trò của **Nguyễn Hải Long**, **Nguyễn Đức Anh**, **Nguyễn Huy Hoàng**, **Hoàng Nhật Thắng**, chỉ rõ đường dẫn file và số dòng code để mở ra giải thích ngay khi bảo vệ. |

---

## 3. BẢNG TỔNG KẾT NGHIỆM THU TOÀN DỰ ÁN (FINAL QA ACCEPTANCE MATRIX)

| Mã Tiêu chí | Hạng mục Chấm điểm ĐG2 (`DDG2_Bài_Tập_Lớn.docx`) | Điểm Tối đa | Kết quả Thực hiện trong Dự án `chodocusinhvien` | Trạng thái |
| :-: | :--- | :-: | :--- | :-: |
| **A1** | **Chức năng và API** (Đủ chức năng chính, chuẩn REST, mã trạng thái đúng, Swagger đầy đủ) | **1,5** | Hoàn thiện **25 RESTful API endpoints** dưới `/api/v1`, trả đúng mã HTTP (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`), tài liệu hóa tự động trên `/docs` (Swagger UI) & `/redoc`, kèm **6 tính năng nâng cao**. | ✅ **ĐẠT 100%** |
| **A2** | **Cơ sở dữ liệu** ($\ge 5$ bảng, quan hệ `1:N` & `N:N`, ràng buộc toàn vẹn, migration, seed) | **1,0** | Thiết kế **8 bảng chuẩn 3NF** (`users`, `categories`, `listings`, `listing_images`, `favorites`, `offers`, `reviews`, `reports`), có `CheckConstraint`, chống lỗi `N+1` bằng `joinedload`/`selectinload`, Alembic `upgrade`/`downgrade` và `seed.py` idempotent. | ✅ **ĐẠT 100%** |
| **A3** | **Bảo mật** (JWT, băm mật khẩu, $\ge 2$ vai trò phân quyền, kiểm chứng dữ liệu, không lộ bí mật) | **1,0** | Xác thực JWT (`HS256`), băm mật khẩu `bcrypt` (`$2b$12$`), phân quyền RBAC 3 vai trò (`STUDENT`, `MODERATOR`, `ADMIN`), chống tự nâng quyền khi đăng ký, kiểm chứng dữ liệu Pydantic v2, không lộ `.env` trên Git. | ✅ **ĐẠT 100%** |
| **A4** | **Container, triển khai, CI/CD** (Docker Compose $\ge 3$ service, non-root, sau Nginx, CI xanh) | **1,5** | `backend/Dockerfile` (`USER appuser` UID 1000), `frontend/Dockerfile` multi-stage (`USER nginx` UID 101), `docker-compose.yml` 3 services (`db`, `api`, `frontend`) + healthcheck + volumes, GitHub Actions CI 3 jobs. | ✅ **ĐẠT 100%** |
| **B1** | **Thuyết trình và Demo** (Slide đúng cấu trúc 12 trang, kịch bản demo 8 bước trơn tru) | **1,0** | Bộ slide `docs/SLIDE_THUYET_TRINH.pptx` đúng 12 slides chuẩn Mục 6.1; giao diện tích hợp **Thanh chuyển nhanh 1-Click 3 Tác nhân Demo** và **Trạm Kiểm thử Trực quan 8 Bước Bảo vệ ĐG2**. | ✅ **ĐẠT 100%** |
| **B2** | **Báo cáo và README** (Đủ nội dung, ERD, kiến trúc, kiểm thử, README chạy được ngay) | **1,0** | Hoàn thiện `README.md`, `docs/BAO_CAO_DO_AN.md`, `docs/BAO_CAO_DO_AN.docx` và `docs/CAM_NANG_VAN_DAP.md` đầy đủ thông tin **Nhóm 4 – Lớp CT2802** và GVHD **ThS. Đỗ Văn Tuyên**. | ✅ **ĐẠT 100%** |
| **C1 & C2** | **Điểm cá nhân (Vấn đáp & Đóng góp GitHub)** | **3,0** | Phân công minh bạch 25% x 4 thành viên kèm Cẩm nang vấn đáp chỉ rõ từng dòng code cho từng thành viên. | ✅ **SẴN SÀNG** |
| **Điểm cộng** | **Test Coverage $\ge 70\%$ & Tính năng vượt yêu cầu thực tế** | **+1,0** | **18/18 tests `pytest` PASSED**, độ bao phủ đạt **94.37%** (vượt mốc 70% tới +24.37%), kèm bộ Postman Collection Runner 24 requests. | 🏆 **VƯỢT CHUẨN** |

