// ============================================================================
// Quote Comparison Page
// Compare vendor quotes side by side
// ============================================================================

import React, { useState } from "react";
import {
  FileText,
  CheckCircle,
  DollarSign,
  Clock,
  Calendar,
  Truck,
  Award,
  BarChart3,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

interface Quote {
  id: string;
  vendorName: string;
  totalAmount: number;
  deliveryDays: number;
  warrantyMonths: number;
  paymentTerms: string;
  rating: number;
  items: Array<{ name: string; price: number }>;
  pros: string[];
  cons: string[];
}

interface LineItem {
  name: string;
  qty: number;
  specs: string;
}

const lineItems: LineItem[] = [
  { name: "Dell Latitude 5540 Laptop", qty: 10, specs: "i7-1365U, 32GB RAM, 512GB SSD" },
  { name: "Docking Station", qty: 10, specs: "USB-C, Dual Monitor" },
  { name: "27\" 4K Monitor", qty: 10, specs: "IPS, 60Hz, HDMI/DP" },
];

const quotes: Quote[] = [
  {
    id: "1",
    vendorName: "Tech Supplies Ltd",
    totalAmount: 28500000,
    deliveryDays: 7,
    warrantyMonths: 36,
    paymentTerms: "Net 30",
    rating: 4.5,
    items: [
      { name: "Dell Latitude 5540 Laptop", price: 2100000 },
      { name: "Docking Station", price: 350000 },
      { name: "27\" 4K Monitor", price: 450000 },
    ],
    pros: ["Original Dell distributor", "Fast delivery", "Excellent support"],
    cons: ["Slightly higher price"],
  },
  {
    id: "2",
    vendorName: "Office Solutions",
    totalAmount: 27250000,
    deliveryDays: 14,
    warrantyMonths: 24,
    paymentTerms: "Net 45",
    rating: 4.2,
    items: [
      { name: "Dell Latitude 5540 Laptop", price: 2050000 },
      { name: "Docking Station", price: 320000 },
      { name: "27\" 4K Monitor", price: 415000 },
    ],
    pros: ["Best price", "Bulk discount available", "Flexible payment terms"],
    cons: ["Longer delivery time", "Shorter warranty"],
  },
  {
    id: "3",
    vendorName: "Prime Equipment",
    totalAmount: 29800000,
    deliveryDays: 5,
    warrantyMonths: 48,
    paymentTerms: "Net 30",
    rating: 4.8,
    items: [
      { name: "Dell Latitude 5540 Laptop", price: 2180000 },
      { name: "Docking Station", price: 380000 },
      { name: "27\" 4K Monitor", price: 480000 },
    ],
    pros: ["Premium quality", "Extended warranty", "Fastest delivery"],
    cons: ["Highest price", "No bulk discount"],
  },
];

export default function QuoteComparison() {
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const toggleQuoteSelection = (id: string) => {
    setSelectedQuotes((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const lowestPrice = Math.min(...quotes.map((q) => q.totalAmount));
  const highestPrice = Math.max(...quotes.map((q) => q.totalAmount));
  const avgDelivery = quotes.reduce((sum, q) => sum + q.deliveryDays, 0) / quotes.length;
  const bestPriceVendor = quotes.sort((a, b) => a.totalAmount - b.totalAmount)[0].vendorName;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quote Comparison</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Compare vendor quotes for RFQ-2024-001</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-gray-100 dark:bg-gray-700" : ""}>
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setViewMode("table")} className={viewMode === "table" ? "bg-gray-100 dark:bg-gray-700" : ""}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Price Range</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(lowestPrice)} - {formatCurrency(highestPrice)}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">Best Price</p>
              <p className="font-bold text-green-700 dark:text-green-300">{bestPriceVendor}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Avg Delivery</p>
              <p className="font-bold text-amber-700 dark:text-amber-300">{avgDelivery.toFixed(0)} days</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Top Rated</p>
              <p className="font-bold text-purple-700 dark:text-purple-300">
                {quotes.sort((a, b) => b.rating - a.rating)[0].vendorName.split(" ")[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Reference */}
      <SectionCard title="Line Items Reference" subtitle={`${lineItems.length} items being quoted`}>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Item</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Qty</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Specifications</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-gray-100">{item.qty}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{item.specs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => {
            const isSelected = selectedQuotes.includes(quote.id);
            const isBestPrice = quote.totalAmount === lowestPrice;

            return (
              <div
                key={quote.id}
                className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800"
                  }`}
                onClick={() => toggleQuoteSelection(quote.id)}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                {isBestPrice && !isSelected && (
                  <div className="absolute top-3 right-3">
                    <Pill label="Best Price" tone="good" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <BuildingIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{quote.vendorName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>★</span>
                      <span>{quote.rating}/5</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                    <span className={`font-bold ${isBestPrice ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                      {formatCurrency(quote.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Delivery</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{quote.deliveryDays} days</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Warranty</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{quote.warrantyMonths} months</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Payment</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{quote.paymentTerms}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {quote.pros.slice(0, 2).map((pro, i) => (
                      <Pill key={i} label={pro} tone="good" />
                    ))}
                    {quote.cons.slice(0, 1).map((con, i) => (
                      <Pill key={i} label={con} tone="warn" />
                    ))}
                  </div>
                </div>

                <Button
                  variant={isSelected ? "primary" : "outline"}
                  className="w-full mt-4"
                >
                  {isSelected ? "Selected" : "Select Quote"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <SectionCard title="Quote Comparison Table" subtitle="Side-by-side comparison">
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Vendor</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Total Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Delivery</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Warranty</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Rating</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Select</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const isSelected = selectedQuotes.includes(quote.id);
                  const isBestPrice = quote.totalAmount === lowestPrice;

                  return (
                    <tr
                      key={quote.id}
                      className={`border-b border-gray-100 dark:border-gray-700 ${isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isBestPrice && <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />}
                          <span className="font-medium text-gray-900 dark:text-gray-100">{quote.vendorName}</span>
                        </div>
                      </td>
                      <td className={`text-right py-3 px-4 font-bold ${isBestPrice ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
                        {formatCurrency(quote.totalAmount)}
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100">{quote.deliveryDays} days</td>
                      <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100">{quote.warrantyMonths} mo</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1 text-gray-900 dark:text-gray-100">
                          <span>★</span>
                          <span>{quote.rating}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => toggleQuoteSelection(quote.id)}
                          className={`p-2 rounded-lg transition-colors ${
                              isSelected
                                ? "bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Selection Actions */}
      {selectedQuotes.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl px-6 py-4 flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedQuotes.length} quote{selectedQuotes.length > 1 ? "s" : ""} selected
          </span>
          <Button variant="outline" onClick={() => setSelectedQuotes([])}>
            Clear
          </Button>
          <Button variant="primary" className="flex items-center gap-2">
            Proceed to PO
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
