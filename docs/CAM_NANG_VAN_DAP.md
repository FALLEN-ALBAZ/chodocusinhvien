# 🎯 CẨM NANG VẤN ĐÁP BẢO VỆ ĐỒ ÁN ĐG2 (`POS02024`)
## ĐỀ TÀI 4: CHỢ ĐỒ CŨ SINH VIÊN (`chodocusinhvien`) — NHÓM 4 (LỚP CT2802)

> **Hướng dẫn sử dụng Cẩm nang này trong buổi bảo vệ:**  
> Theo quy định tại **Mục 6.3 của đề bài ĐG2**, Giảng viên hướng dẫn (**ThS. Đỗ Văn Tuyên**) sẽ hỏi từng thành viên ít nhất **2 câu hỏi** tập trung vào phân hệ người đó phụ trách và **yêu cầu mở đúng file / dòng mã nguồn trong kho GitHub để giải thích**.  
> Tài liệu này trả lời chi tiết toàn bộ **9 chủ đề câu hỏi vấn đáp trong đề bài**, phân chia rõ theo từng thành viên trong **Nhóm 4 – Lớp CT2802** và đính kèm **đường dẫn file + số dòng code chính xác 100%** để mở ra chỉ ngay lập tức!

---

## BẢNG PHÂN BỔ TRỌNG TÂM VẤN ĐÁP THEO 4 THÀNH VIÊN NHÓM 4

| TT | Thành viên | Vai trò phụ trách | Chủ đề câu hỏi chính (Mục 6.3 ĐG2) | Các File mã nguồn cần mở sẵn khi lên bảng |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Nguyễn Hải Long** *(Trưởng nhóm)* | **Trưởng nhóm & DevOps** | • Chủ đề 1: Git, quy trình làm việc nhóm<br/>• Chủ đề 2: Linux, Docker, Non-root, Volume, DNS<br/>• Chủ đề 6: Triển khai, Nginx Reverse Proxy, CI/CD<br/>• Chủ đề 8 & 9: Giấy phép Mã nguồn mở, Mở rộng quy mô | • [`backend/Dockerfile`](../backend/Dockerfile)<br/>• [`frontend/Dockerfile`](../frontend/Dockerfile)<br/>• [`docker-compose.yml`](../docker-compose.yml)<br/>• [`nginx/nginx.conf`](../nginx/nginx.conf)<br/>• [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| **2** | **Nguyễn Đức Anh** | **Back-end API & Bảo mật** | • Chủ đề 3: Thiết kế RESTful API (`PATCH` vs `PUT`, `409` vs `422`, Path vs Query param)<br/>• Chủ đề 5: Bảo mật (JWT 3 phần, `bcrypt`, Token hết hạn, Chống tự nâng quyền, RBAC) | • [`backend/app/security/auth.py`](../backend/app/security/auth.py)<br/>• [`backend/app/routers/auth.py`](../backend/app/routers/auth.py)<br/>• [`backend/app/routers/listings.py`](../backend/app/routers/listings.py)<br/>• [`backend/app/routers/offers.py`](../backend/app/routers/offers.py)<br/>• [`backend/app/schemas/user.py`](../backend/app/schemas/user.py) |
| **3** | **Nguyễn Huy Hoàng** | **Front-end UI/UX** | • Chủ đề 7: Lưu trữ Token phía Client & rủi ro XSS/CSRF, Xử lý mã `401`, Cấu hình CORS, Chuyển đổi 1-Click 3 Tác nhân Demo & Trạm Kiểm thử 8 Bước | • [`frontend/src/api.js`](../frontend/src/api.js)<br/>• [`frontend/src/App.jsx`](../frontend/src/App.jsx)<br/>• [`frontend/src/components/Navbar.jsx`](../frontend/src/components/Navbar.jsx)<br/>• [`frontend/src/components/DefenseLabView.jsx`](../frontend/src/components/DefenseLabView.jsx)<br/>• [`backend/app/main.py`](../backend/app/main.py) |
| **4** | **Hoàng Nhật Thắng** | **CSDL & Kiểm thử (QA)** | • Chủ đề 4: Quan hệ `N:N` (`favorites`), Lỗi `N+1 Query` & cách khắc phục, Alembic Migration (`upgrade`/`downgrade`), `CheckConstraint`, Seed Data & Pytest Coverage `94.37%` | • [`backend/app/models/listing.py`](../backend/app/models/listing.py)<br/>• [`backend/alembic/versions/0001_initial_schema.py`](../backend/alembic/versions/0001_initial_schema.py)<br/>• [`backend/app/seed.py`](../backend/app/seed.py)<br/>• [`backend/tests/test_api.py`](../backend/tests/test_api.py) |

---

# PHẦN 1: CÂU HỎI DÀNH CHO NGUYỄN HẢI LONG (TRƯỞNG NHÓM & DEVOPS)

## Chủ đề 1: Git & Quy trình làm việc nhóm

### Câu 1.1: Vì sao nhóm không push thẳng lên nhánh `main`? Nhóm tổ chức nhánh và Pull Request như thế nào?
- **Trả lời ngắn gọn, đanh thép:**
  1. Nhánh `main` là nhánh chứa mã nguồn ổn định dùng để triển khai lên máy chủ (Production-ready). Nếu các thành viên push thẳng lên `main`, code chưa qua kiểm thử hoặc bị lỗi cú pháp sẽ làm gãy toàn bộ hệ thống và chặn công việc của các thành viên khác.
  2. Nhóm áp dụng quy trình **Feature Branch Workflow**: mỗi phân hệ/tính năng được làm trên nhánh riêng (ví dụ `feat/devops-docker`, `feat/db-models`, `feat/backend-api`, `feat/frontend-ui`), viết commit theo chuẩn **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `ci:`).
  3. Khi hoàn thành, thành viên tạo **Pull Request (PR)** vào `main`. Lúc này GitHub Actions sẽ tự động kích hoạt chạy kiểm tra bảo mật `.env`, chạy linter `ruff`, chạy 18 bài test `pytest` và build thử React. Chỉ khi **CI báo tích xanh** và được thành viên khác review chéo thì mới được merge vào `main`.
- **Chỉ vào mã nguồn:** Mở file [`.github/workflows/ci.yml` (dòng 3–14)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/.github/workflows/ci.yml#L3-L14) để chỉ cấu hình sự kiện `on: push` và `on: pull_request` tự động bảo vệ nhánh `main`.

### Câu 1.2: Nhóm xử lý xung đột khi gộp nhánh (Merge Conflict) như thế nào?
- **Trả lời:**
  1. Để hạn chế xung đột ngay từ đầu, nhóm đã phân tách kiến trúc theo module độc lập: Backend chia thành 10 files nhỏ trong `backend/app/routers/`, Frontend chia thành các component độc lập trong `frontend/src/components/`.
  2. Khi xảy ra xung đột (ví dụ ở các file dùng chung như `backend/app/main.py` hoặc `README.md`), thành viên phụ trách nhánh tính năng sẽ thực hiện:
     ```bash
     git fetch origin
     git rebase origin/main   # hoặc git merge origin/main
     ```
  3. Mở file có dấu đánh dấu xung đột (`<<<<<<<`, `=======`, `>>>>>>>`), trao đổi trực tiếp với thành viên cùng sửa dòng đó để giữ lại đúng logic của cả hai bên, chạy lại `pytest` và `npm run build` ở máy local cho PASS rồi mới đẩy lên cập nhật Pull Request.

---

## Chủ đề 2: Linux, Docker & Container hóa

### Câu 2.1: Giải thích từng dòng trong `backend/Dockerfile` và `frontend/Dockerfile`? Vì sao tuyệt đối không chạy container bằng quyền `root`?
- **Trả lời câu hỏi "Vì sao không chạy bằng `root`?":**
  - Mặc định tiến trình bên trong Docker container chạy với quyền `root` (`UID 0`), và `root` trong container chia sẻ cùng nhân Linux (`Kernel`) với máy chủ vật lý (Host).
  - Nếu ứng dụng web có lỗ hổng thực thi mã từ xa (RCE) hoặc lỗ hổng thoát khỏi container (Container Escape), kẻ tấn công sẽ lập tức chiếm được quyền `root` trên máy chủ thật.
  - Vì vậy, việc tạo và chuyển sang người dùng thường không có đặc quyền (`appuser` với `UID 1000` ở Backend, và `nginx` với `UID 101` ở Frontend) giúp tuân thủ **Nguyên tắc Đặc quyền Tối thiểu (Principle of Least Privilege)**: tiến trình không thể cài phần mềm độc hại hay ghi đè file hệ thống.
- **Giải thích từng dòng trong [`backend/Dockerfile` (dòng 13–60)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/Dockerfile#L13-L60):**
  - **Dòng 13 (`FROM python:3.12-slim`):** Dùng bản `slim` nhẹ hơn bản đầy đủ hàng trăm MB, bỏ bớt các công cụ dư thừa để giảm bề mặt tấn công.
  - **Dòng 18–19 (`ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1`):** Ngăn Python sinh file `.pyc` và ép log in ra `stdout` ngay lập tức theo thời gian thực để xem qua `docker compose logs`.
  - **Dòng 26–30 (`RUN apt-get update && ... && rm -rf /var/lib/apt/lists/*`):** Cài `libpq-dev`, `gcc` (để kết nối PostgreSQL) và `curl` (để chạy healthcheck), sau đó xóa cache apt ngay trong cùng 1 lệnh `RUN` để giảm kích thước layer.
  - **Dòng 33–34 (`RUN groupadd -g 1000 appuser && useradd -r -u 1000 ...`):** Tạo group và user hệ thống `appuser` có `UID 1000`, khóa shell đăng nhập (`/sbin/nologin`).
  - **Dòng 38–42 (`COPY requirements.txt .` rồi `RUN pip install ...`):** Sao chép `requirements.txt` trước khi copy code (`COPY . .` ở dòng 45) để tận dụng **Docker Layer Caching** — khi sửa code Python thì Docker không phải tải lại thư viện.
  - **Dòng 49–51 (`RUN mkdir -p /app/uploads && chmod +x /app/entrypoint.sh && chown -R appuser:appuser /app`):** Cấp quyền sở hữu thư mục làm việc và thư mục chứa ảnh upload cho `appuser`.
  - **Dòng 54 (`USER appuser`):** Chuyển hẳn sang quyền non-root trước khi mở cổng `8000` và chạy `ENTRYPOINT ["/app/entrypoint.sh"]` (dòng 60).
- **Giải thích Multi-stage Build trong [`frontend/Dockerfile` (dòng 12–47)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/Dockerfile#L12-L47):**
  - **Stage 1 (dòng 12–29, `FROM node:20-alpine AS builder`):** Dùng Node.js để cài `node_modules` (`npm ci`) và biên dịch React ra bộ file tĩnh HTML/CSS/JS trong `/app/dist` (`npm run build`).
  - **Stage 2 (dòng 32–47, `FROM nginxinc/nginx-unprivileged:alpine`):** Chỉ copy thư mục `/app/dist` từ Stage 1 sang Nginx (dòng 38), vứt bỏ hoàn toàn `node_modules` nặng hàng trăm MB. Image cuối cùng cực nhẹ và chạy dưới `USER nginx` (`UID 101`, cổng `8080`).

### Câu 2.2: Volume trong `docker-compose.yml` dùng để làm gì? Vì sao dịch vụ `api` kết nối được tới CSDL bằng tên máy chủ là `db`?
- **Trả lời câu hỏi về Volume:**
  - Hệ thống tệp bên trong container là tạm thời (ephemeral) — nếu xóa container (`docker compose down`) thì mọi dữ liệu bên trong sẽ mất sạch.
  - Nhóm cấu hình **2 Named Volumes** tại [`docker-compose.yml` (dòng 26, 57, 85–89)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docker-compose.yml#L85-L89):
    1. `postgres_data:/var/lib/postgresql/data`: Lưu trữ bền vững toàn bộ 8 bảng dữ liệu của PostgreSQL trên ổ cứng máy chủ.
    2. `uploads_data:/app/uploads`: Lưu trữ bền vững các file ảnh đồ cũ mà sinh viên đã tải lên.
- **Trả lời câu hỏi "Vì sao kết nối CSDL bằng host `db`?":**
  - Mở [`docker-compose.yml` (dòng 15, 49, 91–94)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docker-compose.yml#L49): Cả 3 services (`db`, `api`, `frontend`) đều cùng tham gia vào mạng cầu nối tùy chỉnh `chodocu_net`.
  - Docker cung cấp sẵn một **Embedded DNS Server** (máy chủ phân giải tên miền nội bộ tại `127.0.0.11`) cho các mạng user-defined bridge. Khi `api` gọi tới hostname `db` trong chuỗi `postgresql://...@db:5432/...`, DNS nội bộ của Docker tự động phân giải tên dịch vụ `db` thành địa chỉ IP nội bộ của container PostgreSQL.

---

## Chủ đề 6: Triển khai, Nginx Reverse Proxy & CI/CD

### Câu 6.1: Mô tả chi tiết đường đi của một HTTP Request từ trình duyệt người dùng đến CSDL và ngược lại?
- **Chỉ vào mã nguồn:** Mở [`nginx/nginx.conf` (dòng 8–66)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/nginx/nginx.conf#L8-L66) và [`docker-compose.yml`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docker-compose.yml).
- **Trả lời theo 4 chặng rõ ràng:**
  1. **Trình duyệt $\rightarrow$ Nginx (Cổng 80 $\rightarrow$ 8080):** Người dùng gửi request tới cổng 80 của máy chủ. Docker ánh xạ cổng `80:8080` vào container `chodocu_frontend` đang chạy Nginx.
  2. **Phân luồng tại Nginx (`nginx/nginx.conf`):**
     - Nếu đường dẫn là `/` hoặc route giao diện React: khối `location /` (dòng 22–27) dùng `try_files $uri $uri/ /index.html;` trả về ngay giao diện SPA từ `/usr/share/nginx/html`.
     - Nếu đường dẫn bắt đầu bằng `/api/`, `/docs`, `/openapi.json` hoặc `/uploads/`: các khối `location` (dòng 30–65) thực hiện **Reverse Proxy** (`proxy_pass http://api:8000/...`) kèm các header định danh `X-Real-IP`, `X-Forwarded-For` sang container Backend `api`.
  3. **Xử lý tại FastAPI (`backend/app/main.py` & `routers/`):** Request đi qua `structured_logging_middleware` (dòng 86 `main.py`), qua tầng xác thực JWT (`security/auth.py`), kiểm chứng dữ liệu Pydantic v2 (`schemas/`), rồi vào hàm xử lý của Router.
  4. **FastAPI $\rightarrow$ PostgreSQL (`db:5432`):** Router sử dụng phiên làm việc `Session` của SQLAlchemy 2.0 gửi câu lệnh SQL qua cổng TCP `5432` tới container `chodocu_db`, nhận dữ liệu bản ghi, đóng gói thành JSON và trả ngược qua Nginx về trình duyệt.

### Câu 6.2: Các khóa bí mật (Secrets) được lưu ở đâu? Nếu GitHub Actions CI bị báo đỏ (Fail) thì nhóm xử lý quy trình thế nào?
- **Trả lời về Secrets:**
  - Tuyệt đối không lưu khóa bí mật thật trong mã nguồn. Trong kho Git chỉ có file mẫu [`.env.example`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/.env.example).
  - File `.env` thật đã bị chặn hoàn toàn trong [`.gitignore` (dòng 1–5)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/.gitignore#L1-L5) và được kiểm tra tự động bằng lệnh `git ls-files --error-unmatch .env` tại Job 1 của [`.github/workflows/ci.yml` (dòng 26–33)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/.github/workflows/ci.yml#L26-L33). Khi chạy trên máy chủ hoặc GitHub Actions, biến bí mật được nạp qua biến môi trường (`Environment Variables` / `GitHub Secrets`).
- **Trả lời khi CI báo đỏ:**
  1. Không được phép merge Pull Request đó vào `main`.
  2. Mở tab **Actions** trên GitHub để xem chính xác bị đỏ ở Job nào trong 3 Jobs:
     - Nếu đỏ ở `security-and-lint`: Chạy `ruff check . --fix` ở máy cá nhân hoặc gỡ file `.env` bị lọt.
     - Nếu đỏ ở `backend-test`: Xem log `pytest` báo sai ở hàm test nào hoặc độ bao phủ tụt dưới 70%, sửa lỗi logic và chạy lại `pytest --cov=app` tại local.
     - Nếu đỏ ở `frontend-build`: Kiểm tra lỗi import hoặc cú pháp JSX bằng `npm run build` tại local.
  3. Sau khi sửa xong, commit và push bổ sung lên nhánh tính năng để CI tự động chạy lại đến khi xanh cả 3 Jobs.

---

## Chủ đề 8 & 9: Giấy phép Mã nguồn mở & Mở rộng Quy mô Hệ thống

### Câu 8.1: Liệt kê các thành phần mã nguồn mở nhóm sử dụng và giấy phép của chúng. Nhóm chọn giấy phép gì cho dự án và vì sao?
- **Chỉ vào mã nguồn:** Mở file [`LICENSE`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/LICENSE) ở thư mục gốc và Mục 2.2 trong [`README.md`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/README.md).
- **Trả lời:**
  - Các thành phần nguồn mở sử dụng: **FastAPI, SQLAlchemy, Alembic, Pydantic v2, React 18, Vite, TailwindCSS, Pytest** đều mang giấy phép **MIT License**; **Uvicorn, Nginx, Ruff** mang giấy phép **BSD License**; **bcrypt** mang **Apache License 2.0**; **PostgreSQL 16** mang **PostgreSQL License**.
  - Nhóm chọn **MIT License** cho dự án `chodocusinhvien` vì: (1) Đây là giấy phép nguồn mở cấp phép rộng (Permissive), hoàn toàn tương thích với tất cả các thư viện MIT/BSD/Apache 2.0 mà nhóm sử dụng; (2) Cho phép nhà trường, giảng viên và các khóa sinh viên sau tự do nghiên cứu, sửa đổi và triển khai thực tế mà không vướng ràng buộc bản quyền phức tạp.

### Câu 9.1: Nếu số lượng sinh viên sử dụng tăng gấp 10 lần (10x Traffic), hệ thống cần thay đổi những gì?
- **Trả lời theo 4 tầng kiến trúc:**
  1. **Tầng Web / API:** Tăng số lượng worker của Uvicorn (`--workers 4`) và nhân bản (scale horizontal) nhiều container `api` đứng sau bộ cân bằng tải **Nginx Load Balancer** (`upstream api_servers`).
  2. **Tầng Caching:** Bổ sung thêm 1 dịch vụ **Redis** vào `docker-compose.yml` để cache kết quả của API danh mục (`/api/v1/categories`), thống kê (`/api/v1/stats/overview`) và trang đầu danh sách tin đăng trong 30–60 giây, giảm 80% tải đọc cho PostgreSQL.
  3. **Tầng Cơ sở dữ liệu:** Sử dụng bộ quản lý kết nối **PgBouncer** (Connection Pooling), đánh thêm chỉ mục Full-Text Search (`GIN Index` của PostgreSQL) cho cột `title`/`description`, và tách mô hình 1 Primary (Ghi) – 2 Read Replicas (Đọc).
  4. **Tầng Lưu trữ Ảnh:** Chuyển từ Docker Volume cục bộ (`uploads_data`) sang dịch vụ lưu trữ đối tượng tương thích S3 như **MinIO** (mã nguồn mở) kèm CDN để phục vụ ảnh tĩnh.

---

# PHẦN 2: CÂU HỎI DÀNH CHO NGUYỄN ĐỨC ANH (BACK-END API & BẢO MẬT)

## Chủ đề 3: Thiết kế RESTful API

### Câu 3.1: Vì sao các endpoint duyệt tin và chấp nhận đề nghị mua lại dùng `PATCH` thay vì `PUT`?
- **Chỉ vào mã nguồn:**
  - Mở [`backend/app/routers/listings.py` (dòng 353–428)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L353-L428) (`@router.put("/{listing_id}")`).
  - Mở [`backend/app/routers/moderation.py` (dòng 55–99)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/moderation.py#L55-L99) (`@router.patch("/listings/{listing_id}/status")`).
  - Mở [`backend/app/routers/offers.py` (dòng 124–198)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/offers.py#L124-L198) (`@router.patch("/offers/{offer_id}/accept")`).
- **Trả lời:**
  - Theo chuẩn ngữ nghĩa HTTP/REST:
    - **`PUT`** dùng để cập nhật/thay thế toàn bộ thông tin biểu diễn của tài nguyên (khi người bán sửa tiêu đề, mô tả, giá bán, tình trạng, danh mục và danh sách ảnh tại `PUT /api/v1/listings/{listing_id}`).
    - **`PATCH`** dùng để **cập nhật một phần (Partial Update) hoặc chuyển đổi trạng thái cụ thể** của tài nguyên. Khi Kiểm duyệt viên duyệt tin tại `PATCH /api/v1/moderation/listings/{id}/status`, client chỉ gửi đúng trường `{"status": "APPROVED"}` mà không chạm vào tiêu đề hay giá bán của sinh viên. Tương tự, `PATCH /api/v1/offers/{id}/accept` chỉ kích hoạt chuyển trạng thái giao dịch sang `ACCEPTED`.

### Câu 3.2: Khi nào hệ thống trả mã `409 Conflict`, khi nào trả `422 Unprocessable Entity`? Chỉ ra các đoạn code cụ thể!
- **Trả lời phân biệt bản chất:**
  - **`422 Unprocessable Entity`** xảy ra ở **tầng kiểm chứng dữ liệu đầu vào (Pydantic v2 Schema Validation)** trước khi chạm tới CSDL: cú pháp JSON đúng nhưng kiểu dữ liệu hoặc miền giá trị sai quy định.
    - *Chỉ vào code:*
      - [`backend/app/schemas/listing.py` (dòng 28–36)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/schemas/listing.py#L28-L36): `title` phải từ 5–255 ký tự (`min_length=5`), `price` phải không âm (`ge=0`). Nếu gửi `price: -50000` $\rightarrow$ trả `422`.
      - [`backend/app/schemas/listing.py` (dòng 60–75)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/schemas/listing.py#L60-L75): Hàm `@model_validator` bắt buộc phải có `rejection_reason` khi trạng thái duyệt là `REJECTED`; nếu bỏ trống $\rightarrow$ trả `422`.
      - [`backend/app/schemas/review.py` (dòng 10)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/schemas/review.py#L10): `rating: int = Field(..., ge=1, le=5)`. Nếu gửi `rating: 6` $\rightarrow$ trả `422`.
  - **`409 Conflict`** xảy ra ở **tầng logic nghiệp vụ & trạng thái CSDL**: dữ liệu gửi lên hoàn toàn hợp lệ về mặt cú pháp/kiểu, nhưng **xung đột với trạng thái hiện tại của tài nguyên trong CSDL**.
    - *Chỉ vào code:*
      - [`backend/app/routers/auth.py` (dòng 65–69)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/auth.py#L65-L69): Đăng ký bằng email đã tồn tại trong bảng `users` $\rightarrow$ trả `409 Conflict`.
      - [`backend/app/routers/listings.py` (dòng 383–388)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L383-L388): Cố tình chỉnh sửa tin đăng đã bán (`listing.status == SOLD`) $\rightarrow$ trả `409 Conflict`.
      - [`backend/app/routers/offers.py` (dòng 50–57 & 160–170)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/offers.py#L50-L57): Gửi trả giá hoặc chấp nhận trả giá cho tin đăng đã `SOLD` hoặc chưa `APPROVED` $\rightarrow$ trả `409 Conflict`.
      - [`backend/app/routers/reviews.py` (dòng 47–60)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/reviews.py#L47-L60): Đánh giá khi tin chưa `SOLD` hoặc cố tình đánh giá lần thứ 2 cho cùng 1 tin đăng $\rightarrow$ trả `409 Conflict`.

### Câu 3.3: Sự khác nhau giữa Path Parameter và Query Parameter là gì? Nhóm đã áp dụng như thế nào?
- **Trả lời:**
  - **Path Parameter (Tham số đường dẫn):** Là một phần của URL dùng để **định danh duy nhất một tài nguyên cụ thể**. Nếu thiếu nó thì endpoint không xác định được đối tượng.
    - *Ví dụ trong code:* `GET /api/v1/listings/{listing_id}` tại [`backend/app/routers/listings.py` (dòng 305–350)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L305-L350) dùng `listing_id: int` để lấy đúng 1 món đồ.
  - **Query Parameter (Tham số truy vấn sau dấu `?`):** Là các tham số tùy chọn dùng để **tìm kiếm, lọc, sắp xếp hoặc phân trang** một tập hợp tài nguyên.
    - *Ví dụ trong code:* `GET /api/v1/listings?q=casio&category_id=2&min_price=50000&sort_by=price_asc&page=1` tại [`backend/app/routers/listings.py` (dòng 74–128)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L74-L128).

---

## Chủ đề 5: Bảo mật Hệ thống (JWT, Bcrypt, RBAC)

### Câu 5.1: JWT gồm những phần nào? Payload của JWT có bị mã hóa (encrypted) không?
- **Chỉ vào mã nguồn:** Mở [`backend/app/security/auth.py` (dòng 45–76)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/security/auth.py#L45-L76).
- **Trả lời:**
  1. Một chuỗi JWT gồm **3 phần** ngăn cách bởi dấu chấm (`.`): `Header.Payload.Signature`.
     - **Header:** Chứa thuật toán ký (`"alg": "HS256"`, `"typ": "JWT"`).
     - **Payload:** Tại dòng 56–61 của `security/auth.py`, nhóm đưa vào 4 trường: `sub` (ID người dùng), `email`, `role` (`STUDENT`/`MODERATOR`/`ADMIN`) và `exp` (thời điểm hết hạn).
     - **Signature:** Chữ ký số tạo bởi thuật toán HMAC-SHA256 kết hợp `Header + Payload` với khóa bí mật `settings.JWT_SECRET_KEY`.
  2. **Payload của JWT KHÔNG bị mã hóa bí mật (Not Encrypted)** — nó chỉ được **mã hóa định dạng Base64URL (Encoded)** nên bất kỳ ai có chuỗi token đều có thể giải mã Base64 để đọc được nội dung bên trong.
  3. Chính vì vậy: (a) Nhóm tuyệt đối không lưu mật khẩu hay dữ liệu nhạy cảm vào Payload; (b) Bảo mật của JWT nằm ở phần **Signature** — nếu kẻ tấn công tự ý sửa `role` trong Payload thành `ADMIN`, chữ ký sẽ không khớp với `JWT_SECRET_KEY` trên server và hàm `jwt.decode()` (dòng 71) sẽ lập tức ném lỗi `JWTError` $\rightarrow$ trả về `401 Unauthorized`.

### Câu 5.2: Mật khẩu được lưu trong CSDL như thế nào? Điều gì xảy ra khi JWT Token hết hạn?
- **Chỉ vào mã nguồn:** Mở [`backend/app/security/auth.py` (dòng 26–43 và 92–121)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/security/auth.py#L26-L43).
- **Trả lời:**
  - **Lưu trữ mật khẩu:** Hàm `hash_password()` (dòng 26) sử dụng `bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())`. Thuật toán `bcrypt` tự động sinh một chuỗi **muối ngẫu nhiên (random salt)** dài 16 bytes cho từng người dùng và thực hiện băm lặp $2^{12}$ vòng (cost factor = 12), tạo ra chuỗi 60 ký tự có dạng `$2b$12$...` lưu vào cột `password_hash` của bảng `users`. Kể cả 2 sinh viên đặt mật khẩu giống hệt nhau thì chuỗi `password_hash` trong CSDL cũng hoàn toàn khác nhau.
  - **Khi Token hết hạn:** Trường `exp` trong JWT được kiểm tra tự động bởi `jwt.decode()` tại dòng 71. Khi thời gian hiện tại vượt quá `exp`, thư viện `python-jose` ném ngoại lệ `ExpiredSignatureError` (con của `JWTError`), được khối `except (JWTError, ValueError):` tại dòng 114 bắt lại và trả về mã `401 Unauthorized` kèm thông báo *"Phiên đăng nhập không hợp lệ hoặc đã hết hạn"*.

### Câu 5.3: Làm sao hệ thống ngăn chặn người dùng tự nâng quyền (Privilege Escalation) thành Admin/Moderator?
- **Chỉ vào mã nguồn:**
  - Mở [`backend/app/schemas/user.py` (dòng 11–26)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/schemas/user.py#L11-L26).
  - Mở [`backend/app/routers/auth.py` (dòng 55–92)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/auth.py#L55-L92).
  - Mở [`backend/tests/test_api.py` (dòng 35–68)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/tests/test_api.py#L35-L68) (`test_register_student_and_prevent_role_escalation`).
- **Trả lời:**
  - Nhóm chặn lỗ hổng tự nâng quyền (Mass Assignment / Privilege Escalation) bằng **2 chốt chặn**:
    1. **Chốt chặn 1 tại Schema (`schemas/user.py` dòng 11):** Lớp `UserRegisterRequest` chỉ khai báo `email`, `password`, `full_name`, `phone`, `university` — **hoàn toàn không có trường `role`**. Mọi trường `"role": "ADMIN"` do kẻ tấn công gửi kèm trong JSON đều bị Pydantic v2 loại bỏ.
    2. **Chốt chặn 2 tại Router (`routers/auth.py` dòng 83):** Khi tạo bản ghi `User`, mã nguồn gán cứng `role=UserRole.STUDENT.value`. Nhóm đã viết bài kiểm thử tự động `test_register_student_and_prevent_role_escalation` để chứng minh: dù cố tình gửi `"role": "ADMIN"` lúc đăng ký, tài khoản sinh ra vẫn luôn có `role == "STUDENT"`.

---

# PHẦN 3: CÂU HỎI DÀNH CHO NGUYỄN HUY HOÀNG (FRONT-END UI/UX)

## Chủ đề 7: Giao diện Front-end, Quản lý Token & CORS

### Câu 7.1: JWT Token đang được lưu ở đâu phía Client? Rủi ro bảo mật là gì và cách giảm thiểu?
- **Chỉ vào mã nguồn:** Mở [`frontend/src/App.jsx` (dòng 38–49)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/App.jsx#L38-L49) và [`frontend/src/api.js` (dòng 226–233)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/api.js#L226-L233).
- **Trả lời:**
  - **Vị trí lưu trữ:** Phía client lưu JWT Access Token trong `localStorage` với khóa `chodocu_token` (`localStorage.getItem('chodocu_token')` và `localStorage.setItem(...)`) để duy trì phiên đăng nhập khi người dùng tải lại trang (F5), đồng thời hàm `apiRequest()` trong `frontend/src/api.js` (dòng 230–232) tự động đính kèm vào header `Authorization: Bearer ${token}`.
  - **Rủi ro bảo mật:** Lưu token trong `localStorage` có rủi ro nếu ứng dụng bị lỗ hổng **XSS (Cross-Site Scripting)** — mã độc JavaScript chèn vào trang có thể đọc được `localStorage`.
  - **Biện pháp giảm thiểu của nhóm:**
    1. Sử dụng cơ chế tự động thoát mã (Auto-escaping JSX) của React 18, tuyệt đối không dùng `dangerouslySetInnerHTML` ở bất kỳ component nào.
    2. Đặt thời hạn sống (`exp`) cho token và có thể nâng cấp sang lưu token trong `HttpOnly, Secure, SameSite=Strict Cookie` khi triển khai kèm tên miền HTTPS thực tế.

### Câu 7.2: Front-end xử lý thế nào khi gọi API mà nhận về mã lỗi `401 Unauthorized`, `403 Forbidden` hoặc `422`?
- **Chỉ vào mã nguồn:** Mở [`frontend/src/api.js` (dòng 210–266)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/api.js#L210-L266) và [`frontend/src/App.jsx` (dòng 94–115)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/App.jsx#L94-L115).
- **Trả lời:**
  1. Khi ứng dụng khởi động, hàm `fetchMe()` tại `App.jsx` (dòng 95–112) gọi `GET /api/v1/auth/me` với token đang lưu. Nếu token đã hết hạn hoặc không hợp lệ (API trả `401`), khối `catch` lập tức xóa sạch `chodocu_token` và `chodocu_user` khỏi `localStorage` và đưa giao diện về trạng thái Khách vãng lai.
  2. Đối với mọi lời gọi API qua hàm `apiRequest()` (`frontend/src/api.js` dòng 226–267), hàm `extractErrorMessage()` (dòng 210–223) tự động bóc tách cả thông báo lỗi chuỗi (`detail` của `401`, `403`, `409`, `429`) lẫn mảng lỗi kiểm chứng của Pydantic v2 (`422` có dạng `[{loc, msg}]`) để hiển thị thành thông báo Toast tiếng Việt rõ ràng cho người dùng.

### Câu 7.3: CORS là gì và nhóm đã cấu hình CORS kết hợp Proxy như thế nào?
- **Chỉ vào mã nguồn:**
  - Mở [`backend/app/main.py` (dòng 76–82)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/main.py#L76-L82).
  - Mở [`nginx/nginx.conf` (dòng 22–37)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/nginx/nginx.conf#L22-L37).
  - Mở [`frontend/vite.config.js`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/vite.config.js).
- **Trả lời:**
  - **CORS (Cross-Origin Resource Sharing)** là cơ chế bảo mật của trình duyệt chặn trang web ở nguồn (Origin = `protocol + domain + port`) này gọi AJAX/Fetch sang một nguồn khác nếu server đích không cấp phép qua header `Access-Control-Allow-Origin`.
  - Nhóm giải quyết bài toán CORS ở cả 2 cấp độ:
    1. **Ở mức Kiến trúc Triển khai (`nginx/nginx.conf`):** Khi chạy bằng Docker Compose, cả giao diện React (`/`) lẫn API (`/api/v1/...`) đều được truy cập qua cùng 1 cổng của **Nginx Reverse Proxy**, do đó trình duyệt coi đây là **Same-Origin** (cùng nguồn), không bị chặn CORS và không tốn thêm request `OPTIONS` (Preflight).
    2. **Ở mức Backend (`backend/app/main.py` dòng 76–82):** Cấu hình `CORSMiddleware` cho phép khi phát triển độc lập hoặc gọi từ Swagger UI/công cụ bên ngoài vẫn hoạt động trơn tru.

---

# PHẦN 4: CÂU HỎI DÀNH CHO HOÀNG NHẬT THẮNG (CSDL & KIỂM THỬ QA)

## Chủ đề 4: Cơ sở dữ liệu, SQLAlchemy ORM & Alembic Migration

### Câu 4.1: Giải thích quan hệ Nhiều - Nhiều (`N:N`) trong ERD của nhóm? Vì sao dùng khóa chính tổ hợp cho bảng `favorites`?
- **Chỉ vào mã nguồn:** Mở [`backend/app/models/listing.py` (dòng 19–40 và 99–110)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/listing.py#L19-L40) và [`backend/app/routers/listings.py` (dòng 431–499)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L431-L499).
- **Trả lời:**
  - Trong nghiệp vụ Chợ Đồ Cũ Sinh Viên: một sinh viên (`users`) có thể bấm thả tim lưu yêu thích nhiều tin đăng (`listings`), và một tin đăng cũng có thể được nhiều sinh viên khác nhau lưu yêu thích. Đây là quan hệ **Nhiều - Nhiều (`N:N`)**.
  - Trong CSDL quan hệ chuẩn 3NF, quan hệ `N:N` được tách thành bảng trung gian **`favorites`** (`class Favorite` tại `models/listing.py` dòng 19–40) có 2 khóa ngoại `user_id` (`FK -> users.id ON DELETE CASCADE`) và `listing_id` (`FK -> listings.id ON DELETE CASCADE`).
  - Nhóm đặt `primary_key=True` trên cả 2 cột `(user_id, listing_id)` tạo thành **Khóa chính tổ hợp (Composite Primary Key)** để đảm bảo ở mức CSDL: một người dùng không bao giờ có thể lưu trùng lặp 2 bản ghi yêu thích cho cùng một tin đăng.

### Câu 4.2: Lỗi truy vấn `N+1` (N+1 Query Problem) là gì? Nhóm đã xử lý lỗi này ở đâu trong mã nguồn?
- **Chỉ vào mã nguồn:** Mở [`backend/app/routers/listings.py` (dòng 35–43 và dòng 174–179)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L35-L43).
- **Trả lời:**
  - **Khái niệm lỗi `N+1`:** Khi lấy danh sách 12 tin đăng trên 1 trang (`1 câu SELECT` vào bảng `listings`), nếu dùng cơ chế *Lazy Loading* mặc định của ORM, mỗi khi vòng lặp truy cập tới `listing.seller`, `listing.category`, `listing.images`, và `listing.favorited_by`, SQLAlchemy sẽ phát sinh thêm $4 \times 12 = 48$ câu truy vấn phụ nữa (tổng cộng $1 + 48 = 49$ câu SQL cho 1 lần tải trang), làm chậm hệ thống nghiêm trọng.
  - **Cách nhóm khắc phục triệt để:** Tại hàm `get_listing_load_options()` (`routers/listings.py` dòng 35–43), nhóm cấu hình **Eager Loading**:
    ```python
    def get_listing_load_options() -> list:
        return [
            joinedload(Listing.seller),
            joinedload(Listing.category),
            selectinload(Listing.images),
            selectinload(Listing.favorited_by),
        ]
    ```
    Nhờ `joinedload` (gộp bằng `LEFT JOIN` cho quan hệ `N:1`) và `selectinload` (dùng 1 câu `SELECT ... WHERE listing_id IN (...)` cho quan hệ `1:N`), dù trang có 12 hay 100 tin đăng thì PostgreSQL cũng chỉ thực thi cố định **3 câu truy vấn SQL**.

### Câu 4.3: Alembic Migration giải quyết vấn đề gì? Hãy chạy thử lệnh `downgrade` và `upgrade` ngay trên máy!
- **Chỉ vào mã nguồn:** Mở [`backend/alembic/versions/0001_initial_schema.py` (dòng 22–217)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/alembic/versions/0001_initial_schema.py#L22-L217).
- **Trả lời:**
  - **Vai trò của Migration:** Giúp quản lý lịch sử thay đổi cấu trúc CSDL (thêm/sửa bảng, cột, chỉ mục, ràng buộc) bằng mã nguồn giống như Git quản lý code. Nhờ đó mọi thành viên trong nhóm và môi trường máy chủ Production luôn có cấu trúc CSDL đồng nhất 100% mà không phải sửa bảng thủ công bằng tay.
  - **Giải thích hàm `downgrade()` (dòng 196–217):** Khi cần hoàn tác phiên bản CSDL, hàm `downgrade()` xóa các bảng con có khóa ngoại trước (`reports`, `reviews`, `offers`, `favorites`, `listing_images`), sau đó mới xóa bảng cha (`listings`, `categories`, `users`) để không vi phạm ràng buộc khóa ngoại.
  - **Lệnh chạy trực tiếp khi Giảng viên yêu cầu:**
    ```bash
    cd backend
    python3 -m alembic downgrade base
    python3 -m alembic upgrade head
    python3 -m app.seed
    ```

### Câu 4.4: Giải thích cơ chế giao dịch nguyên tử khi chốt đơn (`accept_offer`) và cách tính điểm uy tín người bán (`reputation_score`)?
- **Chỉ vào mã nguồn:**
  - Mở [`backend/app/routers/offers.py` (dòng 172–198)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/offers.py#L172-L198).
  - Mở [`backend/app/routers/reviews.py` (dòng 80–110)](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/reviews.py#L80-L110).
- **Trả lời:**
  1. **Tại `accept_offer` (`routers/offers.py` dòng 175–196):** Trong cùng một phiên giao dịch (`db.commit()` duy nhất ở dòng 196), hệ thống thực hiện đồng thời 3 việc: (1) Đổi `offer.status = ACCEPTED`; (2) Tự động khóa `listing.status = SOLD`; (3) Quét toàn bộ các đề nghị trả giá `PENDING` khác của cùng tin đăng đó và đổi sang `REJECTED`. Nếu bất kỳ bước nào lỗi, toàn bộ giao dịch được rollback, đảm bảo không bao giờ có chuyện 1 món đồ cũ bị bán cho 2 người.
  2. **Tại `create_review` (`routers/reviews.py` dòng 93–108):** Ngay sau khi thêm đánh giá mới và gọi `db.flush()`, hệ thống dùng hàm tổng hợp SQL `func.count(Review.id)` và `func.avg(Review.rating)` trực tiếp trên CSDL để tính lại chính xác `seller.total_reviews` và `seller.reputation_score = round(avg_rating, 2)` trước khi `db.commit()`.
