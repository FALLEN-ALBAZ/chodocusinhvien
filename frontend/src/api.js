// ============================================================================
// TẦNG GIAO TIẾP API & TIỆN ÍCH DÙNG CHUNG — CHỢ ĐỒ CŨ SINH VIÊN
// Kết nối trực tiếp tới Backend FastAPI (/api/v1/...)
// ============================================================================

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Danh sách 3 tài khoản tác nhân Demo chuẩn phục vụ chuyển đổi 1-Click khi bảo vệ ĐG2
export const DEMO_ACCOUNTS = [
  {
    key: 'seller',
    label: 'SV Bán hàng',
    fullTitle: 'Sinh viên Bán hàng (Nguyễn Văn An)',
    email: 'nguyenvana@sv.edu.vn',
    password: 'Sv@123456',
    role: 'STUDENT',
    badgeColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    lightColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Đăng tin bán đồ cũ, quản lý tin đăng, duyệt đề nghị mua & chốt đơn SOLD.',
  },
  {
    key: 'buyer',
    label: 'SV Mua hàng',
    fullTitle: 'Sinh viên Mua hàng (Trần Thị Bình)',
    email: 'tranthib@sv.edu.vn',
    password: 'Sv@123456',
    role: 'STUDENT',
    badgeColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    lightColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Tìm kiếm đồ cũ, lưu yêu thích (N:N), gửi trả giá, đánh giá 1-5 sao & báo cáo vi phạm.',
  },
  {
    key: 'moderator',
    label: 'Kiểm duyệt viên',
    fullTitle: 'Kiểm duyệt viên (Lê Hoàng Nam)',
    email: 'kiemduyet@sv.edu.vn',
    password: 'Mod@123456',
    role: 'MODERATOR',
    badgeColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    lightColor: 'bg-amber-50 text-amber-900 border-amber-300',
    description: 'Phê duyệt tin PENDING -> APPROVED, từ chối tin REJECTED, xử lý báo cáo & tạo danh mục.',
  },
];

// Từ điển hiển thị Tình trạng món đồ (ItemCondition)
export const CONDITION_META = {
  NEW: {
    label: 'Mới 100%',
    shortLabel: 'Mới 100%',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    desc: 'Chưa qua sử dụng, còn nguyên tem/hộp',
  },
  LIKE_NEW: {
    label: 'Như mới 99%',
    shortLabel: 'Như mới 99%',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    desc: 'Mới dùng vài lần, ngoại hình đẹp không trầy xước',
  },
  GOOD: {
    label: 'Tốt (Đang dùng tốt)',
    shortLabel: 'Tình trạng Tốt',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    desc: 'Hoạt động hoàn hảo, có vết xước nhẹ theo thời gian',
  },
  FAIR: {
    label: 'Khá (Tiết kiệm)',
    shortLabel: 'Tình trạng Khá',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    desc: 'Dùng ổn định mọi chức năng, giá sinh viên siêu rẻ',
  },
};

// Từ điển hiển thị Trạng thái tin đăng (ListingStatus)
export const STATUS_META = {
  APPROVED: {
    label: 'Đang bán',
    badge: 'bg-emerald-500 text-white',
    softBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  PENDING: {
    label: 'Chờ duyệt',
    badge: 'bg-amber-500 text-white',
    softBadge: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  SOLD: {
    label: 'Đã bán',
    badge: 'bg-rose-600 text-white',
    softBadge: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  REJECTED: {
    label: 'Bị từ chối',
    badge: 'bg-slate-700 text-white',
    softBadge: 'bg-slate-100 text-slate-700 border border-slate-300',
  },
};

// Từ điển hiển thị Trạng thái đề nghị mua (OfferStatus)
export const OFFER_STATUS_META = {
  PENDING: {
    label: 'Đang chờ phản hồi',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  ACCEPTED: {
    label: 'Đã chấp nhận (Chốt đơn)',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  REJECTED: {
    label: 'Đã từ chối',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

// Từ điển hiển thị Trạng thái báo cáo vi phạm (ReportStatus)
export const REPORT_STATUS_META = {
  PENDING: {
    label: 'Chờ xử lý',
    badge: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  RESOLVED: {
    label: 'Đã xử lý & Gỡ tin',
    badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  },
  DISMISSED: {
    label: 'Đã bác bỏ',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

// Từ điển hiển thị Vai trò người dùng (UserRole)
export const ROLE_META = {
  STUDENT: {
    label: 'Sinh viên',
    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  },
  MODERATOR: {
    label: 'Kiểm duyệt viên',
    badge: 'bg-amber-100 text-amber-900 border border-amber-300',
  },
  ADMIN: {
    label: 'Quản trị viên',
    badge: 'bg-rose-100 text-rose-800 border border-rose-300',
  },
};

// Ảnh mẫu gợi ý nhanh cho sinh viên khi đăng tin
export const SAMPLE_ITEM_IMAGES = [
  {
    label: 'Laptop / Đồ công nghệ',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Giáo trình / Sách đại học',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Xe đạp sinh viên',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Đồ gia dụng phòng trọ',
    url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Bàn ghế / Đèn học',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80',
  },
];

// Định dạng tiền tệ VNĐ chuẩn Việt Nam
export function formatVND(amount) {
  const num = Number(amount || 0);
  if (num === 0) return '0 ₫ (Tặng miễn phí)';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

// Định dạng ngày giờ tiếng Việt
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

// Lấy ảnh đại diện đầu tiên của tin đăng
export function getListingThumbnail(listing) {
  if (listing?.images && listing.images.length > 0) {
    return listing.images[0].image_url;
  }
  return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
}

// Trích xuất thông báo lỗi dễ đọc từ phản hồi FastAPI (hỗ trợ cả 400/403/404/409/422/429)
export function extractErrorMessage(data, fallback = 'Đã xảy ra lỗi khi gọi API.') {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((err) => {
        const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : '';
        return field ? `[${field}] ${err.msg}` : err.msg;
      })
      .join(' | ');
  }
  if (data.message) return data.message;
  return fallback;
}

// Hàm gọi REST API chuẩn có đính kèm JWT Bearer Token
export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const url = path.startsWith('http') || path.startsWith('/api') ? path : `${API_BASE}${path}`;
  const reqHeaders = { ...headers };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    reqHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: payload,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    const error = new Error(extractErrorMessage(data, `Lỗi HTTP ${response.status}`));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Hàm gọi API nguyên bản trả về đầy đủ { status, ok, durationMs, data } cho Trạm Kiểm Thử 8 Bước ĐG2
export async function rawApiRequest(path, { method = 'GET', body, token } = {}) {
  const url = path.startsWith('http') || path.startsWith('/api') ? path : `${API_BASE}${path}`;
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let payload = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const start = performance.now();
  const response = await fetch(url, {
    method,
    headers,
    body: payload,
  });
  const durationMs = Math.round((performance.now() - start) * 10) / 10;

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { raw: text } : null;
  }

  return {
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    durationMs,
    processTimeHeader: response.headers.get('X-Process-Time-Ms'),
    data,
  };
}

// Hàm tải lên nhiều file ảnh thật lên endpoint POST /api/v1/uploads/images
export async function uploadImagesApi(files, token) {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  return apiRequest('/uploads/images', {
    method: 'POST',
    body: formData,
    token,
  });
}
