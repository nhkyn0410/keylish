"use client";

import { Card, Table, Tag } from "antd";

import type { ColumnsType } from "antd/es/table";

import { DashboardSection } from "@/components/dashboard-section";

type VocabRow = {
  key: string;

  word: string;

  meaning: string;

  topic: string;

  level: string;

  updatedAt: string;
};

const vocab: VocabRow[] = [
  {
    key: "v1",

    word: "routine",

    meaning: "th?i quen, n?p sinh ho?t",

    topic: "Daily routines",

    level: "A1",

    updatedAt: "2026-06-12",
  },

  {
    key: "v2",

    word: "meeting",

    meaning: "cu?c h?p",

    topic: "Workplace basics",

    level: "A2",

    updatedAt: "2026-06-11",
  },

  {
    key: "v3",

    word: "itinerary",

    meaning: "l?ch tr?nh chuy?n ?i",

    topic: "Travel essentials",

    level: "B1",

    updatedAt: "2026-06-09",
  },
];

const columns: ColumnsType<VocabRow> = [
  { title: "Word", dataIndex: "word" },

  { title: "Meaning", dataIndex: "meaning" },

  { title: "Topic", dataIndex: "topic" },

  {
    title: "Level",

    dataIndex: "level",

    render: (level: string) => <Tag color="geekblue">{level}</Tag>,
  },

  { title: "Updated", dataIndex: "updatedAt" },
];

export default function VocabPage() {
  return (
    <DashboardSection description="Vocabulary records ready for review and editing." title="Vocab">
      <Card className="admin-table-card" bordered={false}>
        <Table columns={columns} dataSource={vocab} pagination={false} rowKey="key" />
      </Card>
    </DashboardSection>
  );
}
