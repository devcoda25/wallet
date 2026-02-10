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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RFQ Entry</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">Create and submit Request for Quotation</p>
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Line Items</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{lineItems.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Est. Budget</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalEstimatedBudget)}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400">Deadline</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formData.submissionDeadline || "Not set"}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{formData.department || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RFQ Details */}
      <SectionCard title="RFQ Details" subtitle="Basic information about this request">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              RFQ Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
              placeholder="e.g., Q1 2024 Office Equipment Procurement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
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
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Cost Center
            </label>
            <input
              type="text"
              value={formData.costCenter}
              onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
              placeholder="e.g., IT-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Submission Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.submissionDeadline}
              onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Delivery Address
            </label>
            <input
              type="text"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
              placeholder="Delivery location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Required Delivery Date
            </label>
            <input
              type="date"
              value={formData.requiredDeliveryDate}
              onChange={(e) => setFormData({ ...formData, requiredDeliveryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
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
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill label={`Item ${index + 1}`} tone="info" />
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Item Name</label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => updateLineItem(item.id, "itemName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                      min="1"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.id, "unit", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                      placeholder="Unit"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Specifications</label>
                  <input
                    type="text"
                    value={item.specifications}
                    onChange={(e) => updateLineItem(item.id, "specifications", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                    placeholder="Specifications"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                  rows={2}
                  placeholder="Item description"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Estimated Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={item.estimatedBudget}
                    onChange={(e) => updateLineItem(item.id, "estimatedBudget", parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Vendors */}
      <SectionCard
        title="Vendors"
        subtitle="Invite vendors to respond to this RFQ"
        right={
          <Button variant="outline" className="flex items-center gap-2 text-sm">
            <Search className="w-4 h-4" />
            Find Vendors
          </Button>
        }
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
            Vendors to Invite
          </label>
          <textarea
            value={formData.vendorsToInvite}
            onChange={(e) => setFormData({ ...formData, vendorsToInvite: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
            rows={3}
            placeholder="Enter vendor email addresses, one per line"
          />
          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
            We'll send RFQ documents to these vendors
          </p>
        </div>
      </SectionCard>

      {/* Terms & Notes */}
      <SectionCard title="Additional Information" subtitle="Terms, conditions, and notes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Terms & Conditions
            </label>
            <textarea
              value={formData.termsConditions}
              onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
              rows={4}
              placeholder="Payment terms, delivery requirements, warranty terms, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:focus:ring-blue-400"
              rows={4}
              placeholder="Additional notes for vendors"
            />
          </div>
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit RFQ"}
        </Button>
      </div>
    </div>
  );
}
