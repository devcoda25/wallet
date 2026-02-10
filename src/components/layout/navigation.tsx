import React from "react";
import {
    Home,
    Ticket,
    FileText,
    Users,
    ShieldCheck,
    Wallet,
    CreditCard,
    LayoutGrid,
    CalendarClock,
    Sparkles,
    Bell,
    Settings,
    DollarSign,
    Send,
    ArrowDownLeft,
    Building2,
    Zap,
    Truck,
} from "lucide-react";
import { NavSection } from "@/types/types";

export const NAV_SECTIONS: NavSection[] = [
    {
        title: "Home",
        items: [
            { label: "Home", path: "/home", icon: <Home className="h-4 w-4" /> },
        ],
    },
    {
        title: "Wallet",
        items: [
            { label: "Wallet Overview", path: "/wallet", icon: <Wallet className="h-4 w-4" /> },
            { label: "Add Money", path: "/wallet/add-money", icon: <DollarSign className="h-4 w-4" /> },
            { label: "Send Money", path: "/wallet/send", icon: <Send className="h-4 w-4" /> },
            { label: "Request Money", path: "/wallet/request", icon: <ArrowDownLeft className="h-4 w-4" /> },
        ],
    },
    {
        title: "CorporatePay",
        items: [
            { label: "Corporate Hub", path: "/corporate", icon: <Building2 className="h-4 w-4" /> },
            { label: "Organizations", path: "/corporate/organizations", icon: <Users className="h-4 w-4" /> },
            { label: "Policies", path: "/corporate/policies", icon: <ShieldCheck className="h-4 w-4" /> },
            { label: "Limits & Budget", path: "/corporate/limits", icon: <Wallet className="h-4 w-4" /> },
            { label: "My Requests", path: "/corporate/requests", icon: <Ticket className="h-4 w-4" />, badge: "3" },
            { label: "Receipts", path: "/corporate/receipts", icon: <FileText className="h-4 w-4" /> },
        ],
    },
    {
        title: "Checkout Flows",
        items: [
            { label: "Rides Checkout", path: "/checkout/rides", icon: <CreditCard className="h-4 w-4" /> },
            { label: "EV Charging", path: "/checkout/ev", icon: <Zap className="h-4 w-4" /> },
            { label: "E-Commerce", path: "/checkout/ecommerce", icon: <LayoutGrid className="h-4 w-4" /> },
            { label: "Service Booking", path: "/checkout/service", icon: <CalendarClock className="h-4 w-4" /> },
            { label: "Delivery", path: "/checkout/delivery", icon: <Truck className="h-4 w-4" /> },
            { label: "Deal Checkout", path: "/checkout/deal", icon: <Sparkles className="h-4 w-4" /> },
        ],
    },
    {
        title: "Procurement",
        items: [
            { label: "RFQ Request", path: "/procurement/rfq", icon: <FileText className="h-4 w-4" /> },
            { label: "Quote Comparison", path: "/procurement/quotes", icon: <ShieldCheck className="h-4 w-4" /> },
            { label: "PO & Approval", path: "/procurement/po", icon: <Ticket className="h-4 w-4" /> },
            { label: "Fulfillment", path: "/procurement/fulfillment", icon: <Truck className="h-4 w-4" /> },
        ],
    },
    {
        title: "Settings",
        items: [
            { label: "Notifications", path: "/corporate/notifications", icon: <Bell className="h-4 w-4" /> },
            { label: "Preferences", path: "/corporate/preferences", icon: <Settings className="h-4 w-4" /> },
            { label: "Security", path: "/corporate/security", icon: <ShieldCheck className="h-4 w-4" /> },
            { label: "Disputes & Support", path: "/corporate/disputes", icon: <Users className="h-4 w-4" /> },
        ],
    },
];
