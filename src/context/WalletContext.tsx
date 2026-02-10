// ============================================================================
// Wallet Context - Personal Wallet State Management
// ============================================================================

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { Currency, Toast, ToastKind } from "@/types/shared";
import type { WalletContext as WalletContextType, WalletStatus, Balance } from "@/types/wallet";
import { uid } from "@/lib/utils";

// -- Toast Helper --

type ToastAction = (toast: Omit<Toast, "id">) => void;

function useToastSystem(): [Toast[], ToastAction, (id: string) => void] {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = uid("toast");
        setToasts((prev) => [{ id, ...toast }, ...prev].slice(0, 4));
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return [toasts, addToast, dismissToast];
}

// -- Default Values --

const DEFAULT_WALLET_CONTEXT: WalletContextType = {
    id: "personal",
    type: "personal",
    label: "Personal Wallet",
    status: "Active",
};

const DEFAULT_BALANCES: Balance[] = [
    { currency: "UGX", symbol: "UGX", available: 1250000, pending: 320000, reserved: 150000 },
    { currency: "USD", symbol: "$", available: 180.5, pending: 20, reserved: 0 },
    { currency: "CNY", symbol: "¥", available: 820, pending: 0, reserved: 15.5 },
    { currency: "KES", symbol: "KSh", available: 56300, pending: 0, reserved: 0 },
];

// -- Context Interface --

interface WalletState {
    // Personal wallet context
    context: WalletContextType;
    setContext: (context: WalletContextType) => void;

    // Balances
    balances: Balance[];
    setBalances: (balances: Balance[]) => void;
    updateBalance: (currency: Currency, updates: Partial<Balance>) => void;

    // KYC
    kycTier: number;
    setKycTier: (tier: number) => void;

    // Default currency
    defaultCurrency: Currency;
    setDefaultCurrency: (currency: Currency) => void;

    // Toast system
    toasts: Toast[];
    addToast: ToastAction;
    dismissToast: (id: string) => void;
}

// -- Context --

const WalletContext = createContext<WalletState | null>(null);

// -- Provider --

interface WalletProviderProps {
    children: React.ReactNode;
    initialContext?: WalletContextType;
    initialBalances?: Balance[];
}

export function WalletProvider({
    children,
    initialContext = DEFAULT_WALLET_CONTEXT,
    initialBalances = DEFAULT_BALANCES,
}: WalletProviderProps) {
    const [context, setContext] = useState<WalletContextType>(initialContext);
    const [balances, setBalances] = useState<Balance[]>(initialBalances);
    const [kycTier, setKycTier] = useState(1);
    const [defaultCurrency, setDefaultCurrency] = useState<Currency>("UGX");
    const [toasts, addToast, dismissToast] = useToastSystem();

    const updateBalance = useCallback((currency: Currency, updates: Partial<Balance>) => {
        setBalances((prev) =>
            prev.map((b) => (b.currency === currency ? { ...b, ...updates } : b))
        );
    }, []);

    const value: WalletState = useMemo(
        () => ({
            context,
            setContext,
            balances,
            setBalances,
            updateBalance,
            kycTier,
            setKycTier,
            defaultCurrency,
            setDefaultCurrency,
            toasts,
            addToast,
            dismissToast,
        }),
        [context, balances, updateBalance, kycTier, defaultCurrency, toasts, addToast, dismissToast]
    );

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// -- Hook --

export function useWallet(): WalletState {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}

// -- Selectors --

export function useWalletBalance(currency: Currency): Balance | undefined {
    const { balances } = useWallet();
    return balances.find((b) => b.currency === currency);
}

export function useTotalBalance(): { available: number; pending: number; reserved: number } {
    const { balances } = useWallet();
    return balances.reduce(
        (acc, b) => ({
            available: acc.available + b.available,
            pending: acc.pending + b.pending,
            reserved: acc.reserved + b.reserved,
        }),
        { available: 0, pending: 0, reserved: 0 }
    );
}

export function useWalletStatus(): WalletStatus {
    const { context } = useWallet();
    return context.status;
}
