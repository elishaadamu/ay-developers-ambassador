import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import {
  Form,
  Select,
  InputNumber,
  Input,
  Upload,
  Button,
  Table,
  Tabs,
  Badge,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { apiUrl, API_CONFIG } from "../../utilities/config";
import { decryptData } from "../../utilities/encryption";
import { ToastContainer, toast } from "react-toastify";

const { TabPane } = Tabs;

interface Product {
  _id: string;
  name: string;
  price: number;
}

export default function Promotions() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");

  // 🔑 Convert file -> base64
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // 🔑 Decrypt user from localStorage
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

  // 🔑 Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        apiUrl(API_CONFIG.ENDPOINTS.AUTH.GetProducts)
      );
      const rawProducts = response.data.products || response.data || [];
      const sorted = rawProducts.sort((a: Product, b: Product) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" })
      );
      setProducts(sorted);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      message.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    if (!userData?.id) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiUrl(API_CONFIG.ENDPOINTS.AUTH.getPromotions)}${userData.id}`
      );
      console.log("Fetched promotions:", response.data);

      const rawSales = response.data;

      // Ensure array
      setSales(Array.isArray(rawSales) ? rawSales : []);
    } catch (error) {
      console.error("❌ Error fetching sales:", error);
      toast.error("Failed to fetch sales");
      setSales([]); // reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Post sales
  const postSales = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        productId: values.products,
        quantity: values.quantity,
        submittedBy: userData?.id || "",
        transactionReference: values.transactionReference,
        paymentReceipt: paymentReceipt, // base64 receipt
      };

      console.log("Submitting sale with payload:", payload);
      await axios.post(apiUrl(API_CONFIG.ENDPOINTS.AUTH.SubmitSale), payload);

      toast.success("Sale submitted successfully!");
      form.resetFields();
      setPaymentReceipt("");
      fetchSales(); // refresh tables
    } catch (error: any) {
      console.error("❌ Error submitting sale:", error);
      toast.error(error.response?.data?.error || "Failed to submit sale");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Initial load for products
  useEffect(() => {
    fetchProducts();
  }, []);

  // 🔑 Load sales only when userData is ready
  useEffect(() => {
    if (userData?.id) {
      fetchSales();
    }
  }, [userData]);

  // 🔑 Filtered sales
  const pendingSales = sales.filter((s) => s.status === "pending");
  const approvedSales = sales.filter((s) => s.status === "approved");
  const rejectedSales = sales.filter((s) => s.status === "rejected");

  // 📊 Table columns
  const submissionColumns = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (_: any, record: any) => record.productId?.name,
    },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Transaction Ref",
      dataIndex: "transactionReference",
      key: "transactionReference",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_: any, record: any) => record.productId?.price,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          status={
            status === "approved"
              ? "success"
              : status === "rejected"
              ? "error"
              : "processing"
          }
          text={status ? status.charAt(0).toUpperCase() + status.slice(1) : ""}
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: any) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="AY Developers - Promotions"
        description="Manage your sales and promotions"
      />
      <PageBreadcrumb pageTitle="Promotions" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <ToastContainer position="top-right" autoClose={3000} />

        <Tabs defaultActiveKey="submit">
          {/* Submit Sale */}
          <TabPane tab="Submit Sale" key="submit">
            <Form
              form={form}
              layout="vertical"
              className="max-w-2xl mx-auto"
              onFinish={postSales}
            >
              {/* Product select */}
              <Form.Item
                name="products"
                label="Select Products"
                rules={[{ required: true, message: "Please select products" }]}
              >
                <Select placeholder="Select products" className="w-full">
                  {products.map((product) => (
                    <Select.Option key={product._id} value={product._id}>
                      {product.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Quantity */}
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber min={1} className="w-full" />
              </Form.Item>

              {/* Transaction Reference */}
              <Form.Item
                name="transactionReference"
                label="Transaction Reference"
                rules={[
                  {
                    required: true,
                    message: "Please enter transaction reference",
                  },
                ]}
              >
                <Input placeholder="Enter transaction reference" />
              </Form.Item>

              {/* Upload Receipt */}
              <Form.Item
                name="paymentReceipt"
                label="Upload Payment Receipt"
                rules={[{ required: true, message: "Please upload receipt" }]}
              >
                <Upload
                  listType="picture"
                  beforeUpload={async (file) => {
                    const isLt50KB = file.size / 1024 < 50;
                    if (!isLt50KB) {
                      toast.error("❌ File size must be less than 50KB");
                      return Upload.LIST_IGNORE;
                    }
                    const base64 = await getBase64(file);
                    setPaymentReceipt(base64);
                    return false;
                  }}
                  accept="image/*"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="w-full"
                >
                  Make Payment
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* Pending */}
          <TabPane tab="Pending" key="pending">
            <Table
              columns={submissionColumns}
              dataSource={pendingSales}
              rowKey="_id"
              loading={loading}
            />
          </TabPane>

          {/* Approved */}
          <TabPane tab="Approved" key="approved">
            <div className="mb-3 font-semibold"></div>
            <Table
              columns={submissionColumns}
              dataSource={approvedSales}
              rowKey="_id"
              loading={loading}
            />
          </TabPane>

          {/* Rejected */}
          <TabPane tab="Rejected" key="rejected">
            <Table
              columns={submissionColumns}
              dataSource={rejectedSales}
              rowKey="_id"
              loading={loading}
            />
          </TabPane>
        </Tabs>
      </div>
    </>
  );
}
