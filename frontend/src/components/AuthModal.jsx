import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DEMO_ACCOUNTS, apiRequest } from '../api';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  onQuickDemoLogin,
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState(
    'Trường ĐH Quản lý và Công nghệ Hải Phòng (HPU)'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: { email: email.trim(), password },
        });
        onAuthSuccess(res, 'Đăng nhập thành công!');
        onClose();
      } else {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: {
            email: email.trim(),
            password,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            university: university.trim() || null,
          },
        });
        onAuthSuccess(
          res,
          'Đăng ký tài khoản Sinh viên mới thành công! (Vai trò mặc định: STUDENT)'
        );
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">
              {mode === 'login'
                ? 'Đăng nhập Chợ Đồ Cũ Sinh Viên'
                : 'Đăng ký Tài khoản Sinh viên Mới'}
            </h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              Xác thực bảo mật bằng JWT (HS256) &amp; mật khẩu băm Bcrypt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Khu vực 1-Click Demo Login nhanh */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Đăng nhập nhanh 1-Click (Dành cho Giảng viên &amp; Bảo vệ ĐG2):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.key}
                  type="button"
                  onClick={async () => {
                    await onQuickDemoLogin(acc);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:shadow-sm ${acc.lightColor}`}
                >
                  <div className="text-xs font-bold">{acc.label}</div>
                  <div className="text-[11px] opacity-80 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chuyển đổi tab Đăng nhập / Đăng ký */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký tài khoản mới
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên sinh viên *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Phạm Minh Tuấn - Khoa CNTT"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0988123456"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trường đại học
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email sinh viên *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sinhvien@sv.edu.vn"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu * {mode === 'register' && '(Tối thiểu 6 ký tự)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={mode === 'register' ? 6 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất Đăng ký'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
