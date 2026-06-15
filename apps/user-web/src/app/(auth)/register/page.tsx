"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { getErrorMessage, registerUser } from "@/infra/user/userApi";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        ...(displayName ? { displayName } : {}),
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
    <AuthFrame eyebrow="User auth" title="Tạo tài khoản học tập" subtitle="">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
          Tên hiển thị
          <input
            className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
            name="displayName"
            maxLength={120}
            autoComplete="name"
            placeholder="Tên bạn muốn hiện trong app"
          />
        </label>
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
            autoComplete="new-password"
            placeholder="Tối thiểu 12 ký tự"
          />
        </label>
        {error ? (
          <p className="k-b2 bg-neo-red-soft px-4 py-3 text-sm font-black">{error}</p>
        ) : null}
        <button className="k-btn k-btn--primary" disabled={loading} type="submit">
          {loading ? "Đang tạo tài khoản" : "Đăng ký"}
        </button>
        <p className="text-sm font-bold">
          Đã có tài khoản?{" "}
          <Link className="underline" href="/login">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
