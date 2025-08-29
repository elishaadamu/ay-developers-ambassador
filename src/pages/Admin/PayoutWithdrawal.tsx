import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Card, Button, Table, Modal, Form, Input, message, Spin } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { apiUrl, API_CONFIG } from "../../utilities/config";
import { ToastContainer, toast } from "react-toastify";
import { decryptData } from "../../utilities/encryption";

interface SettlementAccount {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function PayoutWithdrawal() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<any>(null);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] =
    useState<SettlementAccount | null>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [acctForm] = Form.useForm();

  const UserData = useMemo(() => {
    const encryptedUserData = localStorage.getItem("userData");
    if (encryptedUserData) {
      const decryptedUserData = decryptData(encryptedUserData);
      if (decryptedUserData) {
        // The error "SyntaxError: "[object Object]" is not valid JSON" indicates
        // that `decryptData` returns a parsed object, not a JSON string.
        // We should use the object directly instead of parsing it again.
        return decryptedUserData;
      }
    }
    return null;
  }, []);

  const handleAccountSubmit = async (values: SettlementAccount) => {
    if (!UserData) {
      message.error("User is not logged in.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
      };

      if (editingAccount) {
        await axios.put(
          apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.createAccount}${UserData.id}`),
          payload
        );
        toast.success("Account updated successfully");
      } else {
        await axios.post(
          apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.createAccount}${UserData.id}`),
          payload
        );
        toast.success("Account created successfully");
      }
      setShowAccountModal(false);
      getAccountBalance();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || "Failed to save account details."
      );
    } finally {
      setLoading(false);
    }
  };

  const getAccountBalance = async () => {
    setLoading(true);
    try {
      if (!UserData) {
        message.error("User is not logged in.");
        return;
      }

      const response = await axios.get(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.getAccountBalance}${UserData.id}`)
      );

      console.log("Account Balance:", response.data.data.bankDetails);
      setBankDetails(response.data.data.bankDetails);
    } catch (error) {
      console.error("Error fetching account balance:", error);
      message.error("Failed to fetch account balance");
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async (values: any) => {
    if (!UserData) {
      message.error("User is not logged in.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        amount: values.amount, // ✅ comes directly from form onFinish
      };

      await axios.post(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.requestWithdrawal}${UserData.id}`),
        payload
      );

      message.success("Withdrawal request submitted successfully!");
      setShowWithdrawModal(false);
      // TODO: Refresh withdrawal list
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || "Failed to submit withdrawal request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (UserData) {
      getAccountBalance();
    }
  }, [UserData]);

  const withdrawalColumns = [
    { title: "Ambassador", dataIndex: "ambassadorName", key: "ambassadorName" },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => `₦${v.toLocaleString()}`,
    },
    {
      title: "Account",
      dataIndex: ["account", "accountNumber"],
      key: "account",
    },
    { title: "Status", dataIndex: "status", key: "status" },
    {
      title: "Requested",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => (d ? dayjs(d).format("MMM DD, YYYY") : "-"),
    },
  ];

  useEffect(() => {
    if (!UserData) {
      message.error("User is not logged in.");
    }
  }, [UserData]);

  if (!UserData) return null;

  return (
    <>
      <PageMeta
        title="AY Developers - Payouts"
        description="Manage payouts, settlement accounts and withdrawals"
      />
      <PageBreadcrumb pageTitle="Payouts & Withdrawals" />
      <ToastContainer position="top-right" autoClose={3000} />
      <Spin spinning={loading}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl">
              <h3 className="text-lg font-semibold mb-3">
                Settlement Accounts
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Bank accounts where funds are settled.
              </p>
              <div className="space-y-3">
                {bankDetails && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="">
                      <span className="font-semibold mr-2">Account name:</span>
                      {bankDetails.accountName}
                    </div>
                    <div>
                      <span className="font-semibold mr-2">Bank name:</span>
                      {bankDetails.bankName}
                    </div>

                    <div>
                      <span className="font-semibold mr-2">
                        Account number:
                      </span>
                      <span className="font-semibold">****</span>{" "}
                      {bankDetails.last4Digits}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-5 mt-4">
                {!bankDetails ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingAccount(null);
                      acctForm.resetFields();
                      setShowAccountModal(true);
                    }}
                  >
                    Add Account
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingAccount(bankDetails);
                      acctForm.setFieldsValue(bankDetails);
                      setShowAccountModal(true);
                    }}
                  >
                    Edit Account
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Withdrawals</h3>
                <p className="text-sm text-gray-500">
                  Pending and approved withdrawal requests
                </p>
              </div>
              <div>
                <Button
                  type="primary"
                  onClick={() => setShowWithdrawModal(true)}
                >
                  New Withdrawal
                </Button>
              </div>
            </div>

            <Table columns={withdrawalColumns} rowKey={(r: any) => r._id} />
          </Card>
        </div>
      </Spin>
      <Modal
        title={editingAccount ? "Edit Account" : "Add Account"}
        open={showAccountModal}
        onCancel={() => setShowAccountModal(false)}
        onOk={() => acctForm.submit()}
      >
        <Form
          form={acctForm}
          layout="vertical"
          onFinish={handleAccountSubmit}
          initialValues={editingAccount || {}}
        >
          <Form.Item
            name="accountName"
            label="Account Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="Bank Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="accountNumber"
            label="Account Number"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Request Withdrawal"
        open={showWithdrawModal}
        onCancel={() => setShowWithdrawModal(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={requestWithdrawal}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
