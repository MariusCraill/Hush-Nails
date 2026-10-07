import { Booking, Invoice, SalonProfile } from "../types";

export function formatZAR(amount: number): string {
  return `R ${Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function cleanPhoneNumber(phone: string): string {
  // Cleans South African numbers: e.g., 082 123 4567 -> 27821234567
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `27${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("27")) {
    return cleaned;
  }
  return cleaned;
}

export type WhatsAppBookingType =
  | "confirm"
  | "reminder"
  | "deposit_request"
  | "client_booking"
  | "cancellation";

export interface WhatsAppBookingParams {
  type: "booking";
  booking: Booking;
  serviceNames: string;
  salon: SalonProfile;
  bookingType?: WhatsAppBookingType;
}

export interface WhatsAppInvoiceParams {
  type: "invoice";
  invoice: Invoice;
  salon: SalonProfile;
}

export type WhatsAppMessageParams = WhatsAppBookingParams | WhatsAppInvoiceParams;

/**
 * Returns a clean, non-duplicated representation of the salon's physical address & city.
 * Prevents repeating the city/suburb if already typed into the street address.
 */
export function formatStudioLocation(salon: SalonProfile): string {
  const addr = (salon.address || "").trim();
  const city = (salon.city || "").trim();
  if (!addr && !city) return "";
  if (!city) return addr;
  if (!addr) return city;
  // If street address already contains the city/suburb, avoid duplicate text
  if (addr.toLowerCase().includes(city.toLowerCase())) {
    return addr;
  }
  return `${addr}, ${city}`;
}

/**
 * Returns a direct Google Maps navigation URL for the studio location
 */
export function getGoogleMapsLink(location: string, salonName?: string): string {
  if (!location) return "";
  const query = salonName ? `${salonName}, ${location}` : location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Generates a pre-formatted WhatsApp message string for a booking,
 * explicitly including the salon's name, phone, email, studio address, and banking details.
 */
export function formatWhatsAppBookingMessage(
  booking: Booking,
  serviceNames: string,
  salon: SalonProfile,
  bookingType: WhatsAppBookingType = "confirm"
): string {
  const salonTitle = salon.salonName.toUpperCase();
  const locationStr = formatStudioLocation(salon);
  const contactBlock = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    locationStr ? `📍 *Studio:* ${locationStr}` : "",
    `📞 *WhatsApp / Call:* ${salon.phone}`,
    `✉️ *Email:* ${salon.email}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].filter(Boolean).join("\n");

  const bankingBlock = [
    `🏦 *BANKING DETAILS FOR EFT DEPOSIT:*`,
    `• Bank: ${salon.bankName}`,
    `• Account Holder: ${salon.accountHolder}`,
    `• Account No: ${salon.accountNumber}`,
    `• Branch Code: ${salon.branchCode}`,
    `• Account Type: ${salon.accountType}`,
    `• Payment Ref: *${booking.clientName.replace(/\s+/g, "")}-Nails*`,
    salon.snapScanId ? `📲 SnapScan Paylink: pos.snapscan.io/qr/${salon.snapScanId}` : "",
  ].filter(Boolean).join("\n");

  if (bookingType === "deposit_request") {
    return [
      `💅 *${salonTitle} - DEPOSIT REQUEST*`,
      `✨ ${salon.tagline || "Bespoke Nail Art & Care"}`,
      contactBlock,
      ``,
      `Hi *${booking.clientName}*! 💅✨`,
      `Thank you for booking with *${salon.salonName}*. We have reserved your appointment slot.`,
      ``,
      `📅 *Date:* ${booking.date}`,
      `⏰ *Time:* ${booking.time}`,
      `💅 *Service(s):* ${serviceNames}`,
      `⏱️ *Estimated Duration:* ${booking.durationMinutes || 90} mins`,
      `💰 *Total Amount:* ${formatZAR(booking.totalAmount)}`,
      `🔒 *${salon.depositPercentage}% Deposit Required to Confirm:* ${formatZAR(booking.depositRequired)}`,
      ``,
      bankingBlock,
      ``,
      `⚠️ *Policy:* ${salon.cancellationPolicy || "50% non-refundable deposit required to confirm slot."}`,
      ``,
      `Kindly reply with your proof of payment to confirm your booking! Can't wait to glam your nails! 💕✨`,
    ].join("\n");
  }

  if (bookingType === "reminder") {
    const remainingBalance = Math.max(0, booking.totalAmount - (booking.depositPaid || 0));
    return [
      `⏰ *${salonTitle} - APPOINTMENT REMINDER*`,
      contactBlock,
      ``,
      `Hi *${booking.clientName}*! Friendly reminder about your nail appointment tomorrow:`,
      ``,
      `📅 *Date:* Tomorrow, ${booking.date}`,
      `⏰ *Time:* ${booking.time}`,
      `💅 *Services:* ${serviceNames}`,
      `💰 *Remaining Balance Due:* ${formatZAR(remainingBalance)}`,
      ``,
      locationStr ? `📍 *Location:* ${locationStr}` : "",
      `📞 *Contact Us:* ${salon.phone}`,
      ``,
      `💡 *Friendly Tips:*`,
      `• Please arrive 5 minutes early with bare nails unless a soak-off was booked.`,
      `• A 15-minute grace period applies to keep all client schedules on track.`,
      ``,
      `See you soon for gorgeous nails! ✨💖`,
    ].filter(Boolean).join("\n");
  }

  if (bookingType === "client_booking") {
    return [
      `💅 *NEW CLIENT BOOKING REQUEST - ${salonTitle}*`,
      `✨ Submitted via HUSH nails Client Portal`,
      contactBlock,
      ``,
      `Hi ${salon.salonName}! I have requested an appointment via your online portal:`,
      ``,
      `👤 *Client Name:* ${booking.clientName}`,
      `📞 *WhatsApp / Phone:* ${booking.clientPhone}`,
      `📅 *Date:* ${booking.date}`,
      `⏰ *Time Slot:* ${booking.time}`,
      `💅 *Requested Service(s):* ${serviceNames}`,
      `⏱️ *Duration:* ~${booking.durationMinutes || 90} minutes`,
      `💰 *Estimated Total:* ${formatZAR(booking.totalAmount)}`,
      `🔒 *${salon.depositPercentage}% Deposit Due:* ${formatZAR(booking.depositRequired)}`,
      booking.customNotes ? `📝 *Styling Notes / Preferences:* ${booking.customNotes}` : "",
      booking.nailInspoDetails ? `🎨 *Nail Inspo:* ${booking.nailInspoDetails}` : "",
      ``,
      bankingBlock,
      ``,
      `Please let me know if this slot is confirmed! Thank you! ✨💅`,
    ].filter(Boolean).join("\n");
  }

  if (bookingType === "cancellation") {
    return [
      `💅 *${salonTitle} - BOOKING NOTICE*`,
      contactBlock,
      ``,
      `Hi *${booking.clientName}*,`,
      `This message confirms that your appointment scheduled for *${booking.date}* at *${booking.time}* for *${serviceNames}* has been updated or cancelled.`,
      ``,
      `If you would like to reschedule or have any questions, please reply directly or call us at *${salon.phone}*.`,
      ``,
      `Warm regards,\n*${salon.salonName} Team*`,
    ].join("\n");
  }

  // Default: "confirm"
  return [
    `💅 *${salonTitle} - BOOKING CONFIRMATION*`,
    `✨ ${salon.tagline || "Bespoke Nail Art & Care"}`,
    contactBlock,
    ``,
    `Yay! Your appointment at *${salon.salonName}* is confirmed! 💅🎉`,
    ``,
    `👤 *Client:* ${booking.clientName}`,
    `📅 *Date:* ${booking.date}`,
    `⏰ *Time:* ${booking.time}`,
    `💅 *Confirmed Services:* ${serviceNames}`,
    `⏱️ *Estimated Duration:* ${booking.durationMinutes || 90} mins`,
    `💰 *Total Amount:* ${formatZAR(booking.totalAmount)}`,
    `✅ *Deposit Paid:* ${formatZAR(booking.depositPaid)}`,
    booking.totalAmount - booking.depositPaid > 0
      ? `🔥 *Remaining Balance on Arrival:* ${formatZAR(booking.totalAmount - booking.depositPaid)}`
      : `✨ *Status:* Fully Paid`,
    ``,
    locationStr ? `📍 *Studio Address:* ${locationStr}` : "",
    `📞 *Studio Contact:* ${salon.phone} | ${salon.email}`,
    salon.snapScanId ? `📲 *SnapScan Paylink:* pos.snapscan.io/qr/${salon.snapScanId}` : "",
    ``,
    `⚠️ *Policy:* ${salon.cancellationPolicy || "Rescheduling permitted with 24 hours notice. 15-minute grace period applies."}`,
    ``,
    `Thank you for supporting ${salon.salonName}! We can't wait to glam your nails! ✨💖`,
  ].filter(Boolean).join("\n");
}

/**
 * Generates a pre-formatted WhatsApp message string for an invoice or quote,
 * explicitly including the salon's name, contact details, itemized breakdown, and banking details.
 */
export function formatWhatsAppInvoiceMessage(
  invoice: Invoice,
  salon: SalonProfile
): string {
  const isQuote = invoice.type === "quote";
  const docTitle = isQuote ? "ESTIMATE / QUOTE" : "TAX INVOICE";
  const salonTitle = salon.salonName.toUpperCase();
  const locationStr = formatStudioLocation(salon);

  const lines: string[] = [
    `💅 *${salonTitle}*`,
    `✨ ${salon.tagline || "Bespoke Sculpted Acrylics & BIAB Natural Care"}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    locationStr ? `📍 *Address:* ${locationStr}` : "",
    `📞 *WhatsApp / Call:* ${salon.phone}`,
    `✉️ *Email:* ${salon.email}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🧾 *${docTitle}: #${invoice.number}*`,
    `📅 *Issue Date:* ${invoice.date}`,
    invoice.dueDate ? `⏳ *Due Date:* ${invoice.dueDate}` : "",
    `👤 *Client Name:* ${invoice.clientName}`,
    `📞 *Client Phone:* ${invoice.clientPhone}`,
    `--------------------------------`,
    `*ITEMIZED SERVICES & PRODUCTS:*`,
  ].filter(Boolean);

  invoice.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.description} (x${item.qty}) - *${formatZAR(item.total)}*`
    );
  });

  lines.push(`--------------------------------`);
  lines.push(`💰 Subtotal: ${formatZAR(invoice.subtotal)}`);
  if (invoice.discount > 0) {
    lines.push(`🎁 Promotional Discount: -${formatZAR(invoice.discount)}`);
  }
  if (invoice.depositPaid > 0) {
    lines.push(`✅ Deposit Paid: ${formatZAR(invoice.depositPaid)}`);
  }
  lines.push(`🔥 *BALANCE DUE: ${formatZAR(invoice.balanceDue)}*`);
  lines.push(``);

  if (!isQuote && invoice.balanceDue > 0) {
    lines.push(`🏦 *BANKING DETAILS FOR EFT PAYMENT:*`);
    lines.push(`• Bank: ${salon.bankName}`);
    lines.push(`• Account Holder: ${salon.accountHolder}`);
    lines.push(`• Account No: ${salon.accountNumber}`);
    lines.push(`• Branch Code: ${salon.branchCode}`);
    lines.push(`• Account Type: ${salon.accountType}`);
    lines.push(`• Reference: *${invoice.number}*`);
    if (salon.snapScanId) {
      lines.push(`📲 SnapScan Paylink: pos.snapscan.io/qr/${salon.snapScanId}`);
    }
    lines.push(``);
  }

  if (invoice.notes) {
    lines.push(`📝 *Notes & Instructions:* ${invoice.notes}`);
    lines.push(``);
  }

  lines.push(`Thank you for supporting *${salon.salonName}*! We can't wait to glam your nails. ✨💖`);

  return lines.join("\n");
}

/**
 * Unified utility function to generate pre-formatted WhatsApp message strings
 * for bookings and invoices, including the salon's name and contact details.
 */
export function generateFormattedWhatsAppMessage(params: WhatsAppMessageParams): string {
  if (params.type === "booking") {
    return formatWhatsAppBookingMessage(
      params.booking,
      params.serviceNames,
      params.salon,
      params.bookingType
    );
  } else {
    return formatWhatsAppInvoiceMessage(params.invoice, params.salon);
  }
}

/**
 * Generates direct WhatsApp wa.me click-to-chat URL with pre-formatted invoice message.
 */
export function generateWhatsAppInvoiceLink(
  invoice: Invoice,
  salon: SalonProfile
): string {
  const fullText = formatWhatsAppInvoiceMessage(invoice, salon);
  const targetPhone = cleanPhoneNumber(invoice.clientPhone);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generates direct WhatsApp wa.me click-to-chat URL with pre-formatted booking message.
 */
export function generateWhatsAppBookingLink(
  booking: Booking,
  serviceNames: string,
  salon: SalonProfile,
  type: WhatsAppBookingType = "confirm"
): string {
  const targetPhone = cleanPhoneNumber(booking.clientPhone);
  const message = formatWhatsAppBookingMessage(booking, serviceNames, salon, type);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

