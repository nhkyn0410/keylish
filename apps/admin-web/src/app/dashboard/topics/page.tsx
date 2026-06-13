"use client";

import { Card, Table, Tag } from "antd";

import type { ColumnsType } from "antd/es/table";

import { DashboardSection } from "@/components/dashboard-section";

type TopicRow = {
  key: string;

  name: string;

  level: string;

  vocabCount: number;

  updatedAt: string;
};

const topics: TopicRow[] = [
  { key: "t1", name: "Daily routines", level: "A1", vocabCount: 48, updatedAt: "2026-06-12" },

  { key: "t2", name: "Workplace basics", level: "A2", vocabCount: 56, updatedAt: "2026-06-11" },

  { key: "t3", name: "Travel essentials", level: "B1", vocabCount: 64, updatedAt: "2026-06-08" },
];

const columns: ColumnsType<TopicRow> = [
  { title: "Topic", dataIndex: "name" },

  {
    title: "Level",

    dataIndex: "level",

    render: (level: string) => <Tag color="blue">{level}</Tag>,
  },

  { title: "Vocab", dataIndex: "vocabCount" },

  { title: "Updated", dataIndex: "updatedAt" },
];

export default function TopicsPage() {
  return (
    <DashboardSection description="Curated topic groups for the learner workflow." title="Topics">
      <Card className="admin-table-card" bordered={false}>
        <Table columns={columns} dataSource={topics} pagination={false} rowKey="key" />
      </Card>
    </DashboardSection>
  );
}
