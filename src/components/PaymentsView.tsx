import React, { useState } from "react";
import { Booking, Invoice, SalonProfile, PaymentMethod } from "../types";
import { formatZAR, exportToCSV } from "../utils/formatters";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Building2,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

interface PaymentsViewProps {
  bookings: Booking[];
  invoices: Invoice[];
  salon: SalonProfile;
  onUpdateBooking: (booking: Booking) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  bookings,
  invoices,
  salon,
  onUpdateBooking,
  onUpdateInvoice,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Financial summary calculations
  const totalCollectedFromBookings = bookings.reduce(
    (acc, b) => acc + (b.depositPaid || 0),
    0
  );
  const totalExpectedFromBookings = bookings.reduce(
    (acc, b) => acc + (b.totalAmount || 0),
    0
  );
  const pendingDeposits = bookings
    .filter((b) => b.paymentStatus === "unpaid" && b.status !== "cancelled")
    .reduce((acc, b) => acc + (b.depositRequired || 0), 0);

  const pendingBalances = Math.max(0, totalExpectedFromBookings - totalCollectedFromBookings);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickMarkDeposit = (booking: Booking) => {
    const isNowPaid = booking.depositPaid > 0;
    const newDeposit = isNowPaid ? 0 : booking.depositRequired;
    const newStatus = isNowPaid ? "unpaid" : "deposit_paid";
    onUpdateBooking({
      ...booking,
      depositPaid: newDeposit,
      paymentStatus: newStatus as any,
      status: isNowPaid ? "upcoming" : "confirmed",
    });
  };

  const handleQuickMarkFull = (booking: Booking) => {
    onUpdateBooking({
      ...booking,
      depositPaid: booking.totalAmount,
      paymentStatus: "fully_paid",
      status: "completed",
    });
  };

  const handleExportPayments = () => {
    const rows = bookings.map((b) => ({
      "Client": b.clientName,
      "Date": b.date,
      "Total Fee (ZAR)": b.totalAmount,
      "Deposit Req (ZAR)": b.depositRequired,
      "Deposit Paid (ZAR)": b.depositPaid,
      "Payment Status": b.paymentStatus,
      "Payment Method": b.paymentMethod || "eft",
    }));
    exportToCSV(`salon_payment_records_${new Date().toISOString().split("T")[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Payment Processing & Finance</h1>
          <p className="text-sm text-stone-500 mt-1">
            Track client deposits, reconcile EFT payments, manage SnapScan QR codes, and monitor salon revenue.
          </p>
        </div>

        <button
          onClick={handleExportPayments}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Financials</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Deposits & Cash Collected
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ZAR
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatZAR(totalCollectedFromBookings)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Safely reconciled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Awaiting 50% Deposits
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              ⏳
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {formatZAR(pendingDeposits)}
          </div>
          <div className="text-xs text-stone-500 font-medium mt-1">
            Required before slot confirmation
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Outstanding Appointment Balances
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              💅
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatZAR(pendingBalances)}
          </div>
          <div className="text-xs text-stone-500 font-medium mt-1">
            Payable in-studio (Card/SnapScan/Cash)
          </div>
        </div>
      </div>

      {/* Payment Rails Section: South Africa Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Banking Details Card for EFT */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-stone-700" />
              <h3 className="font-bold text-stone-900 text-sm">EFT Banking Details (South Africa)</h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
              Zero Merchant Fees
            </span>
          </div>
          <p className="text-xs text-stone-500">
            These banking credentials are automatically included on all generated invoices, quotes, and WhatsApp messages.
          </p>

          <div className="space-y-2.5 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200/80">
            <div className="flex items-center justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Bank Name</span>
              <span className="font-bold text-stone-900">{salon.bankName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Account Holder</span>
              <span className="font-semibold text-stone-900">{salon.accountHolder}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-stone-900">{salon.accountNumber}</span>
                <button
                  onClick={() => handleCopy(salon.accountNumber, "acc")}
                  className="text-stone-400 hover:text-stone-700"
                >
                  {copiedField === "acc" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-200/50">
              <span className="text-stone-500">Branch Code</span>
              <span className="font-mono font-semibold text-stone-900">{salon.branchCode}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-stone-500">Account Type</span>
              <span className="font-medium text-stone-900">{salon.accountType}</span>
            </div>
          </div>
        </div>

        {/* Right: SnapScan & Instant Pay QR */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-stone-900 text-sm">SnapScan & Card POS (In-Studio)</h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                Instant Confirmation
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Accept tap-to-pay cards, mastercard, visa, and SnapScan QR codes at your nail station.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/60 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white border border-sky-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-10 h-10 text-sky-600" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sky-950">SnapScan Merchant QR</div>
              <p className="text-stone-600 text-[11px]">
                Paylink ID: <strong className="font-mono">{salon.snapScanId || "hushnails-rosebank"}</strong>
              </p>
              <a
                href={`https://pos.snapscan.io/qr/${salon.snapScanId || "hushnails-rosebank"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline pt-0.5"
              >
                <span>Open SnapScan Paylink</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>50% booking deposit policy protects your calendar against no-shows.</span>
          </div>
        </div>
      </div>

      {/* Reconcile Client Deposits & Balances Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Recent Booking Transactions & Deposit Tracker</h3>
            <p className="text-xs text-stone-500 mt-0.5">Quickly toggle deposit paid or mark fully settled.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Appt Date</th>
                <th className="p-3 text-right">Total (ZAR)</th>
                <th className="p-3 text-right">Deposit (ZAR)</th>
                <th className="p-3 text-center">Payment Status</th>
                <th className="p-3 text-right">Quick Reconcile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.slice(0, 8).map((b) => (
                <tr key={b.id} className="hover:bg-stone-50/50">
                  <td className="p-3 font-semibold text-stone-900">
                    {b.clientName}
                    <span className="block text-[11px] font-normal text-stone-400">{b.clientPhone}</span>
                  </td>
                  <td className="p-3 text-stone-600">
                    {b.date} @ {b.time}
                  </td>
                  <td className="p-3 text-right font-bold text-stone-900">
                    {formatZAR(b.totalAmount)}
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-700">
                    {formatZAR(b.depositPaid)} / {formatZAR(b.depositRequired)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        b.paymentStatus === "fully_paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.paymentStatus === "deposit_paid"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.paymentStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleQuickMarkDeposit(b)}
                        className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                          b.depositPaid > 0
                            ? "border-stone-200 text-stone-500 hover:bg-stone-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                        }`}
                      >
                        {b.depositPaid > 0 ? "Reset Deposit" : "+50% Deposit"}
                      </button>

                      {b.paymentStatus !== "fully_paid" && (
                        <button
                          onClick={() => handleQuickMarkFull(b)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
