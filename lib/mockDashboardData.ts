// MOCK DATA — reemplazar con fetch a la API cuando el backend Laravel esté disponible

import {
  MetricItem,
  SalesTrendDataPoint,
  TopProduct,
  CategorySales,
  RecentSale,
  LowStockAlert,
} from "@/types/dashboard";

/**
 * Métricas clave del panel principal
 */
export const mockMetrics: MetricItem[] = [
  {
    id: "ventas-dia",
    title: "Ventas del día",
    value: "$2,840.50",
    change: 14.2,
    changeType: "positive",
    period: "vs ayer",
    iconName: "dollar",
    secondaryText: "38 transacciones hoy",
  },
  {
    id: "ventas-mes",
    title: "Ventas del mes",
    value: "$48,920.00",
    change: 8.6,
    changeType: "positive",
    period: "vs mes anterior",
    iconName: "calendar-dollar",
    secondaryText: "Objetivo: 81.5% alcanzado",
  },
  {
    id: "productos-inventario",
    title: "Productos en inventario",
    value: "524",
    change: 2.1,
    changeType: "neutral",
    period: "activos en catálogo",
    iconName: "package",
    secondaryText: "2,180 botellas en almacén",
  },
  {
    id: "stock-bajo",
    title: "Productos con stock bajo",
    value: "6",
    change: 2,
    changeType: "negative",
    period: "requieren reabastecimiento",
    iconName: "alert-triangle",
    secondaryText: "3 en estado crítico",
    isAlert: true,
  },
  {
    id: "compras-mes",
    title: "Compras del mes",
    value: "$18,450.00",
    change: -4.3,
    changeType: "positive", // menos gasto en compras relativo
    period: "14 órdenes procesadas",
    iconName: "shopping-cart",
    secondaryText: "8 proveedores activos",
  },
  {
    id: "utilidad-estimada",
    title: "Utilidad estimada",
    value: "$21,340.00",
    change: 11.4,
    changeType: "positive",
    period: "Margen promedio 43.6%",
    iconName: "trending-up",
    secondaryText: "Margen bruto del mes",
  },
];

/**
 * Tendencia de ventas y compras (últimos 14 días)
 */
export const mockSalesTrend: SalesTrendDataPoint[] = [
  { date: "05 Ago", ventas: 1950, compras: 800, pedidos: 18 },
  { date: "06 Ago", ventas: 2200, compras: 1200, pedidos: 22 },
  { date: "07 Ago", ventas: 2850, compras: 950, pedidos: 29 },
  { date: "08 Ago", ventas: 3100, compras: 2400, pedidos: 34 },
  { date: "09 Ago", ventas: 4200, compras: 1100, pedidos: 48 },
  { date: "10 Ago", ventas: 4850, compras: 500, pedidos: 52 },
  { date: "11 Ago", ventas: 3400, compras: 1800, pedidos: 36 },
  { date: "12 Ago", ventas: 2600, compras: 900, pedidos: 25 },
  { date: "13 Ago", ventas: 2950, compras: 1400, pedidos: 31 },
  { date: "14 Ago", ventas: 3600, compras: 2100, pedidos: 40 },
  { date: "15 Ago", ventas: 4100, compras: 850, pedidos: 45 },
  { date: "16 Ago", ventas: 5200, compras: 1300, pedidos: 58 },
  { date: "17 Ago", ventas: 4900, compras: 600, pedidos: 54 },
  { date: "18 Ago", ventas: 2840, compras: 1150, pedidos: 38 },
];

/**
 * Top 5 productos más vendidos del mes
 */
export const mockTopProducts: TopProduct[] = [
  {
    id: "prod-1",
    name: "Ron Zacapa Centenario 23",
    category: "Ron",
    unitsSold: 142,
    revenue: 9230,
    stock: 28,
  },
  {
    id: "prod-2",
    name: "The Macallan 12 Años Double Cask",
    category: "Whisky",
    unitsSold: 118,
    revenue: 8850,
    stock: 14,
  },
  {
    id: "prod-3",
    name: "Tequila Don Julio 70 Cristalino",
    category: "Tequila",
    unitsSold: 96,
    revenue: 7200,
    stock: 22,
  },
  {
    id: "prod-4",
    name: "Ginebra Hendrick's 750ml",
    category: "Ginebra",
    unitsSold: 84,
    revenue: 4620,
    stock: 35,
  },
  {
    id: "prod-5",
    name: "Mezcal Montelobos Espadín Artesanal",
    category: "Mezcal",
    unitsSold: 75,
    revenue: 3975,
    stock: 19,
  },
];

/**
 * Ventas por categoría de licorería
 */
export const mockCategorySales: CategorySales[] = [
  { name: "Whisky & Malts", value: 16200, percentage: 33.1, color: "#D17B00" },
  { name: "Tequila & Mezcal", value: 12400, percentage: 25.3, color: "#EA580C" },
  { name: "Ron Artesanal", value: 9800, percentage: 20.0, color: "#F59E0B" },
  { name: "Vinos & Cavas", value: 6300, percentage: 12.9, color: "#78350F" },
  { name: "Ginebras & Otros", value: 4220, percentage: 8.7, color: "#64748B" },
];

/**
 * Últimas 5 ventas registradas
 */
export const mockRecentSales: RecentSale[] = [
  {
    id: "sale-1089",
    invoiceNumber: "FAC-2026-089",
    customerName: "Restaurante La Casona",
    customerType: "restaurante",
    itemsCount: 12,
    total: 845.0,
    paymentMethod: "transferencia",
    status: "completada",
    date: "18 Ago 2026",
    time: "15:42",
  },
  {
    id: "sale-1088",
    invoiceNumber: "FAC-2026-088",
    customerName: "Carlos Mendoza (Evento Privado)",
    customerType: "evento",
    itemsCount: 18,
    total: 1320.5,
    paymentMethod: "tarjeta",
    status: "completada",
    date: "18 Ago 2026",
    time: "14:15",
  },
  {
    id: "sale-1087",
    invoiceNumber: "FAC-2026-087",
    customerName: "Distribuidora del Valle",
    customerType: "mayorista",
    itemsCount: 36,
    total: 2450.0,
    paymentMethod: "transferencia",
    status: "completada",
    date: "18 Ago 2026",
    time: "12:30",
  },
  {
    id: "sale-1086",
    invoiceNumber: "FAC-2026-086",
    customerName: "Mariana Silva",
    customerType: "particular",
    itemsCount: 2,
    total: 165.0,
    paymentMethod: "tarjeta",
    status: "completada",
    date: "18 Ago 2026",
    time: "11:05",
  },
  {
    id: "sale-1085",
    invoiceNumber: "FAC-2026-085",
    customerName: "Bar Speakeasy 1920",
    customerType: "restaurante",
    itemsCount: 8,
    total: 620.0,
    paymentMethod: "efectivo",
    status: "completada",
    date: "18 Ago 2026",
    time: "09:50",
  },
];

/**
 * Alertas de stock bajo en inventario
 */
export const mockLowStockAlerts: LowStockAlert[] = [
  {
    id: "low-1",
    productName: "The Macallan 12 Años Double Cask",
    sku: "WHI-MAC-012",
    category: "Whisky",
    currentStock: 3,
    minStock: 12,
    unit: "botellas",
    severity: "critical",
  },
  {
    id: "low-2",
    productName: "Champagne Veuve Clicquot Brut",
    sku: "VIN-VC-075",
    category: "Vinos & Cavas",
    currentStock: 2,
    minStock: 8,
    unit: "botellas",
    severity: "critical",
  },
  {
    id: "low-3",
    productName: "Gin Monkey 47 Schwarzwald 500ml",
    sku: "GIN-MNK-047",
    category: "Ginebra",
    currentStock: 4,
    minStock: 10,
    unit: "botellas",
    severity: "critical",
  },
  {
    id: "low-4",
    productName: "Tequila Clase Azul Reposado 750ml",
    sku: "TEQ-CA-001",
    category: "Tequila",
    currentStock: 5,
    minStock: 10,
    unit: "botellas",
    severity: "warning",
  },
  {
    id: "low-5",
    productName: "Ron Diplomático Reserva Exclusiva",
    sku: "RON-DIP-070",
    category: "Ron",
    currentStock: 6,
    minStock: 12,
    unit: "botellas",
    severity: "warning",
  },
  {
    id: "low-6",
    productName: "Mezcal 400 Conejos Joven",
    sku: "MEZ-400-075",
    category: "Mezcal",
    currentStock: 7,
    minStock: 15,
    unit: "botellas",
    severity: "warning",
  },
];
