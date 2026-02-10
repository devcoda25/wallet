// ============================================================================
// Fulfillment Tracking Page
// Track purchase order delivery and fulfillment
// ============================================================================

import React, { useState } from "react";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Building2,
  FileText,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type POStatus = "ordered" | "processing" | "shipped" | "delivered" | "partial";

interface Shipment {
  id: string;
  poNumber: string;
  vendor: string;
  status: POStatus;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  items: number;
  itemsDelivered: number;
  trackingNumber?: string;
  carrier?: string;
  amount: number;
  milestones: Array<{ status: string; date: string; completed: boolean }>;
}

const shipments: Shipment[] = [
  {
    id: "1",
    poNumber: "PO-2024-0047",
    vendor: "Office Solutions",
    status: "shipped",
    orderDate: "2024-01-20",
    expectedDelivery: "2024-02-05",
    trackingNumber: "TRK-789456123",
    carrier: "Fast Freight Uganda",
    items: 30,
    itemsDelivered: 0,
    amount: 31850000,
    milestones: [
      { status: "Order Placed", date: "2024-01-20", completed: true },
      { status: "Order Confirmed", date: "2024-01-20", completed: true },
      { status: "Processing", date: "2024-01-22", completed: true },
      { status: "Shipped", date: "2024-01-28", completed: true },
      { status: "In Transit", date: "", completed: false },
      { status: "Delivered", date: "", completed: false },
    ],
  },
  {
    id: "2",
    poNumber: "PO-2024-0045",
    vendor: "Tech Supplies Ltd",
    status: "delivered",
    orderDate: "2024-01-10",
    expectedDelivery: "2024-01-20",
    actualDelivery: "2024-01-18",
    items: 15,
    itemsDelivered: 15,
    amount: 42500000,
    milestones: [
      { status: "Order Placed", date: "2024-01-10", completed: true },
      { status: "Order Confirmed", date: "2024-01-10", completed: true },
      { status: "Processing", date: "2024-01-12", completed: true },
      { status: "Shipped", date: "2024-01-15", completed: true },
      { status: "In Transit", date: "2024-01-17", completed: true },
      { status: "Delivered", date: "2024-01-18", completed: true },
    ],
  },
  {
    id: "3",
    poNumber: "PO-2024-0048",
    vendor: "Prime Equipment",
    status: "processing",
    orderDate: "2024-01-25",
    expectedDelivery: "2024-02-10",
    items: 5,
    itemsDelivered: 0,
    amount: 15200000,
    milestones: [
      { status: "Order Placed", date: "2024-01-25", completed: true },
      { status: "Order Confirmed", date: "2024-01-25", completed: true },
      { status: "Processing", date: "", completed: false },
      { status: "Shipped", date: "", completed: false },
      { status: "In Transit", date: "", completed: false },
      { status: "Delivered", date: "", completed: false },
    ],
  },
  {
    id: "4",
    poNumber: "PO-2024-0042",
    vendor: "Office Solutions",
    status: "partial",
    orderDate: "2024-01-05",
    expectedDelivery: "2024-01-25",
    items: 50,
    itemsDelivered: 35,
    amount: 28500000,
    milestones: [
      { status: "Order Placed", date: "2024-01-05", completed: true },
      { status: "Order Confirmed", date: "2024-01-05", completed: true },
      { status: "Processing", date: "2024-01-07", completed: true },
      { status: "Shipped", date: "2024-01-15", completed: true },
      { status: "In Transit", date: "", completed: false },
      { status: "Delivered", date: "", completed: false },
    ],
  },
];

export default function FulfillmentTracking() {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: POStatus) => {
    switch (status) {
      case "ordered":
        return { label: "Ordered", tone: "info" as const, icon: FileText };
      case "processing":
        return { label: "Processing", tone: "warn" as const, icon: Clock };
      case "shipped":
        return { label: "Shipped", tone: "accent" as const, icon: Truck };
      case "delivered":
        return { label: "Delivered", tone: "good" as const, icon: CheckCircle };
      case "partial":
        return { label: "Partial", tone: "warn" as const, icon: Package };
    }
  };

  const filteredShipments = filterStatus === "all"
    ? shipments
    : shipments.filter((s) => s.status === filterStatus);

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => s.status === "shipped").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    pending: shipments.filter((s) => ["ordered", "processing"].includes(s.status)).length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fulfillment Tracking</h1>
          <p className="text-gray-500 mt-1">Track your purchase order deliveries</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600">Pending</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600">In Transit</p>
              <p className="text-2xl font-bold text-purple-700">{stats.inTransit}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600">Delivered</p>
              <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "ordered", "processing", "shipped", "partial", "delivered"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === status
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipment List */}
        <div className="lg:col-span-1">
          <SectionCard title="Shipments" subtitle={`${filteredShipments.length} items`}>
            <div className="space-y-3 mt-4">
              {filteredShipments.map((shipment) => {
                const status = getStatusConfig(shipment.status);
                const StatusIcon = status.icon;
                const isSelected = selectedShipment === shipment.id;

                return (
                  <div
                    key={shipment.id}
                    onClick={() => setSelectedShipment(shipment.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${status.tone === "good" ? "bg-green-100" :
                          status.tone === "warn" ? "bg-amber-100" :
                            status.tone === "accent" ? "bg-purple-100" : "bg-blue-100"
                        }`}>
                        <StatusIcon className={`w-5 h-5 ${status.tone === "good" ? "text-green-600" :
                            status.tone === "warn" ? "text-amber-600" :
                              status.tone === "accent" ? "text-purple-600" : "text-blue-600"
                          }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{shipment.poNumber}</span>
                          <Pill label={status.label} tone={status.tone} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{shipment.vendor}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(shipment.expectedDelivery)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(shipment.amount)}
                          </span>
                        </div>
                        {shipment.status === "partial" && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{shipment.itemsDelivered}/{shipment.items} items</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-amber-500 h-2 rounded-full"
                                style={{ width: `${(shipment.itemsDelivered / shipment.items) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Shipment Details */}
        <div className="lg:col-span-2">
          {selectedShipment ? (
            (() => {
              const shipment = shipments.find((s) => s.id === selectedShipment);
              if (!shipment) return null;
              const status = getStatusConfig(shipment.status);

              return (
                <SectionCard
                  title={shipment.poNumber}
                  subtitle={`${shipment.vendor} | ${formatCurrency(shipment.amount)}`}
                >
                  {/* Status Banner */}
                  <div className={`mt-4 p-4 rounded-lg ${shipment.status === "delivered" ? "bg-green-50 border border-green-200" :
                      shipment.status === "partial" ? "bg-amber-50 border border-amber-200" :
                        "bg-blue-50 border border-blue-200"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {shipment.status === "delivered" ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : shipment.status === "partial" ? (
                          <AlertTriangle className="w-8 h-8 text-amber-600" />
                        ) : (
                          <Truck className="w-8 h-8 text-blue-600" />
                        )}
                        <div>
                          <p className={`font-bold text-lg ${shipment.status === "delivered" ? "text-green-700" :
                              shipment.status === "partial" ? "text-amber-700" : "text-blue-700"
                            }`}>
                            {shipment.status === "delivered" ? "Delivered" :
                              shipment.status === "partial" ? "Partially Delivered" :
                                status.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {shipment.status === "delivered" && shipment.actualDelivery ?
                              `Delivered on ${formatDate(shipment.actualDelivery)}` :
                              `Expected by ${formatDate(shipment.expectedDelivery)}`}
                          </p>
                        </div>
                      </div>
                      {shipment.trackingNumber && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Tracking Number</p>
                          <p className="font-mono font-medium text-gray-900">{shipment.trackingNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Delivery Progress</h4>
                    <div className="relative">
                      {shipment.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-start gap-4 pb-6 last:pb-0">
                          <div className="relative">
                            <div className={`w-4 h-4 rounded-full ${milestone.completed ? "bg-green-500" : "bg-gray-300"
                              }`} />
                            {index < shipment.milestones.length - 1 && (
                              <div className={`absolute top-4 left-1/2 w-0.5 h-full -translate-x-1/2 ${milestone.completed ? "bg-green-300" : "bg-gray-200"
                                }`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${milestone.completed ? "text-gray-900" : "text-gray-400"
                              }`}>
                              {milestone.status}
                            </p>
                            <p className="text-sm text-gray-500">
                              {milestone.date ? formatDate(milestone.date) : "Pending"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Vendor</span>
                      </div>
                      <p className="font-medium text-gray-900">{shipment.vendor}</p>
                    </div>
                    {shipment.carrier && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">Carrier</span>
                        </div>
                        <p className="font-medium text-gray-900">{shipment.carrier}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Track on Map
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Vendor
                    </Button>
                    {shipment.trackingNumber && (
                      <Button variant="primary" className="flex items-center gap-2">
                        View Tracking
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </SectionCard>
              );
            })()
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a shipment to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
