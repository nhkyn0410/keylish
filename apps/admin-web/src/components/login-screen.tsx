"use client";

import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin, getErrorMessage } from "@/infra/admin/adminApi";

type LoginValues = {
  username: string;
  password: string;
};

export function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(values: LoginValues) {
    setLoading(true);
    setError(null);
    try {
      await adminLogin(values);
      router.replace("/dashboard/overview");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <Card className="admin-login-card" variant="borderless">
        <div className="admin-login__brand">
          <Space orientation="vertical" size={0}>
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
          onFinish={handleFinish}
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
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="At least 12 characters"
              size="large"
            />
          </Form.Item>

          {error ? <Alert showIcon title={error} type="error" /> : null}

          <Button block htmlType="submit" loading={loading} size="large" type="primary">
            Open dashboard
          </Button>
        </Form>
      </Card>
    </main>
  );
}
