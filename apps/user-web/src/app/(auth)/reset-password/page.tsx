"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { getErrorMessage, resetPassword } from "@/infra/user/userApi";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await resetPassword(String(form.get("token") ?? ""), String(form.get("password") ?? ""));
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Password reset"
      title="Đặt mật khẩu mới"
      subtitle="Reset thành công sẽ revoke toàn bộ session user hiện có. Bạn đăng nhập lại bằng mật khẩu mới."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
          Token reset
          <textarea
            className="k-b2 min-h-28 resize-y bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
            name="token"
            required
            placeholder="Dán token reset"
          />
        </label>
        <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
          Mật khẩu mới
          <input
            className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
            name="password"
            required
            minLength={12}
            maxLength={128}
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 12 ký tự"
          />
        </label>
        {error ? (
          <p className="k-b2 bg-neo-red-soft px-4 py-3 text-sm font-black">{error}</p>
        ) : null}
        <button className="k-btn k-btn--primary" disabled={loading} type="submit">
          {loading ? "Đang reset" : "Đổi mật khẩu"}
        </button>
        <Link className="text-sm font-bold underline" href="/login">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthFrame>
  );
}
