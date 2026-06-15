"use client";

import { useEffect, useState } from "react";
import { Alert, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from "antd";
import { DashboardSection } from "@/components/dashboard-section";
import { getAdminSummary, getErrorMessage, type AdminSummary } from "@/infra/admin/adminApi";

const operationalQueue = [
  { title: "User status review", detail: "Check disabled/deleted accounts before releases." },
  {
    title: "Topic publishing",
    detail: "Confirm curated topic changes from the admin topic table.",
  },
  {
    title: "Vocab audit",
    detail: "Review duplicate entries and missing meanings in the vocab table.",
  },
];

const healthFocus = [
  { label: "User data", percent: 72 },
  { label: "Content coverage", percent: 84 },
  { label: "Traffic setup", percent: 62 },
];

export default function OverviewPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminSummary()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(getErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { title: "Users", value: summary ? summary.users : "-", note: "Learner accounts" },
    { title: "Topics", value: summary ? summary.topics : "-", note: "Curated topic groups" },
    { title: "Vocab", value: summary ? summary.vocab : "-", note: "Vocabulary entries" },
    { title: "Traffic", value: "Vercel", note: "Use Vercel Analytics for live traffic" },
  ];

  return (
    <DashboardSection
      description="Snapshot of the product resources that the admin panel manages."
      extra={
        <Tag color={summary?.api.status === "ok" ? "green" : "default"}>
          API {summary?.api.status ?? "checking"}
        </Tag>
      }
      title="Overview"
    >
      {error ? <Alert showIcon title={error} type="error" /> : null}

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
            <div className="admin-list-stack">
              {operationalQueue.map((item) => (
                <div className="admin-list-row" key={item.title}>
                  <div>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Typography.Paragraph className="admin-list-row__description">
                      {item.detail}
                    </Typography.Paragraph>
                  </div>
                  <Tag color="blue">Review</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card className="admin-card-surface" title="Health focus">
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
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
