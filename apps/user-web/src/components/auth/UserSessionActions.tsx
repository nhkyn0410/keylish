"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchUserProfile,
  getErrorMessage,
  logoutUser,
  type UserProfile,
} from "@/infra/user/userApi";
import { Icon } from "@/components/vocab/typing/primitives";

export function UserSessionActions() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchUserProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setError(null);
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

  async function handleLogout() {
    setLoading(true);
    try {
      await logoutUser();
      setProfile(null);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading && !profile) {
    return (
      <div className="k-side-auth">
        <span className="k-badge k-badge--white">Đang kiểm tra</span>
      </div>
    );
  }

  if (profile) {
    const label = profile.displayName || profile.email;
    return (
      <div className="k-side-auth">
        <div className="k-badge k-badge--white truncate" title={label}>
          {label}
        </div>
        <Link href="/settings/account" className="k-btn k-btn--sm">
          <span className="k-side-label">Tài khoản</span>
        </Link>
        <button
          className="k-btn k-btn--sm k-btn--primary"
          disabled={loading}
          onClick={handleLogout}
        >
          <span className="k-side-label">Đăng xuất</span>
        </button>
        {error ? <span className="text-xs font-black text-neo-red">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="k-side-auth">
      <Link href="/login" className="k-btn k-btn--sm">
        <span className="k-side-label">Đăng nhập</span>
      </Link>
      <Link href="/register" className="k-btn k-btn--sm k-btn--primary">
        <span className="k-side-label">Đăng ký</span> <Icon name="arrow" size={16} />
      </Link>
      {error ? <span className="text-xs font-black text-neo-red">{error}</span> : null}
    </div>
  );
}
