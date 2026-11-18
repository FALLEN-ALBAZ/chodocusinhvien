# TRƯỜNG ĐẠI HỌC QUẢN LÝ VÀ CÔNG NGHỆ HẢI PHÒNG
## KHOA CÔNG NGHỆ THÔNG TIN

---

# BÁO CÁO ĐỒ ÁN NHÓM (CAPSTONE) — ĐÁNH GIÁ 2 (ĐG2)
## HỌC PHẦN: LẬP TRÌNH MÃ NGUỒN MỞ (`POS02024`)

### ĐỀ TÀI SỐ 4:
# XÂY DỰNG HỆ THỐNG WEB CHỢ ĐỒ CŨ SINH VIÊN (`chodocusinhvien`)

- **Nhóm thực hiện:** **Nhóm 4**
- **Lớp hành chính:** **CT2802**
- **Giảng viên hướng dẫn:** **ThS. Đỗ Văn Tuyên**
- **Kho lưu trữ GitHub:** `https://github.com/FALLEN-ALBAZ/chodocusinhvien`
- **Giấy phép phát hành:** MIT License (Mã nguồn mở)

**Danh sách thành viên thực hiện:**
1. **Nguyễn Hải Long** — Trưởng nhóm & DevOps (Đóng góp: 25%)
2. **Nguyễn Đức Anh** — Back-end API & Bảo mật (Đóng góp: 25%)
3. **Nguyễn Huy Hoàng** — Front-end UI/UX (Đóng góp: 25%)
4. **Hoàng Nhật Thắng** — CSDL & Kiểm thử QA (Đóng góp: 25%)

*Hải Phòng, Năm 2026*

---

## PHỤ LỤC ĐẦU BÁO CÁO: PHIẾU ĐĂNG KÝ ĐỀ TÀI VÀ PHÂN CÔNG NHIỆM VỤ

- **Tên nhóm:** **Nhóm 4** — **Lớp:** **CT2802** — **Đề tài số:** **04**
- **Tên đề tài:** **Chợ đồ cũ sinh viên (`chodocusinhvien`)**
- **Giảng viên hướng dẫn:** **Đỗ Văn Tuyên**
- **Kho GitHub:** `https://github.com/FALLEN-ALBAZ/chodocusinhvien`

| TT | Họ và tên | Vai trò | Phân hệ phụ trách chính | Minh chứng trên GitHub | Tỷ lệ đóng góp |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | **Nguyễn Hải Long** *(Trưởng nhóm)* | Trưởng nhóm, DevOps | Lập kế hoạch, chia việc trên GitHub Projects; thiết kế cấu trúc Monorepo; viết `Dockerfile` non-root (`appuser` UID 1000 & `nginx` UID 101), `docker-compose.yml` (3 services + healthcheck + volumes), cấu hình Nginx Reverse Proxy; thiết lập GitHub Actions CI/CD (`.github/workflows/ci.yml`); tích hợp hệ thống cuối. | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `nginx/nginx.conf`, `.github/workflows/ci.yml`, `.env.example` | **25%** |
| **2** | **Nguyễn Đức Anh** | Back-end API & Bảo mật | Thiết kế và hiện thực 25 RESTful API endpoints bằng FastAPI; xác thực JWT (`HS256`) và băm mật khẩu `bcrypt`; phân quyền RBAC 3 vai trò (`STUDENT`, `MODERATOR`, `ADMIN`); kiểm chứng dữ liệu Pydantic v2; hiện thực các quy tắc nghiệp vụ nâng cao (Upload đa ảnh UUID, chống spam 5 tin/ngày `429`, chốt đơn nguyên tử `SOLD`, Structured JSON Logging). | `backend/app/main.py`, `backend/app/security/`, `backend/app/routers/`, `backend/app/schemas/` | **25%** |
| **3** | **Nguyễn Huy Hoàng** | Front-end UI/UX | Thiết kế và phát triển giao diện Single Page Application (SPA) bằng React 18 + Vite + TailwindCSS; kết nối RESTful API & quản lý JWT phía client; xây dựng Thanh chuyển đổi nhanh 1-Click 3 Tác nhân Demo, màn hình Khám phá/Lọc/Phân trang, Đăng tin đa ảnh, Quản lý giao dịch, Bàn làm việc Kiểm duyệt viên và Trạm Kiểm thử Trực quan 8 Bước Bảo vệ ĐG2 (`DefenseLabView`). | `frontend/src/App.jsx`, `frontend/src/api.js`, `frontend/src/components/`, `frontend/vite.config.js` | **25%** |
| **4** | **Hoàng Nhật Thắng** | CSDL & Kiểm thử (QA) | Thiết kế sơ đồ ERD 8 bảng đạt chuẩn 3NF (quan hệ `1:N`, `N:N`, `1:1`); lập trình SQLAlchemy 2.0 ORM Models kèm `CheckConstraint`; cấu hình Alembic Migration (`upgrade`/`downgrade`); viết kịch bản dữ liệu mẫu idempotent (`seed.py`); xây dựng bộ 18 bài kiểm thử tự động `pytest` (đạt độ bao phủ **94.37%**) và bộ Postman Collection Runner (24 requests). | `backend/app/models/`, `backend/alembic/`, `backend/app/seed.py`, `backend/tests/`, `postman/` | **25%** |

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ BÀI TOÁN THỰC TẾ

### 1.1. Bối cảnh thực tế trong môi trường đại học
Sau mỗi học kỳ hoặc khi chuẩn bị tốt nghiệp ra trường, sinh viên tại các trường đại học (đặc biệt là sinh viên ở ký túc xá và các khu nhà trọ sinh viên xung quanh Trường Đại học Quản lý và Công nghệ Hải Phòng) luôn phát sinh nhu cầu rất lớn trong việc thanh lý, nhượng lại hoặc tìm mua các vật dụng học tập và sinh hoạt với chi phí tiết kiệm. Các mặt hàng phổ biến bao gồm:
- Giáo trình đại cương, sách chuyên ngành CNTT, Kinh tế, Ngoại ngữ, tài liệu ôn thi.
- Thiết bị điện tử phục vụ học tập (laptop cũ, màn hình rời, bàn phím cơ, chuột, máy tính bỏ túi Casio).
- Đồ gia dụng phòng trọ (nồi cơm điện mini, ấm siêu tốc, quạt điện, tủ lạnh mini, kệ sách, bàn học gấp).
- Phương tiện di chuyển trong khuôn viên trường và thành phố (xe đạp thể thao, xe đạp điện, mũ bảo hiểm).

### 1.2. Các vấn đề tồn tại của phương thức giao dịch hiện nay
Hiện tại, phần lớn sinh viên thực hiện mua bán đồ cũ thông qua các hội nhóm trên mạng xã hội (Facebook Groups, Zalo Groups). Phương thức tự phát này bộc lộ nhiều hạn chế nghiêm trọng:
1. **Khó tìm kiếm và tra cứu có cấu trúc:** Các bài đăng trên mạng xã hội bị trôi rất nhanh theo thời gian. Sinh viên muốn tìm một cuốn giáo trình cụ thể hoặc lọc các món đồ trong tầm giá dưới 200.000đ gần như không thể thực hiện chính xác.
2. **Thiếu cơ chế kiểm duyệt trước khi hiển thị:** Các nhóm mạng xã hội thường xuyên bị tràn ngập bởi tin rác (spam), quảng cáo cờ bạc, tuyển dụng đa cấp hoặc rao bán hàng cấm, làm loãng thông tin thực của sinh viên.
3. **Không đồng bộ trạng thái giao dịch ("Đã bán"):** Nhiều món đồ đã bán từ nhiều tuần trước nhưng bài viết vẫn còn tồn tại khiến người mua mất thời gian nhắn tin hỏi lại.
4. **Rủi ro lừa đảo và thiếu thước đo uy tín:** Người mua không có căn cứ lịch sử giao dịch hay điểm uy tín (`reputation_score`) để đánh giá độ tin cậy của người bán trước khi hẹn gặp giao dịch.

### 1.3. Mục tiêu của hệ thống `chodocusinhvien`
Nhóm 4 xây dựng hệ thống **Chợ Đồ Cũ Sinh Viên (`chodocusinhvien`)** nhằm giải quyết triệt để các bất cập trên thông qua một nền tảng Web chuyên biệt, đáp ứng đồng thời hai mục tiêu lớn:
- **Về mặt nghiệp vụ thực tiễn:** Cung cấp quy trình giao dịch C2C khép kín, có kiểm duyệt nội dung trước khi hiển thị (`PENDING` $\rightarrow$ `APPROVED` / `REJECTED`), hỗ trợ tìm kiếm đa tiêu chí, thương lượng giá (`Offer`), tự động khóa tin khi chốt đơn (`SOLD`), đánh giá uy tín 1–5 sao sau giao dịch và báo cáo tin vi phạm.
- **Về mặt học thuật và kỹ thuật (Học phần `POS02024`):** Vận dụng toàn diện hệ sinh thái phần mềm mã nguồn mở gồm Linux, Git/GitHub, Docker (non-root container) & Docker Compose 3 services, Nginx Reverse Proxy, FastAPI, SQLAlchemy 2.0 ORM, Alembic Migration, PostgreSQL 16, React 18, kiểm thử tự động `pytest` (đạt độ bao phủ **94.37%**) và quy trình tích hợp liên tục GitHub Actions CI/CD.

### 1.4. Phạm vi của đề tài
- **Phạm vi trong đồ án:** Quản lý định danh & phân quyền RBAC; Quản lý danh mục; Đăng tin đa ảnh kèm kiểm soát hạn mức chống spam (tối đa 5 tin/ngày); Tìm kiếm, lọc, sắp xếp, phân trang; Lưu danh sách yêu thích (quan hệ `N:N`); Quy trình kiểm duyệt tin đăng và xử lý báo cáo vi phạm; Đề nghị mua/trả giá và chốt đơn nguyên tử; Đánh giá người bán và tự động tính điểm uy tín trung bình; Thống kê tổng quan hệ thống.
- **Phạm vi định hướng mở rộng sau đồ án:** Tích hợp cổng thanh toán tạm giữ (Escrow/VietQR) và nhắn tin thời gian thực qua WebSocket.

---

## CHƯƠNG 2: PHÂN TÍCH YÊU CẦU HỆ THỐNG

### 2.1. Xác định các Tác nhân Người dùng (Actors)
Hệ thống được thiết kế xoay quanh **5 tác nhân người dùng bằng Tiếng Việt** rõ ràng, ánh xạ vào 3 vai trò phân quyền kỹ thuật (`STUDENT`, `MODERATOR`, `ADMIN`):

| STT | Tác nhân Người dùng | Vai trò Hệ thống (`UserRole`) | Mô tả Đặc điểm & Quyền hạn Nghiệp vụ |
| :-: | :--- | :---: | :--- |
| **1** | **Khách vãng lai** | Chưa đăng nhập | Truy cập trang chủ chợ đồ cũ, xem các tin đăng đã được phê duyệt (`APPROVED`), tìm kiếm theo từ khóa, lọc theo danh mục/khoảng giá/tình trạng, xem hồ sơ công khai và lịch sử đánh giá của người bán, đăng ký tài khoản hoặc đăng nhập. |
| **2** | **Sinh viên Bán hàng** | `STUDENT` | Đăng tin bán đồ cũ kèm nhiều hình ảnh minh họa (tối đa 5 tin/ngày để chống spam), theo dõi trạng thái kiểm duyệt (`PENDING`, `APPROVED`, `REJECTED` kèm lý do), chỉnh sửa hoặc xóa tin đăng của mình, xem danh sách đề nghị trả giá nhận được và bấm **Chấp nhận** (tự động chuyển tin sang `SOLD`) hoặc **Từ chối**. |
| **3** | **Sinh viên Mua hàng** | `STUDENT` | Lưu các tin đăng quan tâm vào Danh sách Yêu thích (`favorites` N:N), gửi đề nghị mua/trả giá (`offers`) kèm lời nhắn cho người bán, viết đánh giá 1–5 sao (`reviews`) sau khi giao dịch thành công, và gửi báo cáo vi phạm (`reports`) nếu phát hiện tin lừa đảo. |
| **4** | **Kiểm duyệt viên** | `MODERATOR` | Kiểm duyệt danh sách tin đăng đang chờ duyệt (`PENDING` $\rightarrow$ `APPROVED` hoặc `REJECTED` bắt buộc ghi rõ lý do từ chối), tiếp nhận và xử lý các báo cáo vi phạm cộng đồng (`RESOLVED` tự động gỡ tin vi phạm sang `REJECTED` hoặc `DISMISSED`), quản lý danh mục sản phẩm. |
| **5** | **Quản trị viên** | `ADMIN` | Kế thừa toàn bộ quyền của Kiểm duyệt viên, đồng thời quản trị danh mục hệ thống, giám sát số liệu thống kê tổng quan và quản lý tài khoản người dùng. |

### 2.2. Phân tích Yêu cầu Chức năng Chính (Core Functional Requirements)
1. **Phân hệ Xác thực & Hồ sơ Người dùng:**
   - Đăng ký tài khoản sinh viên mới với kiểm tra trùng lặp email (`409 Conflict`) và ép cứng vai trò `STUDENT` nhằm ngăn chặn lỗ hổng tự nâng quyền (Privilege Escalation).
   - Đăng nhập bằng email và mật khẩu, cấp phát JWT Access Token (`HS256`).
   - Xem hồ sơ cá nhân, điểm uy tín trung bình (`reputation_score`) và danh sách nhận xét từ các giao dịch trước.
2. **Phân hệ Quản lý Tin đăng & Kiểm duyệt Nội dung:**
   - Sinh viên tạo tin đăng mới gồm: tiêu đề, mô tả chi tiết, giá bán ($\ge 0$), tình trạng món đồ (`NEW`, `LIKE_NEW`, `GOOD`, `FAIR`), danh mục và danh sách nhiều hình ảnh.
   - Mọi tin mới tạo đều mang trạng thái `PENDING` (chờ duyệt) và chưa hiển thị ra chợ công khai cho đến khi được Kiểm duyệt viên phê duyệt sang `APPROVED`.
   - Nếu tin vi phạm quy chế, Kiểm duyệt viên chuyển trạng thái sang `REJECTED` kèm theo lý do từ chối (`rejection_reason`) để sinh viên biết và chỉnh sửa.
3. **Phân hệ Tìm kiếm, Lọc, Sắp xếp & Phân trang:**
   - Tìm kiếm toàn văn theo từ khóa `q` trong tiêu đề và mô tả sản phẩm (`ILIKE`).
   - Lọc kết hợp theo danh mục (`category_id`), khoảng giá (`min_price`, `max_price`), tình trạng món đồ (`condition`), người bán (`seller_id`) và tùy chọn hiển thị cả tin đã bán (`include_sold`).
   - Sắp xếp theo: Mới nhất (`newest`), Giá tăng dần (`price_asc`), Giá giảm dần (`price_desc`).
   - Phân trang chuẩn (`page`, `page_size`) trả về tổng số bản ghi (`total`) và tổng số trang (`total_pages`).
4. **Phân hệ Thương lượng Giá (Offers) & Chốt đơn Nguyên tử:**
   - Sinh viên mua gửi đề nghị mua hàng với mức giá đề xuất (`offered_price > 0`) và lời nhắn. Hệ thống chặn tự trả giá tin của chính mình (`400 Bad Request`) và chặn trả giá tin chưa duyệt hoặc đã bán (`409 Conflict`).
   - Khi Sinh viên bán chấp nhận một đề nghị mua (`PATCH /api/v1/offers/{id}/accept`), hệ thống thực hiện **giao dịch nguyên tử (Atomic Transaction)**:
     1. Chuyển trạng thái đề nghị mua được chọn sang `ACCEPTED`.
     2. Tự động khóa trạng thái tin đăng sang `SOLD` (Đã bán).
     3. Tự động từ chối (`REJECTED`) toàn bộ các đề nghị mua `PENDING` khác của cùng tin đăng đó.
5. **Phân hệ Đánh giá sau Giao dịch & Báo cáo Vi phạm:**
   - Chỉ sinh viên mua có đề nghị mua `ACCEPTED` trên tin đã `SOLD` mới được phép gửi đánh giá (`1 <= rating <= 5`) và tối đa 1 lần cho mỗi giao dịch.
   - Sinh viên có thể báo cáo tin đăng đáng ngờ; khi Kiểm duyệt viên xác nhận báo cáo là đúng (`RESOLVED`), hệ thống tự động gỡ tin đăng đó sang `REJECTED`.

### 2.3. Phân tích 6 Tính năng Nâng cao đã Hiện thực (Vượt yêu cầu tối thiểu 2 tính năng)
Theo Bảng 1 của đề bài ĐG2, mỗi nhóm cần hiện thực ít nhất 2 tính năng nâng cao. Nhóm 4 đã hiện thực đầy đủ **6 tính năng nâng cao** (bao gồm cả 3 điểm nâng cao riêng của Đề tài 4 và 3 tính năng kỹ thuật chung):
1. **Upload nhiều file ảnh thật an toàn (`POST /api/v1/uploads/images`):** Kiểm tra định dạng MIME/extension (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`), giới hạn dung lượng 10MB/file, tự động sinh tên file bằng `UUID4` để chống lỗ hổng Path Traversal và lưu trữ bền vững trên Docker Volume `uploads_data`.
2. **Tìm kiếm đa tiêu chí, Lọc khoảng giá, Sắp xếp & Phân trang kết hợp Eager Loading:** Chống triệt để lỗi truy vấn `N+1` bằng `joinedload` và `selectinload`.
3. **Danh sách Yêu thích (Quan hệ `N:N` qua bảng `favorites`):** Cho phép sinh viên thả tim lưu/bỏ lưu tin đăng bằng 1 cú nhấp chuột và quản lý danh sách tin yêu thích riêng.
4. **Hệ thống Điểm uy tín Người bán tự động (`reputation_score`):** Tự động tính lại trung bình cộng điểm sao (`AVG(rating)`) và tổng số lượt đánh giá (`COUNT(id)`) ngay trong transaction tạo đánh giá mới.
5. **Giới hạn số tin đăng mỗi ngày chống Spam (`DAILY_LISTING_LIMIT = 5`):** Đếm số tin đã đăng trong ngày (từ `00:00:00 UTC`) của sinh viên; nếu vượt quá 5 tin/ngày, API trả về mã chuẩn `429 Too Many Requests`.
6. **Thống kê Báo cáo Tổng quan (`/api/v1/stats/overview`) & Structured JSON Logging Middleware:** Cung cấp số liệu thống kê theo danh mục/trạng thái theo thời gian thực và ghi log định dạng JSON có cấu trúc kèm thời gian xử lý `duration_ms` (`X-Process-Time-Ms`).

### 2.4. Yêu cầu Phi chức năng (Non-functional Requirements)
- **Bảo mật:** Mật khẩu băm bằng `bcrypt` (cost factor 12); xác thực stateless bằng JWT `HS256`; container chạy dưới quyền non-root (`UID 1000` và `UID 101`); không lưu bất kỳ khóa bí mật hay file `.env` nào trong kho Git.
- **Độ tin cậy & Khả năng phục hồi:** Các dịch vụ Docker đều có `healthcheck` tự động và chính sách `restart: unless-stopped`; dữ liệu CSDL và file upload được bảo toàn qua Named Volumes.
- **Khả năng bảo trì & Kiểm thử:** Mã nguồn tuân thủ chuẩn PEP8 (kiểm tra tự động bằng `ruff`), độ bao phủ kiểm thử tự động `pytest` đạt **94.37%** (vượt xa yêu cầu 70%).

---

## CHƯƠNG 3: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ MÃ NGUỒN MỞ

### 3.1. Kiến trúc Triển khai 3 Tầng Container hóa
Hệ thống được thiết kế theo kiến trúc phân tách rõ ràng giữa Giao diện (Presentation Layer), Xử lý Nghiệp vụ (Application Layer) và Lưu trữ Dữ liệu (Data Layer), vận hành trong mạng cầu nối nội bộ `chodocu_network`:

```
[Trình duyệt Người dùng]
        │
        ▼ (HTTP Port 80)
[Service 3: frontend — Nginx Unprivileged (UID 101, Port 8080)]
        ├───► Phục vụ trực tiếp gói tĩnh React 18 SPA (/usr/share/nginx/html)
        │
        └───► Reverse Proxy (/api/*, /docs, /openapi.json, /uploads/*)
                    │
                    ▼ (HTTP nội bộ http://api:8000)
        [Service 2: api — FastAPI + Uvicorn + SQLAlchemy 2.0 (UID 1000, Port 8000)]
                    ├───► Đọc/Ghi ảnh sản phẩm ───► [Named Volume: uploads_data]
                    │
                    ▼ (Giao thức TCP/IP nội bộ db:5432)
        [Service 1: db — PostgreSQL 16 Alpine (Port 5432)]
                    └───► Lưu trữ bền vững 8 bảng ─► [Named Volume: postgres_data]
```

**Đường đi chi tiết của một HTTP Request từ trình duyệt đến CSDL:**
1. Người dùng thao tác trên trình duyệt (ví dụ: tìm kiếm `"Giáo trình"`), trình duyệt gửi request `GET /api/v1/listings?q=Giáo+trình` tới cổng `80` của máy chủ Linux.
2. Container `chodocu_frontend` (chạy Nginx ở cổng `8080` được ánh xạ ra cổng `80` của máy chủ) tiếp nhận request. Khối cấu hình `location /api/` trong [`nginx/nginx.conf`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/nginx/nginx.conf#L30-L37) nhận diện tiền tố `/api/` và chuyển tiếp (`proxy_pass http://api:8000/api/`) sang container `api` thông qua DNS nội bộ của Docker.
3. Tại container `chodocu_api`, request đi qua `structured_logging_middleware` trong [`backend/app/main.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/main.py#L85-L106) để bấm giờ xử lý, sau đó được định tuyến tới hàm `list_listings()` trong [`backend/app/routers/listings.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L74-L189).
4. Dependency `get_db()` cấp phát một phiên kết nối SQLAlchemy (`Session`), thực thi truy vấn SQL có tham số hóa (chống SQL Injection) kèm `joinedload`/`selectinload` tới container `chodocu_db` (`PostgreSQL 16`) qua cổng `5432`.
5. Kết quả từ PostgreSQL được ánh xạ qua Pydantic v2 Schema (`PaginatedListingResponse`), đi kèm header `X-Process-Time-Ms` và trả ngược qua Nginx về trình duyệt để React 18 kết xuất lên màn hình.

### 3.2. Phân tích Hệ sinh thái Phần mềm Mã nguồn mở & Giấy phép (Licenses)
Nhóm lựa chọn phát hành dự án dưới giấy phép **MIT License** (tệp [`LICENSE`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/LICENSE)) vì đây là giấy phép nguồn mở cấp phép rộng rãi (permissive), ngắn gọn, cho phép cộng đồng sinh viên và giảng viên tự do sử dụng, nghiên cứu, sửa đổi và triển khai mà không gặp rào cản pháp lý. Toàn bộ các thư viện thành phần được sử dụng đều mang giấy phép tương thích:

| STT | Thành phần Mã nguồn mở | Phiên bản | Giấy phép (License) | Lý do lựa chọn trong kiến trúc |
| :-: | :--- | :---: | :---: | :--- |
| 1 | **Linux (Debian / Alpine)** | `Bookworm / 3.20` | GPLv2 / MIT / BSD | Hệ điều hành máy chủ và base image container siêu nhẹ, ổn định, bảo mật cao. |
| 2 | **PostgreSQL** | `16` | **PostgreSQL License** | Hệ quản trị CSDL quan hệ mã nguồn mở mạnh mẽ nhất hiện nay, tuân thủ ACID và 3NF. |
| 3 | **Python** | `3.12` | **PSF License** | Ngôn ngữ lập trình hiện đại, hỗ trợ Type Hints mạnh mẽ cho FastAPI và SQLAlchemy 2.0. |
| 4 | **FastAPI** | `0.115.6` | **MIT License** | Framework RESTful API hiệu năng cao hàng đầu trên Python, tích hợp sẵn chuẩn OpenAPI 3.1. |
| 5 | **SQLAlchemy & Alembic** | `2.0.36` / `1.14.0` | **MIT License** | Quản lý ORM chuyên nghiệp, hỗ trợ Eager Loading và kiểm soát lịch sử thay đổi CSDL. |
| 6 | **Pydantic v2** | `2.10.4` | **MIT License** | Nhân kiểm chứng dữ liệu viết bằng Rust cực nhanh, đảm bảo toàn vẹn dữ liệu đầu vào. |
| 7 | **bcrypt & python-jose** | `4.0.1` / `3.3.0` | **Apache 2.0 / MIT** | Thực thi băm mật khẩu một chiều có muối và ký số token JWT chuẩn công nghiệp. |
| 8 | **React & Vite** | `18.3.1` / `5.4.11` | **MIT License** | Thư viện giao diện hướng thành phần (Component-based) và công cụ đóng gói tốc độ cao. |
| 9 | **TailwindCSS** | `3.4.15` | **MIT License** | Xây dựng giao diện nhất quán, đáp ứng mọi kích thước màn hình (Responsive). |
| 10 | **Nginx (Unprivileged)** | `1.27` | **2-Clause BSD License** | Web server và Reverse Proxy chịu tải cao, chạy an toàn dưới quyền non-root. |
| 11 | **Pytest & Ruff** | `8.3.4` / `0.8.4` | **MIT License** | Bộ khung kiểm thử tự động và công cụ kiểm tra mã nguồn tĩnh siêu tốc. |

---

## CHƯƠNG 4: THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ QUẢN LÝ MIGRATION

### 4.1. Sơ đồ Thực thể Liên kết (ERD) và Chuẩn hóa 3NF
Cơ sở dữ liệu của hệ thống bao gồm **8 bảng** (vượt yêu cầu tối thiểu 5 bảng của ĐG2 và mở rộng thêm bảng trung gian `favorites` từ 7 bảng gợi ý của Đề tài 4). Thiết kế tuân thủ chặt chẽ dạng chuẩn 3 (**3NF**):
- **Đạt 1NF:** Mọi thuộc tính trong cả 8 bảng đều mang giá trị nguyên tử (Atomic). Các hình ảnh nhiều giá trị của một tin đăng được tách riêng ra bảng `listing_images` thay vì lưu chuỗi nối dấu phẩy.
- **Đạt 2NF:** Mọi thuộc tính không khóa đều phụ thuộc hàm đầy đủ vào khóa chính (đặc biệt tại bảng `favorites` có khóa chính tổ hợp `(user_id, listing_id)`, thuộc tính `created_at` phụ thuộc vào cả cặp khóa).
- **Đạt 3NF:** Không có phụ thuộc bắc cầu giữa các thuộc tính không khóa (thông tin tên/biểu tượng danh mục nằm ở bảng `categories`, thông tin họ tên/trường học của người bán nằm ở bảng `users`, bảng `listings` chỉ tham chiếu qua khóa ngoại `seller_id` và `category_id`).

### 4.2. Đặc tả Chi tiết 8 Bảng Cơ sở dữ liệu

#### Bảng 1: `users` — Quản lý người dùng & Điểm uy tín ([`backend/app/models/user.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/user.py#L14-L79))
| Tên cột | Kiểu dữ liệu | Ràng buộc (Constraints) | Mô tả ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY`, `INDEX` | Mã định danh tự tăng của người dùng. |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL`, `INDEX` | Địa chỉ email sinh viên dùng để đăng nhập. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Chuỗi mật khẩu đã băm bằng `bcrypt` (`$2b$12$...`). |
| `full_name` | `VARCHAR(150)` | `NOT NULL` | Họ và tên đầy đủ của sinh viên / kiểm duyệt viên. |
| `phone` | `VARCHAR(30)` | `NULLABLE` | Số điện thoại liên hệ khi giao dịch. |
| `university` | `VARCHAR(200)` | `NULLABLE` | Tên trường đại học (Mặc định: ĐH Quản lý và Công nghệ Hải Phòng). |
| `avatar_url` | `VARCHAR(500)` | `NULLABLE` | Đường dẫn ảnh đại diện. |
| `role` | `VARCHAR(30)` | `NOT NULL`, `INDEX`, Default `'STUDENT'` | Vai trò RBAC: `STUDENT`, `MODERATOR`, `ADMIN`. |
| `reputation_score` | `FLOAT` | `NOT NULL`, Default `5.0` | Điểm uy tín trung bình tính từ các đánh giá sau giao dịch. |
| `total_reviews` | `INTEGER` | `NOT NULL`, Default `0` | Tổng số lượt đánh giá mà người bán đã nhận được. |
| `is_active` | `BOOLEAN` | `NOT NULL`, Default `True` | Trạng thái kích hoạt tài khoản. |
| `created_at` | `DATETIME` | `NOT NULL`, Default `utcnow` | Thời điểm tạo tài khoản. |

#### Bảng 2: `categories` — Danh mục đồ cũ sinh viên ([`backend/app/models/category.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/category.py#L9-L26))
| Tên cột | Kiểu dữ liệu | Ràng buộc (Constraints) | Mô tả ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY`, `INDEX` | Mã định danh danh mục. |
| `name` | `VARCHAR(120)` | `UNIQUE`, `NOT NULL`, `INDEX` | Tên danh mục (VD: Giáo trình & Sách, Đồ điện tử & Laptop...). |
| `slug` | `VARCHAR(150)` | `UNIQUE`, `NOT NULL`, `INDEX` | Chuỗi định danh URL không dấu tự động sinh từ `name`. |
| `description` | `TEXT` | `NULLABLE` | Mô tả chi tiết các mặt hàng thuộc danh mục. |
| `icon` | `VARCHAR(50)` | `NULLABLE` | Tên biểu tượng hiển thị trên giao diện. |
| `created_at` | `DATETIME` | `NOT NULL` | Thời điểm tạo danh mục. |

#### Bảng 3: `listings` — Tin đăng bán đồ cũ ([`backend/app/models/listing.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/listing.py#L42-L136))
| Tên cột | Kiểu dữ liệu | Ràng buộc (Constraints) | Mô tả ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY`, `INDEX` | Mã định danh tin đăng. |
| `seller_id` | `INTEGER` | `FK -> users.id (ON DELETE CASCADE)`, `INDEX` | Người bán đăng tin. |
| `category_id` | `INTEGER` | `FK -> categories.id (ON DELETE RESTRICT)`, `INDEX` | Danh mục của món đồ. |
| `title` | `VARCHAR(255)` | `NOT NULL`, `INDEX` | Tiêu đề tin đăng (tối thiểu 5 ký tự). |
| `description` | `TEXT` | `NOT NULL` | Mô tả tình trạng, xuất xứ, địa điểm giao dịch (tối thiểu 10 ký tự). |
| `price` | `FLOAT` | `NOT NULL`, `CHECK (price >= 0)` | Giá bán niêm yết (VNĐ, cho phép `0` đối với đồ tặng miễn phí). |
| `condition` | `VARCHAR(30)` | `NOT NULL`, Default `'GOOD'` | Tình trạng: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`. |
| `status` | `VARCHAR(30)` | `NOT NULL`, `INDEX`, Default `'PENDING'` | Trạng thái: `PENDING`, `APPROVED`, `REJECTED`, `SOLD`. |
| `rejection_reason` | `TEXT` | `NULLABLE` | Lý do từ chối hoặc gỡ tin của Kiểm duyệt viên. |
| `created_at` | `DATETIME` | `NOT NULL`, `INDEX` | Thời điểm đăng tin (dùng để kiểm tra hạn mức 5 tin/ngày). |
| `updated_at` | `DATETIME` | `NOT NULL` | Thời điểm cập nhật gần nhất. |

#### Bảng 4: `listing_images` — Hình ảnh đính kèm tin đăng ([`backend/app/models/listing.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/listing.py#L138-L154))
- Quan hệ `1:N` với `listings` (`listing_id FK -> listings.id ON DELETE CASCADE`), lưu `image_url` (`VARCHAR(500)`) và thứ tự hiển thị `display_order` (`INTEGER`).

#### Bảng 5: `favorites` — Bảng trung gian Quan hệ Nhiều - Nhiều (`N:N`) ([`backend/app/models/listing.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/listing.py#L19-L40))
- Hiện thực hóa quan hệ `N:N` giữa `users` và `listings`.
- Sử dụng **Khóa chính tổ hợp (Composite Primary Key)** gồm `(user_id, listing_id)`, cả hai đều là khóa ngoại có `ON DELETE CASCADE`, kèm dấu thời gian `created_at`.

#### Bảng 6: `offers` — Đề nghị mua hàng / Trả giá ([`backend/app/models/offer.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/offer.py#L17-L57))
- Lưu trữ các lời đề nghị mua từ `buyer_id` (`FK -> users.id`) gửi tới `listing_id` (`FK -> listings.id`), mức giá đề xuất `offered_price` có ràng buộc toàn vẹn `CHECK (offered_price > 0)`, lời nhắn `message` và trạng thái `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).

#### Bảng 7: `reviews` — Đánh giá người bán sau giao dịch ([`backend/app/models/review.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/review.py#L16-L61))
- Quan hệ `1:1` với `listings` thông qua ràng buộc `UNIQUE` trên cột `listing_id`.
- Lưu `reviewer_id` (người mua), `seller_id` (người bán), điểm sao `rating` có ràng buộc `CHECK (rating >= 1 AND rating <= 5)`, và nhận xét `comment`.

#### Bảng 8: `reports` — Báo cáo tin đăng vi phạm ([`backend/app/models/report.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/models/report.py#L16-L46))
- Lưu thông tin báo cáo từ `reporter_id` đối với `listing_id`, lý do `reason`, chi tiết `details`, trạng thái xử lý `status` (`PENDING`, `RESOLVED`, `DISMISSED`) và ghi chú của Kiểm duyệt viên `moderator_note`.

### 4.3. Giải pháp Chống lỗi Truy vấn `N+1` trong SQLAlchemy 2.0 ORM
Lỗi `N+1 Query` xảy ra khi ứng dụng thực hiện 1 câu truy vấn lấy danh sách $N$ tin đăng (`SELECT * FROM listings LIMIT 12`), sau đó khi lặp qua từng tin để lấy thông tin người bán (`listing.seller`), danh mục (`listing.category`), danh sách ảnh (`listing.images`) và lượt yêu thích (`listing.favorited_by`), ORM lại âm thầm phát sinh thêm $4 \times N$ câu truy vấn con nữa.

Nhóm đã triệt tiêu hoàn toàn lỗi `N+1` tại hàm `get_listing_load_options()` trong [`backend/app/routers/listings.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/listings.py#L35-L43):
- Sử dụng `joinedload(Listing.seller)` và `joinedload(Listing.category)` để gộp truy vấn quan hệ `N:1` bằng mệnh đề `LEFT OUTER JOIN` ngay trong câu SQL chính.
- Sử dụng `selectinload(Listing.images)` và `selectinload(Listing.favorited_by)` để tải toàn bộ ảnh và lượt yêu thích của cả trang danh sách chỉ bằng 1 câu truy vấn `SELECT ... WHERE listing_id IN (...)`.

### 4.4. Quản lý Phiên bản CSDL với Alembic Migration & Dữ liệu Mẫu (`seed.py`)
- **Alembic Migration ([`backend/alembic/versions/0001_initial_schema.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/alembic/versions/0001_initial_schema.py#L22-L217)):** Quản lý toàn bộ lịch sử cấu trúc bảng bằng mã nguồn. Hàm `upgrade()` khởi tạo 8 bảng và các chỉ mục theo đúng thứ tự phụ thuộc khóa ngoại; hàm `downgrade()` thu hồi sạch sẽ 8 bảng theo thứ tự ngược lại (`reports` $\rightarrow$ `reviews` $\rightarrow$ `offers` $\rightarrow$ `favorites` $\rightarrow$ `listing_images` $\rightarrow$ `listings` $\rightarrow$ `categories` $\rightarrow$ `users`).
- **Kịch bản Dữ liệu mẫu Idempotent ([`backend/app/seed.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/seed.py#L430-L479)):** Hàm `seed_database()` kiểm tra trước xem CSDL đã có dữ liệu hay chưa (`db.query(User).first()`). Nếu chưa có, hệ thống tự động nạp: 4 tài khoản mẫu (mật khẩu băm `bcrypt`), 6 danh mục đồ cũ sinh viên, 10 tin đăng thực tế kèm 20 hình ảnh, 3 lượt yêu thích, 2 đề nghị trả giá, 1 đánh giá 5 sao và 1 báo cáo vi phạm. Nhờ tính chất *idempotent*, việc khởi động lại container nhiều lần không bao giờ gây lỗi trùng lặp dữ liệu.

---

## CHƯƠNG 5: THIẾT KẾ RESTFUL API VÀ CƠ CHẾ BẢO MẬT

### 5.1. Nguyên tắc Thiết kế RESTful API & Sử dụng Phương thức HTTP
Hệ thống cung cấp **25 RESTful API endpoints** được tổ chức khoa học thành 10 module router dưới tiền tố `/api/v1`:
- **Phân biệt `PUT` và `PATCH`:**
  - `PUT /api/v1/listings/{listing_id}` được dùng khi chủ tin đăng cập nhật thông tin tài nguyên tin đăng.
  - `PATCH` được dùng cho các thao tác **cập nhật một phần trạng thái (partial state transition)** của tài nguyên, cụ thể là: `PATCH /api/v1/moderation/listings/{id}/status` (chỉ duyệt trạng thái tin), `PATCH /api/v1/moderation/reports/{id}` (chỉ cập nhật kết quả xử lý báo cáo), và `PATCH /api/v1/offers/{id}/accept` hoặc `/reject` (chỉ chuyển trạng thái đề nghị mua).
- **Chuẩn hóa Mã Trạng thái HTTP (HTTP Status Codes):**
  - `200 OK`: Truy vấn (`GET`) hoặc cập nhật trạng thái (`PUT`, `PATCH`, toggle favorite) thành công.
  - `201 Created`: Khởi tạo thành công tài nguyên mới (Đăng ký, Tạo danh mục, Upload ảnh, Đăng tin mới, Gửi trả giá, Gửi đánh giá, Gửi báo cáo).
  - `204 No Content`: Xóa tin đăng (`DELETE /api/v1/listings/{id}`) thành công, không trả về phần thân phản hồi.
  - `400 Bad Request`: Vi phạm quy tắc logic nghiệp vụ cơ bản (VD: tự trả giá hoặc tự báo cáo tin đăng của chính mình, tải lên file không phải định dạng ảnh).
  - `401 Unauthorized`: Chưa đăng nhập, thiếu header `Authorization: Bearer <token>`, sai mật khẩu, hoặc JWT đã hết hạn/bị sửa đổi chữ ký.
  - `403 Forbidden`: Đã xác thực danh tính nhưng **không đủ quyền hạn RBAC** (VD: tài khoản `STUDENT` gọi API kiểm duyệt `/api/v1/moderation/...`, hoặc sửa/xóa tin đăng của người khác, hoặc người chưa mua hàng đòi đánh giá).
  - `404 Not Found`: ID tài nguyên (`listing_id`, `offer_id`, `user_id`, `report_id`) không tồn tại.
  - `409 Conflict`: Xung đột trạng thái tài nguyên hiện tại (VD: đăng ký trùng email đã tồn tại; tạo trùng tên danh mục; sửa hoặc gửi trả giá vào tin đã `SOLD`; đánh giá lặp lần 2 cho cùng 1 giao dịch).
  - `422 Unprocessable Entity`: Dữ liệu đầu vào vi phạm ràng buộc kiểu hoặc miền giá trị của Pydantic v2 Schema (VD: `price < 0`, `title` ngắn hơn 5 ký tự, `rating` nằm ngoài khoảng `1..5`, từ chối tin `REJECTED` nhưng bỏ trống `rejection_reason`).
  - `429 Too Many Requests`: Vượt quá hạn mức chống spam (**đăng quá 5 tin/ngày**).

### 5.2. Cơ chế Xác thực JWT (`HS256`) và Băm mật khẩu `bcrypt`
Được hiện thực tại [`backend/app/security/auth.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/security/auth.py#L26-L76):
1. **Băm mật khẩu có muối (`bcrypt`):** Hệ thống tuyệt đối không lưu mật khẩu dạng văn bản thuần (plaintext). Hàm `hash_password()` sử dụng `bcrypt.gensalt()` sinh ngẫu nhiên một chuỗi muối (salt) riêng biệt cho mỗi người dùng và băm thành chuỗi định dạng `$2b$12$...` (60 ký tự). Khi đăng nhập, hàm `verify_password()` dùng `bcrypt.checkpw()` để so khớp an toàn, chống hoàn toàn tấn công từ điển (Rainbow Table Attack).
2. **Cấu trúc JWT Access Token:** Khi đăng nhập thành công, hàm `create_access_token()` sinh chuỗi JWT gồm 3 phần ngăn cách bởi dấu chấm (`Header.Payload.Signature`):
   - `Header`: `{"alg": "HS256", "typ": "JWT"}`.
   - `Payload`: Chứa các claims định danh gồm `sub` (ID người dùng), `email`, `role` (`STUDENT`/`MODERATOR`/`ADMIN`) và `exp` (thời điểm hết hạn tính bằng UTC). *Lưu ý: Payload chỉ được mã hóa Base64URL (ai cũng đọc được), không phải mã hóa bí mật, vì vậy tuyệt đối không đặt mật khẩu hay thông tin nhạy cảm vào Payload.*
   - `Signature`: Chữ ký HMAC-SHA256 được tính từ `Header + Payload` với khóa bí mật `JWT_SECRET_KEY` đọc từ biến môi trường. Nếu kẻ tấn công sửa `role` trong Payload từ `STUDENT` thành `ADMIN`, chữ ký sẽ không khớp và hàm `decode_access_token()` sẽ lập tức từ chối với mã `401 Unauthorized`.

### 5.3. Ma trận Phân quyền RBAC & Chống Tự nâng quyền (Privilege Escalation)
1. **Chống tự nâng quyền khi Đăng ký:** Tại [`backend/app/schemas/user.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/schemas/user.py#L11-L26), lớp `UserRegisterRequest` chỉ chấp nhận các trường `email`, `password`, `full_name`, `phone`, `university` (không có trường `role`). Đồng thời tại [`backend/app/routers/auth.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/routers/auth.py#L72-L87), khi khởi tạo đối tượng `User`, hệ thống gán cứng `role=UserRole.STUDENT.value`. Do đó, dù kẻ tấn công cố tình chèn `"role": "ADMIN"` vào JSON body khi gọi `POST /api/v1/auth/register`, tài khoản tạo ra vẫn luôn chỉ là `STUDENT`.
2. **Kiểm soát truy cập theo vai trò (`require_roles`):** Hàm factory dependency `require_roles(*allowed_roles)` tại [`backend/app/security/auth.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/app/security/auth.py#L150-L178) kiểm tra vai trò thực tế của người dùng trong CSDL so với tập quyền cho phép của từng router.

| Nhóm Chức năng / API Endpoint | Khách vãng lai | Sinh viên (`STUDENT`) | Kiểm duyệt viên (`MODERATOR`) | Quản trị viên (`ADMIN`) |
| :--- | :-: | :-: | :-: | :-: |
| Xem danh sách tin `APPROVED`, tìm kiếm, lọc, xem hồ sơ người bán | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| Đăng tin bán đồ cũ (tối đa 5 tin/ngày), upload ảnh, lưu yêu thích `N:N` | ❌ `401` | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| Sửa / Xóa tin đăng | ❌ `401` | ✅ Chỉ chủ tin (`403` nếu tin người khác) | ✅ Cho phép | ✅ Cho phép |
| Gửi đề nghị trả giá (`Offer`), báo cáo vi phạm (`Report`) | ❌ `401` | ✅ Cho phép (Trừ tin của chính mình `400`) | ✅ Cho phép | ✅ Cho phép |
| Chấp nhận / Từ chối đề nghị trả giá (`Accept/Reject Offer`) | ❌ `401` | ✅ Chỉ chủ tin đăng (`403` nếu khác) | ❌ `403` | ❌ `403` |
| Đánh giá 1–5 sao (`Review`) sau khi tin đã `SOLD` | ❌ `401` | ✅ Chỉ người mua có Offer `ACCEPTED` (`403`) | ❌ `403` | ❌ `403` |
| Duyệt tin (`APPROVED`/`REJECTED`), xử lý báo cáo, tạo danh mục mới | ❌ `401` | ❌ **Chặn `403 Forbidden`** | ✅ Cho phép | ✅ Cho phép |

---

## CHƯƠNG 6: XÂY DỰNG GIAO DIỆN NGƯỜI DÙNG, CONTAINER HÓA VÀ CI/CD

### 6.1. Thiết kế Giao diện Người dùng (React 18 + Vite + TailwindCSS)
Giao diện Frontend tại thư mục `frontend/src/` được thiết kế hiện đại, trực quan, hỗ trợ đầy đủ các trạng thái `Loading` (hiệu ứng Skeleton), `Empty State`, `Error Banner` và `Toast Notification`:
1. **Thanh Điều hướng & Chuyển đổi nhanh 1-Click 3 Tác nhân Demo ([`Navbar.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/Navbar.jsx)):** Hiển thị các chỉ số thống kê thời gian thực và tích hợp cụm 3 nút chuyển đổi tức thì giữa **Sinh viên Bán hàng**, **Sinh viên Mua hàng** và **Kiểm duyệt viên** phục vụ trình diễn bảo vệ ĐG2 nhanh chóng.
2. **Trang Khám phá Chợ Đồ Cũ & Bộ lọc Đa tiêu chí ([`App.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/App.jsx)):** Cho phép chọn nhanh 6 danh mục bằng biểu tượng, tìm kiếm từ khóa, lọc tình trạng món đồ, lọc khoảng giá, bật/tắt hiển thị tin `ĐÃ BÁN (SOLD)`, sắp xếp và phân trang.
3. **Màn hình Đăng tin Đa ảnh & Kiểm soát Hạn mức 5 tin/ngày ([`CreateListingView.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/CreateListingView.jsx)):** Hiển thị thanh tiến trình số tin đã đăng trong ngày (`postedTodayCount / 5`), hỗ trợ tải nhiều file ảnh trực tiếp từ máy tính (`FormData`) và nút *"Điền nhanh dữ liệu mẫu"*.
4. **Cửa sổ Chi tiết Món đồ & Thương lượng / Đánh giá ([`ListingDetailModal.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/ListingDetailModal.jsx)):** Trình chiếu Gallery nhiều ảnh, thông tin uy tín người bán, gửi đề nghị trả giá nhanh (`-10%`, `-5%`, `Giá gốc`), đánh giá 1–5 sao và báo cáo vi phạm.
5. **Màn hình Quản lý Giao dịch Cá nhân ([`TransactionsView.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/TransactionsView.jsx)):** Quản lý tin đã đăng, duyệt chấp nhận/từ chối các lời trả giá nhận được và theo dõi các lời trả giá đã gửi đi.
6. **Bàn làm việc Kiểm duyệt viên ([`ModerationView.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/ModerationView.jsx)):** Phê duyệt hoặc từ chối tin đăng chờ duyệt, xử lý báo cáo vi phạm, thêm danh mục mới và xem biểu đồ phân bố sản phẩm.
7. **Trạm Kiểm thử Trực quan 8 Bước Bảo vệ ĐG2 ([`DefenseLabView.jsx`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/src/components/DefenseLabView.jsx)):** Tích hợp bảng điều khiển chạy trực tiếp 8 bước kịch bản demo bắt buộc (bao gồm nút chứng minh `HTTP 403 Forbidden` và `HTTP 422 Unprocessable Entity`) kèm cửa sổ `Live HTTP Response Inspector` hiển thị nguyên bản JSON phản hồi và thời gian xử lý `ms`.

### 6.2. Container hóa với Docker (Non-root) & Docker Compose 3 Services
1. **Bảo mật Non-root Container trong [`backend/Dockerfile`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/Dockerfile#L32-L60):**
   - Sử dụng `python:3.12-slim` để tối giản kích thước image và giảm bề mặt tấn công.
   - Tạo nhóm và người dùng không có đặc quyền root: `groupadd -g 1000 appuser && useradd -r -u 1000 -g appuser ...`.
   - Sao chép `requirements.txt` trước khi sao chép mã nguồn để tận dụng tối đa cơ chế **Docker Layer Caching**.
   - Cấp quyền sở hữu thư mục `/app` và `/app/uploads` cho `appuser`, sau đó chuyển ngữ cảnh thực thi bằng chỉ thị `USER appuser` (dòng 54) trước khi chạy `ENTRYPOINT ["/app/entrypoint.sh"]`.
2. **Multi-stage Build & Non-root Nginx trong [`frontend/Dockerfile`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/frontend/Dockerfile#L11-L47):**
   - **Stage 1 (`node:20-alpine AS builder`):** Cài đặt dependencies bằng `npm ci` và đóng gói mã nguồn React ra thư mục tĩnh `/app/dist`.
   - **Stage 2 (`nginxinc/nginx-unprivileged:alpine`):** Chỉ sao chép thư mục `/app/dist` đã nén nhẹ sang Nginx (loại bỏ hoàn toàn `node_modules` nặng hàng trăm MB) và chạy dưới quyền `USER nginx` (`UID 101`) lắng nghe tại cổng `8080`.
3. **Điều phối 3 Services trong [`docker-compose.yml`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/docker-compose.yml#L11-L94):**
   - Định nghĩa 3 dịch vụ: `db` (`postgres:16-alpine`), `api` (`chodocu_api`), và `frontend` (`chodocu_frontend`).
   - Thiết lập `healthcheck` cho `db` bằng lệnh `pg_isready` và cấu hình `depends_on: db: condition: service_healthy` ở dịch vụ `api` để đảm bảo Backend chỉ chạy migration sau khi PostgreSQL đã sẵn sàng nhận kết nối.
   - Sử dụng 2 Named Volumes (`postgres_data` và `uploads_data`) để dữ liệu CSDL và ảnh upload không bị mất khi xóa hoặc khởi động lại container.

### 6.3. Quy trình Tích hợp Liên tục GitHub Actions CI (`.github/workflows/ci.yml`)
Pipeline CI tại [`.github/workflows/ci.yml`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/.github/workflows/ci.yml#L15-L128) tự động kích hoạt trên mỗi sự kiện `push` hoặc `pull_request` vào nhánh `main`/`master`/`feat/**`, bao gồm **3 Jobs**:
- **Job 1 (`security-and-lint`):** Kiểm tra tự động bằng `git ls-files` để đảm bảo không có bất kỳ file `.env` nào bị commit nhầm vào kho Git; sau đó chạy `ruff check .` kiểm tra chuẩn mã nguồn Python.
- **Job 2 (`backend-test`):** Khởi tạo dịch vụ container `postgres:16-alpine` thật, kiểm thử chu trình Alembic Migration (`alembic upgrade head` $\rightarrow$ `alembic downgrade base` $\rightarrow$ `alembic upgrade head`), và chạy `pytest --cov=app --cov-report=term-missing --cov-fail-under=70`.
- **Job 3 (`frontend-build`):** Thiết lập Node.js 20, chạy `npm ci` và `npm run build` để đảm bảo giao diện React SPA không có lỗi biên dịch.

---

## CHƯƠNG 7: KIỂM THỬ HỆ THỐNG (TESTING & QUALITY ASSURANCE)

### 7.1. Kiểm thử Tự động Backend với `pytest` (18 Tests — Độ bao phủ 94.37%)
Bộ kiểm thử tự động tại [`backend/tests/test_api.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/tests/test_api.py) và [`backend/tests/conftest.py`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/backend/tests/conftest.py) sử dụng CSDL kiểm thử cô lập hoàn toàn, bao phủ toàn bộ 18 kịch bản kiểm thử từ xác thực, phân quyền RBAC, kiểm chứng dữ liệu đến các luồng nghiệp vụ phức tạp:

| STT | Tên Ca Kiểm thử (`test_api.py`) | Mục tiêu Kiểm thử & Kỳ vọng | Kết quả |
| :-: | :--- | :--- | :-: |
| 1 | `test_health_check` | Kiểm tra `/api/v1/health` (`200 OK`) và header `X-Process-Time-Ms`. | ✅ **PASS** |
| 2 | `test_register_student_and_prevent_role_escalation` | Đăng ký mới (`201`), chặn tự nâng quyền `ADMIN` $\rightarrow$ ép về `STUDENT`, chặn trùng email (`409`). | ✅ **PASS** |
| 3 | `test_login_and_get_me` | Đăng nhập JSON & OAuth2 Form (`200`), sai mật khẩu (`401`), `/auth/me` (`200`), token giả (`401`). | ✅ **PASS** |
| 4 | `test_validation_errors_422` | Giá bán âm (`-50000`), tiêu đề ngắn (`< 5` ký tự), đánh giá `rating=6`, từ chối thiếu lý do $\rightarrow$ `422`. | ✅ **PASS** |
| 5 | `test_rbac_forbidden_403` | Tài khoản `STUDENT` gọi các API kiểm duyệt và tạo danh mục $\rightarrow$ chặn `403 Forbidden`. | ✅ **PASS** |
| 6 | `test_categories_crud` | `MODERATOR` tạo danh mục mới (`201`, tự sinh slug tiếng Việt), chặn trùng tên (`409`). | ✅ **PASS** |
| 7 | `test_upload_multiple_images` | Upload nhiều ảnh `.png`/`.jpg` (`201`), chặn file `.sh` không phải ảnh (`400`) và file rỗng (`400`). | ✅ **PASS** |
| 8 | `test_create_listing_and_moderation_flow` | Đăng tin mới (`PENDING`) $\rightarrow$ Kiểm duyệt viên duyệt (`APPROVED`) và từ chối (`REJECTED`). | ✅ **PASS** |
| 9 | `test_search_filter_sort_pagination` | Tìm kiếm từ khóa `q`, lọc danh mục, khoảng giá, tình trạng, sắp xếp và phân trang. | ✅ **PASS** |
| 10 | `test_update_and_delete_listing` | Chủ tin sửa (`200`) / xóa (`204`), người khác sửa/xóa bị chặn (`403`), truy vấn lại trả `404`. | ✅ **PASS** |
| 11 | `test_favorites_many_to_many` | Bật/tắt lưu yêu thích `N:N` (`is_favorited=True/False`) và lấy danh sách `/users/me/favorites`. | ✅ **PASS** |
| 12 | `test_offers_and_auto_sold_transition` | Chặn tự mua tin mình (`400`); 2 người gửi trả giá; chấp nhận offer #1 $\rightarrow$ tin tự khóa sang `SOLD`, offer #2 tự chuyển sang `REJECTED`, chặn sửa tin đã `SOLD` (`409`). | ✅ **PASS** |
| 13 | `test_reject_offer` | Người bán từ chối đề nghị mua (`200`), chặn người lạ từ chối (`403`), chặn từ chối lặp (`409`). | ✅ **PASS** |
| 14 | `test_review_and_seller_reputation_calculation` | Chặn người chưa mua đánh giá (`403`); người mua trúng đánh giá 4 sao (`201`) $\rightarrow$ `reputation_score` người bán tự động cập nhật từ `5.0` thành `4.5`, chặn đánh giá lần 2 (`409`). | ✅ **PASS** |
| 15 | `test_report_violation_and_moderation_resolution` | Gửi báo cáo vi phạm (`201`), chặn báo cáo trùng (`409`), Kiểm duyệt viên xử lý `RESOLVED` $\rightarrow$ tự động gỡ tin sang `REJECTED`. | ✅ **PASS** |
| 16 | `test_daily_listing_rate_limit_429` | Đăng 5 tin đầu trong ngày thành công (`201`), tin thứ 6 bị chặn với mã `429 Too Many Requests`. | ✅ **PASS** |
| 17 | `test_stats_overview_and_user_profile` | Kiểm tra số liệu thống kê `/api/v1/stats/overview` (`200`) và hồ sơ người dùng (`200` / `404`). | ✅ **PASS** |
| 18 | `test_seed_database_idempotent` | Kiểm tra kịch bản `seed_database()` chạy an toàn, idempotent không tạo dữ liệu trùng lặp. | ✅ **PASS** |

**Tổng hợp độ bao phủ mã nguồn (`pytest-cov`):** Toàn bộ Backend đạt **94.37% coverage** (`1154 statements`, chỉ miss `65 statements`), vượt **+24.37%** so với mốc điểm cộng `70%` của đề bài.

### 7.2. Kiểm thử Tự động API với Postman Collection Runner
Tệp [`postman/chodocusinhvien.postman_collection.json`](file:///home/antigravity/FALLEN-ALBAZ/chodocusinhvien/postman/chodocusinhvien.postman_collection.json) gồm **7 thư mục / 24 requests** được thiết kế tuần tự theo đúng luồng nghiệp vụ bảo vệ ĐG2. Mỗi request đều đính kèm kịch bản kiểm thử tự động `pm.test()` kiểm tra mã trạng thái HTTP, cấu trúc JSON trả về và tự động lưu truyền biến môi trường (`{{studentSellerToken}}`, `{{studentBuyerToken}}`, `{{moderatorToken}}`, `{{createdListingId}}`, `{{createdOfferId}}`, `{{createdReportId}}`).

---

## CHƯƠNG 8: KẾT QUẢ ĐẠT ĐƯỢC, HẠN CHẾ, HƯỚNG PHÁT TRIỂN VÀ KÊ KHAI AI

### 8.1. Tổng kết Kết quả Đạt được (Đối chiếu 10/10 Tiêu chí Bắt buộc & Điểm cộng ĐG2)
1. **Hoàn thành 100% nghiệp vụ Đề tài 4:** Đáp ứng trọn vẹn chu trình từ Đăng tin đa ảnh $\rightarrow$ Kiểm duyệt (`PENDING` / `APPROVED` / `REJECTED`) $\rightarrow$ Tìm kiếm, lọc, sắp xếp, phân trang $\rightarrow$ Lưu yêu thích `N:N` $\rightarrow$ Đề nghị trả giá & Chốt đơn nguyên tử (`SOLD`) $\rightarrow$ Đánh giá sao & Tự động tính điểm uy tín $\rightarrow$ Báo cáo vi phạm & Gỡ tin tự động.
2. **Đạt toàn bộ các hạng mục kỹ thuật & điểm cộng:**
   - CSDL **8 bảng** đạt chuẩn 3NF (vượt yêu cầu $\ge 5$ bảng), có đủ quan hệ `1:N`, `N:N`, `1:1`, Alembic Migration (`upgrade`/`downgrade`) và Seed Data idempotent.
   - Bảo mật chặt chẽ với JWT `HS256`, `bcrypt`, phân quyền RBAC 3 vai trò, chống tự nâng quyền, không lộ `.env` trên Git.
   - Hiện thực **6 tính năng nâng cao** (vượt yêu cầu $\ge 2$ tính năng).
   - Đóng gói `Dockerfile` **non-root** cho cả Backend (`UID 1000`) và Frontend Nginx (`UID 101`), khởi chạy toàn hệ thống 3 services bằng **1 lệnh duy nhất** (`docker compose up --build -d`).
   - Bộ kiểm thử tự động **18 tests `pytest`** đạt độ bao phủ **94.37%** (đạt điểm cộng Coverage $\ge 70\%$) cùng bộ **24 requests Postman Collection Runner**.

### 8.2. Hạn chế Hiện tại của Hệ thống
1. Hệ thống hiện tập trung vào việc kết nối, thương lượng giá và chốt đơn giữa sinh viên trong cùng trường đại học (giao dịch trực tiếp tại khuôn viên trường/ký túc xá), chưa tích hợp cổng thanh toán trực tuyến hoặc ví tạm giữ (Escrow).
2. Trao đổi giữa người mua và người bán hiện thực hiện qua lời nhắn đính kèm đề nghị mua (`Offer.message`) và thông tin số điện thoại, chưa có phòng chat thời gian thực (Real-time Chat).
3. Hình ảnh tải lên đang được lưu trữ trên Docker Named Volume của máy chủ vật lý, chưa tách sang dịch vụ Object Storage phân tán (như MinIO hoặc AWS S3).

### 8.3. Hướng Phát triển Tiếp theo
1. **Tích hợp Nhắn tin Thời gian thực (WebSocket):** Sử dụng FastAPI WebSockets để sinh viên mua và bán có thể nhắn tin, gửi thêm ảnh thực tế của món đồ ngay trên web.
2. **Tích hợp Thanh toán VietQR & Giữ tiền Tạm thời (Escrow):** Sinh mã QR chuyển khoản tự động khi đề nghị mua được chấp nhận (`ACCEPTED`) để giữ cọc an toàn cho cả hai bên.
3. **Tích hợp Lưu trữ Đám mây (MinIO / S3) & Redis Caching:** Lưu trữ ảnh trên S3-compatible storage và dùng Redis để lưu đệm (cache) danh sách tin đăng trang chủ khi lượng người dùng tăng gấp 10 lần.
4. **Gợi ý Giá bán Hợp lý bằng Học máy (AI Price Suggestion):** Dựa trên lịch sử các món đồ cùng danh mục và tình trạng đã bán (`SOLD`) để gợi ý mức giá đăng bán tối ưu cho sinh viên.

### 8.4. Kê khai Sử dụng Công cụ AI Hỗ trợ và Quy trình Kiểm chứng Mã nguồn (Theo Mục VII Đề bài ĐG2)
Tuân thủ quy định tại **Mục VII của đề bài ĐG2** (*"Được dùng công cụ AI hỗ trợ nhưng phải ghi rõ trong báo cáo đã dùng ở đâu; sinh viên phải hiểu và giải thích được mọi đoạn mã nộp"*), Nhóm 4 xin kê khai minh bạch như sau:

| STT | Hạng mục sử dụng công cụ AI hỗ trợ | Cách thức Nhóm kiểm chứng, hiệu chỉnh và làm chủ mã nguồn | Thành viên chịu trách nhiệm giải trình |
| :-: | :--- | :--- | :--- |
| **1** | Gợi ý khung cấu hình `Dockerfile` non-root, `nginx.conf` và cú pháp workflow GitHub Actions CI (`.github/workflows/ci.yml`). | Trực tiếp kiểm tra quyền UID/GID (`1000` và `101`), kiểm thử cơ chế `depends_on: service_healthy` với `pg_isready`, xác minh luồng `proxy_pass` cho cả `/api/`, `/docs`, `/uploads/` và kiểm tra log khởi động `entrypoint.sh`. | **Nguyễn Hải Long** *(Trưởng nhóm, DevOps)* |
| **2** | Hỗ trợ sinh khung Pydantic v2 Schemas, bộ chuyển đổi tiếng Việt không dấu (`slugify_vietnamese`) và cấu trúc Middleware ghi log JSON. | Rà soát từng mã trạng thái HTTP (`200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`), kiểm tra logic khóa cứng `role=STUDENT` chống tự nâng quyền, và viết câu lệnh `joinedload`/`selectinload` chống lỗi `N+1`. | **Nguyễn Đức Anh** *(Back-end API & Bảo mật)* |
| **3** | Hỗ trợ tạo nhanh các lớp CSS bằng TailwindCSS và bố cục giao diện компоненt React 18 (`DefenseLabView`, `ModerationView`, `TransactionsView`). | Kiểm tra khớp nối 100% đường dẫn API và query parameters giữa `frontend/src/api.js` với OpenAPI schema của Backend; chạy `npm run build` đảm bảo 0 lỗi biên dịch. | **Nguyễn Huy Hoàng** *(Front-end UI/UX)* |
| **4** | Hỗ trợ tạo dữ liệu văn bản mẫu tiếng Việt trong `seed.py` và gợi ý các ca kiểm thử biên trong `test_api.py`. | Thực thi trực tiếp `alembic downgrade base` $\rightarrow$ `alembic upgrade head`, kiểm tra các ràng buộc `CheckConstraint` (`price >= 0`, `offered_price > 0`, `1 <= rating <= 5`) và chạy `pytest --cov=app` đạt **94.37%**. | **Hoàng Nhật Thắng** *(CSDL & Kiểm thử QA)* |

**Cam kết của Nhóm 4 – Lớp CT2802:** Toàn bộ 4 thành viên đều nắm vững kiến trúc tổng thể cũng như từng dòng mã nguồn thuộc phân hệ mình phụ trách, sẵn sàng giải thích và thực hiện chỉnh sửa trực tiếp theo yêu cầu của Giảng viên hướng dẫn trong buổi bảo vệ ĐG2.
