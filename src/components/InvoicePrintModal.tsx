import React, { useState } from "react";
import { Invoice, SalonProfile } from "../types";
import {
  formatZAR,
  generateWhatsAppInvoiceLink,
  formatWhatsAppInvoiceMessage,
  copyToClipboard,
} from "../utils/formatters";
import { SalonLogo } from "./SalonLogo";
import { X, Printer, MessageCircle, Download, CheckCircle2, Copy, Check } from "lucide-react";

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  salon: SalonProfile;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  salon,
  onClose,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!invoice) return null;

  const isQuote = invoice.type === "quote";
  const docTitle = isQuote ? "QUOTATION / ESTIMATE" : "TAX INVOICE";

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = async () => {
    const formatted = formatWhatsAppInvoiceMessage(invoice, salon);
    const ok = await copyToClipboard(formatted);
    if (ok) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-auto print:border-none print:shadow-none print:p-0">
        {/* Actions Bar (hidden when printing) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
              {docTitle}
            </span>
            <span className="text-xs text-stone-500 font-medium">#{invoice.number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
              title="Copy pre-formatted WhatsApp text with banking details"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <a
              href={generateWhatsAppInvoiceLink(invoice, salon)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </a>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-stone-900 font-sans" id="printable-invoice">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <SalonLogo salon={salon} size="md" roundedClassName="rounded-xl" />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-stone-900 uppercase">
                    {salon.salonName}
                  </h1>
                  <p className="text-xs text-stone-500 font-medium">{salon.tagline}</p>
                </div>
              </div>
              <div className="text-xs text-stone-600 space-y-0.5 mt-2.5">
                <p>{salon.address}</p>
                <p>{salon.city}</p>
                <p>WhatsApp: {salon.phone} | {salon.email}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xl font-extrabold text-stone-900 uppercase tracking-wide">
                {docTitle}
              </div>
              <p className="text-sm font-bold text-stone-700 mt-1">#{invoice.number}</p>
              <div className="text-xs text-stone-500 space-y-0.5 mt-2 font-medium">
                <p>Issue Date: {invoice.date}</p>
                <p>Due Date: {invoice.dueDate}</p>
                <p className="capitalize">
                  Status: <strong className="text-stone-800">{invoice.status}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Client Info Block */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
              Billed To
            </div>
            <div className="font-bold text-sm text-stone-900">{invoice.clientName}</div>
            <div className="text-xs text-stone-600 space-y-0.5 mt-0.5">
              <p>Phone: {invoice.clientPhone}</p>
              {invoice.clientEmail && <p>Email: {invoice.clientEmail}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-2.5 px-2">Service Description</th>
                  <th className="py-2.5 px-2 text-center w-16">Qty</th>
                  <th className="py-2.5 px-2 text-right w-24">Unit (ZAR)</th>
                  <th className="py-2.5 px-2 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {invoice.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="py-2.5 px-2 font-medium text-stone-800">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-2 text-center text-stone-600">
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-2 text-right text-stone-600 font-medium">
                      {formatZAR(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-stone-900">
                      {formatZAR(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-900">{formatZAR(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Special Discount:</span>
                  <span>-{formatZAR(invoice.discount)}</span>
                </div>
              )}
              {invoice.depositPaid > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Deposit Received:</span>
                  <span>-{formatZAR(invoice.depositPaid)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-stone-900 text-sm font-bold text-stone-900">
                <span>Total Balance Due:</span>
                <span className="text-base font-black">{formatZAR(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* South African Banking Details for EFT */}
          {!isQuote && (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
                🏦 Banking Details for EFT Transfer
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-stone-500 text-[11px] block">Bank Name</span>
                  <span className="font-bold text-stone-800">{salon.bankName}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block">Account Holder</span>
                  <span className="font-medium text-stone-800">{salon.accountHolder}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block">Account Number</span>
                  <span className="font-bold text-stone-900">{salon.accountNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block">Branch Code</span>
                  <span className="font-medium text-stone-800">{salon.branchCode}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block">Account Type</span>
                  <span className="font-medium text-stone-800">{salon.accountType}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[11px] block">Payment Reference</span>
                  <span className="font-bold text-rose-600">{invoice.number}</span>
                </div>
              </div>
              {salon.snapScanId && (
                <div className="mt-3 pt-2 border-t border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
                  <span>SnapScan QR Code available at studio:</span>
                  <span className="font-mono font-semibold text-stone-800">pos.snapscan.io/qr/{salon.snapScanId}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes & Policy */}
          <div className="text-[11px] text-stone-500 space-y-1 pt-2 border-t border-stone-100">
            {invoice.notes && (
              <p>
                <strong className="text-stone-700">Special Notes:</strong> {invoice.notes}
              </p>
            )}
            <p>
              <strong className="text-stone-700">Terms & Conditions:</strong> {salon.cancellationPolicy}
            </p>
            <p className="text-center italic pt-2 text-stone-400">
              Thank you for supporting {salon.salonName}! We appreciate your business. ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
