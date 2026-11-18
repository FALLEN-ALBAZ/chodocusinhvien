from datetime import UTC, datetime, timedelta

import bcrypt
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    Category,
    Favorite,
    ItemCondition,
    Listing,
    ListingImage,
    ListingStatus,
    Offer,
    OfferStatus,
    Report,
    ReportStatus,
    Review,
    User,
    UserRole,
)


def hash_password(plain_password: str) -> str:
    """Băm mật khẩu bằng thuật toán bcrypt chuẩn bảo mật."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def seed_database(db: Session) -> dict:
    """
    Khởi tạo dữ liệu mẫu chuẩn học thuật cho hệ thống Chợ Đồ Cũ Sinh Viên.
    Hàm có tính chất idempotent (chỉ khởi tạo khi CSDL chưa có dữ liệu).
    """
    existing_user = db.query(User).first()
    if existing_user is not None:
        print("[Seed] CSDL đã có dữ liệu mẫu. Bỏ qua bước khởi tạo trùng lặp.")
        return {"seeded": False, "message": "Database already seeded"}

    now = datetime.now(UTC).replace(tzinfo=None)

    # =========================================================================
    # 1. KHỞI TẠO 4 TÀI KHOẢN DEMO CHUẨN CHO CÁC TÁC NHÂN
    # =========================================================================
    moderator = User(
        email="kiemduyet@sv.edu.vn",
        password_hash=hash_password("Mod@123456"),
        full_name="Lê Hoàng Nam (Kiểm duyệt viên)",
        phone="0901234567",
        university="Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=moderator",
        role=UserRole.MODERATOR.value,
        reputation_score=5.0,
        total_reviews=0,
        is_active=True,
        created_at=now - timedelta(days=30),
    )

    admin = User(
        email="admin@sv.edu.vn",
        password_hash=hash_password("Admin@123456"),
        full_name="Quản trị viên Hệ thống",
        phone="0909999888",
        university="Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role=UserRole.ADMIN.value,
        reputation_score=5.0,
        total_reviews=0,
        is_active=True,
        created_at=now - timedelta(days=30),
    )

    seller_student = User(
        email="nguyenvana@sv.edu.vn",
        password_hash=hash_password("Sv@123456"),
        full_name="Nguyễn Văn An - Khoa CNTT",
        phone="0987654321",
        university="Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenvana",
        role=UserRole.STUDENT.value,
        reputation_score=5.0,
        total_reviews=1,
        is_active=True,
        created_at=now - timedelta(days=20),
    )

    buyer_student = User(
        email="tranthib@sv.edu.vn",
        password_hash=hash_password("Sv@123456"),
        full_name="Trần Thị Bình - Khoa Kinh tế",
        phone="0912345678",
        university="Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=tranthib",
        role=UserRole.STUDENT.value,
        reputation_score=4.9,
        total_reviews=1,
        is_active=True,
        created_at=now - timedelta(days=18),
    )

    db.add_all([moderator, admin, seller_student, buyer_student])
    db.flush()

    # =========================================================================
    # 2. KHỞI TẠO 6 DANH MỤC ĐỒ CŨ SINH VIÊN (CATEGORIES)
    # =========================================================================
    categories_data = [
        {
            "name": "Giáo trình & Sách tham khảo",
            "slug": "giao-trinh-sach-tham-khao",
            "description": "Sách giáo trình đại cương, chuyên ngành CNTT, Kinh tế, Ngoại ngữ, tài liệu ôn thi.",
            "icon": "BookOpen",
        },
        {
            "name": "Đồ điện tử & Laptop",
            "slug": "do-dien-tu-laptop",
            "description": "Laptop sinh viên, màn hình rời, bàn phím cơ, chuột không dây, tai nghe học online.",
            "icon": "Laptop",
        },
        {
            "name": "Đồ gia dụng phòng trọ",
            "slug": "do-gia-dung-phong-tro",
            "description": "Ấm siêu tốc, nồi cơm điện mini, quạt cây, đèn bàn chống cận, giá để đồ.",
            "icon": "Home",
        },
        {
            "name": "Bàn ghế & Nội thất",
            "slug": "ban-ghe-noi-that",
            "description": "Bàn học gấp gọn, ghế xoay văn phòng, kệ sách gỗ, tủ vải sinh viên.",
            "icon": "Armchair",
        },
        {
            "name": "Phương tiện di chuyển",
            "slug": "phuong-tien-di-chuyen",
            "description": "Xe đạp thể thao đi học, xe đạp điện, mũ bảo hiểm, phụ kiện xe.",
            "icon": "Bike",
        },
        {
            "name": "Thời trang & Phụ kiện",
            "slug": "thoi-trang-phu-kien",
            "description": "Balo chống sốc laptop, áo khoác đồng phục, giày thể thao, đồng hồ sinh viên.",
            "icon": "Shirt",
        },
    ]

    categories = {}
    for cat in categories_data:
        category_obj = Category(
            name=cat["name"],
            slug=cat["slug"],
            description=cat["description"],
            icon=cat["icon"],
            created_at=now - timedelta(days=25),
        )
        db.add(category_obj)
        db.flush()
        categories[cat["slug"]] = category_obj

    # =========================================================================
    # 3. KHỞI TẠO 9 TIN ĐĂNG MẪU ĐA DẠNG TRẠNG THÁI + HÌNH ẢNH (1:N)
    # =========================================================================
    listings_spec = [
        {
            "seller": seller_student,
            "category": categories["giao-trinh-sach-tham-khao"],
            "title": "Combo Giáo trình Cấu trúc dữ liệu & Giải thuật + Lập trình Hướng đối tượng",
            "description": (
                "Mình vừa qua môn với điểm A nên nhượng lại bộ 2 cuốn giáo trình cốt lõi ngành CNTT. "
                "Sách in màu rõ nét, đã bọc bìa bóng kính cẩn thận, không rách hay viết bẩn, tặng kèm tập đề cương ôn thi cuối kỳ."
            ),
            "price": 65000,
            "condition": ItemCondition.LIKE_NEW.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=5),
            "images": [
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80",
            ],
        },
        {
            "seller": seller_student,
            "category": categories["do-dien-tu-laptop"],
            "title": "Bàn phím cơ không dây Keychron K6 Red Switch (Fullbox còn bảo hành)",
            "description": (
                "Bàn phím cơ nhỏ gọn 65% cực hợp gõ code ban đêm trong ký túc xá vì Red Switch rất êm. "
                "Pin dùng 2 tuần mới cần sạc, kết nối Bluetooth 3 thiết bị cùng lúc. Đầy đủ hộp, cáp Type-C và keycap puller."
            ),
            "price": 850000,
            "condition": ItemCondition.LIKE_NEW.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=4),
            "images": [
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
            ],
        },
        {
            "seller": buyer_student,
            "category": categories["do-gia-dung-phong-tro"],
            "title": "Đèn bàn học chống cận Xiaomi Mi LED Desk Lamp 1S chỉnh 4 chế độ sáng",
            "description": (
                "Đèn học ánh sáng tự nhiên CRI 90 không nhấp nháy, bảo vệ mắt khi thức khuya làm đồ án. "
                "Núm xoay chỉnh nhiệt độ màu từ vàng ấm sang trắng sáng. Giao dịch trực tiếp tại cổng trường HPU."
            ),
            "price": 390000,
            "condition": ItemCondition.GOOD.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=3),
            "images": [
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
            ],
        },
        {
            "seller": seller_student,
            "category": categories["ban-ghe-noi-that"],
            "title": "Bàn học gỗ MDF chân chữ Z kèm kệ sách 2 tầng (1m2 x 60cm)",
            "description": (
                "Chuyển phòng trọ nên thanh lý nhanh bàn học kiêm bàn làm việc chân sắt sơn tĩnh điện chắc chắn. "
                "Có thể tháo rời ốc vít để chở bằng xe máy dễ dàng. Tặng kèm miếng lót chuột cỡ lớn."
            ),
            "price": 320000,
            "condition": ItemCondition.GOOD.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=2),
            "images": [
                "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
            ],
        },
        {
            "seller": buyer_student,
            "category": categories["phuong-tien-di-chuyen"],
            "title": "Xe đạp thể thao Trinx TX16 khung nhôm nhẹ đi học hàng ngày",
            "description": (
                "Xe đạp 21 tốc độ bộ đề Shimano mượt mà, lốp mới thay còn nguyên gai. "
                "Phù hợp cho các bạn sinh viên năm nhất đi từ khu trọ tới giảng đường. Kèm khóa số chống trộm và chắn bùn."
            ),
            "price": 1650000,
            "condition": ItemCondition.GOOD.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=2),
            "images": [
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
            ],
        },
        {
            "seller": seller_student,
            "category": categories["thoi-trang-phu-kien"],
            "title": "Balo chống sốc Laptop 15.6 inch Tomtoc chống thấm nước",
            "description": (
                "Balo thiết kế ngăn chống sốc đáy đệm khí bảo vệ laptop cực tốt, nhiều ngăn đựng sạc, chuột, bình nước. "
                "Mới đeo vài lần, khóa kéo YKK mượt như mới."
            ),
            "price": 450000,
            "condition": ItemCondition.LIKE_NEW.value,
            "status": ListingStatus.APPROVED.value,
            "created_at": now - timedelta(days=1),
            "images": [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
            ],
        },
        # Tin đăng đã bán (SOLD) để minh họa luồng Đề nghị mua (ACCEPTED) + Đánh giá 5 sao (Review)
        {
            "seller": seller_student,
            "category": categories["do-dien-tu-laptop"],
            "title": "Máy tính bỏ túi Casio fx-580VN X chính hãng Bitex (Đã giao dịch)",
            "description": (
                "Máy tính khoa học thần thánh cho các môn Toán cao cấp, Xác suất thống kê và Vật lý đại cương. "
                "Tem chống giả Bitex còn nguyên, màn hình LCD độ phân giải cao."
            ),
            "price": 380000,
            "condition": ItemCondition.LIKE_NEW.value,
            "status": ListingStatus.SOLD.value,
            "created_at": now - timedelta(days=7),
            "images": [
                "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
            ],
        },
        # Tin đăng đang chờ duyệt (PENDING) để Kiểm duyệt viên demo duyệt tin
        {
            "seller": seller_student,
            "category": categories["do-dien-tu-laptop"],
            "title": "Màn hình rời LG IPS 24 inch FullHD 75Hz chống mỏi mắt khi lập trình",
            "description": (
                "Màn hình phụ xuất từ laptop qua cổng HDMI cực nét, góc nhìn rộng 178 độ, không điểm chết. "
                "Đầy đủ chân đế và dây nguồn, dây HDMI đi kèm."
            ),
            "price": 1450000,
            "condition": ItemCondition.GOOD.value,
            "status": ListingStatus.PENDING.value,
            "created_at": now - timedelta(hours=6),
            "images": [
                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=800&q=80",
            ],
        },
        # Tin đăng chờ duyệt thứ 2 (PENDING)
        {
            "seller": buyer_student,
            "category": categories["giao-trinh-sach-tham-khao"],
            "title": "Bộ sách ôn luyện TOEIC ETS 2024 (Listening + Reading) kèm file nghe",
            "description": (
                "Mình vừa thi đạt 780 TOEIC đủ chuẩn đầu ra nên nhượng lại bộ 2 cuốn ETS 2024 mới 98%, "
                "chỉ làm bài ra giấy nháp nên sách trắng tinh."
            ),
            "price": 95000,
            "condition": ItemCondition.LIKE_NEW.value,
            "status": ListingStatus.PENDING.value,
            "created_at": now - timedelta(hours=3),
            "images": [
                "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
            ],
        },
        # Tin đăng bị từ chối (REJECTED) để minh họa lịch sử kiểm duyệt
        {
            "seller": seller_student,
            "category": categories["do-gia-dung-phong-tro"],
            "title": "Thanh lý bếp gas mini cũ đã rỉ sét",
            "description": "Bếp gas mini dùng lâu năm, van hơi lỏng nhưng vẫn bật lửa được.",
            "price": 50000,
            "condition": ItemCondition.FAIR.value,
            "status": ListingStatus.REJECTED.value,
            "rejection_reason": (
                "Sản phẩm bếp gas mini cũ bị rỉ sét, van lỏng có nguy cơ mất an toàn phòng cháy chữa cháy "
                "trong khu ký túc xá và phòng trọ sinh viên."
            ),
            "created_at": now - timedelta(days=6),
            "images": [
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
            ],
        },
    ]

    created_listings = []
    for item in listings_spec:
        listing = Listing(
            seller_id=item["seller"].id,
            category_id=item["category"].id,
            title=item["title"],
            description=item["description"],
            price=item["price"],
            condition=item["condition"],
            status=item["status"],
            rejection_reason=item.get("rejection_reason"),
            created_at=item["created_at"],
            updated_at=item["created_at"],
        )
        db.add(listing)
        db.flush()

        for idx, img_url in enumerate(item["images"]):
            db.add(
                ListingImage(
                    listing_id=listing.id,
                    image_url=img_url,
                    display_order=idx,
                )
            )
        created_listings.append(listing)

    db.flush()

    # =========================================================================
    # 4. KHỞI TẠO DỮ LIỆU MẪU BẢNG FAVORITES (QUAN HỆ N:N)
    # =========================================================================
    favorites = [
        Favorite(
            user_id=buyer_student.id,
            listing_id=created_listings[0].id,
            created_at=now - timedelta(days=2),
        ),
        Favorite(
            user_id=buyer_student.id,
            listing_id=created_listings[1].id,
            created_at=now - timedelta(days=1),
        ),
        Favorite(
            user_id=seller_student.id,
            listing_id=created_listings[2].id,
            created_at=now - timedelta(days=1),
        ),
    ]
    db.add_all(favorites)

    # =========================================================================
    # 5. KHỞI TẠO DỮ LIỆU MẪU BẢNG OFFERS (ĐỀ NGHỊ MUA HÀNG)
    # =========================================================================
    offers = [
        # Đề nghị mua đang chờ phản hồi cho Bàn phím cơ Keychron K6
        Offer(
            listing_id=created_listings[1].id,
            buyer_id=buyer_student.id,
            offered_price=780000,
            message="Bạn ơi để lại cho mình 780k nhé, chiều nay tan ca học ở giảng đường B mình qua lấy luôn ạ!",
            status=OfferStatus.PENDING.value,
            created_at=now - timedelta(hours=12),
            updated_at=now - timedelta(hours=12),
        ),
        # Đề nghị mua đã chấp nhận cho Máy tính Casio fx-580VN X (Listing #7 - SOLD)
        Offer(
            listing_id=created_listings[6].id,
            buyer_id=buyer_student.id,
            offered_price=350000,
            message="Mình là sinh viên năm nhất Khoa Kinh tế đang cần máy tính để ôn thi Xác suất thống kê, bạn bớt cho mình còn 350k nhé!",
            status=OfferStatus.ACCEPTED.value,
            created_at=now - timedelta(days=6),
            updated_at=now - timedelta(days=5),
        ),
    ]
    db.add_all(offers)

    # =========================================================================
    # 6. KHỞI TẠO DỮ LIỆU MẪNG BẢNG REVIEWS (ĐÁNH GIÁ SAU GIAO DỊCH)
    # =========================================================================
    review = Review(
        listing_id=created_listings[6].id,
        reviewer_id=buyer_student.id,
        seller_id=seller_student.id,
        rating=5,
        comment=(
            "Anh An rất nhiệt tình, máy tính Casio chính hãng còn mới nguyên và bấm rất nhạy. "
            "Giao dịch đúng giờ ngay tại thư viện trường, cảm ơn anh nhiều ạ!"
        ),
        created_at=now - timedelta(days=4),
    )
    db.add(review)

    # =========================================================================
    # 7. KHỞI TẠO DỮ LIỆU MẪU BẢNG REPORTS (BÁO CÁO VI PHẠM CHỜ XỬ LÝ)
    # =========================================================================
    report = Report(
        listing_id=created_listings[3].id,
        reporter_id=buyer_student.id,
        reason="Nghi vấn thông tin kích thước chưa chính xác",
        description="Mình muốn nhờ Kiểm duyệt viên xác minh lại kích thước mặt bàn thực tế có đúng 1m2 hay 1m0 ạ.",
        status=ReportStatus.PENDING.value,
        moderator_note=None,
        created_at=now - timedelta(hours=5),
        updated_at=now - timedelta(hours=5),
    )
    db.add(report)

    db.commit()
    print(
        f"[Seed] Đã khởi tạo thành công: 4 Users, {len(categories)} Categories, "
        f"{len(created_listings)} Listings, {len(favorites)} Favorites, "
        f"{len(offers)} Offers, 1 Review, 1 Report."
    )
    return {
        "seeded": True,
        "users": 4,
        "categories": len(categories),
        "listings": len(created_listings),
        "favorites": len(favorites),
        "offers": len(offers),
        "reviews": 1,
        "reports": 1,
    }


def main() -> None:
    """Entrypoint khi chạy lệnh `python -m app.seed`."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
