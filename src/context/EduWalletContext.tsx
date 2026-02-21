// ============================================================================
// EduWallet Context - Parent & Student Management
// ============================================================================

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

// -- Types --

export type ChildStatus = "Active" | "Paused" | "Restricted" | "Needs consent";

export type Child = {
  id: string;
  name: string;
  school: string;
  className: string;
  stream?: string;
  status: ChildStatus;
  currency: "UGX" | "USD";
  balance: number;
  todaySpend: number;
  guardians: number;
  schoolVerified?: boolean;
};

export type Approval = {
  id: string;
  childId: string;
  kind: "Purchase" | "School payment" | "Fund request";
  title: string;
  vendor?: string;
  amount: number;
  currency: "UGX" | "USD";
  at: number;
  status: "Pending" | "Approved" | "Declined";
};

export type AlertEvent = {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  body: string;
  at: number;
  childId?: string;
};

export type Transaction = {
  id: string;
  childId: string;
  vendor: string;
  category: "Food" | "Books" | "Transport" | "Fees" | "Other";
  amount: number;
  currency: "UGX" | "USD";
  status: "Approved" | "Declined" | "Pending";
  at: number;
  ref: string;
  reason?: string;
};

export type Vendor = {
  id: string;
  name: string;
  type: "Canteen" | "Bookshop" | "Transport" | "School" | "Other";
  status: "Active" | "Suspended";
};

export type PaymentRequest = {
  id: string;
  childId: string;
  title: string;
  amount: number;
  currency: "UGX" | "USD";
  status: "Approved" | "Declined" | "Pending";
  at: number;
  kind: "School payment" | "Fund request";
};

// -- Mock Data --

const MOCK_CHILDREN: Child[] = [
  {
    id: "c_1",
    name: "Amina N.",
    school: "Greenhill Academy",
    className: "P6",
    stream: "Blue",
    status: "Active",
    currency: "UGX",
    balance: 68000,
    todaySpend: 9000,
    guardians: 2,
    schoolVerified: true,
  },
  {
    id: "c_2",
    name: "Daniel K.",
    school: "Greenhill Academy",
    className: "S2",
    stream: "West",
    status: "Active",
    currency: "UGX",
    balance: 41000,
    todaySpend: 12000,
    guardians: 1,
  },
  {
    id: "c_3",
    name: "Maya R.",
    school: "Starlight School",
    className: "P3",
    status: "Needs consent",
    currency: "USD",
    balance: 22,
    todaySpend: 0,
    guardians: 1,
  },
];

const MOCK_APPROVALS: Approval[] = [
  {
    id: "a_1",
    childId: "c_2",
    kind: "Purchase",
    title: "Bookstore purchase",
    vendor: "Campus Bookshop",
    amount: 18000,
    currency: "UGX",
    at: Date.now() - 18 * 60000,
    status: "Pending",
  },
  {
    id: "a_2",
    childId: "c_1",
    kind: "School payment",
    title: "Trip contribution",
    vendor: "Greenhill Academy",
    amount: 55000,
    currency: "UGX",
    at: Date.now() - 2 * 60 * 60000,
    status: "Pending",
  },
];

const MOCK_ALERTS: AlertEvent[] = [
  {
    id: "n_1",
    severity: "warning",
    title: "Declined: outside allowed hours",
    body: "A purchase attempt was blocked by schedule rules.",
    at: Date.now() - 42 * 60000,
    childId: "c_2",
  },
];

const MOCK_TXNS: Transaction[] = [
  { id: "t_1", childId: "c_1", vendor: "School Canteen", category: "Food", amount: 6000, currency: "UGX", status: "Approved", at: Date.now() - 45 * 60000, ref: "TXN-91302" },
  { id: "t_2", childId: "c_2", vendor: "Campus Bookshop", category: "Books", amount: 18000, currency: "UGX", status: "Pending", at: Date.now() - 18 * 60000, ref: "TXN-91303" },
  { id: "t_3", childId: "c_2", vendor: "School Canteen", category: "Food", amount: 12000, currency: "UGX", status: "Declined", at: Date.now() - 120 * 60000, ref: "TXN-91304", reason: "Daily limit reached" },
  { id: "t_4", childId: "c_3", vendor: "Starlight School", category: "Fees", amount: 10, currency: "USD", status: "Approved", at: Date.now() - 1440 * 60000, ref: "TXN-91305" },
];

const MOCK_VENDORS: Vendor[] = [
  { id: "v_1", name: "School Canteen", type: "Canteen", status: "Active" },
  { id: "v_2", name: "Campus Bookshop", type: "Bookshop", status: "Active" },
  { id: "v_3", name: "School Transport", type: "Transport", status: "Active" },
  { id: "v_4", name: "Greenhill Academy", type: "School", status: "Active" },
  { id: "v_5", name: "Uniform Store", type: "Other", status: "Active" },
];

const MOCK_REQUESTS: PaymentRequest[] = [
  { id: "r_1", childId: "c_1", title: "Trip contribution", amount: 55000, currency: "UGX", status: "Pending", at: Date.now() - 120 * 60000, kind: "School payment" },
  { id: "r_2", childId: "c_3", title: "Request: lunch allowance", amount: 10, currency: "USD", status: "Pending", at: Date.now() - 1440 * 60000, kind: "Fund request" },
];


// -- Context Interface --

export interface EduWalletState {
  children: Child[];
  approvals: Approval[];
  alerts: AlertEvent[];
  transactions: Transaction[];
  vendors: Vendor[];
  requests: PaymentRequest[];
  // Actions
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  approveRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  dismissAlert: (id: string) => void;
  getById: (id: string) => Child | undefined;
}

const EduWalletContext = createContext<EduWalletState | null>(null);

// -- Provider --

interface EduWalletProviderProps {
  children: React.ReactNode;
}

export function EduWalletProvider({ children }: EduWalletProviderProps) {
  const [kids, setKids] = useState<Child[]>(MOCK_CHILDREN);
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS);
  const [transactions] = useState<Transaction[]>(MOCK_TXNS);
  const [vendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [requests] = useState<PaymentRequest[]>(MOCK_REQUESTS);

  const addChild = useCallback((child: Child) => {
    setKids((prev) => [...prev, child]);
  }, []);

  const updateChild = useCallback((id: string, updates: Partial<Child>) => {
    setKids((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
  }, []);

  const approveRequest = useCallback((id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Approved" } : a))
    );
  }, []);

  const declineRequest = useCallback((id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Declined" } : a))
    );
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getById = useCallback(
    (id: string) => kids.find((k) => k.id === id),
    [kids]
  );

  const value = useMemo<EduWalletState>(
    () => ({
      children: kids,
      approvals,
      alerts,
      transactions,
      vendors,
      requests,
      addChild,
      updateChild,
      approveRequest,
      declineRequest,
      dismissAlert,
      getById,
    }),
    [kids, approvals, alerts, transactions, vendors, requests, addChild, updateChild, approveRequest, declineRequest, dismissAlert, getById]
  );

  return <EduWalletContext.Provider value={value}>{children}</EduWalletContext.Provider>;
}

// -- Hook --

export function useEduWallet() {
  const context = useContext(EduWalletContext);
  if (!context) {
    throw new Error("useEduWallet must be used within an EduWalletProvider");
  }
  return context;
}
