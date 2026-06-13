"use client";

import type { ReactNode } from "react";
import { ConfigProvider, theme } from "antd";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 8,
          colorPrimary: "#0f766e",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
