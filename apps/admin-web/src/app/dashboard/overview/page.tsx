"use client";

import { Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from "antd";

import { DashboardSection } from "@/components/dashboard-section";

type Metric = {
  title: string;

  value: string;

  note: string;
};

const metrics: Metric[] = [
  { title: "Users", value: "2,481", note: "+64 in the last 7 days" },

  { title: "Topics", value: "128", note: "+5 curated updates" },

  { title: "Vocab", value: "18.4k", note: "+220 entries ready" },

  { title: "Traffic", value: "78.2k", note: "+12% compared with last period" },
];

const operationalQueue = [
  { title: "User import review", detail: "Validate the latest account batch before release." },

  { title: "Topic publishing", detail: "Confirm the next curated topic set." },

  { title: "Vocab audit", detail: "Check duplicate entries and missing meanings." },
];

const healthFocus = [
  { label: "User growth", percent: 72 },

  { label: "Content coverage", percent: 84 },

  { label: "Traffic stability", percent: 91 },
];

export default function OverviewPage() {
  return (
    <DashboardSection
      description="Snapshot of the product surfaces that the admin panel will manage."
      extra={<Tag color="green">System healthy</Tag>}
      title="Overview"
    >
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col key={metric.title} xs={24} sm={12} xl={6}>
            <Card className="admin-card-surface">
              <Statistic title={metric.title} value={metric.value} />

              <Typography.Text type="secondary">{metric.note}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card className="admin-card-surface" title="Operational queue">
            <List
              dataSource={operationalQueue}
              itemLayout="horizontal"
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.title} description={item.detail} />

                  <Tag color="blue">Pending</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card className="admin-card-surface" title="Health focus">
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {healthFocus.map((item) => (
                <div key={item.label}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Typography.Text>{item.label}</Typography.Text>

                    <Typography.Text strong>{item.percent}%</Typography.Text>
                  </Space>

                  <Progress percent={item.percent} showInfo={false} />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </DashboardSection>
  );
}
