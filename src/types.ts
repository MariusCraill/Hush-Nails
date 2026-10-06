export type ServiceCategory =
  | "Acrylic Extensions"
  | "BIAB & Gel Overlays"
  | "Nail Art & Add-ons"
  | "Pedicures & Spa"
  | "Maintenance & Soak-off";

export interface MenuItem {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number; // in ZAR (R)
  durationMinutes: number;
  description: string;
  isPopular?: boolean;
  isActive: boolean;
}

export type BookingStatus =
  | "upcoming"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "unpaid" | "deposit_paid" | "fully_paid" | "refunded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "eft"
  | "snapscan"
  | "zapper"
  | "instant_pay";

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  serviceIds: string[];
  customNotes?: string;
  nailInspoDetails?: string;
  totalAmount: number;
  depositRequired: number;
  depositPaid: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export type InvoiceType = "invoice" | "quote";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "accepted";

export interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  date: string;
  dueDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  bookingId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  depositPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type SocialPlatform = "TikTok" | "Instagram" | "WhatsApp Status" | "Facebook";

export interface MarketingPost {
  id: string;
  platform: SocialPlatform;
  scheduledDate: string;
  scheduledTime: string;
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  format: string;
  status: "draft" | "scheduled" | "posted";
  serviceFocus?: string;
  bestPostingTime?: string;
}

export interface MarketingIdea {
  title: string;
  platform: SocialPlatform;
  hook: string;
  format: string;
  bestPostingTime: string;
  caption: string;
  hashtags: string[];
  estimatedReach: string;
  callToAction: string;
}

export interface SalonProfile {
  salonName: string;
  tagline: string;
  logoType?: "emoji" | "image";
  logoEmoji?: string;
  logoUrl?: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  snapScanId: string;
  depositPercentage: number;
  cancellationPolicy: string;
  adminUsername?: string;
  adminPassword?: string;
}

export type UserRole = "admin" | "client";

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  preferredStyle?: string;
  isVip?: boolean;
  createdAt?: string;
  lastVisit?: string;
}

export interface UserSession {
  role: UserRole;
  client?: ClientProfile;
}

export interface ComboDeal {
  id: string;
  title: string;
  tagline: string;
  badge?: string; // e.g. "Best Value", "Client Favorite", "Save R140"
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  durationMinutes: number;
  description: string;
  includedItems: string[];
  serviceIds: string[];
  isPopular?: boolean;
}

export interface SpecialOffer {
  id: string;
  title: string;
  code: string;
  badge: string;
  discountText: string;
  description: string;
  validity: string;
  terms?: string;
}
