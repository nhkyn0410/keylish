"use client";

import type { ReactNode } from "react";

import { Space, Typography } from "antd";

type DashboardSectionProps = {
  title: string;

  description: string;

  extra?: ReactNode;

  children: ReactNode;
};

export function DashboardSection({ title, description, extra, children }: DashboardSectionProps) {
  return (
    <Space className="admin-section" direction="vertical" size={16}>
      <div className="admin-section__header">
        <Space direction="vertical" size={4}>
          <Typography.Title className="admin-section__title" level={3}>
            {title}
          </Typography.Title>

          <Typography.Text className="admin-section__description">{description}</Typography.Text>
        </Space>

        {extra}
      </div>

      {children}
    </Space>
  );
}
