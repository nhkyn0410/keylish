"use client";

import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { useRouter } from "next/navigation";

export function LoginScreen() {
  const router = useRouter();

  return (
    <main className="admin-login">
      <Card bordered={false} className="admin-login-card">
        <div className="admin-login__brand">
          <Space direction="vertical" size={0}>
            <Typography.Text className="admin-login__kicker">KeyLish Admin</Typography.Text>
            <Typography.Title level={2} className="admin-login__title">
              Sign in
            </Typography.Title>
            <Typography.Paragraph className="admin-login__subtitle">
              Access the operator console with username and password.
            </Typography.Paragraph>
          </Space>
        </div>

        <Form
          autoComplete="off"
          className="admin-login__form"
          layout="vertical"
          requiredMark={false}
          onFinish={() => router.push("/dashboard/overview")}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Enter the admin username." }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter the password." }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="???????????????" size="large" />
          </Form.Item>

          <Button block htmlType="submit" size="large" type="primary">
            Open dashboard
          </Button>
        </Form>
      </Card>
    </main>
  );
}
