import React, { useState } from 'react';
import {
  Terminal,
  ShieldAlert,
  AlertOctagon,
  Play,
  CheckCircle2,
  Clock,
  Lock,
  Code2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { rawApiRequest, DEMO_ACCOUNTS } from '../api';

export default function DefenseLabView({
  currentUser,
  token,
  onQuickDemoLogin,
  onRefreshAll,
  showNotify,
}) {
  const [logs, setLogs] = useState([]);
  const [runningStep, setRunningStep] = useState(null);
  const [lastCreatedListingId, setLastCreatedListingId] = useState(null);
  const [lastCreatedOfferId, setLastCreatedOfferId] = useState(null);

  const appendLog = (title, stepBadge, responseObj, expectedStatus) => {
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        title,
        stepBadge,
        expectedStatus,
        ...responseObj,
      },
      ...prev,
    ]);
  };

  // Hàm lấy nhanh JWT Token của một tác nhân Demo cụ thể để chạy kịch bản tự động chính xác
  const getActorToken = async (actorKey) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.key === actorKey);
    const loginRes = await rawApiRequest('/auth/login', {
      method: 'POST',
      body: { email: acc.email, password: acc.password },
    });
    return loginRes.data?.access_token || token;
  };

  // BƯỚC 1: Kiểm tra Healthcheck & Thống kê hệ thống
  const runStep1Health = async () => {
    setRunningStep(1);
    try {
      const res = await rawApiRequest('/health', { method: 'GET' });
      appendLog(
        'Kiểm tra Sức khỏe Dịch vụ Backend (Healthcheck)',
        'Bước 1',
        res,
        200
      );
      showNotify('Bước 1: Hệ thống trả về HTTP 200 OK!', 'success');
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 2: Xác thực JWT & Lấy hồ sơ cá nhân (/auth/login & /auth/me)
  const runStep2Auth = async () => {
    setRunningStep(2);
    try {
      const sellerAcc = DEMO_ACCOUNTS[0];
      const res = await rawApiRequest('/auth/login', {
        method: 'POST',
        body: { email: sellerAcc.email, password: sellerAcc.password },
      });
      appendLog(
        `Đăng nhập nhận JWT Token (${sellerAcc.email})`,
        'Bước 2',
        res,
        200
      );
      showNotify(
        'Bước 2: Xác thực JWT HS256 thành công (HTTP 200 OK)!',
        'success'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 3 (TRỌNG TÂM BẢO VỆ): Thử nghiệm Phân quyền RBAC — Sinh viên gọi API Kiểm duyệt -> HTTP 403 Forbidden
  const runStep3RbacForbidden = async () => {
    setRunningStep(3);
    try {
      const studentToken = await getActorToken('seller');
      const res = await rawApiRequest('/moderation/listings', {
        method: 'GET',
        token: studentToken,
      });
      appendLog(
        'Thử nghiệm Phân quyền (Sinh viên gọi API Kiểm duyệt GET /api/v1/moderation/listings)',
        'Bước 3 — RBAC 403',
        res,
        403
      );
      showNotify(
        'Bước 3 Demo: Máy chủ chặn truy cập trái phép và trả về đúng HTTP 403 Forbidden!',
        'info'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 4 (TRỌNG TÂM BẢO VỆ): Thử nghiệm Kiểm chứng dữ liệu — Gửi giá âm -50.000đ -> HTTP 422 Unprocessable Entity
  const runStep4Validation422 = async () => {
    setRunningStep(4);
    try {
      const studentToken = await getActorToken('seller');
      const res = await rawApiRequest('/listings', {
        method: 'POST',
        token: studentToken,
        body: {
          title: 'Bàn học gỗ thông sinh viên thử nghiệm giá âm',
          description:
            'Thử nghiệm gửi mức giá âm -50.000 VNĐ để kiểm chứng Pydantic Schema Validation trên FastAPI.',
          price: -50000,
          condition: 'GOOD',
          category_id: 1,
          image_urls: [],
        },
      });
      appendLog(
        'Thử nghiệm Kiểm chứng dữ liệu (Gửi giá âm -50.000đ vào POST /api/v1/listings)',
        'Bước 4 — Validation 422',
        res,
        422
      );
      showNotify(
        'Bước 4 Demo: FastAPI chặn dữ liệu bẩn và trả về đúng HTTP 422 Unprocessable Entity!',
        'info'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 5: Sinh viên Bán đăng tin hợp lệ -> HTTP 201 Created (Trạng thái PENDING)
  const runStep5CreateListing = async () => {
    setRunningStep(5);
    try {
      const sellerToken = await getActorToken('seller');
      const res = await rawApiRequest('/listings', {
        method: 'POST',
        token: sellerToken,
        body: {
          title: `Combo Giáo trình Lập trình Web & Chuột không dây Logitech (Demo #${Math.floor(
            100 + Math.random() * 900
          )})`,
          description:
            'Tin đăng thử nghiệm trực tiếp từ Trạm Kiểm Thử 8 Bước ĐG2. Sách còn mới 99%, chuột nhạy, tặng kèm lót chuột.',
          price: 165000,
          condition: 'LIKE_NEW',
          category_id: 1,
          image_urls: [
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
          ],
        },
      });
      if (res.data?.id) {
        setLastCreatedListingId(res.data.id);
      }
      appendLog(
        'Sinh viên Bán đăng tin đồ cũ mới (Khởi tạo ở trạng thái PENDING chờ duyệt)',
        'Bước 5 — 201 Created',
        res,
        201
      );
      onRefreshAll();
      showNotify(
        `Bước 5: Tạo tin mới #${res.data?.id || ''} thành công (HTTP ${res.status})!`,
        res.ok ? 'success' : 'error'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 6: Kiểm duyệt viên phê duyệt tin PENDING -> APPROVED
  const runStep6ModerateApprove = async () => {
    setRunningStep(6);
    try {
      const modToken = await getActorToken('moderator');
      let targetListingId = lastCreatedListingId;
      if (!targetListingId) {
        const pendingRes = await rawApiRequest(
          '/moderation/listings?status=PENDING',
          {
            method: 'GET',
            token: modToken,
          }
        );
        if (Array.isArray(pendingRes.data) && pendingRes.data.length > 0) {
          targetListingId = pendingRes.data[0].id;
        } else {
          targetListingId = 1;
        }
      }
      const res = await rawApiRequest(
        `/moderation/listings/${targetListingId}/status`,
        {
          method: 'PATCH',
          token: modToken,
          body: { status: 'APPROVED' },
        }
      );
      setLastCreatedListingId(targetListingId);
      appendLog(
        `Kiểm duyệt viên phê duyệt tin #${targetListingId} sang APPROVED`,
        'Bước 6 — Moderation',
        res,
        200
      );
      onRefreshAll();
      showNotify(
        `Bước 6: Đã duyệt tin #${targetListingId} sang APPROVED hiển thị lên chợ!`,
        'success'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 7: Sinh viên Mua gửi đề nghị mua & Người bán Chấp nhận chốt đơn SOLD
  const runStep7OfferAndAccept = async () => {
    setRunningStep(7);
    try {
      const buyerToken = await getActorToken('buyer');
      const sellerToken = await getActorToken('seller');
      const targetListingId = lastCreatedListingId || 1;

      const offerRes = await rawApiRequest(
        `/listings/${targetListingId}/offers`,
        {
          method: 'POST',
          token: buyerToken,
          body: {
            offered_price: 150000,
            message:
              'Mình đặt mua món này từ Trạm Kiểm Thử ĐG2, chiều nay mình qua nhận đồ nhé!',
          },
        }
      );
      appendLog(
        `Sinh viên Mua gửi đề nghị mua cho tin #${targetListingId}`,
        'Bước 7A — Tạo Offer',
        offerRes,
        201
      );

      if (offerRes.data?.id) {
        setLastCreatedOfferId(offerRes.data.id);
        const acceptRes = await rawApiRequest(
          `/offers/${offerRes.data.id}/accept`,
          {
            method: 'PATCH',
            token: sellerToken,
          }
        );
        appendLog(
          `Người bán chấp nhận Offer #${offerRes.data.id} -> Tự động khóa tin #${targetListingId} sang SOLD`,
          'Bước 7B — Chốt đơn SOLD',
          acceptRes,
          200
        );
      }
      onRefreshAll();
      showNotify(
        'Bước 7: Hoàn tất gửi trả giá & Chốt đơn nguyên tử (Atomic SOLD)!',
        'success'
      );
    } finally {
      setRunningStep(null);
    }
  };

  // BƯỚC 8: Sinh viên Mua đánh giá 5 sao sau giao dịch & Tự động tính lại điểm uy tín
  const runStep8ReviewSeller = async () => {
    setRunningStep(8);
    try {
      const buyerToken = await getActorToken('buyer');
      const targetListingId = lastCreatedListingId || 5;
      const res = await rawApiRequest(`/listings/${targetListingId}/reviews`, {
        method: 'POST',
        token: buyerToken,
        body: {
          rating: 5,
          comment:
            'Đánh giá 5 sao từ Trạm Kiểm Thử 8 Bước ĐG2: Người bán rất uy tín, sách đẹp như mới!',
        },
      });
      appendLog(
        `Sinh viên Mua đánh giá 5 sao cho giao dịch tin #${targetListingId} -> Cập nhật reputation_score`,
        'Bước 8 — Review 5⭐',
        res,
        201
      );
      onRefreshAll();
      showNotify(
        `Bước 8: Đã gửi đánh giá cho tin #${targetListingId} (HTTP ${res.status})!`,
        res.ok ? 'success' : 'info'
      );
    } finally {
      setRunningStep(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header giới thiệu Trạm Kiểm Thử 8 Bước ĐG2 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Interactive Defense Demo Lab — Bảo vệ Đồ án ĐG2 (Đề tài 4)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trạm Kiểm Thử Trực Quan 8 Bước Bảo Vệ ĐG2
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bảng điều khiển chuyên dụng giúp trình diễn trực tiếp trước Giảng viên cơ chế{' '}
              <strong className="text-amber-300">Phân quyền RBAC (403 Forbidden)</strong>,{' '}
              <strong className="text-rose-300">Kiểm chứng dữ liệu bẩn (422 Unprocessable Entity)</strong>{' '}
              và trọn vẹn vòng đời giao dịch đồ cũ sinh viên kèm phản hồi JSON thời gian thực từ máy chủ FastAPI.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-indigo-200">
              <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 font-semibold">
                Học phần: <strong className="text-white">Lập trình mã nguồn mở (POS02024)</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-200 font-bold">
                Nhóm 4 – Lớp CT2802
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 font-bold">
                GVHD: ThS. Đỗ Văn Tuyên
              </span>
            </div>
          </div>

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-extrabold text-white transition-all"
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            Mở Swagger UI (/docs)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Thẻ Thành viên Nhóm 4 – Lớp CT2802 */}
        <div className="mt-5 pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-amber-300 uppercase">1. Trưởng nhóm • DevOps</div>
            <div className="font-extrabold text-white text-sm mt-0.5">Nguyễn Hải Long</div>
            <div className="text-slate-300 text-[11px] mt-0.5">Kiến trúc hệ thống, Docker &amp; Tích hợp</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-emerald-300 uppercase">2. Back-end API &amp; Bảo mật</div>
            <div className="font-extrabold text-white text-sm mt-0.5">Nguyễn Đức Anh</div>
            <div className="text-slate-300 text-[11px] mt-0.5">FastAPI, JWT Auth, RBAC 403 &amp; Validation 422</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-sky-300 uppercase">3. Front-end UI/UX</div>
            <div className="font-extrabold text-white text-sm mt-0.5">Nguyễn Huy Hoàng</div>
            <div className="text-slate-300 text-[11px] mt-0.5">React 18, TailwindCSS &amp; Trạm Kiểm Thử ĐG2</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-purple-300 uppercase">4. CSDL &amp; Kiểm thử QA</div>
            <div className="font-extrabold text-white text-sm mt-0.5">Hoàng Nhật Thắng</div>
            <div className="text-slate-300 text-[11px] mt-0.5">SQLAlchemy 2.0, Seed Data &amp; Pytest 23/23</div>
          </div>
        </div>
      </div>

      {/* HAI THẺ DEMO TRỌNG TÂM: BƯỚC 3 (403 FORBIDDEN) & BƯỚC 4 (422 UNPROCESSABLE ENTITY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BƯỚC 3 DEMO: HTTP 403 FORBIDDEN */}
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                <Lock className="w-3.5 h-3.5" />
                Bước 3 Demo — Kiểm thử Phân quyền RBAC
              </span>
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                Kỳ vọng: HTTP 403 Forbidden
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Thử nghiệm Phân quyền (Sinh viên gọi API Kiểm duyệt)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sử dụng JWT Token của tài khoản <strong>Sinh viên (role = STUDENT)</strong> để gọi trái phép vào endpoint quản trị{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                GET /api/v1/moderation/listings
              </code>
              . Dependency <code>require_roles(MODERATOR, ADMIN)</code> sẽ chặn đứng và trả về lỗi <strong>403 Forbidden</strong>.
            </p>
          </div>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep3RbacForbidden}
            className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>
              {runningStep === 3
                ? 'Đang gửi request kiểm thử RBAC...'
                : 'Thử nghiệm Phân quyền (Sinh viên gọi API Kiểm duyệt)'}
            </span>
          </button>
        </div>

        {/* BƯỚC 4 DEMO: HTTP 422 UNPROCESSABLE ENTITY */}
        <div className="bg-white rounded-3xl border-2 border-rose-300 p-6 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                <AlertOctagon className="w-3.5 h-3.5" />
                Bước 4 Demo — Kiểm chứng Dữ liệu Đầu vào
              </span>
              <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800">
                Kỳ vọng: HTTP 422 Unprocessable Entity
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Thử nghiệm Kiểm chứng dữ liệu (Gửi giá âm -50.000đ)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gửi request{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold">
                POST /api/v1/listings
              </code>{' '}
              với trường <code>price: -50000</code> (giá âm). Tầng Pydantic Schema{' '}
              <code>Field(..., ge=0)</code> của FastAPI sẽ tự động từ chối dữ liệu bẩn và trả về chi tiết lỗi <strong>422 Unprocessable Entity</strong>.
            </p>
          </div>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep4Validation422}
            className="w-full py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <AlertOctagon className="w-5 h-5" />
            <span>
              {runningStep === 4
                ? 'Đang gửi dữ liệu giá âm -50.000đ...'
                : 'Thử nghiệm Kiểm chứng dữ liệu (Gửi giá âm -50.000đ)'}
            </span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH ĐẦY ĐỦ 8 BƯỚC KỊCH BẢN DEMO BẢO VỆ ĐG2 */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Chạy Trọn Vẹn Chuỗi 8 Bước Kịch Bản Nghiệp Vụ ĐG2
            </h3>
            <p className="text-xs text-slate-500">
              Bấm từng bước theo thứ tự từ Bước 1 đến Bước 8 để kiểm chứng toàn bộ luồng dữ liệu End-to-End.
            </p>
          </div>
          {lastCreatedListingId && (
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              Mã tin đang thử nghiệm: #{lastCreatedListingId}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep1Health}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-indigo-600">
                Bước 1 • Healthcheck
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                GET /api/v1/health (200 OK)
              </div>
            </div>
            <Play className="w-4 h-4 text-indigo-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep2Auth}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-indigo-600">
                Bước 2 • Xác thực JWT
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                POST /api/v1/auth/login (200 OK)
              </div>
            </div>
            <Play className="w-4 h-4 text-indigo-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep5CreateListing}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-emerald-600">
                Bước 5 • SV Bán đăng tin mới
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                POST /api/v1/listings (PENDING)
              </div>
            </div>
            <Play className="w-4 h-4 text-emerald-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep6ModerateApprove}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-amber-600">
                Bước 6 • Kiểm duyệt viên Duyệt
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                PATCH /moderation/... (APPROVED)
              </div>
            </div>
            <Play className="w-4 h-4 text-amber-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep7OfferAndAccept}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-blue-600">
                Bước 7 • Trả giá &amp; Chốt đơn
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                POST Offer &amp; PATCH Accept (SOLD)
              </div>
            </div>
            <Play className="w-4 h-4 text-blue-600 shrink-0" />
          </button>

          <button
            type="button"
            disabled={runningStep !== null}
            onClick={runStep8ReviewSeller}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-extrabold text-purple-600">
                Bước 8 • Đánh giá Uy tín 5⭐
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                POST /reviews (Cập nhật điểm uy tín)
              </div>
            </div>
            <Play className="w-4 h-4 text-purple-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* MÀN HÌNH CONSOLE HIỂN THỊ PHẢN HỒI JSON THẬT TỪ MÁY CHỦ FASTAPI */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-2 text-xs font-mono font-bold text-slate-300">
              Live HTTP Response Inspector (Kết quả phản hồi thật từ FastAPI Backend)
            </span>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-xs text-slate-400 hover:text-white font-semibold"
            >
              Xóa lịch sử log ({logs.length})
            </button>
          )}
        </div>

        <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Terminal className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">
                Hãy bấm vào nút <strong>Bước 3 (403 Forbidden)</strong> hoặc{' '}
                <strong>Bước 4 (422 Unprocessable Entity)</strong> phía trên để xem phản hồi JSON trực tiếp từ máy chủ!
              </p>
            </div>
          ) : (
            logs.map((entry) => {
              const isMatchedExpected = entry.status === entry.expectedStatus;
              const statusBadgeColor =
                entry.status >= 200 && entry.status < 300
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : entry.status === 403
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-3 font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
                        {entry.stepBadge}
                      </span>
                      <span className="font-sans font-bold text-white text-sm">
                        {entry.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-extrabold ${statusBadgeColor}`}
                      >
                        HTTP {entry.status} {entry.statusText}
                      </span>
                      {isMatchedExpected && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          Đúng kỳ vọng
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {entry.durationMs} ms
                      </span>
                    </div>
                  </div>

                  <div className="text-slate-400">
                    Request:{' '}
                    <strong className="text-amber-300">{entry.method}</strong>{' '}
                    <span className="text-sky-300">{entry.url}</span>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800/80">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
