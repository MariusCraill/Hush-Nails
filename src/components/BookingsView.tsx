import React, { useState } from "react";
import { Booking, MenuItem, SalonProfile, BookingStatus, PaymentStatus, PaymentMethod, Invoice } from "../types";
import { formatZAR, generateWhatsAppBookingLink, exportToCSV, cleanPhoneNumber } from "../utils/formatters";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle2,
  FileText,
  Search,
  Download,
  X,
  Sparkles,
  AlertCircle,
  CreditCard,
  User,
  Filter,
  Users,
  UserCheck,
  RotateCcw,
  CalendarPlus,
  History,
  Check,
  ChevronDown,
  UserPlus
} from "lucide-react";

export interface ExistingClientSummary {
  name: string;
  phone: string;
  email?: string;
  totalAppointments: number;
  lastBookingDate: string;
  lastTime?: string;
  lastServiceIds: string[];
  lastServiceNames: string;
  lastNotes?: string;
  lastNailInspo?: string;
  totalSpent: number;
}

interface BookingsViewProps {
  bookings: Booking[];
  invoices?: Invoice[];
  menu: MenuItem[];
  salon: SalonProfile;
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onConvertToInvoice: (booking: Booking) => void;
}

function calculateSuggestedNextDate(baseDateStr: string): string {
  const base = new Date(baseDateStr);
  const now = new Date();
  // Standard nail maintenance/fill cycle is 2-3 weeks (21 days)
  let target = new Date(base.getTime() + 21 * 86400000);
  if (isNaN(target.getTime()) || target < now) {
    // If date is in the past, schedule 7-14 days from today
    target = new Date(now.getTime() + 14 * 86400000);
  }
  return target.toISOString().split("T")[0];
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  invoices,
  menu,
  salon,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onConvertToInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all"); // 'all', 'today', 'tomorrow', 'upcoming', 'custom'
  const [customPickedDate, setCustomPickedDate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Existing Clients & Repeat Bookings State
  const [customClients, setCustomClients] = useState<ExistingClientSummary[]>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_custom_clients");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedExistingClient, setSelectedExistingClient] = useState<ExistingClientSummary | null>(null);
  const [showExistingClientsDirectory, setShowExistingClientsDirectory] = useState(false);
  const [directorySearchQuery, setDirectorySearchQuery] = useState("");
  
  // Client Dropdown in Booking Form State
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isDirectTypingMode, setIsDirectTypingMode] = useState(false);

  // Add New Client Modal State
  const [isAddNewClientModalOpen, setIsAddNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("+27 ");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bookingTime, setBookingTime] = useState("10:00");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [nailInspoDetails, setNailInspoDetails] = useState("");
  const [depositPaid, setDepositPaid] = useState<number | string>(0);
  const [status, setStatus] = useState<BookingStatus>("upcoming");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("eft");

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  // Helper to extract service names
  const getServiceNames = (ids: string[]) => {
    return (
      ids
        .map((id) => menu.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(" + ") || "Nail Service"
    );
  };

  // Compile unique existing clients profile directory
  const existingClients = React.useMemo(() => {
    const map = new Map<string, ExistingClientSummary>();

    // 1. Incorporate custom added clients
    customClients.forEach((c) => {
      const name = c.name.trim();
      const phone = c.phone?.trim() || "";
      const key = phone ? phone.replace(/[^0-9]/g, "") : name.toLowerCase();
      if (!key && !name) return;
      map.set(key, { ...c });
    });

    // 2. Incorporate bookings history
    bookings.forEach((b) => {
      const name = b.clientName.trim();
      const phone = b.clientPhone?.trim() || "";
      const key = phone ? phone.replace(/[^0-9]/g, "") : name.toLowerCase();
      if (!key && !name) return;

      const svcNames = b.serviceIds
        .map((id) => menu.find((m) => m.id === id)?.name)
        .filter(Boolean)
        .join(" + ") || "Nail Service";

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: b.clientName,
          phone: b.clientPhone,
          email: b.clientEmail,
          totalAppointments: 1,
          lastBookingDate: b.date,
          lastTime: b.time,
          lastServiceIds: b.serviceIds || [],
          lastServiceNames: svcNames,
          lastNotes: b.customNotes,
          lastNailInspo: b.nailInspoDetails,
          totalSpent: b.totalAmount || 0,
        });
      } else {
        existing.totalAppointments += 1;
        existing.totalSpent += b.totalAmount || 0;
        if (b.date >= existing.lastBookingDate) {
          existing.lastBookingDate = b.date;
          existing.lastTime = b.time;
          existing.lastServiceIds = b.serviceIds || [];
          existing.lastServiceNames = svcNames;
          if (b.customNotes) existing.lastNotes = b.customNotes;
          if (b.nailInspoDetails) existing.lastNailInspo = b.nailInspoDetails;
          if (b.clientEmail) existing.email = b.clientEmail;
        }
      }
    });

    // 3. Incorporate invoices history
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        const name = inv.clientName.trim();
        const phone = inv.clientPhone?.trim() || "";
        const key = phone ? phone.replace(/[^0-9]/g, "") : name.toLowerCase();
        if (!key && !name) return;

        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            name: inv.clientName,
            phone: inv.clientPhone,
            email: inv.clientEmail,
            totalAppointments: 1,
            lastBookingDate: inv.date,
            lastTime: "11:00",
            lastServiceIds: [],
            lastServiceNames: inv.items.map((i) => i.description).join(" + "),
            lastNotes: inv.notes,
            lastNailInspo: "",
            totalSpent: inv.subtotal || 0,
          });
        }
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      (b.lastBookingDate || "").localeCompare(a.lastBookingDate || "") ||
      a.name.localeCompare(b.name)
    );
  }, [bookings, invoices, menu, customClients]);

  // Filtered clients for the form dropdown menu
  const filteredDropdownClients = React.useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return existingClients;
    return existingClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.lastServiceNames.toLowerCase().includes(q)
    );
  }, [existingClients, clientSearchQuery]);

  // Filtered clients for quick picker dropdown (retained for backward compatibility)
  const filteredExistingClients = filteredDropdownClients;

  // Filtered clients for the directory modal
  const filteredDirectoryClients = React.useMemo(() => {
    const q = directorySearchQuery.trim().toLowerCase();
    if (!q) return existingClients;
    return existingClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.lastServiceNames.toLowerCase().includes(q) ||
        (c.lastNotes && c.lastNotes.toLowerCase().includes(q))
    );
  }, [existingClients, directorySearchQuery]);

  // Handle opening the Add New Client modal
  const handleOpenAddNewClient = (prefillName?: string) => {
    setNewClientName(prefillName || clientSearchQuery.trim() || "");
    setNewClientPhone("+27 ");
    setNewClientEmail("");
    setNewClientNotes("");
    setIsClientDropdownOpen(false);
    setIsAddNewClientModalOpen(true);
  };

  // Handle saving a new client from the modal
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const trimmedName = newClientName.trim();
    const trimmedPhone = newClientPhone.trim() || "+27 ";
    const trimmedEmail = newClientEmail.trim();
    const trimmedNotes = newClientNotes.trim();

    const newClientObj: ExistingClientSummary = {
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail || undefined,
      totalAppointments: 0,
      lastBookingDate: todayStr,
      lastTime: "10:00",
      lastServiceIds: [],
      lastServiceNames: "New Client Profile",
      lastNotes: trimmedNotes || undefined,
      totalSpent: 0,
    };

    const clientKey = trimmedPhone.replace(/[^0-9]/g, "") || trimmedName.toLowerCase();
    const updatedCustomClients = [
      newClientObj,
      ...customClients.filter((c) => {
        const k = c.phone ? c.phone.replace(/[^0-9]/g, "") : c.name.toLowerCase();
        return k !== clientKey;
      }),
    ];

    setCustomClients(updatedCustomClients);
    try {
      localStorage.setItem("nail_studio_custom_clients", JSON.stringify(updatedCustomClients));
    } catch (err) {
      console.error(err);
    }

    // Auto-select this newly created client into the booking form
    handleSelectExistingClient(newClientObj);
    setIsAddNewClientModalOpen(false);
    setIsDirectTypingMode(false);
    setClientSearchQuery("");
  };

  // Detected existing client when typing
  const detectedExistingClient = React.useMemo(() => {
    if (selectedExistingClient || editingBooking) return null;
    const trimmedName = clientName.trim().toLowerCase();
    const cleanPhone = clientPhone.replace(/[^0-9]/g, "");

    if (cleanPhone.length >= 7) {
      const match = existingClients.find((c) =>
        c.phone.replace(/[^0-9]/g, "").includes(cleanPhone)
      );
      if (match) return match;
    }

    if (trimmedName.length >= 3) {
      const match = existingClients.find((c) =>
        c.name.toLowerCase().includes(trimmedName)
      );
      if (match) return match;
    }

    return null;
  }, [clientName, clientPhone, selectedExistingClient, editingBooking, existingClients]);

  // Select an existing client into the form
  const handleSelectExistingClient = (client: ExistingClientSummary) => {
    setSelectedExistingClient(client);
    setClientName(client.name);
    setClientPhone(client.phone);
    if (client.email) setClientEmail(client.email);
    if (client.lastNotes) setCustomNotes(client.lastNotes);
    if (client.lastNailInspo) setNailInspoDetails(client.lastNailInspo);
    if (client.lastTime) setBookingTime(client.lastTime);
    if (client.lastServiceIds && client.lastServiceIds.length > 0) {
      setSelectedServiceIds(client.lastServiceIds);
    }
    setIsClientDropdownOpen(false);
  };

  // Rebook client: creates a new appointment from an existing booking or client summary
  const handleRebookClient = (clientOrBooking: Booking | ExistingClientSummary) => {
    setEditingBooking(null); // Fresh new booking
    const isSummary = "totalAppointments" in clientOrBooking;

    const cName = isSummary ? clientOrBooking.name : clientOrBooking.clientName;
    const cPhone = isSummary ? clientOrBooking.phone : clientOrBooking.clientPhone;
    const cEmail = isSummary ? (clientOrBooking.email || "") : (clientOrBooking.clientEmail || "");
    const baseDate = isSummary ? clientOrBooking.lastBookingDate : clientOrBooking.date;
    const preferredTime = isSummary ? (clientOrBooking.lastTime || "11:00") : clientOrBooking.time;
    const svcIds = isSummary ? clientOrBooking.lastServiceIds : clientOrBooking.serviceIds;
    const notes = isSummary ? (clientOrBooking.lastNotes || "") : (clientOrBooking.customNotes || "");
    const inspo = isSummary ? (clientOrBooking.lastNailInspo || "") : (clientOrBooking.nailInspoDetails || "");

    setClientName(cName);
    setClientPhone(cPhone);
    setClientEmail(cEmail);
    setBookingDate(calculateSuggestedNextDate(baseDate));
    setBookingTime(preferredTime || "11:00");
    setSelectedServiceIds(
      svcIds && svcIds.length > 0 ? svcIds : (menu.length > 0 ? [menu[0].id] : [])
    );
    setCustomNotes(notes);
    setNailInspoDetails(inspo);
    setDepositPaid(0);
    setStatus("upcoming");
    setPaymentMethod("eft");

    const summary = existingClients.find(
      (c) =>
        (c.phone && cPhone && c.phone.replace(/[^0-9]/g, "") === cPhone.replace(/[^0-9]/g, "")) ||
        c.name.toLowerCase() === cName.toLowerCase()
    );
    setSelectedExistingClient(
      summary || {
        name: cName,
        phone: cPhone,
        email: cEmail,
        totalAppointments: 1,
        lastBookingDate: baseDate,
        lastTime: preferredTime,
        lastServiceIds: svcIds || [],
        lastServiceNames: getServiceNames(svcIds || []),
        lastNotes: notes,
        lastNailInspo: inspo,
        totalSpent: 0,
      }
    );

    setShowExistingClientsDirectory(false);
    setIsModalOpen(true);
  };

  // Helper to open Add modal
  const handleOpenAdd = () => {
    setEditingBooking(null);
    setSelectedExistingClient(null);
    setClientName("");
    setClientPhone("+27 ");
    setClientEmail("");
    setBookingDate(todayStr);
    setBookingTime("11:00");
    setSelectedServiceIds(menu.length > 0 ? [menu[0].id] : []);
    setCustomNotes("");
    setNailInspoDetails("");
    setDepositPaid(0);
    setStatus("upcoming");
    setPaymentMethod("eft");
    setIsClientDropdownOpen(false);
    setClientSearchQuery("");
    setIsDirectTypingMode(false);
    setIsModalOpen(true);
  };

  // Helper to open Edit modal
  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    const summary = existingClients.find(
      (c) =>
        (c.phone && b.clientPhone && c.phone.replace(/[^0-9]/g, "") === b.clientPhone.replace(/[^0-9]/g, "")) ||
        c.name.toLowerCase() === b.clientName.toLowerCase()
    );
    setSelectedExistingClient(summary || null);
    setClientName(b.clientName);
    setClientPhone(b.clientPhone);
    setClientEmail(b.clientEmail || "");
    setBookingDate(b.date);
    setBookingTime(b.time);
    setSelectedServiceIds(b.serviceIds);
    setCustomNotes(b.customNotes || "");
    setNailInspoDetails(b.nailInspoDetails || "");
    setDepositPaid(b.depositPaid);
    setStatus(b.status);
    setPaymentMethod(b.paymentMethod || "eft");
    setIsClientDropdownOpen(false);
    setClientSearchQuery("");
    setIsDirectTypingMode(false);
    setIsModalOpen(true);
  };

  // Toggle service selection in modal
  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  // Calculate totals from selected services
  const selectedServices = menu.filter((item) =>
    selectedServiceIds.includes(item.id)
  );
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );
  const recommendedDeposit = Math.round(
    totalAmount * (salon.depositPercentage / 100)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || selectedServiceIds.length === 0) return;

    const numDeposit = Number(depositPaid) || 0;
    let computedPaymentStatus: PaymentStatus = "unpaid";
    if (numDeposit >= totalAmount && totalAmount > 0) {
      computedPaymentStatus = "fully_paid";
    } else if (numDeposit > 0) {
      computedPaymentStatus = "deposit_paid";
    }

    if (editingBooking) {
      onUpdateBooking({
        ...editingBooking,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        date: bookingDate,
        time: bookingTime,
        durationMinutes: totalDuration,
        serviceIds: selectedServiceIds,
        customNotes: customNotes.trim(),
        nailInspoDetails: nailInspoDetails.trim(),
        totalAmount,
        depositRequired: recommendedDeposit,
        depositPaid: numDeposit,
        status,
        paymentStatus: computedPaymentStatus,
        paymentMethod,
      });
    } else {
      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        date: bookingDate,
        time: bookingTime,
        durationMinutes: totalDuration,
        serviceIds: selectedServiceIds,
        customNotes: customNotes.trim(),
        nailInspoDetails: nailInspoDetails.trim(),
        totalAmount,
        depositRequired: recommendedDeposit,
        depositPaid: numDeposit,
        status: numDeposit > 0 ? "confirmed" : status,
        paymentStatus: computedPaymentStatus,
        paymentMethod,
        createdAt: new Date().toISOString(),
      };
      onAddBooking(newBooking);
    }
    setIsModalOpen(false);
  };

  // Filter bookings
  const filteredBookings = bookings
    .filter((b) => {
      const matchesSearch =
        b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.clientPhone.includes(searchQuery) ||
        (b.customNotes && b.customNotes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = b.date === todayStr;
      } else if (dateFilter === "tomorrow") {
        matchesDate = b.date === tomorrowStr;
      } else if (dateFilter === "upcoming") {
        matchesDate = b.date >= todayStr;
      } else if (dateFilter === "custom" && customPickedDate) {
        matchesDate = b.date === customPickedDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  // Metrics for overview bar
  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const tomorrowBookings = bookings.filter((b) => b.date === tomorrowStr);
  const upcomingBookings = bookings.filter((b) => b.date >= todayStr);
  const pendingDeposits = bookings.filter(
    (b) => b.status !== "cancelled" && (b.paymentStatus === "unpaid" || b.depositPaid < b.depositRequired)
  );
  const todayRevenue = todayBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const handleExportCSV = () => {
    const rows = bookings.map((b) => {
      const svcNames = b.serviceIds
        .map((id) => menu.find((m) => m.id === id)?.name || id)
        .join("; ");
      return {
        "Booking ID": b.id,
        "Client Name": b.clientName,
        "Phone": b.clientPhone,
        "Date": b.date,
        "Time": b.time,
        "Duration (Mins)": b.durationMinutes,
        "Services": svcNames,
        "Total (ZAR)": b.totalAmount,
        "Deposit Paid (ZAR)": b.depositPaid,
        "Status": b.status,
        "Payment Status": b.paymentStatus,
      };
    });
    exportToCSV(`nail_studio_bookings_${todayStr}`, rows);
  };

  const getStatusBadge = (st: BookingStatus) => {
    switch (st) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "upcoming":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-stone-100 text-stone-700 border-stone-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  const getPaymentBadge = (ps: PaymentStatus) => {
    switch (ps) {
      case "fully_paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "deposit_paid":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Client Bookings & Scheduling</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage nail appointments, track deposits, send instant WhatsApp confirmations, and generate invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDirectorySearchQuery("");
              setShowExistingClientsDirectory(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="View all existing client profiles and quickly schedule repeat visits"
          >
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>Existing Clients</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
              {existingClients.length}
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Export all client bookings to CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Top Overview Metric Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => { setDateFilter("today"); setCustomPickedDate(""); }}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            dateFilter === "today"
              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
              : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={dateFilter === "today" ? "text-stone-300 font-medium" : "text-stone-500 font-medium"}>
              Today's Clients
            </span>
            <span className={`w-2 h-2 rounded-full ${todayBookings.length > 0 ? "bg-emerald-400 animate-pulse" : "bg-stone-300"}`} />
          </div>
          <div className="text-2xl font-black">
            {todayBookings.length}
          </div>
          <div className={`text-[11px] mt-1 ${dateFilter === "today" ? "text-stone-300" : "text-stone-400"}`}>
            {todayStr}
          </div>
        </button>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium mb-1">
            Today's Expected ZAR
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatZAR(todayRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {todayBookings.length > 0 ? "From scheduled appointments" : "No clients today yet"}
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setDateFilter("upcoming"); setCustomPickedDate(""); }}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            dateFilter === "upcoming"
              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
              : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"
          }`}
        >
          <div className="text-xs mb-1 font-medium text-stone-500">
            Upcoming Schedule
          </div>
          <div className="text-2xl font-black">
            {upcomingBookings.length}
          </div>
          <div className={`text-[11px] mt-1 ${dateFilter === "upcoming" ? "text-stone-300" : "text-stone-400"}`}>
            From today forward
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter("upcoming"); }}
          className="text-left p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-xs transition-all cursor-pointer"
        >
          <div className="text-xs text-stone-500 font-medium mb-1">
            Pending Deposits / Unpaid
          </div>
          <div className={`text-2xl font-black ${pendingDeposits.length > 0 ? "text-amber-600" : "text-stone-900"}`}>
            {pendingDeposits.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Need deposit follow-up
          </div>
        </button>
      </div>

      {/* Date Navigation Strip & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        {/* Date Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-stone-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Date:
            </span>

            <button
              type="button"
              onClick={() => { setDateFilter("all"); setCustomPickedDate(""); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === "all" && !customPickedDate
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              All Appointments ({bookings.length})
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter("today"); setCustomPickedDate(""); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                dateFilter === "today"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>Today</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dateFilter === "today" ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-800"
              }`}>
                {todayBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter("tomorrow"); setCustomPickedDate(""); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                dateFilter === "tomorrow"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>Tomorrow</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dateFilter === "tomorrow" ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-800"
              }`}>
                {tomorrowBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter("upcoming"); setCustomPickedDate(""); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                dateFilter === "upcoming"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span>Upcoming</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                dateFilter === "upcoming" ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-800"
              }`}>
                {upcomingBookings.length}
              </span>
            </button>
          </div>

          {/* Specific Date Picker Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Specific Date:</span>
            <input
              type="date"
              value={customPickedDate}
              onChange={(e) => {
                setCustomPickedDate(e.target.value);
                if (e.target.value) setDateFilter("custom");
                else setDateFilter("all");
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
            />
            {customPickedDate && (
              <button
                type="button"
                onClick={() => { setCustomPickedDate(""); setDateFilter("all"); }}
                className="text-xs text-stone-400 hover:text-stone-700 p-1"
                title="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search client by name, phone or nail inspo notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-200 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
            >
              <option value="all">All Booking Statuses</option>
              <option value="upcoming">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.map((booking) => {
          const serviceNames = getServiceNames(booking.serviceIds);
          const isToday = booking.date === todayStr;

          return (
            <div
              key={booking.id}
              className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                isToday ? "border-stone-900/40 ring-1 ring-stone-900/10" : "border-stone-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Client info & Services */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-stone-900">
                      {booking.clientName}
                    </span>

                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                        Today
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border capitalize ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border capitalize ${getPaymentBadge(
                        booking.paymentStatus
                      )}`}
                    >
                      {booking.paymentStatus.replace("_", " ")}
                    </span>
                  </div>

                  {/* Services Details */}
                  <div className="text-sm font-medium text-stone-800">
                    💅 {serviceNames}
                  </div>

                  {/* Date, Time, Duration & Phone */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 font-medium">
                    <span className="flex items-center gap-1 text-stone-700">
                      <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1 text-stone-700">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {booking.time} ({booking.durationMinutes} mins)
                    </span>
                    <span className="flex items-center gap-1 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      {booking.clientPhone}
                    </span>
                  </div>

                  {/* Nail Inspiration / Notes */}
                  {booking.customNotes && (
                    <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-100 mt-2">
                      <strong className="text-stone-700 font-medium">Notes:</strong> {booking.customNotes}
                    </div>
                  )}
                </div>

                {/* Right: Pricing & Quick Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                  <div className="text-left lg:text-right">
                    <div className="text-lg font-bold text-stone-900">
                      {formatZAR(booking.totalAmount)}
                    </div>
                    <div className="text-xs text-stone-500 font-medium">
                      Deposit: {formatZAR(booking.depositPaid)} / {formatZAR(booking.depositRequired)} req.
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Rebook Client */}
                    <button
                      type="button"
                      onClick={() => handleRebookClient(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors shadow-xs cursor-pointer"
                      title="Schedule next appointment for this client"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-rose-300" />
                      <span>Rebook</span>
                    </button>

                    {/* WhatsApp deposit request or confirmation */}
                    <a
                      href={generateWhatsAppBookingLink(
                        booking,
                        serviceNames,
                        salon,
                        booking.paymentStatus === "unpaid" ? "deposit_request" : "confirm"
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Send WhatsApp update to client"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Quick invoice generation */}
                    <button
                      onClick={() => onConvertToInvoice(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                      title="Create Tax Invoice for this booking"
                    >
                      <FileText className="w-3.5 h-3.5 text-stone-500" />
                      <span>Invoice</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(booking)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
            <CalendarIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-800 text-sm">No bookings found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              No appointments matching your current search or date filters. Add a new client booking to start filling your calendar.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              Book New Appointment
            </button>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-xl w-full my-auto shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {editingBooking ? "Edit Booking Details" : "Book New Client Appointment"}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Client contact info, appointment schedule & treatments
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                {/* Returning Client Profile Banner */}
                {/* Returning Client Profile Banner */}
                {selectedExistingClient ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {selectedExistingClient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              {selectedExistingClient.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300/60">
                              ⭐️ Existing Client ({selectedExistingClient.totalAppointments} {selectedExistingClient.totalAppointments === 1 ? "booking" : "bookings"})
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Last visit: <span className="font-semibold text-stone-700">{selectedExistingClient.lastBookingDate}</span> • Total spend: <span className="font-semibold text-stone-700">{formatZAR(selectedExistingClient.totalSpent)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExistingClient(null);
                          if (!editingBooking) {
                            setClientName("");
                            setClientPhone("+27 ");
                            setClientEmail("");
                            setCustomNotes("");
                            setNailInspoDetails("");
                          }
                        }}
                        className="text-[11px] text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Clear and choose a different client"
                      >
                        Change / Clear
                      </button>
                    </div>

                    {/* Previous treatments snippet & reuse button */}
                    <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-stone-600 truncate max-w-xs sm:max-w-sm">
                        <span className="font-medium text-stone-700">Previous treatment:</span> {selectedExistingClient.lastServiceNames}
                      </div>

                      {selectedExistingClient.lastServiceIds && selectedExistingClient.lastServiceIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedServiceIds(selectedExistingClient.lastServiceIds)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reuse Treatments</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Detected Client Autocomplete Banner (when typing directly) */}
                {detectedExistingClient && !selectedExistingClient && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">
                        Match found: <strong>{detectedExistingClient.name}</strong> ({detectedExistingClient.phone})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectExistingClient(detectedExistingClient)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                {/* Client Name (Dropdown Menu) & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-stone-700">
                        Client Full Name *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAddNewClient(clientName)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ New Client</span>
                        </button>
                        <span className="text-stone-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isDirectTypingMode) {
                              setIsDirectTypingMode(false);
                              setIsClientDropdownOpen(true);
                            } else {
                              setIsDirectTypingMode(true);
                              setIsClientDropdownOpen(false);
                            }
                          }}
                          className="text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                        >
                          {isDirectTypingMode ? "📋 Dropdown" : "✏️ Type"}
                        </button>
                      </div>
                    </div>

                    {isDirectTypingMode ? (
                      /* Direct typing input mode */
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lerato Molefe"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full pl-3.5 pr-20 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsDirectTypingMode(false);
                            setIsClientDropdownOpen(true);
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>List</span>
                          <ChevronDown className="w-3 h-3 text-stone-500" />
                        </button>
                      </div>
                    ) : (
                      /* Dropdown Menu for Client Names */
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                          className={`w-full px-3.5 py-2 text-sm rounded-xl border text-left bg-white transition-all shadow-2xs flex items-center justify-between gap-2 cursor-pointer ${
                            isClientDropdownOpen
                              ? "border-stone-400 ring-2 ring-stone-900/10"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1">
                            <User className="w-4 h-4 text-stone-400 shrink-0" />
                            {clientName ? (
                              <span className="font-semibold text-stone-900 truncate">
                                {clientName}
                              </span>
                            ) : (
                              <span className="text-stone-400 truncate">
                                Select client name from dropdown...
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {clientName && (
                              <span
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExistingClient(null);
                                  setClientName("");
                                  setClientPhone("+27 ");
                                  setClientEmail("");
                                  setCustomNotes("");
                                }}
                                className="p-0.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                                title="Clear selection"
                              >
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                                isClientDropdownOpen ? "rotate-180 text-stone-700" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Dropdown Menu Overlay & Box */}
                        {isClientDropdownOpen && (
                          <>
                            {/* Backdrop click dismiss */}
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setIsClientDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
                              {/* Search input in dropdown */}
                              <div className="p-2.5 border-b border-stone-100 bg-stone-50/70 shrink-0">
                                <div className="relative">
                                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    placeholder="Search client by name or phone..."
                                    value={clientSearchQuery}
                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>

                              {/* Scrollable list of client names */}
                              <div className="max-h-52 overflow-y-auto p-1.5 space-y-1">
                                {filteredDropdownClients.map((client) => {
                                  const isSelected =
                                    client.name.toLowerCase() === clientName.toLowerCase() ||
                                    (client.phone &&
                                      clientPhone &&
                                      client.phone.replace(/[^0-9]/g, "") ===
                                        clientPhone.replace(/[^0-9]/g, ""));
                                  return (
                                    <button
                                      key={client.phone || client.name}
                                      type="button"
                                      onClick={() => {
                                        handleSelectExistingClient(client);
                                        setIsClientDropdownOpen(false);
                                        setClientSearchQuery("");
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                        isSelected
                                          ? "bg-rose-50 border border-rose-200/80 text-rose-950 font-semibold"
                                          : "hover:bg-stone-50 text-stone-800"
                                      }`}
                                    >
                                      <div className="truncate">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="text-xs font-bold text-stone-900 truncate">
                                            {client.name}
                                          </span>
                                          {client.totalAppointments > 0 && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 shrink-0">
                                              {client.totalAppointments}v
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-stone-500 truncate mt-0.5">
                                          {client.phone}
                                          {client.lastBookingDate && ` • Last: ${client.lastBookingDate}`}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}

                                {filteredDropdownClients.length === 0 && (
                                  <div className="py-4 px-3 text-center text-xs text-stone-400">
                                    No existing clients found matching "{clientSearchQuery}"
                                  </div>
                                )}
                              </div>

                              {/* AT BOTTOM OF DROPDOWN: Allow to add new client */}
                              <div className="p-2 border-t border-stone-100 bg-stone-50/90 rounded-b-2xl space-y-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddNewClient(clientSearchQuery)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-rose-600" />
                                  <span>
                                    {clientSearchQuery.trim()
                                      ? `+ Add "${clientSearchQuery.trim()}" as New Client`
                                      : "+ Add New Client"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDirectTypingMode(true);
                                    setIsClientDropdownOpen(false);
                                  }}
                                  className="w-full text-center py-1 text-[11px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                                >
                                  Or type client name directly in form
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      WhatsApp / Phone (SA) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 082 345 6789 or +27 82 345 6789"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Time Slot *
                    </label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                </div>

                {/* Select Treatments from Menu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-700">
                      Select Treatments & Add-ons *
                    </label>
                    <span className="text-xs text-stone-500 font-medium">
                      Duration: ~{totalDuration} mins
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-stone-200 rounded-xl p-2 space-y-1 bg-stone-50/50">
                    {menu
                      .filter((m) => m.isActive)
                      .map((item) => {
                        const isSelected = selectedServiceIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleService(item.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? "bg-stone-900 text-white font-medium"
                                : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded text-stone-900"
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className={`font-bold ml-2 ${isSelected ? "text-rose-200" : "text-stone-900"}`}>
                              {formatZAR(item.price)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Total Treatment Price:</span>
                    <span className="font-bold text-stone-900 text-sm">{formatZAR(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>Recommended 50% Deposit:</span>
                    <span className="font-semibold text-emerald-700">{formatZAR(recommendedDeposit)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200/80">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Deposit Collected (ZAR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={depositPaid}
                        onChange={(e) => setDepositPaid(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white"
                      >
                        <option value="eft">EFT Transfer</option>
                        <option value="snapscan">SnapScan QR</option>
                        <option value="card">Card (Yoco / POS)</option>
                        <option value="cash">Cash</option>
                        <option value="instant_pay">Instant Pay / Ozow</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status & Custom Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Booking Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as BookingStatus)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                    >
                      <option value="upcoming">Pending Confirmation</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress (At Studio)</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nail Inspo & Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Almond shape, French chrome, bring inspo pic"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/90 flex items-center justify-between shrink-0">
                {editingBooking ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteBooking(editingBooking.id);
                      setIsModalOpen(false);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                  >
                    Delete Booking
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
                  >
                    {editingBooking ? "Save Changes" : "Confirm Booking"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Existing Clients Directory Modal */}
      {showExistingClientsDirectory && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Existing Clients Directory
                  </h2>
                  <p className="text-xs text-stone-500">
                    {existingClients.length} clients on record • Select to book a repeat appointment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExistingClientsDirectory(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Stats */}
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by client name, mobile number, or treatment..."
                  value={directorySearchQuery}
                  onChange={(e) => setDirectorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <div className="font-bold text-stone-900 text-sm">{existingClients.length}</div>
                  <div className="text-[10px] text-stone-500">Total Clients</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <div className="font-bold text-rose-600 text-sm">
                    {existingClients.filter((c) => c.totalAppointments > 1).length}
                  </div>
                  <div className="text-[10px] text-stone-500">Repeat Clients</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <div className="font-bold text-emerald-600 text-sm">
                    {formatZAR(existingClients.reduce((sum, c) => sum + c.totalSpent, 0))}
                  </div>
                  <div className="text-[10px] text-stone-500">Total Spend</div>
                </div>
              </div>
            </div>

            {/* Client Cards List */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3 flex-1">
              {filteredDirectoryClients.map((client) => (
                <div
                  key={client.phone || client.name}
                  className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-stone-900">{client.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        ⭐️ {client.totalAppointments} {client.totalAppointments === 1 ? "booking" : "bookings"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {client.phone}
                      </span>
                      <span>•</span>
                      <span>Last: {client.lastBookingDate}</span>
                      <span>•</span>
                      <span>Total spend: {formatZAR(client.totalSpent)}</span>
                    </div>

                    <div className="text-xs text-stone-600 pt-0.5">
                      <span className="font-medium text-stone-700">Recent Service:</span> 💅 {client.lastServiceNames}
                    </div>

                    {client.lastNotes && (
                      <div className="text-[11px] text-stone-500 italic bg-stone-50 p-1.5 rounded-lg max-w-lg">
                        "{client.lastNotes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <a
                      href={`https://wa.me/${cleanPhoneNumber(client.phone)}?text=${encodeURIComponent(
                        `Hi ${client.name}! 💅✨ Hope you're loving your nails from ${salon.salonName}. It's time for your next maintenance appointment! Let us know what date and time works best for you.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Send WhatsApp follow-up / check-in message"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRebookClient(client)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors shadow-xs cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-rose-300" />
                      <span>Book Appointment</span>
                    </button>
                  </div>
                </div>
              ))}

              {filteredDirectoryClients.length === 0 && (
                <div className="text-center py-10">
                  <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500">No clients matching your search.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/80 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowExistingClientsDirectory(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Client Modal */}
      {isAddNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Add New Client Profile
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Save client details for quick future appointments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddNewClientModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewClient} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lerato Molefe"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  WhatsApp / Phone (SA) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +27 82 345 6789"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. lerato@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Client Notes / Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sensitive cuticles, prefers square almond shape, loyal to nude gels"
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddNewClientModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Save & Select Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
