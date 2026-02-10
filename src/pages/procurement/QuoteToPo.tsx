// ============================================================================
// Quote to PO Page
// Create Purchase Order from selected quote
// ============================================================================

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  DollarSign,
  Calendar,
  Building2,
  User,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  ArrowLeft,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

interface POLineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function QuoteToPo() {
  const [poNumber, setPoNumber] = useState("PO-2024-0047");
  const [vendor, setVendor] = useState({
    name: "Office Solutions",
    contact: "John Smith",
    email: "john@officesolutions.ug",
    phone: "+256 701 234 567",
    address: "Plot 45, Kampala Road, Kampala",
  });

  const [lineItems, setLineItems] = useState<POLineItem[]>([
    {
      id: "1",
      itemName: "Dell Latitude 5540 Laptop",
      description: "i7-1365U, 32GB RAM, 512GB SSD, 15.6\" FHD",
      quantity: 10,
      unitPrice: 2050000,
      totalPrice: 20500000,
    },
    {
      id: "2",
      itemName: "USB-C Docking Station",
      description: "Enterprise docking station with dual monitor support",
      quantity: 10,
      unitPrice: 320000,
      totalPrice: 3200000,
    },
    {
      id: "3",
      itemName: "27\" 4K Monitor",
      description: "IPS panel, 60Hz, HDMI/DisplayPort inputs",
      quantity: 10,
      unitPrice: 415000,
      totalPrice: 4150000,
    },
  ]);

  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("CorporatePay HQ, Plot 123, Parliament Avenue, Kampala");
  const [paymentTerms, setPaymentTerms] = useState("Net 45");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const vat = subtotal * 0.18;
  const total = subtotal + vat;

  const updateLineItem = (id: string, field: keyof POLineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        itemName: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            <p className="text-gray-500 mt-1">Convert quote to purchase order</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Preview
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="primary" className="flex items-center gap-2" onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit PO"}
          </Button>
        </div>
      </div>

      {/* PO Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">PO Number</p>
              <p className="text-xl font-bold text-blue-700">{poNumber}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600">Total Amount</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600">PO Date</p>
              <p className="text-lg font-bold text-amber-700">{poDate}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600">Vendor</p>
              <p className="text-lg font-bold text-purple-700">{vendor.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor & Delivery Info */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard title="Vendor Information" subtitle="Selected vendor details">
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Company Name</p>
                <p className="font-medium text-gray-900">{vendor.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contact Person</p>
                <p className="font-medium text-gray-900">{vendor.contact}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{vendor.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{vendor.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{vendor.address}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery Information" subtitle="Shipping and delivery details">
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* PO Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="PO Details" subtitle="Purchase order reference and terms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Date
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFQ Reference
                </label>
                <input
                  type="text"
                  value="RFQ-2024-001"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
                />
              </div>
            </div>
          </SectionCard>

          {/* Line Items */}
          <SectionCard
            title="Line Items"
            subtitle={`${lineItems.length} items | Subtotal: ${formatCurrency(subtotal)}`}
            right={
              <Button variant="outline" onClick={addLineItem} className="flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            }
          >
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium text-gray-600 text-sm">Item</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600 text-sm">Description</th>
                    <th className="text-center py-2 px-2 font-medium text-gray-600 text-sm w-20">Qty</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600 text-sm w-28">Unit Price</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600 text-sm w-28">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateLineItem(item.id, "itemName", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => removeLineItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT (18%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes & Terms" subtitle="Additional information for the vendor">
            <div className="mt-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter any additional notes or special terms..."
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
