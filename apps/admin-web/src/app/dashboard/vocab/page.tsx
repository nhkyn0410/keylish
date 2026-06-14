"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DashboardSection } from "@/components/dashboard-section";
import {
  createWord,
  deleteWord,
  getErrorMessage,
  listTopics,
  listVocab,
  updateWord,
  type AdminTopic,
  type AdminVocab,
  type AdminVocabInput,
  type CefrLevel,
} from "@/infra/admin/adminApi";

const LEVEL_OPTIONS: { label: CefrLevel; value: CefrLevel }[] = [
  { label: "A1", value: "A1" },
  { label: "A2", value: "A2" },
  { label: "B1", value: "B1" },
  { label: "B2", value: "B2" },
  { label: "C1", value: "C1" },
  { label: "C2", value: "C2" },
];

type VocabForm = {
  en: string;
  vi: string;
  level?: CefrLevel;
  frequency?: number;
  pos?: string;
  ipa?: string;
  example?: string;
  source?: string;
  topicId?: string;
};

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toVocabInput(values: VocabForm): AdminVocabInput {
  return {
    en: values.en.trim(),
    vi: values.vi.trim(),
    level: values.level ?? null,
    frequency: values.frequency ?? 0,
    pos: cleanOptional(values.pos),
    ipa: cleanOptional(values.ipa),
    example: cleanOptional(values.example),
    source: values.source?.trim() || "admin",
    topicId: values.topicId || null,
  };
}

export default function VocabPage() {
  const [form] = Form.useForm<VocabForm>();
  const [messageApi, contextHolder] = message.useMessage();
  const [items, setItems] = useState<AdminVocab[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<string | undefined>();
  const [level, setLevel] = useState<CefrLevel | undefined>();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVocab | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      const result = await listTopics({ page: 1, pageSize: 100 });
      setTopics(result.items);
    } catch (err) {
      messageApi.error(getErrorMessage(err));
    }
  }, [messageApi]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listVocab({ search, topicId, level, page, pageSize });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      messageApi.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [level, messageApi, page, pageSize, search, topicId]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ frequency: 0, source: "admin" });
    setModalOpen(true);
  }

  function openEdit(word: AdminVocab) {
    setEditing(word);
    form.setFieldsValue({
      en: word.en,
      vi: word.vi,
      level: word.level ?? undefined,
      frequency: word.frequency,
      pos: word.pos ?? undefined,
      ipa: word.ipa ?? undefined,
      example: word.example ?? undefined,
      source: word.source,
      topicId: word.topic?.id,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload = toVocabInput(values);
    setLoading(true);
    try {
      if (editing) {
        await updateWord(editing.id, payload);
        messageApi.success("Word updated");
      } else {
        await createWord(payload);
        messageApi.success("Word created");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      messageApi.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleDelete(word: AdminVocab) {
    setLoading(true);
    try {
      await deleteWord(word.id);
      messageApi.success("Word deleted");
      await load();
    } catch (err) {
      messageApi.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  const columns: ColumnsType<AdminVocab> = [
    { title: "Word", dataIndex: "en", ellipsis: true },
    { title: "Meaning", dataIndex: "vi", ellipsis: true },
    {
      title: "Level",
      dataIndex: "level",
      render: (value: CefrLevel | null) => (value ? <Tag color="geekblue">{value}</Tag> : "-"),
    },
    {
      title: "Topic",
      dataIndex: "topic",
      render: (value: AdminVocab["topic"]) => value?.title ?? "-",
    },
    { title: "Frequency", dataIndex: "frequency", width: 112 },
    {
      title: "Actions",
      key: "actions",
      width: 156,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete word?" onConfirm={() => void handleDelete(record)}>
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
      description="Vocabulary records ready for review and editing."
      title="Vocab"
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search word or meaning"
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            options={topics.map((topic) => ({ label: topic.title, value: topic.id }))}
            placeholder="Topic"
            showSearch
            optionFilterProp="label"
            value={topicId}
            onChange={(value) => {
              setTopicId(value);
              setPage(1);
            }}
            style={{ width: 220 }}
          />
          <Select
            allowClear
            options={LEVEL_OPTIONS}
            placeholder="Level"
            value={level}
            onChange={(value) => {
              setLevel(value);
              setPage(1);
            }}
            style={{ width: 120 }}
          />
          <Button type="primary" onClick={openCreate}>
            New word
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
        title={editing ? "Edit word" : "New word"}
        width={760}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleSubmit()}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="admin-form-grid">
            <Form.Item
              label="Word"
              name="en"
              rules={[{ required: true, message: "Enter the word." }]}
            >
              <Input placeholder="routine" />
            </Form.Item>
            <Form.Item
              label="Meaning"
              name="vi"
              rules={[{ required: true, message: "Enter the meaning." }]}
            >
              <Input placeholder="thói quen" />
            </Form.Item>
            <Form.Item label="Level" name="level">
              <Select allowClear options={LEVEL_OPTIONS} placeholder="CEFR" />
            </Form.Item>
            <Form.Item label="Topic" name="topicId">
              <Select
                allowClear
                options={topics.map((topic) => ({ label: topic.title, value: topic.id }))}
                placeholder="No topic"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="Frequency" name="frequency">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Part of speech" name="pos">
              <Input placeholder="noun" />
            </Form.Item>
            <Form.Item label="IPA" name="ipa">
              <Input placeholder="/ˈruːtiːn/" />
            </Form.Item>
            <Form.Item label="Source" name="source">
              <Input placeholder="admin" />
            </Form.Item>
          </div>
          <Form.Item label="Example" name="example">
            <Input.TextArea maxLength={500} rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </DashboardSection>
  );
}
