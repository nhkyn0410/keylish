"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Empty, Row, Segmented, Spin, Statistic, Tag, Typography } from "antd";

import { DashboardSection } from "@/components/dashboard-section";
import {
  getErrorMessage,
  getTrafficAnalytics,
  type TrafficAnalytics,
} from "@/infra/admin/adminApi";

const RANGE_OPTIONS = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

type BarItem = { label: string; value: number; hint: string };

function Bars({ items, color, height = 150 }: { items: BarItem[]; color: string; height?: number }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, overflowX: "auto" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{ flex: "1 0 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
        >
          <div
            title={item.hint}
            style={{
              width: "100%",
              height: Math.round((item.value / max) * (height - 22)),
              minHeight: item.value > 0 ? 2 : 0,
              background: color,
              borderRadius: 3,
              transition: "height .2s",
            }}
          />
          <span style={{ fontSize: 10, lineHeight: 1, color: "var(--ant-color-text-tertiary, #999)" }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrafficAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTrafficAnalytics(days)
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days]);

  const stats = useMemo(() => {
    const buckets = data?.buckets ?? [];
    const byDay = new Map<string, number>();
    const byHour = new Array<number>(24).fill(0);
    let total = 0;

    for (const bucket of buckets) {
      const local = new Date(bucket.hour); // JS converts the UTC ISO to local tz
      const dayKey = `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`;
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + bucket.count);
      byHour[local.getHours()] += bucket.count;
      total += bucket.count;
    }

    const dayEntries = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const dayItems: BarItem[] = dayEntries.map(([key, value]) => {
      const [, month, day] = key.split("-");
      return { label: `${day}/${month}`, value, hint: `${key}: ${value} lượt` };
    });
    const hourItems: BarItem[] = byHour.map((value, hour) => ({
      label: hour % 3 === 0 ? `${hour}h` : "",
      value,
      hint: `${pad2(hour)}:00–${pad2((hour + 1) % 24)}:00: ${value} lượt`,
    }));

    const peakHour = byHour.reduce((best, value, hour) => (value > byHour[best] ? hour : best), 0);
    const peakDay = dayEntries.reduce(
      (best, entry) => (entry[1] > best.value ? { label: entry[0], value: entry[1] } : best),
      { label: "", value: 0 }
    );
    const todayKey = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    })();

    return {
      total,
      dayItems,
      hourItems,
      peakHourLabel: total > 0 ? `${pad2(peakHour)}:00–${pad2((peakHour + 1) % 24)}:00` : "—",
      peakDayLabel: peakDay.value > 0 ? peakDay.label.slice(5).replace("-", "/") : "—",
      today: byDay.get(todayKey) ?? 0,
    };
  }, [data]);

  return (
    <DashboardSection
      description="Lượt xem trang (pageviews) của web công khai, gộp theo giờ — múi giờ local."
      extra={<Tag color="cyan">Pageviews</Tag>}
      title="Analytics"
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <Segmented
          options={RANGE_OPTIONS}
          value={days}
          onChange={(value) => setDays(Number(value))}
        />
      </div>

      {error ? <Alert showIcon message={error} type="error" style={{ marginBottom: 16 }} /> : null}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {[
            ["Tổng lượt xem", stats.total, `Trong ${days} ngày`],
            ["Hôm nay", stats.today, "Pageviews"],
            ["Khung giờ đông nhất", stats.peakHourLabel, "Theo giờ local"],
            ["Ngày đông nhất", stats.peakDayLabel, "DD/MM"],
          ].map(([title, value, note]) => (
            <Col key={String(title)} xs={24} sm={12} xl={6}>
              <Card className="admin-card-surface">
                <Statistic title={String(title)} value={value as string | number} />
                <Typography.Text type="secondary">{String(note)}</Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>

        {stats.total === 0 && !loading ? (
          <Card className="admin-table-card" variant="borderless" style={{ marginTop: 16 }}>
            <Empty
              description={
                <span>
                  Chưa có dữ liệu. Beacon chỉ đếm ở <b>production</b> — truy cập user-web đã deploy
                  để bắt đầu ghi nhận.
                </span>
              }
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} xl={14}>
              <Card className="admin-table-card" variant="borderless" title="Lượt xem theo ngày">
                <Bars items={stats.dayItems} color="#1677ff" />
              </Card>
            </Col>
            <Col xs={24} xl={10}>
              <Card
                className="admin-table-card"
                variant="borderless"
                title="Lượt xem theo giờ trong ngày (0–23h)"
              >
                <Bars items={stats.hourItems} color="#13c2c2" />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </DashboardSection>
  );
}
