"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { forgotPassword, getErrorMessage } from "@/infra/user/userApi";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetToken(null);
    try {
      const result = await forgotPassword(String(form.get("email") ?? ""));
      setMessage("Nếu tài khoản tồn tại, hướng dẫn reset sẽ được gửi theo kênh đã cấu hình.");
      if (result.token) setResetToken(result.token);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Password reset"
      title="Lấy lại quyền truy cập"
      subtitle="API luôn trả lời chung để không tiết lộ email có tồn tại hay không. Token chỉ hiện nếu bật env dev AUTH_EXPOSE_RESET_TOKEN."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
          Email
          <input
            className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
            name="email"
            required
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
          />
        </label>
        {message ? (
          <p className="k-b2 bg-neo-green-soft px-4 py-3 text-sm font-black">{message}</p>
        ) : null}
        {resetToken ? (
          <div className="k-b2 bg-neo-yellow-soft px-4 py-3 text-sm font-bold">
            <p className="font-black">Dev reset token</p>
            <code className="break-all">{resetToken}</code>
            <Link className="mt-3 inline-block underline" href="/reset-password">
              Đi tới reset mật khẩu
            </Link>
          </div>
        ) : null}
        {error ? (
          <p className="k-b2 bg-neo-red-soft px-4 py-3 text-sm font-black">{error}</p>
        ) : null}
        <button className="k-btn k-btn--primary" disabled={loading} type="submit">
          {loading ? "Đang gửi" : "Gửi yêu cầu reset"}
        </button>
        <Link className="text-sm font-bold underline" href="/login">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthFrame>
  );
}
