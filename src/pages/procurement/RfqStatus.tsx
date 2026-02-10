// ============================================================================
// RFQ Status Page
// Track RFQ progress and Q&A with vendors
// ============================================================================

import React, { useState } from "react";
import {
  FileText,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { SectionCard } from "../../components/ui/SectionCard";
import { Button } from "../../components/ui/Button";
import { Pill } from "../../components/ui/Pill";

type RFQStatus = "draft" | "published" | "evaluating" | "awarded" | "closed";

interface RFQItem {
  id: string;
  rfqNumber: string;
  title: string;
  department: string;
  status: RFQStatus;
  submissionDeadline: string;
  responses: number;
  questions: number;
  budget: number;
  createdAt: string;
  vendors: Array<{ name: string; status: string }>;
}

interface Question {
  id: string;
  vendor: string;
  question: string;
  answer?: string;
  submittedAt: string;
  answeredAt?: string;
}

const sampleRFQs: RFQItem[] = [
  {
    id: "1",
    rfqNumber: "RFQ-2024-001",
    title: "Office Equipment Procurement Q1",
    department: "IT",
    status: "published",
    submissionDeadline: "2024-02-15",
    responses: 5,
    questions: 12,
    budget: 25000000,
    createdAt: "2024-01-15",
    vendors: [
      { name: "Tech Supplies Ltd", status: "Submitted" },
      { name: "Office Solutions", status: "Viewed" },
      { name: "Prime Equipment", status: "Pending" },
      { name: "Global Tech", status: "Viewed" },
      { name: "Supply Chain Co", status: "Pending" },
    ],
  },
  {
    id: "2",
    rfqNumber: "RFQ-2024-002",
    title: "Security Systems Upgrade",
    department: "Operations",
    status: "evaluating",
    submissionDeadline: "2024-01-30",
    responses: 3,
    questions: 8,
    budget: 45000000,
    createdAt: "2024-01-10",
    vendors: [
      { name: "SecureTech", status: "Submitted" },
      { name: "SafetyFirst", status: "Submitted" },
      { name: "SecureWorld", status: "Submitted" },
    ],
  },
  {
    id: "3",
    rfqNumber: "RFQ-2024-003",
    title: "Fleet Management Software",
    department: "Transport",
    status: "awarded",
    submissionDeadline: "2024-01-20",
    responses: 4,
    questions: 5,
    budget: 15000000,
    createdAt: "2024-01-05",
    vendors: [
      { name: "FleetPro", status: "Awarded" },
      { name: "TrackMaster", status: "Submitted" },
      { name: "AutoFleet", status: "Submitted" },
      { name: "FleetTrack", status: "Submitted" },
    ],
  },
];

const sampleQuestions: Question[] = [
  {
    id: "1",
    vendor: "Tech Supplies Ltd",
    question: "What is the preferred payment terms for this procurement?",
    answer: "Net 30 days from invoice date",
    submittedAt: "2024-01-16T10:30:00Z",
    answeredAt: "2024-01-16T14:00:00Z",
  },
  {
    id: "2",
    vendor: "Office Solutions",
    question: "Is installation service included in the quoted price?",
    answer: "Yes, installation and training are included",
    submittedAt: "2024-01-17T09:15:00Z",
    answeredAt: "2024-01-17T11:30:00Z",
  },
  {
    id: "3",
    vendor: "Prime Equipment",
    question: "Can we submit a partial quote for only some line items?",
    submittedAt: "2024-01-18T16:45:00Z",
  },
];

export default function RFQStatus() {
  const [selectedRFQ, setSelectedRFQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "responses">("overview");
  const [newQuestion, setNewQuestion] = useState("");
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: RFQStatus) => {
    switch (status) {
      case "draft":
        return { label: "Draft", tone: "neutral" as const };
      case "published":
        return { label: "Published", tone: "info" as const };
      case "evaluating":
        return { label: "Evaluating", tone: "warn" as const };
      case "awarded":
        return { label: "Awarded", tone: "good" as const };
      case "closed":
        return { label: "Closed", tone: "neutral" as const };
    }
  };

  const stats = {
    total: sampleRFQs.length,
    published: sampleRFQs.filter((r) => r.status === "published").length,
    evaluating: sampleRFQs.filter((r) => r.status === "evaluating").length,
    awarded: sampleRFQs.filter((r) => r.status === "awarded").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Status</h1>
          <p className="text-gray-500 mt-1">Track your RFQs and manage vendor communications</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SectionCard title="Total RFQs" subtitle="All time">
          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </SectionCard>
        <SectionCard title="Published" subtitle="Awaiting responses">
          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-700">{stats.published}</p>
          </div>
        </SectionCard>
        <SectionCard title="Evaluating" subtitle="Reviewing responses">
          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-700">{stats.evaluating}</p>
          </div>
        </SectionCard>
        <SectionCard title="Awarded" subtitle="Successfully awarded">
          <div className="flex items-center gap-3 mt-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-700">{stats.awarded}</p>
          </div>
        </SectionCard>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFQ List */}
        <div className="lg:col-span-1">
          <SectionCard title="Your RFQs" subtitle={`${sampleRFQs.length} items`}>
            <div className="space-y-3 mt-4">
              {sampleRFQs.map((rfq) => {
                const status = getStatusConfig(rfq.status);
                return (
                  <div
                    key={rfq.id}
                    onClick={() => setSelectedRFQ(rfq.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedRFQ === rfq.id ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{rfq.rfqNumber}</h3>
                          <Pill label={status.label} tone={status.tone} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{rfq.title}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {rfq.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(rfq.budget)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* RFQ Details */}
        <div className="lg:col-span-2">
          {selectedRFQ ? (
            (() => {
              const rfq = sampleRFQs.find((r) => r.id === selectedRFQ);
              if (!rfq) return null;
              const status = getStatusConfig(rfq.status);

              return (
                <SectionCard
                  title={rfq.title}
                  subtitle={`${rfq.rfqNumber} | Created ${formatDate(rfq.createdAt)}`}
                >
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-gray-200 mt-4">
                    {(["overview", "questions", "responses"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === tab
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Status</p>
                          <Pill label={status.label} tone={status.tone} />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Deadline</p>
                          <p className="font-medium text-gray-900">{formatDate(rfq.submissionDeadline)}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Responses</p>
                          <p className="font-medium text-gray-900">{rfq.responses}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-medium text-gray-900">{formatCurrency(rfq.budget)}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Vendors ({rfq.vendors.length})</h4>
                        <div className="space-y-2">
                          {rfq.vendors.map((vendor, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">{vendor.name}</span>
                              </div>
                              <Pill
                                label={vendor.status}
                                tone={vendor.status === "Submitted" ? "good" : vendor.status === "Awarded" ? "accent" : "neutral"}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions Tab */}
                  {activeTab === "questions" && (
                    <div className="mt-4 space-y-4">
                      {/* Ask Question */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Ask Vendor a Question</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your question to vendors..."
                          />
                          <Button variant="primary" className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Send
                          </Button>
                        </div>
                      </div>

                      {/* Q&A List */}
                      <div className="space-y-3">
                        {sampleQuestions.map((q) => (
                          <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{q.vendor}</span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(q.submittedAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{q.question}</p>
                                {q.answer ? (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-700">Answered</span>
                                      <span className="text-xs text-green-600">
                                        {q.answeredAt && formatDate(q.answeredAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-green-700">{q.answer}</p>
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    {answeringQuestion === q.id ? (
                                      <div className="space-y-2">
                                        <textarea
                                          value={answer}
                                          onChange={(e) => setAnswer(e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          rows={2}
                                          placeholder="Type your answer..."
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            variant="primary"
                                            onClick={() => {
                                              setAnsweringQuestion(null);
                                              setAnswer("");
                                            }}
                                          >
                                            Submit Answer
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            onClick={() => setAnsweringQuestion(null)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        onClick={() => setAnsweringQuestion(q.id)}
                                      >
                                        Answer
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responses Tab */}
                  {activeTab === "responses" && (
                    <div className="mt-4">
                      <div className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>View and compare vendor responses</p>
                        <Button variant="primary" className="mt-4">
                          Compare Responses
                        </Button>
                      </div>
                    </div>
                  )}
                </SectionCard>
              );
            })()
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select an RFQ to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
