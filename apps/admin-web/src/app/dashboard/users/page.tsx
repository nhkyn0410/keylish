"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Card, Input, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DashboardSection } from "@/components/dashboard-section";
import {
  getErrorMessage,
  listUsers,
  updateUserStatus,
  type AdminUser,
  type UserStatus,
} from "@/infra/admin/adminApi";

const STATUS_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "DISABLED", value: "DISABLED" },
  { label: "DELETED", value: "DELETED" },
];

function statusColor(status: UserStatus) {
  if (status === "ACTIVE") return "green";
  if (status === "DISABLED") return "volcano";
  return "default";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function UsersPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listUsers({ search, status, page, pageSize });
      setItems(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(user: AdminUser, nextStatus: UserStatus) {
    setLoading(true);
    try {
      await updateUserStatus(user.id, nextStatus);
      messageApi.success("User status updated");
      await load();
    } catch (err) {
      messageApi.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  const columns = useMemo<ColumnsType<AdminUser>>(
    () => [
      { title: "Email", dataIndex: "email", ellipsis: true },
      {
        title: "Display name",
        dataIndex: "displayName",
        render: (value: string | null) => value || "-",
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (value: UserStatus, record) => (
          <Select
            aria-label="User status"
            options={STATUS_OPTIONS}
            size="small"
            value={value}
            onChange={(nextStatus) => void handleStatusChange(record, nextStatus)}
            style={{ minWidth: 128 }}
          />
        ),
      },
      {
        title: "State",
        dataIndex: "status",
        render: (value: UserStatus) => <Tag color={statusColor(value)}>{value}</Tag>,
      },
      { title: "Created", dataIndex: "createdAt", render: formatDate },
      { title: "Updated", dataIndex: "updatedAt", render: formatDate },
    ],
    []
  );

  return (
    <DashboardSection
      description="Learner accounts and their current state."
      title="Users"
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search email or display name"
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            options={STATUS_OPTIONS}
            placeholder="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            style={{ width: 160 }}
          />
        </Space>
      }
    >
      {contextHolder}
      {error ? <Alert showIcon title={error} type="error" /> : null}
      <Card className="admin-table-card" variant="borderless">
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          rowKey="id"
        />
      </Card>
    </DashboardSection>
  );
}
