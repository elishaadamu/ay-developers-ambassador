import { useEffect, useState } from "react";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import ProductTable from "../../components/ecommerce/ProductTableIndex";
import PageMeta from "../../components/common/PageMeta";
import { decryptData } from "../../utilities/encryption";
import { apiUrl, API_CONFIG } from "../../utilities/config";
import axios from "axios";
import { message } from "antd";
import { Link } from "react-router-dom";

interface UserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  photo?: string;
  country?: string;
  state?: string;
  name?: string;
  _id?: string;
}

interface Product {
  id?: number;
  _id?: string;
  name: string;
  status: "Active" | "Inactive";
  createdDate: string;
  images: string;
  price: number;
  description: string;
}

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

export default function Home() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [, setCurrentTime] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const encryptedUserData = localStorage.getItem("userData");

  let decryptedUserData: string | null = null;
  if (encryptedUserData !== null) {
    decryptedUserData = decryptData(encryptedUserData);
  }

  useEffect(() => {
    // Decrypt and load user data when component mounts
    try {
      const encryptedUserData = localStorage.getItem("userData");

      if (encryptedUserData) {
        const decryptedUserData = decryptData(encryptedUserData);
        console.log("Decrypted User Data:", decryptedUserData);
        setUserData(decryptedUserData);
      } else {
        console.log("No user data found in localStorage");
      }
    } catch (error) {
      console.error("Failed to decrypt user data:", error);
    }
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        apiUrl(API_CONFIG.ENDPOINTS.AUTH.GetProducts)
      );
      setProducts(response.data.products || response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const getAccountBalance = async () => {
    setLoading(true);
    try {
      const encryptedUserData = localStorage.getItem("userData");
      if (!encryptedUserData) {
        setLoading(false);
        return;
      }
      const decryptedUserData: { id: string } = decryptData(encryptedUserData);
      const userId = decryptedUserData.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${apiUrl(API_CONFIG.ENDPOINTS.AUTH.getAccountBalance)}${userId}`
      );

      console.log("Account Balance:", response.data);
      setBalance(response.data.walletBalance ?? 0); // save balance to state
    } catch (error) {
      console.error("Error fetching account balance:", error);
      message.error("Failed to fetch account balance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tickets from API
  const fetchTickets = async () => {
    const encryptedUserData = localStorage.getItem("userData");
    if (!encryptedUserData) {
      setLoading(false);
      return;
    }
    const decryptedUserData: { id: string } = decryptData(encryptedUserData);
    const userId = decryptedUserData.id;

    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        apiUrl(`${API_CONFIG.ENDPOINTS.AUTH.getTickets}${userId}`)
      );
      setTickets(response.data.tickets || response.data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      message.error("Failed to fetch tickets");
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchTickets();
    getAccountBalance();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // 24-hour format for digital display
      });
      setCurrentTime(timeString);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second for digital clock

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Dummy functions for ProductTable props
  const handleDeleteProduct = async (id: string | number) => {
    console.log("Delete product:", id);
  };

  const handleUpdateProduct = async (
    id: string | number,
    data: Partial<Product>
  ) => {
    console.log("Update product:", id, data);
  };

  const handleEditProduct = (product: Product) => {
    console.log("Edit product:", product);
  };

  // Tickets component
  const TicketsOverview = () => {
    return (
      <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-6 md:py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">
            Support Tickets
          </h3>
          <Link to="/tickets">
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[11px] md:text-[14px] font-medium text-white hover:bg-blue-700">
              View All Tickets
            </button>
          </Link>
        </div>

        <div className="space-y-2 md:space-y-3">
          {tickets.slice(0, 5).map((ticket) => (
            <div
              key={ticket._id || ticket.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-2 md:p-3 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-gray-900 dark:text-white text-xs md:text-sm truncate">
                  {ticket.subject || "No subject"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {ticket.name || "Unknown"} • {ticket.priority || "Unknown"}{" "}
                  priority
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-medium flex-shrink-0 ${
                  ticket.status === "open"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                {ticket.status}
              </span>
            </div>
          ))}

          {tickets.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6 md:py-8 text-sm">
              No tickets available
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title="AY Developers - Dashboard"
        description="Ambassador Dashboard - Monitor your performance, track earnings, and manage your ambassador activities"
      />

      {/* Welcome Header */}
      <div className="mb-4 md:mb-6 rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {userData?.firstName || "Ambassador"}! 👋
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Welcome back to your dashboard. .
            </p>
          </div>

          {/* Right-side widgets: Balance + Time + Avatar */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Wallet Balance */}
            <div className="text-center sm:text-right flex flex-row items-baseline gap-10">
              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Account Name
                </p>

                <p className="text-sm md:text-base font-medium text-gray-800 dark:text-white">
                  {userData?.firstName && userData?.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData?.name || "Unknown User"}
                </p>
              </div>

              <div>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 ">
                  Wallet Balance
                </p>
                {balance !== null ? (
                  <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    ₦{balance.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 lg:gap-6">
        {/* Main Metrics and Charts */}

        <div className="col-span-1 md:col-span-2 lg:col-span-12">
          <MonthlySalesChart />
        </div>
        {/* Tickets Overview */}
        <div className="col-span-1 md:col-span-1 lg:col-span-12">
          <TicketsOverview />
        </div>

        {/* Recent Products */}
        <div className="col-span-1 md:col-span-1 lg:col-span-12">
          <div className="rounded-xl md:rounded-2xl border border-gray-200 bg-white px-4 py-4 md:px-6 md:py-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white">
                Recent Products
              </h3>
              <Link to="/products">
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[11px] md:text-[14px] font-medium text-white hover:bg-blue-700">
                  View all Products
                </button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <ProductTable
                products={products.slice(0, 5)} // Show only first 5 products
                loading={loading}
                onDelete={handleDeleteProduct}
                onUpdate={handleUpdateProduct}
                onEdit={handleEditProduct}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
