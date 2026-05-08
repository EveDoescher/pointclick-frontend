export type AdminDashboardResponse = {
  totalOrders: number;
  pendingOrders: number;
  closedOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  finishedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  activeUsers: number;
  inactiveUsers: number;
  customerUsers: number;
  adminUsers: number;
};

export type DashboardCard = {
  label: string;
  value: string | number;
  description?: string;
};