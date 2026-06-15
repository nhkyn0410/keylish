"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DashboardSection } from "@/components/dashboard-section";
import {
  createTopic,
  deleteTopic,
  getErrorMessage,
  listTopics,
  updateTopic,
  type AdminTopic,
} from "@/infra/admin/adminApi";

type TopicForm = {
  slug: string;
  title: string;
};

export default function TopicsPage() {
  const [form] = Form.useForm<TopicForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const [items, setItems] = useState<AdminTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTopic | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listTopics({ search, page, pageSize });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      messageApi.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [messageApi, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(topic: AdminTopic) {
    setEditing(topic);
    form.setFieldsValue({ slug: topic.slug, title: topic.title });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (editing) {
        await updateTopic(editing.id, values);
        messageApi.success("Topic updated");
      } else {
        await createTopic(values);
        messageApi.success("Topic created");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      messageApi.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleDelete(topic: AdminTopic) {
    setLoading(true);
    try {
      await deleteTopic(topic.id);
      messageApi.success("Topic deleted");
      await load();
    } catch (err) {
      messageApi.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  const columns: ColumnsType<AdminTopic> = [
    { title: "Slug", dataIndex: "slug", ellipsis: true },
    { title: "Title", dataIndex: "title", ellipsis: true },
    { title: "Words", dataIndex: "count", render: (value: number | undefined) => value ?? 0 },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete topic?"
            description="Only empty topics can be deleted."
            onConfirm={() => void handleDelete(record)}
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DashboardSection
      description="Curated topic groups for the learner workflow."
      title="Topics"
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search slug or title"
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={openCreate}>
            New topic
          </Button>
        </Space>
      }
    >
      {contextHolder}
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

      <Modal
        destroyOnHidden
        okText={editing ? "Save" : "Create"}
        open={modalOpen}
        title={editing ? "Edit topic" : "New topic"}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleSubmit()}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, min: 2, max: 80, message: "Enter a slug." }]}
          >
            <Input placeholder="daily-routines" />
          </Form.Item>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, min: 2, max: 120, message: "Enter a title." }]}
          >
            <Input placeholder="Daily routines" />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardSection>
  );
}
