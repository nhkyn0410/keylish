"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  changeUserPassword,
  fetchUserProfile,
  getErrorMessage,
  logoutUser,
  updateUserProfile,
  type UserProfile,
} from "@/infra/user/userApi";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchUserProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const avatarUrl = String(form.get("avatarUrl") ?? "").trim();
      const updated = await updateUserProfile({
        displayName: String(form.get("displayName") ?? "").trim(),
        avatarUrl: avatarUrl ? avatarUrl : null,
      });
      setProfile(updated);
      setMessage("Đã cập nhật hồ sơ.");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await changeUserPassword({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword: String(form.get("newPassword") ?? ""),
      });
      router.replace("/login");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setSaving(true);
    try {
      await logoutUser();
      setProfile(null);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="k-site-wrap py-10 text-lg font-black">Đang tải tài khoản...</main>;
  }

  if (!profile) {
    return (
      <main className="k-site-wrap py-10">
        <div className="k-card bg-neo-white p-6">
          <h1 className="text-4xl tracking-normal">Bạn chưa đăng nhập</h1>
          <p className="mt-3 font-bold text-neo-ink/70">
            Đăng nhập để xem và cập nhật hồ sơ học tập.
          </p>
          <Link className="k-btn k-btn--primary mt-6 inline-flex" href="/login">
            Đăng nhập
          </Link>
          {error ? <p className="mt-4 text-sm font-black text-neo-red">{error}</p> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="k-site-wrap py-10">
      <div className="mb-6">
        <div className="k-badge k-badge--violet mb-4">Tài khoản</div>
        <h1 className="text-5xl tracking-normal">Hồ sơ học tập</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form className="k-card grid gap-4 bg-neo-white p-6" onSubmit={handleProfileSubmit}>
          <h2 className="text-2xl tracking-normal">Thông tin hiển thị</h2>
          <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
            Email
            <input
              className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none opacity-70"
              value={profile.email}
              readOnly
            />
          </label>
          <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
            Tên hiển thị
            <input
              className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
              name="displayName"
              maxLength={120}
              defaultValue={profile.displayName ?? ""}
            />
          </label>
          <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
            Avatar URL
            <input
              className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
              name="avatarUrl"
              type="url"
              maxLength={512}
              defaultValue={profile.avatarUrl ?? ""}
              placeholder="https://..."
            />
          </label>
          <button className="k-btn k-btn--primary" disabled={saving} type="submit">
            Lưu hồ sơ
          </button>
        </form>

        <form className="k-card grid gap-4 bg-neo-white p-6" onSubmit={handlePasswordSubmit}>
          <h2 className="text-2xl tracking-normal">Đổi mật khẩu</h2>
          <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
            Mật khẩu hiện tại
            <input
              className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
              name="currentPassword"
              required
              minLength={12}
              maxLength={128}
              type="password"
              autoComplete="current-password"
            />
          </label>
          <label className="grid gap-2 text-sm font-black uppercase tracking-normal">
            Mật khẩu mới
            <input
              className="k-b2 bg-neo-white px-4 py-3 text-base font-bold normal-case outline-none"
              name="newPassword"
              required
              minLength={12}
              maxLength={128}
              type="password"
              autoComplete="new-password"
            />
          </label>
          <button className="k-btn" disabled={saving} type="submit">
            Đổi mật khẩu
          </button>
          <button
            className="k-btn k-btn--primary"
            disabled={saving}
            type="button"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </form>
      </div>

      {message ? (
        <p className="k-b2 mt-5 bg-neo-green-soft px-4 py-3 text-sm font-black">{message}</p>
      ) : null}
      {error ? (
        <p className="k-b2 mt-5 bg-neo-red-soft px-4 py-3 text-sm font-black">{error}</p>
      ) : null}
    </main>
  );
}
