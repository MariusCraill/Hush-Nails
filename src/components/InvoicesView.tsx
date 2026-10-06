import React, { useState } from "react";
import { Invoice, InvoiceItem, InvoiceType, InvoiceStatus, MenuItem, SalonProfile, Booking } from "../types";
import { formatZAR, generateWhatsAppInvoiceLink, exportToCSV } from "../utils/formatters";
import { InvoicePrintModal } from "./InvoicePrintModal";
import {
  Plus,
  Search,
  ReceiptText,
  FileText,
  MessageCircle,
  Printer,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Share2
} from "lucide-react";

interface InvoicesViewProps {
  invoices: Invoice[];
  menu: MenuItem[];
  bookings: Booking[];
  salon: SalonProfile;
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  menu,
  bookings,
  salon,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
}) => {
  const [docTypeFilter, setDocTypeFilter] = useState<"all" | "invoice" | "quote">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Modal Form State
  const [formType, setFormType] = useState<InvoiceType>("invoice");
  const [formNumber, setFormNumber] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("+27 ");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [formItems, setFormItems] = useState<InvoiceItem[]>([]);
  const [formDiscount, setFormDiscount] = useState<number | string>(0);
  const [formDepositPaid, setFormDepositPaid] = useState<number | string>(0);
  const [formStatus, setFormStatus] = useState<InvoiceStatus>("sent");
  const [formNotes, setFormNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const generateNextNumber = (type: InvoiceType) => {
    const prefix = type === "quote" ? "QT-2026" : "INV-2026";
    const existing = invoices.filter((i) => i.type === type);
    const nextSeq = String(existing.length + 1).padStart(3, "0");
    return `${prefix}-${nextSeq}`;
  };

  const handleOpenAdd = (type: InvoiceType = "invoice") => {
    setEditingInvoice(null);
    setFormType(type);
    setFormNumber(generateNextNumber(type));
    setFormClientName("");
    setFormClientPhone("+27 ");
    setFormClientEmail("");
    setFormDate(todayStr);
    setFormDueDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);

    // Pre-populate with first popular item from menu
    const popularItem = menu.find((m) => m.isPopular && m.isActive) || menu[0];
    if (popularItem) {
      setFormItems([
        {
          id: `item-${Date.now()}`,
          description: popularItem.name,
          qty: 1,
          unitPrice: popularItem.price,
          total: popularItem.price,
        },
      ]);
    } else {
      setFormItems([
        {
          id: `item-${Date.now()}`,
          description: "Plain Acrylic Full Set (Tips)",
          qty: 1,
          unitPrice: 380,
          total: 380,
        },
      ]);
    }

    setFormDiscount(0);
    setFormDepositPaid(0);
    setFormStatus(type === "quote" ? "draft" : "sent");
    setFormNotes(
      type === "quote"
        ? "Quotation valid for 7 days. 50% deposit required upon acceptance."
        : `Payment ref: ${generateNextNumber(type)}. Remaining balance due upon arrival.`
    );
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormType(inv.type);
    setFormNumber(inv.number);
    setFormClientName(inv.clientName);
    setFormClientPhone(inv.clientPhone);
    setFormClientEmail(inv.clientEmail || "");
    setFormDate(inv.date);
    setFormDueDate(inv.dueDate);
    setFormItems(inv.items);
    setFormDiscount(inv.discount);
    setFormDepositPaid(inv.depositPaid);
    setFormStatus(inv.status);
    setFormNotes(inv.notes || "");
    setIsModalOpen(true);
  };

  const handleAddItemFromMenu = (menuItem: MenuItem) => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      description: menuItem.name,
      qty: 1,
      unitPrice: menuItem.price,
      total: menuItem.price,
    };
    setFormItems([...formItems, newItem]);
  };

  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      description: "Custom Nail Art / Extra",
      qty: 1,
      unitPrice: 100,
      total: 100,
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "qty" || field === "unitPrice") {
      const q = Number(updated[index].qty) || 1;
      const u = Number(updated[index].unitPrice) || 0;
      updated[index].total = q * u;
    }
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const subtotal = formItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const discountNum = Number(formDiscount) || 0;
  const depositPaidNum = Number(formDepositPaid) || 0;
  const balanceDue = Math.max(0, subtotal - discountNum - depositPaidNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim() || formItems.length === 0) return;

    if (editingInvoice) {
      onUpdateInvoice({
        ...editingInvoice,
        type: formType,
        number: formNumber,
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim(),
        clientEmail: formClientEmail.trim(),
        date: formDate,
        dueDate: formDueDate,
        items: formItems,
        subtotal,
        discount: discountNum,
        depositPaid: depositPaidNum,
        balanceDue,
        status: formStatus,
        notes: formNotes.trim(),
      });
    } else {
      const newInvoice: Invoice = {
        id: `doc-${Date.now()}`,
        number: formNumber || generateNextNumber(formType),
        type: formType,
        clientName: formClientName.trim(),
        clientPhone: formClientPhone.trim(),
        clientEmail: formClientEmail.trim(),
        date: formDate,
        dueDate: formDueDate,
        items: formItems,
        subtotal,
        discount: discountNum,
        depositPaid: depositPaidNum,
        balanceDue,
        status: formStatus,
        notes: formNotes.trim(),
      };
      onAddInvoice(newInvoice);
    }
    setIsModalOpen(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesType = docTypeFilter === "all" || inv.type === docTypeFilter;
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientPhone.includes(searchQuery);
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    const rows = invoices.map((i) => ({
      "Type": i.type.toUpperCase(),
      "Doc Number": i.number,
      "Client": i.clientName,
      "Phone": i.clientPhone,
      "Date": i.date,
      "Due Date": i.dueDate,
      "Subtotal (ZAR)": i.subtotal,
      "Discount (ZAR)": i.discount,
      "Deposit Paid (ZAR)": i.depositPaid,
      "Balance Due (ZAR)": i.balanceDue,
      "Status": i.status,
    }));
    exportToCSV(`nail_studio_invoices_${todayStr}`, rows);
  };

  const totalInvoiced = invoices
    .filter((i) => i.type === "invoice")
    .reduce((acc, curr) => acc + curr.subtotal, 0);

  const totalBalanceDue = invoices
    .filter((i) => i.type === "invoice")
    .reduce((acc, curr) => acc + curr.balanceDue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Quotes & Tax Invoicing</h1>
          <p className="text-sm text-stone-500 mt-1">
            Generate formal ZAR quotes and tax invoices with direct 1-tap WhatsApp sharing, itemized menu pricing, and EFT banking instructions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            title="Export all documents to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenAdd("quote")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quote</span>
          </button>

          <button
            onClick={() => handleOpenAdd("invoice")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500">Total Billed Invoices</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{formatZAR(totalInvoiced)}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            {invoices.filter((i) => i.type === "invoice").length} invoices generated
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500">Outstanding Balances</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{formatZAR(totalBalanceDue)}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Awaiting appointment payment</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-stone-500">Active Estimates & Quotes</div>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {invoices.filter((i) => i.type === "quote").length} quotes
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">WhatsApp ready</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        {/* Toggle Doc Type Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setDocTypeFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              docTypeFilter === "all" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            All Docs
          </button>
          <button
            onClick={() => setDocTypeFilter("invoice")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              docTypeFilter === "invoice" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setDocTypeFilter("quote")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              docTypeFilter === "quote" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Quotes
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search invoice # or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-200 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="accepted">Accepted</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.map((inv) => {
          const isQuote = inv.type === "quote";

          return (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Doc Number, Client & Line Item Preview */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                        isQuote
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {inv.type}
                    </span>

                    <span className="font-bold text-stone-900 text-base">
                      {inv.number}
                    </span>

                    <span className="text-sm font-semibold text-stone-800">
                      • {inv.clientName}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border capitalize ${
                        inv.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : inv.status === "sent"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : inv.status === "accepted"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-stone-100 text-stone-600 border-stone-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Itemized List Snapshot */}
                  <div className="text-xs text-stone-600 font-medium">
                    {inv.items.map((i) => `${i.description} (x${i.qty})`).join(", ")}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
                    <span>Issued: {inv.date}</span>
                    <span>Due: {inv.dueDate}</span>
                    <span>Phone: {inv.clientPhone}</span>
                  </div>
                </div>

                {/* Right: Amounts & Quick Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                  <div className="text-left lg:text-right">
                    <div className="text-lg font-bold text-stone-900">
                      {formatZAR(inv.balanceDue > 0 ? inv.balanceDue : inv.subtotal)}
                    </div>
                    <div className="text-xs text-stone-500 font-medium">
                      {inv.balanceDue > 0
                        ? `Balance Due (Total: ${formatZAR(inv.subtotal)})`
                        : "Fully Settled"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* WhatsApp 1-tap sender */}
                    <a
                      href={generateWhatsAppInvoiceLink(inv, salon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Send itemized invoice via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp {isQuote ? "Quote" : "Invoice"}</span>
                    </a>

                    {/* View / Print modal */}
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                      title="Print or view receipt"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-500" />
                      <span>Print / PDF</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(inv)}
                      className="p-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
                      title="Edit document"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="p-1.5 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
            <ReceiptText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-800 text-sm">No invoices or quotes found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Create a new tax invoice or quote to send clients via WhatsApp or print as a receipt.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => handleOpenAdd("quote")}
                className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl"
              >
                + New Quote
              </button>
              <button
                onClick={() => handleOpenAdd("invoice")}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-xl"
              >
                + New Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">
                {editingInvoice
                  ? `Edit ${formType.toUpperCase()}: ${formNumber}`
                  : `Create New ${formType === "quote" ? "Quotation" : "Tax Invoice"}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Type, Number, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as InvoiceType;
                      setFormType(t);
                      if (!editingInvoice) setFormNumber(generateNextNumber(t));
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200"
                  >
                    <option value="invoice">Tax Invoice</option>
                    <option value="quote">Quotation / Estimate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-stone-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent to Client</option>
                    <option value="paid">Paid in Full</option>
                    <option value="accepted">Accepted (Quote)</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nandi Madida"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+27 82 123 4567"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              {/* Itemized Services Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800">
                    Itemized Services & Pricing (ZAR)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* Quick Add from Menu dropdown */}
                    <select
                      onChange={(e) => {
                        const itm = menu.find((m) => m.id === e.target.value);
                        if (itm) handleAddItemFromMenu(itm);
                        e.target.value = "";
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 font-medium text-stone-700"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        + Add from Menu
                      </option>
                      {menu.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({formatZAR(m.price)})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 w-16 text-center">Qty</th>
                        <th className="p-2.5 w-24 text-right">Price (R)</th>
                        <th className="p-2.5 w-24 text-right">Total</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formItems.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(index, "description", e.target.value)
                              }
                              className="w-full px-2 py-1 text-xs rounded-lg border border-stone-200"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={1}
                              required
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateItem(index, "qty", Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs text-center rounded-lg border border-stone-200"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              required
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(
                                  index,
                                  "unitPrice",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1 text-xs text-right font-semibold rounded-lg border border-stone-200"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-stone-900">
                            {formatZAR(item.total)}
                          </td>
                          <td className="p-2 text-center">
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-stone-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-stone-900">{formatZAR(subtotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Discount (ZAR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Deposit Received (ZAR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formDepositPaid}
                      onChange={(e) => setFormDepositPaid(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                  <span>Total Balance Due:</span>
                  <span className="text-base text-rose-600">{formatZAR(balanceDue)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes & Banking Reference Instructions
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Please use invoice number as EFT payment reference."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs"
                >
                  {editingInvoice ? "Save Document" : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal Preview */}
      <InvoicePrintModal
        invoice={previewInvoice}
        salon={salon}
        onClose={() => setPreviewInvoice(null)}
      />
    </div>
  );
};
