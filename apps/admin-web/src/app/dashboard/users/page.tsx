"use client";

import { Card, Table, Tag } from "antd";

import type { ColumnsType } from "antd/es/table";

import { DashboardSection } from "@/components/dashboard-section";

type UserRow = {
  key: string;

  email: string;

  displayName: string;

  status: "ACTIVE" | "DISABLED";

  createdAt: string;

  updatedAt: string;
};

const users: UserRow[] = [
  {
    key: "u1",

    email: "linh@example.com",

    displayName: "Linh Nguyen",

    status: "ACTIVE",

    createdAt: "2026-06-11",

    updatedAt: "2026-06-13",
  },

  {
    key: "u2",

    email: "quang@example.com",

    displayName: "Quang Le",

    status: "ACTIVE",

    createdAt: "2026-06-09",

    updatedAt: "2026-06-12",
  },

  {
    key: "u3",

    email: "mai@example.com",

    displayName: "Mai Tran",

    status: "DISABLED",

    createdAt: "2026-05-30",

    updatedAt: "2026-06-10",
  },
];

const columns: ColumnsType<UserRow> = [
  { title: "Email", dataIndex: "email" },

  { title: "Display name", dataIndex: "displayName" },

  {
    title: "Status",

    dataIndex: "status",

    render: (status: UserRow["status"]) => (
      <Tag color={status === "ACTIVE" ? "green" : "volcano"}>{status}</Tag>
    ),
  },

  { title: "Created", dataIndex: "createdAt" },

  { title: "Updated", dataIndex: "updatedAt" },
];

export default function UsersPage() {
  return (
    <DashboardSection description="Learner accounts and their current state." title="Users">
      <Card className="admin-table-card" bordered={false}>
        <Table columns={columns} dataSource={users} pagination={false} rowKey="key" />
      </Card>
    </DashboardSection>
  );
}
