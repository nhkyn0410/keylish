"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { getErrorMessage, loginUser } from "@/infra/user/userApi";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await loginUser({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="User auth"
      title="Đăng nhập để giữ phiên luyện"
      subtitle="Session được lưu bằng cookie HttpOnly từ API. KeyLish không lưu auth token trong localStorage hoặc sessionStorage."
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
        <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
          Mật khẩu
          <input
            className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
            name="password"
            required
            minLength={12}
            maxLength={128}
            type="password"
            autoComplete="current-password"
            placeholder="Tối thiểu 12 ký tự"
          />
        </label>
        {error ? (
          <p className="k-b2 bg-neo-red-soft px-4 py-3 text-sm font-black">{error}</p>
        ) : null}
        <button className="k-btn k-btn--primary" disabled={loading} type="submit">
          {loading ? "Đang đăng nhập" : "Đăng nhập"}
        </button>
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <Link className="underline" href="/register">
            Tạo tài khoản
          </Link>
          <Link className="underline" href="/forgot-password">
            Quên mật khẩu
          </Link>
        </div>
      </form>
    </AuthFrame>
  );
}
