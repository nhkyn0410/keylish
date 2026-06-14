"use client";

import { Card, Col, Row, Table, Tag, Typography } from "antd";

import type { ColumnsType } from "antd/es/table";

import { DashboardSection } from "@/components/dashboard-section";

type TrafficRow = {
  key: string;

  source: string;

  views: string;

  users: string;

  share: string;
};

const trafficSources: TrafficRow[] = [
  { key: "a1", source: "Vercel", views: "42.1k", users: "18.4k", share: "54%" },

  { key: "a2", source: "Direct", views: "21.3k", users: "9.5k", share: "27%" },

  { key: "a3", source: "Campaign", views: "14.8k", users: "6.1k", share: "19%" },
];

const columns: ColumnsType<TrafficRow> = [
  { title: "Source", dataIndex: "source" },

  { title: "Views", dataIndex: "views" },

  { title: "Users", dataIndex: "users" },

  { title: "Share", dataIndex: "share" },
];

export default function AnalyticsPage() {
  return (
    <DashboardSection
      description="Operational traffic snapshot for the admin workspace."
      extra={<Tag color="cyan">Proxy ready</Tag>}
      title="Analytics"
    >
      <Row gutter={[16, 16]}>
        {[
          ["Page views", "42.1k"],

          ["Unique visitors", "18.4k"],

          ["Avg. load", "312ms"],

          ["Bounce rate", "24%"],
        ].map(([title, value]) => (
          <Col key={title} xs={24} sm={12} xl={6}>
            <Card className="admin-card-surface">
              <Typography.Text type="secondary">{title}</Typography.Text>

              <Typography.Title level={3} style={{ margin: "8px 0 0" }}>
                {value}
              </Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="admin-table-card" variant="borderless" title="Traffic sources">
        <Table columns={columns} dataSource={trafficSources} pagination={false} rowKey="key" />
      </Card>
    </DashboardSection>
  );
}
