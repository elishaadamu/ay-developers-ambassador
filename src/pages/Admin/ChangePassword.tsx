import { Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { API_CONFIG, apiUrl } from "../../utilities/config";
import { decryptData } from "../../utilities/encryption";

interface UserData {
  id?: string;
  _id?: string;
}

export default function ChangePassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Decrypt and load user data when component mounts
    try {
      const encryptedUserData = localStorage.getItem("userData");
      if (encryptedUserData) {
        const decryptedUserData = decryptData(encryptedUserData);
        setUserData(decryptedUserData);
      }
    } catch (error) {
      console.error("Failed to decrypt user data:", error);
    }
  }, []);

  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        messageApi.error("The new passwords you entered do not match.");
        return;
      }

      setLoading(true);

      if (!userData?.id) {
        messageApi.error("User not found. Please login again.");
        return;
      }

      const response = await axios({
        method: "patch",
        url: apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.SetPassword}${userData.id}`),
        data: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });

      if (response.data) {
        messageApi.success("Password changed successfully");
        form.resetFields();
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      messageApi.error(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <PageMeta
        title="AY Developers - Change Password"
        description="Change your account password"
      />
      <PageBreadcrumb pageTitle="Change Password" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Change Password
        </h3>

        <div className="max-w-md mx-auto">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleChangePassword}
            requiredMark={false}
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "Please enter your current password",
                },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                className="py-2"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Please enter your new password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                className="py-2"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              rules={[
                { required: true, message: "Please confirm your new password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                className="py-2"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={loading}
              >
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}
