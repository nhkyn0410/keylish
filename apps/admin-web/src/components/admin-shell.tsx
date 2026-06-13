"use client";

import {
  BookOutlined,
  DashboardOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "overview",
    label: "Overview",
    path: "/dashboard/overview",
    icon: <DashboardOutlined />,
  },
  {
    key: "users",
    label: "Users",
    path: "/dashboard/users",
    icon: <UserOutlined />,
  },
  {
    key: "topics",
    label: "Topics",
    path: "/dashboard/topics",
    icon: <ReadOutlined />,
  },
  {
    key: "vocab",
    label: "Vocab",
    path: "/dashboard/vocab",
    icon: <BookOutlined />,
  },
  {
    key: "analytics",
    label: "Analytics",
    path: "/dashboard/analytics",
    icon: <LineChartOutlined />,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeItem =
    NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(item.path + "/")) ??
    NAV_ITEMS[0];

  const menuItems: MenuProps["items"] = NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  return (
    <Layout className="admin-shell">
      <Layout.Sider
        breakpoint="lg"
        className="admin-shell__sider"
        collapsed={collapsed}
        collapsedWidth={80}
        onCollapse={setCollapsed}
        trigger={null}
        width={248}
      >
        <div className="admin-shell__brand">
          <div className="admin-shell__mark">KL</div>
          {!collapsed ? (
            <Space direction="vertical" size={0}>
              <Typography.Text className="admin-shell__brand-title">KeyLish</Typography.Text>
              <Typography.Text className="admin-shell__brand-subtitle">Admin panel</Typography.Text>
            </Space>
          ) : null}
        </div>

        <Menu
          className="admin-shell__menu"
          inlineCollapsed={collapsed}
          mode="inline"
          onClick={({ key }) => {
            const item = NAV_ITEMS.find((entry) => entry.key === key);
            if (item) {
              router.push(item.path);
            }
          }}
          selectedKeys={[activeItem.key]}
          theme="dark"
          items={menuItems}
        />
      </Layout.Sider>

      <Layout className="admin-shell__main">
        <header className="admin-shell__header">
          <Space className="admin-shell__toolbar" size={12}>
            <Button
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
            <Space direction="vertical" size={0}>
              <Typography.Text type="secondary">Dashboard</Typography.Text>
              <Typography.Title className="admin-shell__heading" level={4}>
                {activeItem.label}
              </Typography.Title>
            </Space>
          </Space>

          <Button icon={<LogoutOutlined />} onClick={() => router.push("/")}>
            Sign out
          </Button>
        </header>

        <Layout.Content className="admin-shell__content">{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
