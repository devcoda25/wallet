// ============================================================================
// RFQ Entry Page
// Request for Quotation entry and submission
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
  Search,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

interface LineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  specifications: string;
  estimatedBudget: number;
}

export default function RFQEntry() {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      itemName: "Office Laptops",
      description: "High-performance laptops for engineering team",
      quantity: 10,
      unit: "units",
      specifications: "16GB RAM, 512GB SSD, i7 Processor",
      estimatedBudget: 15000000,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    costCenter: "",
    submissionDeadline: "",
    deliveryAddress: "",
    requiredDeliveryDate: "",
    termsConditions: "",
    evaluationCriteria: "price",
    vendorsToInvite: "",
    notes: "",
  });

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        itemName: "",
        description: "",
        quantity: 1,
        unit: "units",
        specifications: "",
        estimatedBudget: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const totalEstimatedBudget = lineItems.reduce((sum, item) => sum + item.estimatedBudget, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Entry</h1>
          <p className="text-gray-500 mt-1">Create and submit Request for Quotation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit RFQ"}
          </Button>
        </div>
      </div>

      {/* RFQ Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Line Items</p>
              <p className="text-2xl font-bold text-blue-700">{lineItems.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Est. Budget</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalEstimatedBudget)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm text-amber-600">Deadline</p>
              <p className="text-lg font-bold text-amber-700">{formData.submissionDeadline || "Not set"}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-bold text-gray-700">{formData.department || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RFQ Details */}
      <SectionCard title="RFQ Details" subtitle="Basic information about this request">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFQ Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q1 2024 Office Equipment Procurement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select department</option>
              <option value="IT">Information Technology</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">Human Resources</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Center
            </label>
            <input
              type="text"
              value={formData.costCenter}
              onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., IT-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submission Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.submissionDeadline}
              onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address
            </label>
            <input
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Delivery location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Delivery Date
            </label>
            <input
              type="date"
              value={formData.requiredDeliveryDate}
              onChange={(e) => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </SectionCard>

      {/* Line Items */}
      <SectionCard
        title="Line Items"
        subtitle={`${lineItems.length} items | Total: ${formatCurrency(totalEstimatedBudget)}`}
        right={
          <Button variant="outline" onClick={addLineItem} className="flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        }
      >
        <div className="space-y-4 mt-4">
          {lineItems.map((item, index) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill label={`Item ${index + 1}`} tone="info" />
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => updateLineItem(item.id, "itemName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unit"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Budget</label>
                  <input
                    type="number"
                    value={item.estimatedBudget}
                    onChange={(e) => updateLineItem(item.id, "estimatedBudget", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                  <input
                    type="text"
                    value={item.specifications}
                    onChange={(e) => updateLineItem(item.id, "specifications", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Technical specs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Vendor Selection */}
      <SectionCard title="Vendor Selection" subtitle="Choose how to select vendors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Open RFQ</h4>
                <p className="text-sm text-gray-500">
                  Publish to all approved vendors for competitive bidding
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Select Vendors</h4>
                <p className="text-sm text-gray-500">
                  Invite specific vendors from your approved list
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Terms */}
      <SectionCard title="Terms & Conditions" subtitle="Additional requirements and terms">
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
            <textarea
              value={formData.termsConditions}
              onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter standard terms and conditions for this RFQ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any additional notes for vendors..."
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
