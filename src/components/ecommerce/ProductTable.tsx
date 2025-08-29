import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import { notification } from "antd";
import { ErrorBoundary } from "../ErrorBoundary";

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

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onDelete: (id: string | number) => Promise<void>;
  onUpdate: (id: string | number, data: Partial<Product>) => Promise<void>;
  onEdit: (product: Product) => void;
}

function ProductTable({ products, loading }: ProductTableProps) {
  const [, contextHolder] = notification.useNotification();

  const formatDate = (dateString: string) => {
    if (!dateString) {
      throw new Error("Invalid date string provided");
    }
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Product Name
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Price
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Created Date
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product._id || product.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        {product.images && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img
                              src={product.images}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs dark:text-gray-400">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 text-gray-500 dark:text-gray-400">
                      ₦{product.price.toLocaleString()}
                    </TableCell>

                    <TableCell className="py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {formatDate(product.createdDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

// Wrap the export with ErrorBoundary
export default function ProductTableWithErrorBoundary(
  props: ProductTableProps
) {
  return (
    <ErrorBoundary>
      <ProductTable {...props} />
    </ErrorBoundary>
  );
}
