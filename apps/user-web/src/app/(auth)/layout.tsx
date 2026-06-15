import { ApiWarmer } from "@/components/layout/ApiWarmer";
import { AppShell } from "@/components/layout/AppShell";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ApiWarmer />
      <AppShell>{children}</AppShell>
    </>
  );
}
