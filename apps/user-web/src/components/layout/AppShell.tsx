import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/**
 * Khung ứng dụng: sidebar dọc (variant D) cố định bên trái + vùng nội dung cuộn
 * bên phải. Dùng cho mọi màn "shell" (trang chủ, thiết lập, tổng kết…). Màn đang
 * gõ (focus zone) KHÔNG bọc trong khung này — xem PlayFlow.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="k-shell">
      <Sidebar />
      <main className="k-shell-main">{children}</main>
    </div>
  );
}
