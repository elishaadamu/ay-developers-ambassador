import { useState, useEffect } from "react";
import {
  Tabs,
  Badge,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  notification,
  Dropdown, // Add this
} from "antd";
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { TableProps, MenuProps } from "antd";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { API_CONFIG, apiUrl } from "../../utilities/config";
import { decryptData } from "../../utilities/encryption";

const { TextArea } = Input;

interface Ticket {
  id?: string;
  ticketId?: string;
  _id?: string;
  subject?: string;
  description?: string;
  status: "open" | "closed";
  priority: "low" | "medium" | "high";
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function Tickets() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("open");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createTicketForm] = Form.useForm(); // Separate form instance for create ticket

  // Configure notification
  useEffect(() => {
    notification.config({
      placement: "topRight",
      duration: 4.5,
    });
  }, []);

  // Decrypt and load user data when component mounts
  useEffect(() => {
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

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching tickets from API...");
      const response = await axios.get(
        apiUrl(API_CONFIG.ENDPOINTS.AUTH.GetTickets)
      );

      console.log("✅ Tickets fetched successfully:", response.data);

      // Handle different response structures
      const ticketsData = response.data.tickets || response.data || [];
      console.log("📊 Tickets data:", ticketsData);

      setTickets(ticketsData);
    } catch (error) {
      console.error("❌ Error fetching tickets:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch tickets",
      });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Update ticket - only for open tickets
  const handleUpdateTicket = async (
    values: Partial<Ticket & { reply: string }>
  ) => {
    if (!selectedTicket) return;

    // Only allow updates for open tickets
    if (selectedTicket.status === "closed") {
      notification.warning({
        message: "Update Restricted",
        description: "Cannot update closed tickets",
      });
      return;
    }

    try {
      const ticketId = selectedTicket._id || selectedTicket.id;

      // Create dynamic payload with status from form and reply
      const payload = {
        status: values.status, // Dynamic status from form
        reply: values.reply,
        updatedAt: new Date().toISOString(),
      };

      console.log("🔄 Sending payload to API:", payload);

      // Use dynamic status in URL
      const response = await axios.patch(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.UpdateTicket}${ticketId}/status`),
        payload
      );

      console.log("✅ Ticket updated successfully:", response.data);

      // Success notification
      notification.success({
        message: "Ticket Updated",
        description: "Ticket has been updated successfully",
        duration: 4.5,
      });

      setUpdateModalVisible(false);
      form.resetFields();
      setSelectedTicket(null);
      await fetchTickets();
    } catch (error) {
      console.error("❌ Error updating ticket:", error);
      if (axios.isAxiosError(error)) {
        console.error("📋 Error response:", error.response?.data);
        console.error("📊 Error status:", error.response?.status);

        notification.error({
          message: "Update Failed",
          description:
            error.response?.data?.message || "Failed to update ticket",
          duration: 5,
        });
      } else {
        notification.error({
          message: "Update Failed",
          description: "An unexpected error occurred while updating the ticket",
          duration: 5,
        });
      }
    }
  };

  // Handle update ticket - only for open tickets
  const handleUpdateClick = (ticket: Ticket) => {
    if (ticket.status === "closed") {
      notification.warning({
        message: "Update Restricted",
        description: "Cannot update closed tickets",
      });
      return;
    }

    console.log("✏️ Opening update modal for ticket:", ticket);
    setSelectedTicket(ticket);
    form.setFieldsValue({
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      reply: "", // Initialize reply field as empty
    });
    setUpdateModalVisible(true);
  };

  // Close ticket
  const handleCloseTicket = async (ticket: Ticket) => {
    try {
      const ticketId = ticket._id || ticket.id;
      console.log("🔄 Closing ticket:", ticketId);

      const payload = {
        status: "closed", // Dynamic status - always closed for this action
        updatedAt: new Date().toISOString(),
      };

      console.log("🔄 Sending close payload to API:", payload);

      const response = await axios.patch(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.UpdateTicket}${ticketId}/status`),
        payload
      );

      console.log("✅ Ticket closed successfully:", response.data);

      // Success notification
      notification.success({
        message: "Ticket Closed",
        description: "Ticket has been closed successfully",
        duration: 4.5,
      });

      await fetchTickets();
    } catch (error) {
      console.error("❌ Error closing ticket:", error);
      if (axios.isAxiosError(error)) {
        console.error("📋 Error response:", error.response?.data);
        console.error("📊 Error status:", error.response?.status);

        notification.error({
          message: "Close Failed",
          description:
            error.response?.data?.message || "Failed to close ticket",
          duration: 5,
        });
      } else {
        notification.error({
          message: "Close Failed",
          description: "An unexpected error occurred while closing the ticket",
          duration: 5,
        });
      }
    }
  };

  // Reopen ticket
  const handleReopenTicket = async (ticket: Ticket) => {
    try {
      const ticketId = ticket._id || ticket.id;
      console.log("🔄 Reopening ticket:", ticketId);

      const payload = {
        status: "open",
        updatedAt: new Date().toISOString(),
      };

      console.log("🔄 Sending reopen payload to API:", payload);

      const response = await axios.patch(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.UpdateTicket}${ticketId}/status`),
        payload
      );

      console.log("✅ Ticket reopened successfully:", response.data);

      // Success notification
      notification.success({
        message: "Ticket Reopened",
        description: "Ticket has been reopened successfully",
        duration: 4.5,
      });

      await fetchTickets();
    } catch (error) {
      console.error("❌ Error reopening ticket:", error);
      if (axios.isAxiosError(error)) {
        console.error("📋 Error response:", error.response?.data);
        console.error("📊 Error status:", error.response?.status);

        notification.error({
          message: "Reopen Failed",
          description:
            error.response?.data?.message || "Failed to reopen ticket",
          duration: 5,
        });
      } else {
        notification.error({
          message: "Reopen Failed",
          description:
            "An unexpected error occurred while reopening the ticket",
          duration: 5,
        });
      }
    }
  };

  // Handle view ticket
  const handleViewTicket = (ticket: Ticket) => {
    console.log("👁️ Viewing ticket:", ticket);
    setSelectedTicket(ticket);
    setViewModalVisible(true);
  };

  // Update the action menu to show different options based on status
  const getActionMenuItems = (record: Ticket): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
      onClick: () => handleViewTicket(record),
    },
    // Show update option for open tickets
    ...(record.status === "open"
      ? [
          {
            key: "update",
            icon: <EditOutlined />,
            label: "Update",
            onClick: () => handleUpdateClick(record),
          },
          {
            key: "close",
            icon: <CheckOutlined />,
            label: "Close",
            onClick: () => handleCloseTicket(record),
          },
        ]
      : [
          // Show reopen option for closed tickets
          {
            key: "reopen",
            icon: <EditOutlined />,
            label: "Reopen",
            onClick: () => handleReopenTicket(record),
          },
        ]),
  ];

  // Update the date rendering to handle the full ISO format
  const columns: TableProps<Ticket>["columns"] = [
    {
      title: "Ticket ID",
      dataIndex: "ticketId",
      key: "ticketId",
      render: (ticketId, record) => (
        <span className="font-medium text-xs dark:text-white">
          {ticketId || record._id || record.id || "N/A"}
        </span>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text) => (
        <span className="text-gray-900 dark:text-white">
          {text || "No subject"}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {name || "Unknown"}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {record.email || "No email"}
          </div>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Badge
          color={
            priority === "high"
              ? "red"
              : priority === "medium"
              ? "yellow"
              : "blue"
          }
          text={
            priority
              ? priority.charAt(0).toUpperCase() + priority.slice(1)
              : "Unknown"
          }
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => {
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <span className="text-gray-900 dark:text-white">{formattedDate}</span>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => {
        if (!date) {
          return (
            <span className="text-gray-500 dark:text-gray-400 italic">
              No updates yet
            </span>
          );
        }
        const formattedDate = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <span className="text-gray-900 dark:text-white">{formattedDate}</span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <MoreOutlined className="text-gray-600 dark:text-gray-300" />
          </button>
        </Dropdown>
      ),
    },
  ];

  const handleSubmitTicket = async (values: any) => {
    if (!userData) {
      notification.error({
        message: "Error",
        description: "User data not found. Please login again.",
      });
      return;
    }

    setLoading(true);
    try {
      const fullName = `${userData.firstName} ${userData.lastName}`;
      const payload = {
        ...values,
        name: fullName,
        email: userData.email,
        role: userData.role,
        status: "open",
      };

      const response = await axios.post(
        apiUrl(API_CONFIG.ENDPOINTS.AUTH.GetTickets),
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        notification.success({
          message: "Success",
          description: "Ticket submitted successfully",
          placement: "topRight",
        });
        createTicketForm.resetFields();
        setCreateModalVisible(false);
        fetchTickets(); // Refresh tickets list
      }
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit ticket",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <>
      <PageMeta
        title="AY Developers - Tickets"
        description="Support tickets management system"
      />
      <PageBreadcrumb pageTitle="Tickets" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Support Tickets
          </h3>
          <div className="flex items-center gap-5">
            {/* Add Create Ticket button */}
            <Button
              type="primary"
              onClick={() => setCreateModalVisible(true)}
              className="bg-blue-600 mr-4"
            >
              Create Ticket
            </Button>
            <Badge
              count={tickets.filter((t) => t.status === "open").length}
              showZero
              style={{
                backgroundColor: "#1890ff",
                marginTop: "-7px",
                padding: "5px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="mr-2">Open</span>
            </Badge>
            <Badge
              count={tickets.filter((t) => t.status === "closed").length}
              showZero
              style={{
                backgroundColor: "#52c41a",
                marginTop: "-7px",
                padding: "5px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="mr-2">Closed</span>
            </Badge>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "open",
              label: "Open Tickets",
              children: (
                <Table
                  columns={columns}
                  dataSource={tickets.filter((t) => t.status === "open")}
                  rowKey={(record) => record.id || record._id || ""}
                  pagination={{ pageSize: 10 }}
                  loading={loading}
                  locale={{
                    emptyText: "No open tickets available",
                  }}
                />
              ),
            },
            {
              key: "closed",
              label: "Closed Tickets",
              children: (
                <Table
                  columns={columns}
                  dataSource={tickets.filter((t) => t.status === "closed")}
                  rowKey={(record) => record.id || record._id || ""}
                  pagination={{ pageSize: 10 }}
                  loading={loading}
                  locale={{
                    emptyText: "No closed tickets available",
                  }}
                />
              ),
            },
          ]}
        />
      </div>

      {/* View Ticket Modal */}
      <Modal
        title="Ticket Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedTicket(null);
        }}
        footer={null}
        width={600}
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket ID
              </label>
              <p className="text-gray-900">
                #
                {selectedTicket.ticketId ||
                  selectedTicket._id ||
                  selectedTicket.id ||
                  "N/A"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <p className="text-gray-900">
                {selectedTicket.subject || "No subject"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-900">
                {selectedTicket.description || "No description provided"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Badge
                  color={selectedTicket.status === "open" ? "blue" : "green"}
                  text={
                    selectedTicket.status
                      ? selectedTicket.status.charAt(0).toUpperCase() +
                        selectedTicket.status.slice(1)
                      : "Unknown"
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Badge
                  color={
                    selectedTicket.priority === "high"
                      ? "red"
                      : selectedTicket.priority === "medium"
                      ? "yellow"
                      : "blue"
                  }
                  text={
                    selectedTicket.priority
                      ? selectedTicket.priority.charAt(0).toUpperCase() +
                        selectedTicket.priority.slice(1)
                      : "Unknown"
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <p className="text-gray-900">
                {selectedTicket.name || "Unknown"}
              </p>
              <p className="text-gray-600 text-sm">
                {selectedTicket.email || "No email"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <p className="text-gray-900">
                  {selectedTicket.createdAt
                    ? new Date(selectedTicket.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      )
                    : "Date not available"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {selectedTicket.updatedAt
                    ? new Date(selectedTicket.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      )
                    : "No updates yet"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Ticket Modal */}
      <Modal
        title="Update Ticket"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          form.resetFields();
          setSelectedTicket(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateTicket}
          className="mt-4"
        >
          <Form.Item name="subject" label="Subject">
            <Input
              placeholder="Enter ticket subject"
              disabled
              className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter ticket description"
              disabled
              className="bg-gray-100 dark:bg-gray-700  text-black dark:text-gray-400"
            />
          </Form.Item>

          <Form.Item name="priority" label="Priority">
            <Select
              placeholder="Select priority"
              disabled
              className="opacity-60"
            >
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reply"
            label="Reply"
            rules={[{ required: true, message: "Please enter your reply" }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter your reply to the ticket..."
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setUpdateModalVisible(false);
                form.resetFields();
                setSelectedTicket(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Update Ticket
            </button>
          </div>
        </Form>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        title="Create Support Ticket"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createTicketForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createTicketForm}
          layout="vertical"
          onFinish={handleSubmitTicket}
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter ticket subject" }]}
          >
            <Input placeholder="Enter ticket subject" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter ticket description" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter ticket description"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[
              { required: true, message: "Please select priority level" },
            ]}
          >
            <Select placeholder="Select priority level">
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setCreateModalVisible(false);
                createTicketForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600"
            >
              Submit Ticket
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
