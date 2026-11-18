from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models.user import User
from app.seed import seed_database


def test_health_check(client: TestClient) -> None:
    """1. Kiểm tra /api/v1/health (200 OK), root / và header X-Process-Time-Ms."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "chodocusinhvien-backend"
    assert "X-Process-Time-Ms" in res.headers
    assert float(res.headers["X-Process-Time-Ms"]) >= 0

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "docs" in root_res.json()


def test_register_student_and_prevent_role_escalation(client: TestClient) -> None:
    """2. Đăng ký tài khoản mới (201), chống tự nâng quyền lên ADMIN, trùng email trả 409 Conflict."""
    payload = {
        "email": "sinhvien_moi@sv.edu.vn",
        "password": "Password@123",
        "full_name": "Phạm Minh Tuấn",
        "phone": "0934567890",
        "university": "Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        "role": "ADMIN",  # Cố tình gửi trường role=ADMIN để thử nâng quyền trái phép
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sinhvien_moi@sv.edu.vn"
    # Vai trò phải luôn bị khóa cứng là STUDENT
    assert data["user"]["role"] == "STUDENT"
    assert data["role"] == "STUDENT"
    assert "password_hash" not in data["user"]

    # Đăng ký trùng email (không phân biệt hoa thường) phải trả 409 Conflict
    dup_payload = {**payload, "email": "SINHVIEN_MOI@sv.edu.vn"}
    dup_res = client.post("/api/v1/auth/register", json=dup_payload)
    assert dup_res.status_code == 409


def test_login_and_get_me(client: TestClient) -> None:
    """3. Đăng nhập JSON (200), OAuth2 form (200), sai mật khẩu (401), lấy /api/v1/auth/me (200), thiếu/sai token (401)."""
    # Đăng nhập bằng JSON Body
    json_res = client.post(
        "/api/v1/auth/login",
        json={"email": "nguyenvana@sv.edu.vn", "password": "Sv@123456"},
    )
    assert json_res.status_code == 200
    token = json_res.json()["access_token"]
    assert token

    # Đăng nhập bằng OAuth2 Form (như nút Authorize trên Swagger UI)
    form_res = client.post(
        "/api/v1/auth/login",
        data={"username": "tranthib@sv.edu.vn", "password": "Sv@123456"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert form_res.status_code == 200
    assert form_res.json()["user"]["email"] == "tranthib@sv.edu.vn"

    # Sai mật khẩu -> 401 Unauthorized
    wrong_pass = client.post(
        "/api/v1/auth/login",
        json={"email": "nguyenvana@sv.edu.vn", "password": "WrongPassword!"},
    )
    assert wrong_pass.status_code == 401

    # Email không tồn tại -> 401 Unauthorized
    unknown_user = client.post(
        "/api/v1/auth/login",
        json={"email": "khongtontai@sv.edu.vn", "password": "Sv@123456"},
    )
    assert unknown_user.status_code == 401

    # Lấy thông tin tài khoản hiện tại /api/v1/auth/me -> 200 OK
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "nguyenvana@sv.edu.vn"

    # Không có token hoặc token giả mạo -> 401 Unauthorized
    no_token_res = client.get("/api/v1/auth/me")
    assert no_token_res.status_code == 401

    bad_token_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert bad_token_res.status_code == 401


def test_validation_errors_422(
    client: TestClient,
    seller_headers: dict[str, str],
    moderator_headers: dict[str, str],
) -> None:
    """4. Kiểm tra nhập dữ liệu sai quy cách (giá âm, tiêu đề quá ngắn, rating = 6, email sai) trả đúng 422."""
    # Email sai định dạng khi đăng ký
    bad_email = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "Password123",
            "full_name": "Sinh Viên",
        },
    )
    assert bad_email.status_code == 422

    # Số điện thoại sai định dạng khi đăng ký
    bad_phone = client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid_student_phone@sv.edu.vn",
            "password": "Password123",
            "full_name": "Sinh Viên Test SĐT",
            "phone": "123abc",
        },
    )
    assert bad_phone.status_code == 422

    # Giá âm khi đăng tin
    neg_price = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Giáo trình Toán cao cấp tập 1",
            "description": "Sách còn mới tinh chưa viết vẽ gì vào bên trong.",
            "price": -50000,
            "condition": "GOOD",
            "category_id": 1,
        },
    )
    assert neg_price.status_code == 422

    # Tiêu đề quá ngắn (< 5 ký tự)
    short_title = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Sách",
            "description": "Mô tả đầy đủ hơn mười ký tự hợp lệ.",
            "price": 50000,
            "condition": "GOOD",
            "category_id": 1,
        },
    )
    assert short_title.status_code == 422

    # Đánh giá số sao vượt quá 5 (rating = 6)
    bad_rating = client.post(
        "/api/v1/listings/1/reviews",
        headers=seller_headers,
        json={"rating": 6, "comment": "Đánh giá không hợp lệ vượt quá 5 sao"},
    )
    assert bad_rating.status_code == 422

    # Kiểm duyệt viên từ chối tin nhưng không nhập lý do từ chối -> 422
    missing_reason = client.patch(
        "/api/v1/moderation/listings/8/status",
        headers=moderator_headers,
        json={"status": "REJECTED", "rejection_reason": ""},
    )
    assert missing_reason.status_code == 422


def test_rbac_forbidden_403(
    client: TestClient,
    seller_headers: dict[str, str],
) -> None:
    """5. Sinh viên (STUDENT) gọi API kiểm duyệt hoặc tạo danh mục bị chặn 403 Forbidden."""
    mod_listings = client.get(
        "/api/v1/moderation/listings",
        headers=seller_headers,
    )
    assert mod_listings.status_code == 403

    mod_patch = client.patch(
        "/api/v1/moderation/listings/8/status",
        headers=seller_headers,
        json={"status": "APPROVED"},
    )
    assert mod_patch.status_code == 403

    mod_reports = client.get(
        "/api/v1/moderation/reports",
        headers=seller_headers,
    )
    assert mod_reports.status_code == 403

    create_cat = client.post(
        "/api/v1/categories",
        headers=seller_headers,
        json={
            "name": "Danh mục trái phép",
            "description": "Sinh viên không được phép tạo danh mục",
        },
    )
    assert create_cat.status_code == 403


def test_categories_crud(
    client: TestClient,
    moderator_headers: dict[str, str],
) -> None:
    """6. Kiểm duyệt viên tạo danh mục mới (201), trùng tên (409), lấy danh sách danh mục (200)."""
    list_before = client.get("/api/v1/categories")
    assert list_before.status_code == 200
    initial_count = len(list_before.json())
    assert initial_count >= 6

    create_res = client.post(
        "/api/v1/categories",
        headers=moderator_headers,
        json={
            "name": "Nhạc cụ & Đồ câu lạc bộ",
            "description": "Đàn guitar sinh viên, cajon, phụ kiện sinh hoạt CLB.",
            "icon": "Music",
        },
    )
    assert create_res.status_code == 201
    created_cat = create_res.json()
    assert created_cat["name"] == "Nhạc cụ & Đồ câu lạc bộ"
    assert created_cat["slug"] == "nhac-cu-do-cau-lac-bo"

    # Tạo trùng tên hoặc slug -> 409 Conflict
    dup_res = client.post(
        "/api/v1/categories",
        headers=moderator_headers,
        json={
            "name": "Nhạc cụ & Đồ câu lạc bộ",
            "description": "Trùng tên danh mục",
        },
    )
    assert dup_res.status_code == 409

    list_after = client.get("/api/v1/categories")
    assert list_after.status_code == 200
    assert len(list_after.json()) == initial_count + 1


def test_upload_multiple_images(
    client: TestClient,
    seller_headers: dict[str, str],
) -> None:
    """7. Tải lên nhiều file ảnh qua POST /api/v1/uploads/images (201) và chặn file không phải ảnh (400)."""
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    fake_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01"

    res = client.post(
        "/api/v1/uploads/images",
        headers=seller_headers,
        files=[
            ("files", ("anh_mat_truoc.png", fake_png, "image/png")),
            ("files", ("anh_mat_sau.jpg", fake_jpg, "image/jpeg")),
        ],
    )
    assert res.status_code == 201
    urls = res.json()["image_urls"]
    assert len(urls) == 2
    assert urls[0].startswith("/uploads/") and urls[0].endswith(".png")
    assert urls[1].startswith("/uploads/") and urls[1].endswith(".jpg")

    # Kiểm tra chặn định dạng file thực thi / script (.exe / .sh) -> 400 Bad Request
    bad_ext = client.post(
        "/api/v1/uploads/images",
        headers=seller_headers,
        files=[("files", ("malware.sh", b"#!/bin/bash\necho hacked", "text/plain"))],
    )
    assert bad_ext.status_code == 400

    # Kiểm tra chặn file rỗng -> 400 Bad Request
    empty_file = client.post(
        "/api/v1/uploads/images",
        headers=seller_headers,
        files=[("files", ("empty.png", b"", "image/png"))],
    )
    assert empty_file.status_code == 400


def test_create_listing_and_moderation_flow(
    client: TestClient,
    seller_headers: dict[str, str],
    moderator_headers: dict[str, str],
) -> None:
    """8. Sinh viên Bán hàng đăng tin mới (201, PENDING), xem /listings/my, Kiểm duyệt viên duyệt (APPROVED) và từ chối (REJECTED)."""
    # Danh mục không tồn tại -> 404
    not_found_cat = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Giáo trình Mạng máy tính cơ bản",
            "description": "Sách giáo trình Mạng máy tính còn rất mới.",
            "price": 45000,
            "condition": "GOOD",
            "category_id": 99999,
        },
    )
    assert not_found_cat.status_code == 404

    # Sinh viên Bán hàng tạo tin đăng hợp lệ -> 201 Created, status = PENDING
    create_res = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Chuột không dây Logitech M331 Silent giảm ồn cho thư viện",
            "description": "Chuột bấm êm không phát tiếng động, dùng pin AA 1 năm, còn nguyên tem Phong Vũ.",
            "price": 180000,
            "condition": "LIKE_NEW",
            "category_id": 2,
            "image_urls": [
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
            ],
        },
    )
    assert create_res.status_code == 201
    listing = create_res.json()
    listing_id = listing["id"]
    assert listing["status"] == "PENDING"
    assert len(listing["images"]) == 2

    # Xem danh sách tin đăng của tôi (/api/v1/listings/my)
    my_res = client.get("/api/v1/listings/my", headers=seller_headers)
    assert my_res.status_code == 200
    assert any(item["id"] == listing_id for item in my_res.json())

    # Kiểm duyệt viên xem danh sách tin chờ duyệt PENDING
    pending_res = client.get(
        "/api/v1/moderation/listings?status=PENDING",
        headers=moderator_headers,
    )
    assert pending_res.status_code == 200
    assert any(item["id"] == listing_id for item in pending_res.json())

    # Kiểm duyệt viên phê duyệt tin -> APPROVED
    approve_res = client.patch(
        f"/api/v1/moderation/listings/{listing_id}/status",
        headers=moderator_headers,
        json={"status": "APPROVED"},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
    assert approve_res.json()["rejection_reason"] is None

    # Kiểm duyệt viên từ chối một tin đăng kèm lý do rõ ràng -> REJECTED
    reject_res = client.patch(
        "/api/v1/moderation/listings/9/status",
        headers=moderator_headers,
        json={
            "status": "REJECTED",
            "rejection_reason": "Hình ảnh minh họa chưa chụp thực tế trang bìa và mã vạch sách.",
        },
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert "Hình ảnh minh họa" in reject_res.json()["rejection_reason"]


def test_search_filter_sort_pagination(client: TestClient) -> None:
    """9. Tìm kiếm q, lọc category_id, min_price, max_price, condition, sắp xếp price_asc/price_desc/newest, phân trang."""
    # Tìm kiếm theo từ khóa q
    q_res = client.get("/api/v1/listings", params={"q": "Keychron"})
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert q_data["total"] >= 1
    assert any("Keychron" in item["title"] for item in q_data["items"])

    # Lọc theo danh mục, khoảng giá và tình trạng
    filter_res = client.get(
        "/api/v1/listings",
        params={
            "category_id": 2,
            "min_price": 100000,
            "max_price": 1000000,
            "condition": "LIKE_NEW",
        },
    )
    assert filter_res.status_code == 200
    for item in filter_res.json()["items"]:
        assert item["category_id"] == 2
        assert 100000 <= item["price"] <= 1000000
        assert item["condition"] == "LIKE_NEW"

    # Sắp xếp giá tăng dần (price_asc)
    asc_res = client.get("/api/v1/listings", params={"sort_by": "price_asc"})
    assert asc_res.status_code == 200
    asc_prices = [item["price"] for item in asc_res.json()["items"]]
    assert asc_prices == sorted(asc_prices)

    # Sắp xếp giá giảm dần (price_desc)
    desc_res = client.get("/api/v1/listings", params={"sort_by": "price_desc"})
    assert desc_res.status_code == 200
    desc_prices = [item["price"] for item in desc_res.json()["items"]]
    assert desc_prices == sorted(desc_prices, reverse=True)

    # Phân trang page & page_size
    page_res = client.get("/api/v1/listings", params={"page": 1, "page_size": 2})
    assert page_res.status_code == 200
    page_data = page_res.json()
    assert len(page_data["items"]) == 2
    assert page_data["page"] == 1
    assert page_data["page_size"] == 2
    assert page_data["total_pages"] >= 3


def test_update_and_delete_listing(
    client: TestClient,
    seller_headers: dict[str, str],
    buyer_headers: dict[str, str],
) -> None:
    """10. Chủ tin cập nhật tin (PUT -> 200), người khác sửa/xóa bị chặn (403), xóa tin (DELETE -> 204)."""
    # Tạo một tin mới để kiểm thử sửa và xóa
    create_res = client.post(
        "/api/v1/listings",
        headers=seller_headers,
        json={
            "title": "Áo khoác đồng phục thể dục HPU size L mới 99%",
            "description": "Áo khoác đồng phục mua dư 1 chiếc chưa mặc lần nào, nhượng lại cho khóa mới.",
            "price": 120000,
            "condition": "NEW",
            "category_id": 6,
            "image_urls": [],
        },
    )
    assert create_res.status_code == 201
    listing_id = create_res.json()["id"]

    # Chủ tin cập nhật giá và tiêu đề -> 200 OK
    update_res = client.put(
        f"/api/v1/listings/{listing_id}",
        headers=seller_headers,
        json={
            "title": "Áo khoác đồng phục thể dục HPU size L (Đã giảm giá)",
            "price": 100000,
            "condition": "LIKE_NEW",
            "image_urls": ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
        },
    )
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 100000
    assert "Đã giảm giá" in update_res.json()["title"]

    # Người dùng khác (buyer) cố tình sửa tin -> 403 Forbidden
    forbidden_update = client.put(
        f"/api/v1/listings/{listing_id}",
        headers=buyer_headers,
        json={"price": 10000},
    )
    assert forbidden_update.status_code == 403

    # Người dùng khác (buyer) cố tình xóa tin -> 403 Forbidden
    forbidden_delete = client.delete(
        f"/api/v1/listings/{listing_id}",
        headers=buyer_headers,
    )
    assert forbidden_delete.status_code == 403

    # Chủ tin xóa tin -> 204 No Content
    del_res = client.delete(
        f"/api/v1/listings/{listing_id}",
        headers=seller_headers,
    )
    assert del_res.status_code == 204

    # Xem lại tin đã xóa -> 404 Not Found
    get_deleted = client.get(f"/api/v1/listings/{listing_id}")
    assert get_deleted.status_code == 404


def test_favorites_many_to_many(
    client: TestClient,
    buyer_headers: dict[str, str],
) -> None:
    """11. Toggle lưu yêu thích (POST /listings/{id}/favorite -> 200), xem /users/me/favorites, bấm lần nữa để bỏ yêu thích."""
    target_listing_id = 4  # Tin đăng chưa có trong danh sách yêu thích của buyer

    # Lần 1: Thêm vào yêu thích
    fav_on = client.post(
        f"/api/v1/listings/{target_listing_id}/favorite",
        headers=buyer_headers,
    )
    assert fav_on.status_code == 200
    assert fav_on.json()["is_favorited"] is True
    assert fav_on.json()["favorites_count"] >= 1

    # Kiểm tra trong danh sách yêu thích của tôi
    my_favs = client.get("/api/v1/users/me/favorites", headers=buyer_headers)
    assert my_favs.status_code == 200
    assert any(item["id"] == target_listing_id for item in my_favs.json())

    # Lần 2: Bấm lại để bỏ yêu thích
    fav_off = client.post(
        f"/api/v1/listings/{target_listing_id}/favorite",
        headers=buyer_headers,
    )
    assert fav_off.status_code == 200
    assert fav_off.json()["is_favorited"] is False


def test_offers_and_auto_sold_transition(
    client: TestClient,
    seller_headers: dict[str, str],
    buyer_headers: dict[str, str],
    moderator_headers: dict[str, str],
) -> None:
    """12. Gửi 2 đề nghị mua (201), chặn tự mua tin của mình (400), xem sent/received, chấp nhận offer -> SOLD & từ chối offer còn lại."""
    target_listing_id = 6  # Balo chống sốc Laptop 15.6 inch Tomtoc (của seller, đang APPROVED)

    # Chủ tin tự trả giá tin của chính mình -> 400 Bad Request
    self_offer = client.post(
        f"/api/v1/listings/{target_listing_id}/offers",
        headers=seller_headers,
        json={"offered_price": 400000, "message": "Tự trả giá"},
    )
    assert self_offer.status_code == 400

    # Đề nghị mua #1 từ buyer_student
    offer1_res = client.post(
        f"/api/v1/listings/{target_listing_id}/offers",
        headers=buyer_headers,
        json={
            "offered_price": 420000,
            "message": "Mình qua lấy ngay tại sảnh thư viện trường bạn nhé!",
        },
    )
    assert offer1_res.status_code == 201
    offer1_id = offer1_res.json()["id"]
    assert offer1_res.json()["status"] == "PENDING"

    # Đề nghị mua #2 từ một người dùng khác (moderator đóng vai người mua thứ 2)
    offer2_res = client.post(
        f"/api/v1/listings/{target_listing_id}/offers",
        headers=moderator_headers,
        json={
            "offered_price": 400000,
            "message": "Để lại cho mình giá 400k nhé.",
        },
    )
    assert offer2_res.status_code == 201
    offer2_id = offer2_res.json()["id"]

    # Người mua kiểm tra /api/v1/offers/sent
    sent_res = client.get("/api/v1/offers/sent", headers=buyer_headers)
    assert sent_res.status_code == 200
    assert any(o["id"] == offer1_id for o in sent_res.json())

    # Người bán kiểm tra /api/v1/offers/received
    rec_res = client.get("/api/v1/offers/received", headers=seller_headers)
    assert rec_res.status_code == 200
    assert any(o["id"] == offer1_id for o in rec_res.json())

    # Người không phải chủ tin cố chấp nhận đề nghị mua -> 403 Forbidden
    forbidden_accept = client.patch(
        f"/api/v1/offers/{offer1_id}/accept",
        headers=buyer_headers,
    )
    assert forbidden_accept.status_code == 403

    # Chủ tin chấp nhận đề nghị mua #1 -> 200 OK
    accept_res = client.patch(
        f"/api/v1/offers/{offer1_id}/accept",
        headers=seller_headers,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # Kiểm tra tin đăng đã tự động chuyển sang SOLD
    listing_after = client.get(f"/api/v1/listings/{target_listing_id}")
    assert listing_after.status_code == 200
    assert listing_after.json()["status"] == "SOLD"

    # Kiểm tra đề nghị mua #2 của cùng tin đăng đã tự động chuyển sang REJECTED
    rec_after = client.get("/api/v1/offers/received", headers=seller_headers)
    offer2_after = next(o for o in rec_after.json() if o["id"] == offer2_id)
    assert offer2_after["status"] == "REJECTED"

    # Kiểm tra chặn chỉnh sửa tin đã SOLD -> 409 Conflict
    edit_sold = client.put(
        f"/api/v1/listings/{target_listing_id}",
        headers=seller_headers,
        json={"price": 500000},
    )
    assert edit_sold.status_code == 409


def test_reject_offer(
    client: TestClient,
    seller_headers: dict[str, str],
    buyer_headers: dict[str, str],
) -> None:
    """13. Sinh viên Bán hàng từ chối đề nghị mua (PATCH /offers/{id}/reject -> 200)."""
    # Tạo một đề nghị mua mới trên tin số 4 (đang APPROVED của seller)
    offer_res = client.post(
        "/api/v1/listings/4/offers",
        headers=buyer_headers,
        json={"offered_price": 250000, "message": "Mình trả 250k cho bàn học nhé"},
    )
    assert offer_res.status_code == 201
    offer_id = offer_res.json()["id"]

    # Người mua không được tự từ chối bằng API của người bán -> 403
    forbidden_reject = client.patch(
        f"/api/v1/offers/{offer_id}/reject",
        headers=buyer_headers,
    )
    assert forbidden_reject.status_code == 403

    # Chủ tin từ chối đề nghị mua -> 200 OK
    reject_res = client.patch(
        f"/api/v1/offers/{offer_id}/reject",
        headers=seller_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"

    # Từ chối lại lần nữa trên offer đã REJECTED -> 409 Conflict
    reject_again = client.patch(
        f"/api/v1/offers/{offer_id}/reject",
        headers=seller_headers,
    )
    assert reject_again.status_code == 409


def test_review_and_seller_reputation_calculation(
    client: TestClient,
    buyer_headers: dict[str, str],
    moderator_headers: dict[str, str],
) -> None:
    """14. Sinh viên Mua hàng (đã có offer ACCEPTED trên tin SOLD #6) đánh giá, cập nhật reputation_score, chặn đánh giá trùng (409) và người chưa mua (403)."""
    sold_listing_id = 6  # Đã chốt bán cho buyer ở test_offers_and_auto_sold_transition

    # Người chưa mua (moderator) cố đánh giá -> 403 Forbidden
    unauth_review = client.post(
        f"/api/v1/listings/{sold_listing_id}/reviews",
        headers=moderator_headers,
        json={"rating": 5, "comment": "Tôi chưa mua món này"},
    )
    assert unauth_review.status_code == 403

    # Người mua hợp lệ (buyer) gửi đánh giá 4 sao -> 201 Created
    rev_res = client.post(
        f"/api/v1/listings/{sold_listing_id}/reviews",
        headers=buyer_headers,
        json={
            "rating": 4,
            "comment": "Balo rất đẹp và dày dặn, giao dịch nhanh gọn đúng hẹn.",
        },
    )
    assert rev_res.status_code == 201
    rev_data = rev_res.json()
    assert rev_data["rating"] == 4
    assert rev_data["listing_id"] == sold_listing_id

    # Đánh giá trùng lần 2 cho cùng tin đăng -> 409 Conflict
    dup_rev = client.post(
        f"/api/v1/listings/{sold_listing_id}/reviews",
        headers=buyer_headers,
        json={"rating": 5, "comment": "Đánh giá lần 2"},
    )
    assert dup_rev.status_code == 409

    # Kiểm tra điểm uy tín (reputation_score) và tổng số đánh giá (total_reviews) của người bán (ID=3)
    # Trước đó seller có 1 review 5 sao (từ seed), thêm 1 review 4 sao -> trung bình = 4.5, total_reviews = 2
    seller_profile = client.get("/api/v1/users/3")
    assert seller_profile.status_code == 200
    profile_data = seller_profile.json()
    assert profile_data["total_reviews"] == 2
    assert profile_data["reputation_score"] == 4.5

    # Xem danh sách đánh giá của người bán GET /api/v1/users/3/reviews
    reviews_list = client.get("/api/v1/users/3/reviews")
    assert reviews_list.status_code == 200
    assert len(reviews_list.json()) == 2


def test_report_violation_and_moderation_resolution(
    client: TestClient,
    seller_headers: dict[str, str],
    buyer_headers: dict[str, str],
    moderator_headers: dict[str, str],
) -> None:
    """15. Báo cáo tin vi phạm (201), chặn báo cáo trùng (409), Kiểm duyệt viên xem và xử lý báo cáo (tự động gỡ tin vi phạm)."""
    target_listing_id = 2  # Tin của seller

    # Chủ tin tự báo cáo tin của chính mình -> 400 Bad Request
    self_report = client.post(
        f"/api/v1/listings/{target_listing_id}/reports",
        headers=seller_headers,
        json={"reason": "Tự báo cáo", "description": "Không hợp lệ"},
    )
    assert self_report.status_code == 400

    # Sinh viên Mua hàng gửi báo cáo vi phạm -> 201 Created
    rep_res = client.post(
        f"/api/v1/listings/{target_listing_id}/reports",
        headers=buyer_headers,
        json={
            "reason": "Nghi vấn sản phẩm không đúng mô tả",
            "description": "Hình ảnh trên bài viết giống ảnh lấy từ mạng, nhờ kiểm duyệt viên xác minh.",
        },
    )
    assert rep_res.status_code == 201
    report_id = rep_res.json()["id"]
    assert rep_res.json()["status"] == "PENDING"

    # Gửi trùng báo cáo khi báo cáo cũ đang PENDING -> 409 Conflict
    dup_rep = client.post(
        f"/api/v1/listings/{target_listing_id}/reports",
        headers=buyer_headers,
        json={"reason": "Báo cáo lặp lại", "description": "Trùng lặp"},
    )
    assert dup_rep.status_code == 409

    # Kiểm duyệt viên xem danh sách báo cáo vi phạm
    mod_reports = client.get(
        "/api/v1/moderation/reports?status=PENDING",
        headers=moderator_headers,
    )
    assert mod_reports.status_code == 200
    assert any(r["id"] == report_id for r in mod_reports.json())

    # Kiểm duyệt viên xử lý báo cáo (RESOLVED) -> tự động gỡ tin vi phạm sang REJECTED
    resolve_res = client.patch(
        f"/api/v1/moderation/reports/{report_id}",
        headers=moderator_headers,
        json={
            "status": "RESOLVED",
            "moderator_note": "Đã xác minh vi phạm quy định hình ảnh, tạm gỡ tin đăng.",
            "reject_listing": True,
        },
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"

    # Tin đăng bị báo cáo phải tự động chuyển sang REJECTED
    listing_after = client.get(f"/api/v1/listings/{target_listing_id}")
    assert listing_after.status_code == 200
    assert listing_after.json()["status"] == "REJECTED"


def test_daily_listing_rate_limit_429(client: TestClient) -> None:
    """16. Kiểm tra giới hạn số tin đăng mỗi ngày (DAILY_LISTING_LIMIT=5), tin thứ 6 trả 429 Too Many Requests."""
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "ratelimit_tester@sv.edu.vn",
            "password": "Password@123",
            "full_name": "Sinh Viên Kiểm Thử Giới Hạn",
        },
    )
    assert reg_res.status_code == 201
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # Đăng liên tiếp 5 tin trong ngày -> cả 5 tin đều 201 Created
    for i in range(1, 6):
        res = client.post(
            "/api/v1/listings",
            headers=headers,
            json={
                "title": f"Tài liệu ôn tập môn học số {i} học kỳ 2",
                "description": "Tài liệu tổng hợp công thức và bài tập có lời giải chi tiết.",
                "price": 25000 * i,
                "condition": "GOOD",
                "category_id": 1,
            },
        )
        assert res.status_code == 201, f"Tin thứ {i} phải trả về 201 Created"

    # Tin thứ 6 trong cùng một ngày -> 429 Too Many Requests
    sixth_res = client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Tài liệu ôn tập vượt quá giới hạn ngày thứ 6",
            "description": "Tin đăng thứ 6 trong ngày sẽ bị hệ thống chặn chống spam.",
            "price": 50000,
            "condition": "GOOD",
            "category_id": 1,
        },
    )
    assert sixth_res.status_code == 429
    assert "giới hạn tối đa" in sixth_res.json()["detail"].lower()


def test_stats_overview_and_user_profile(client: TestClient) -> None:
    """17. Kiểm tra GET /api/v1/stats/overview (200) và GET /api/v1/users/{id} (200 & 404)."""
    stats_res = client.get("/api/v1/stats/overview")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_users"] >= 4
    assert stats["total_categories"] >= 6
    assert stats["total_listings"] >= 10
    assert isinstance(stats["listings_by_category"], list)
    assert len(stats["listings_by_category"]) >= 6

    user_res = client.get("/api/v1/users/3")
    assert user_res.status_code == 200
    assert user_res.json()["email"] == "nguyenvana@sv.edu.vn"

    not_found_user = client.get("/api/v1/users/99999")
    assert not_found_user.status_code == 404

    not_found_reviews = client.get("/api/v1/users/99999/reviews")
    assert not_found_reviews.status_code == 404


def test_seed_database_idempotent(db_session: Session) -> None:
    """18. Kiểm tra hàm seed_database() chạy an toàn và có tính chất idempotent."""
    # Gọi lại seed_database trên CSDL đã có dữ liệu -> phải bỏ qua an toàn
    second_run = seed_database(db_session)
    assert second_run["seeded"] is False

    # Kiểm tra trên một CSDL in-memory mới tinh -> phải seed đủ 4 users, 6 categories, 10 listings
    mem_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=mem_engine)
    MemSession = sessionmaker(bind=mem_engine)
    with MemSession() as fresh_db:
        first_run = seed_database(fresh_db)
        assert first_run["seeded"] is True
        assert first_run["users"] == 4
        assert first_run["categories"] == 6
        assert first_run["listings"] == 10
        assert fresh_db.query(User).count() == 4
    mem_engine.dispose()
