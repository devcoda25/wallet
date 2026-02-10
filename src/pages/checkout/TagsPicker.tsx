// ============================================================================
// Tags Picker Page
// Group/Cost Center/Project Tags
// ============================================================================

import React, { useState } from "react";
import {
    Tag,
    Search,
    Plus,
    X,
    CheckCircle,
    Building2,
    Briefcase,
    Folder,
    DollarSign,
    Users,
    ChevronRight,
    Edit,
    Trash2,
    Filter,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";
import { Input } from "../../components/ui/Input";

interface TagOption {
    id: string;
    name: string;
    type: "cost-center" | "project" | "department" | "custom";
    color: string;
    budget?: number;
    used?: number;
}

const TAG_OPTIONS: TagOption[] = [
    { id: "tc1", name: "Sales - Q1 Campaign", type: "project", color: "blue", budget: 5000000, used: 2300000 },
    { id: "tc2", name: "Marketing Operations", type: "cost-center", color: "green", budget: 10000000, used: 7500000 },
    { id: "tc3", name: "IT Department", type: "department", color: "purple", budget: 15000000, used: 12000000 },
    { id: "tc4", name: "Office Supplies", type: "cost-center", color: "amber", budget: 500000, used: 180000 },
    { id: "tc5", name: "Client Events", type: "project", color: "rose", budget: 2000000, used: 500000 },
    { id: "tc6", name: "Travel & Entertainment", type: "cost-center", color: "cyan", budget: 3000000, used: 2100000 },
    { id: "tc7", name: "Training & Development", type: "project", color: "lime", budget: 1000000, used: 300000 },
    { id: "tc8", name: "Equipment Maintenance", type: "cost-center", color: "orange", budget: 800000, used: 450000 },
];

const FREQUENT_TAGS = ["Sales-001", "Marketing", "Operations", "IT-Department", "Travel", "Office-Services"];

export default function TagsPicker() {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(null);

    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

    const getTypeIcon = (type: TagOption["type"]) => {
        switch (type) {
            case "cost-center":
                return <DollarSign className="w-4 h-4" />;
            case "project":
                return <Briefcase className="w-4 h-4" />;
            case "department":
                return <Building2 className="w-4 h-4" />;
            default:
                return <Folder className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: TagOption["type"]) => {
        switch (type) {
            case "cost-center":
                return "Cost Center";
            case "project":
                return "Project";
            case "department":
                return "Department";
            default:
                return "Custom";
        }
    };

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            blue: "bg-blue-100 text-blue-700 ring-blue-200",
            green: "bg-green-100 text-green-700 ring-green-200",
            purple: "bg-purple-100 text-purple-700 ring-purple-200",
            amber: "bg-amber-100 text-amber-700 ring-amber-200",
            rose: "bg-rose-100 text-rose-700 ring-rose-200",
            cyan: "bg-cyan-100 text-cyan-700 ring-cyan-200",
            lime: "bg-lime-100 text-lime-700 ring-lime-200",
            orange: "bg-orange-100 text-orange-700 ring-orange-200",
        };
        return colors[color] || "bg-gray-100 text-gray-700 ring-gray-200";
    };

    const filteredTags = TAG_OPTIONS.filter((tag) => {
        const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType ? tag.type === filterType : true;
        return matchesSearch && matchesFilter;
    });

    const budgetUsedPercent = (tag: TagOption) => {
        if (!tag.budget) return 0;
        return Math.round(((tag.used || 0) / tag.budget) * 100);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Group/Cost Center/Project Tags</h1>
                    <p className="text-gray-500 mt-1">Select tags to categorize this transaction</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" />
                    Create Tag
                </Button>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Selected Tags ({selectedTags.length})</span>
                        <button
                            onClick={() => setSelectedTags([])}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tagId) => {
                            const tag = TAG_OPTIONS.find((t) => t.id === tagId);
                            return (
                                <div
                                    key={tagId}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getColorClass(tag?.color || "gray")}`}
                                >
                                    <span className="text-sm font-medium">{tag?.name}</span>
                                    <button onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tagId))}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterType(null)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${filterType === null
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    All
                </button>
                {["cost-center", "project", "department"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type === filterType ? null : type)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${filterType === type
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {getTypeLabel(type as TagOption["type"])}
                    </button>
                ))}
            </div>

            {/* Tags List */}
            <SectionCard
                title="Available Tags"
                subtitle={`${filteredTags.length} tags available`}
            >
                <div className="space-y-3 mt-4">
                    {filteredTags.map((tag) => (
                        <div
                            key={tag.id}
                            onClick={() => {
                                if (selectedTags.includes(tag.id)) {
                                    setSelectedTags(selectedTags.filter((t) => t !== tag.id));
                                } else {
                                    setSelectedTags([...selectedTags, tag.id]);
                                }
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTags.includes(tag.id)
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getColorClass(tag.color)}`}>
                                        {getTypeIcon(tag.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{tag.name}</h3>
                                            <Pill label={getTypeLabel(tag.type)} tone="neutral" />
                                        </div>
                                        {tag.budget && (
                                            <div className="mt-1">
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>Budget</span>
                                                    <span>
                                                        {formatCurrency(tag.used || 0)} / {formatCurrency(tag.budget)}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className={`h-1.5 rounded-full ${budgetUsedPercent(tag) > 90
                                                                ? "bg-red-500"
                                                                : budgetUsedPercent(tag) > 70
                                                                    ? "bg-amber-500"
                                                                    : "bg-green-500"
                                                            }`}
                                                        style={{ width: `${budgetUsedPercent(tag)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTags.includes(tag.id) ? (
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Frequent Tags */}
            <SectionCard title="Frequently Used" subtitle="Quick select">
                <div className="flex flex-wrap gap-2 mt-4">
                    {FREQUENT_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => {
                                if (selectedTags.includes(tag)) {
                                    setSelectedTags(selectedTags.filter((t) => t !== tag));
                                } else {
                                    setSelectedTags([...selectedTags, tag]);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedTags.includes(tag)
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Selection Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Selected</p>
                        <p className="text-lg font-bold text-gray-900">{selectedTags.length} tag(s)</p>
                    </div>
                    <Button variant="primary" disabled={selectedTags.length === 0}>
                        Apply Tags
                    </Button>
                </div>
            </div>
        </div>
    );
}
