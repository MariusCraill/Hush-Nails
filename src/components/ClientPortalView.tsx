import React, { useState, useMemo } from "react";
import {
  SalonProfile,
  MenuItem,
  Booking,
  Invoice,
  UserSession,
  ComboDeal,
  SpecialOffer,
  ServiceCategory,
} from "../types";
import {
  formatZAR,
  generateWhatsAppBookingLink,
  formatWhatsAppBookingMessage,
  copyToClipboard,
  cleanPhoneNumber,
  formatStudioLocation,
} from "../utils/formatters";
import { SalonLogo } from "./SalonLogo";
import {
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  Share2,
  Copy,
  Tag,
  Gift,
  ArrowRight,
  ShieldCheck,
  User,
  Search,
  Check,
  Info,
  CreditCard,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ClientPortalViewProps {
  salon: SalonProfile;
  menu: MenuItem[];
  bookings: Booking[];
  invoices: Invoice[];
  currentSession: UserSession;
  combos: ComboDeal[];
  specials: SpecialOffer[];
  onAddBooking: (booking: Booking) => void;
  onOpenAdminLogin: () => void;
  onOpenProfileLookup: () => void;
  onClearClientProfile?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  salon,
  menu,
  bookings,
  invoices,
  currentSession,
  combos,
  specials,
  onAddBooking,
  onOpenAdminLogin,
  onOpenProfileLookup,
  onClearClientProfile,
}) => {
  // Client tabs
  const [activeTab, setActiveTab] = useState<
    "pricelists" | "specials" | "book" | "my-bookings" | "info"
  >("specials");

  // Filter state for menu
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Booking Form State
  const [bookingClientName, setBookingClientName] = useState<string>(
    currentSession.client?.name || ""
  );
  const [bookingClientPhone, setBookingClientPhone] = useState<string>(
    currentSession.client?.phone || ""
  );
  const [bookingClientEmail, setBookingClientEmail] = useState<string>(
    currentSession.client?.email || ""
  );
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000); // Tomorrow
    return d.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState<string>("10:30");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    menu[0]?.id || "srv-ac-1",
  ]);
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<string>("");
  const [nailInspoDetails, setNailInspoDetails] = useState<string>(
    currentSession.client?.preferredStyle || ""
  );
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");

  // Sync client profile details if loaded from WhatsApp link or lookup
  React.useEffect(() => {
    if (currentSession.client) {
      if (currentSession.client.name) setBookingClientName(currentSession.client.name);
      if (currentSession.client.phone) setBookingClientPhone(currentSession.client.phone);
      if (currentSession.client.email) setBookingClientEmail(currentSession.client.email);
      if (currentSession.client.preferredStyle && !nailInspoDetails) {
        setNailInspoDetails(currentSession.client.preferredStyle);
      }
    }
  }, [currentSession.client]);

  // Confirmation state
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Time Slots
  const availableTimeSlots = [
    "09:00",
    "10:30",
    "12:00",
    "13:30",
    "15:00",
    "16:30",
    "18:00",
  ];

  const categories: string[] = [
    "All",
    "Acrylic Extensions",
    "BIAB & Gel Overlays",
    "Nail Art & Add-ons",
    "Pedicures & Spa",
    "Maintenance & Soak-off",
  ];

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      if (!item.isActive) return false;
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Selected services calculation
  const selectedServices = useMemo(() => {
    return menu.filter((m) => selectedServiceIds.includes(m.id));
  }, [menu, selectedServiceIds]);

  const selectedCombo = useMemo(() => {
    return combos.find((c) => c.id === selectedComboId) || null;
  }, [combos, selectedComboId]);

  const calculatedTotal = useMemo(() => {
    if (selectedCombo) {
      return selectedCombo.discountedPrice;
    }
    const rawSum = selectedServices.reduce((acc, s) => acc + s.price, 0);
    // Apply promo if valid
    if (appliedPromoCode.trim().toUpperCase() === "HUSH15") {
      return Math.round(rawSum * 0.85);
    }
    if (appliedPromoCode.trim().toUpperCase() === "MIDWEEK60" && rawSum >= 350) {
      return Math.max(0, rawSum - 60);
    }
    return rawSum;
  }, [selectedCombo, selectedServices, appliedPromoCode]);

  const calculatedDuration = useMemo(() => {
    if (selectedCombo) {
      return selectedCombo.durationMinutes;
    }
    return Math.max(
      60,
      selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0)
    );
  }, [selectedCombo, selectedServices]);

  const depositRequired = Math.round(
    (calculatedTotal * (salon.depositPercentage || 50)) / 100
  );

  // Client's personal bookings
  const myBookings = useMemo(() => {
    const clientPhoneClean = cleanPhoneNumber(
      currentSession.client?.phone || bookingClientPhone
    );
    const clientNameLower = (
      currentSession.client?.name || bookingClientName
    ).toLowerCase();

    return bookings.filter((b) => {
      const bPhone = cleanPhoneNumber(b.clientPhone);
      const bName = b.clientName.toLowerCase();
      return (
        (clientPhoneClean && bPhone.includes(clientPhoneClean)) ||
        (clientNameLower && bName.includes(clientNameLower))
      );
    });
  }, [bookings, currentSession.client, bookingClientPhone, bookingClientName]);

  // Handler: select a service and jump to booking
  const handleSelectServiceToBook = (serviceId: string) => {
    setSelectedComboId(null);
    setSelectedServiceIds([serviceId]);
    setActiveTab("book");
  };

  // Handler: select a combo and jump to booking
  const handleSelectComboToBook = (combo: ComboDeal) => {
    setSelectedComboId(combo.id);
    setSelectedServiceIds(combo.serviceIds);
    setActiveTab("book");
  };

  const handleToggleServiceSelection = (serviceId: string) => {
    setSelectedComboId(null);
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length > 1) {
        setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
      }
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Handler: submit new booking
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingClientName.trim() || !bookingClientPhone.trim()) {
      alert("Please enter your name and South African WhatsApp/phone number.");
      return;
    }

    const serviceNames = selectedCombo
      ? `${selectedCombo.title} Combo Deal`
      : selectedServices.map((s) => s.name).join(" + ") || "Nail Treatment";

    const newBooking: Booking = {
      id: "bk-c" + Date.now().toString().slice(-6),
      clientName: bookingClientName.trim(),
      clientPhone: bookingClientPhone.trim(),
      clientEmail: bookingClientEmail.trim() || undefined,
      date: bookingDate,
      time: bookingTime,
      durationMinutes: calculatedDuration,
      serviceIds: selectedServiceIds,
      customNotes: selectedCombo
        ? `[COMBO: ${selectedCombo.title}] ${customNotes}`.trim()
        : customNotes.trim() || undefined,
      nailInspoDetails: nailInspoDetails.trim() || undefined,
      totalAmount: calculatedTotal,
      depositRequired: depositRequired,
      depositPaid: 0,
      status: "upcoming",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
    };

    onAddBooking(newBooking);
    setSubmittedBooking(newBooking);
  };

  const serviceNamesForSummary = useMemo(() => {
    if (selectedCombo) return `${selectedCombo.title} (Combo Deal)`;
    return selectedServices.map((s) => s.name).join(" + ") || "Nail Service";
  }, [selectedCombo, selectedServices]);

  const handleCopyCode = (code: string) => {
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyFormattedMessage = async () => {
    if (!submittedBooking) return;
    const msg = formatWhatsAppBookingMessage(
      submittedBooking,
      serviceNamesForSummary,
      salon,
      "client_booking"
    );
    const ok = await copyToClipboard(msg);
    if (ok) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-20 font-sans">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SalonLogo salon={salon} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-stone-900 text-base sm:text-lg leading-tight">
                  {salon.salonName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                {salon.tagline || "Bespoke Sculpted Acrylics & BIAB Natural Care"} • {salon.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentSession.client ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-950">
                <User className="w-3.5 h-3.5 text-rose-600" />
                <span className="max-w-[110px] sm:max-w-[150px] truncate">
                  {currentSession.client.name}
                </span>
                {currentSession.client.isVip && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
                    VIP
                  </span>
                )}
                {onClearClientProfile && (
                  <button
                    type="button"
                    onClick={onClearClientProfile}
                    className="ml-1 text-rose-400 hover:text-rose-800 text-xs cursor-pointer"
                    title="Clear loaded client profile"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenProfileLookup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                title="Enter your phone number to view your personalized profile"
              >
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Returning Client?</span>
                <span>Find Profile</span>
              </button>
            )}

            {/* Admin Login Button */}
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="Admin Login (Username & Password Required)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

        {/* Client Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-stone-100 pt-1 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("specials")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "specials"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Specials & Combos</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "specials" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
              }`}
            >
              Hot
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pricelists")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "pricelists"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Full Pricelist (ZAR)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmittedBooking(null);
              setActiveTab("book");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "book"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my-bookings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "my-bookings"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>My Bookings</span>
            {myBookings.length > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-stone-200 text-stone-800 font-bold">
                {myBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "info"
                ? "bg-stone-900 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Studio Info & EFT</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ================= SPECIALS & COMBOS TAB ================= */}
        {activeTab === "specials" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Promo Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>HUSH nails Exclusive Packages</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Hand-Crafted Combos & Seasonal Specials
                </h2>
                <p className="text-sm text-stone-300 leading-relaxed">
                  Save up to R145 when booking matching sets and pedicures together. All combos include thorough cuticle care, strengthening overlays, and salon-grade diamond top coats.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectComboToBook(combos[0])}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <span>Book The Signature Glow Combo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pricelists")}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors border border-white/10 cursor-pointer"
                  >
                    Browse Single Services
                  </button>
                </div>
              </div>
            </div>

            {/* Combo Deals Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500" />
                    <span>Popular Nail & Spa Combos</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Bundled luxury treatments with built-in ZAR savings
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {combos.length} Combos Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {combo.badge && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          {combo.badge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-base font-bold text-stone-900 group-hover:text-rose-600 transition-colors">
                          {combo.title}
                        </h4>
                        <p className="text-xs font-semibold text-rose-600 mt-0.5">
                          {combo.tagline}
                        </p>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {combo.description}
                      </p>

                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                          What's Included:
                        </span>
                        <ul className="space-y-1.5">
                          {combo.includedItems.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-stone-700 flex items-start gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-stone-900">
                            {formatZAR(combo.discountedPrice)}
                          </span>
                          <span className="text-xs text-stone-400 line-through font-semibold">
                            {formatZAR(combo.originalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold text-emerald-600">
                            Save {formatZAR(combo.savings)}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{combo.durationMinutes}m</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectComboToBook(combo)}
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Book Combo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Offers & Promo Codes */}
            <div className="pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-rose-500" />
                  <span>Promotional Vouchers & Discounts</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Copy voucher code and apply during booking checkout
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {specials.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          {spec.badge}
                        </span>
                        <span className="text-[10px] font-medium text-stone-400">
                          {spec.validity}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 text-sm">{spec.title}</h4>
                      <p className="text-xs font-medium text-stone-700 mt-1">
                        {spec.discountText}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">{spec.description}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <code className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-mono text-xs font-bold border border-stone-200">
                        {spec.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(spec.code)}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === spec.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= FULL PRICELIST TAB ================= */}
        {activeTab === "pricelists" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {salon.salonName} Treatment Menu & Pricelist
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                All prices in South African Rands (ZAR). Transparent pricing with no hidden charges.
              </p>
            </div>

            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search treatments (e.g. Ombré, BIAB, Gel, Pedi, Chrome)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/20"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-stone-900 text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm group-hover:text-rose-600 transition-colors">
                          {item.name}
                        </h4>
                      </div>
                      {item.isPopular && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-stone-900">
                        {formatZAR(item.price)}
                      </span>
                      <span className="text-[11px] text-stone-400 ml-1.5">
                        • {item.durationMinutes}m
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectServiceToBook(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Book</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-6">
                <p className="text-stone-500 text-sm">
                  No treatments found matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= BOOK APPOINTMENT TAB ================= */}
        {activeTab === "book" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Book Your Appointment at {salon.salonName}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Select your preferred date, time slot, and treatments. Instant WhatsApp confirmation generated with studio details.
              </p>
            </div>

            {/* If appointment successfully submitted */}
            {submittedBooking ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Booking Request Created!
                  </h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Your appointment for{" "}
                    <strong>
                      {submittedBooking.date} at {submittedBooking.time}
                    </strong>{" "}
                    is logged in our calendar. To lock in your slot, send the confirmation via WhatsApp and transfer your deposit.
                  </p>
                </div>

                {/* Appointment Summary Box */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Client:</span>
                    <span className="font-bold text-stone-900">{submittedBooking.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Service(s):</span>
                    <span className="font-bold text-stone-900">{serviceNamesForSummary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Estimated Total:</span>
                    <span className="font-bold text-stone-900">{formatZAR(submittedBooking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200 text-rose-700 font-bold">
                    <span>{salon.depositPercentage}% Deposit to Pay:</span>
                    <span>{formatZAR(submittedBooking.depositRequired)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a
                    href={generateWhatsAppBookingLink(
                      submittedBooking,
                      serviceNamesForSummary,
                      salon,
                      "client_booking"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send Booking to HUSH Nails via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyFormattedMessage}
                    className="w-full py-2.5 px-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">
                          Copied Pre-Formatted WhatsApp Message!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy Pre-Formatted WhatsApp Message String</span>
                      </>
                    )}
                  </button>
                </div>

                {/* EFT & SnapScan Payment Box */}
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-950 space-y-2">
                  <span className="font-bold flex items-center gap-1.5 text-sky-900">
                    <CreditCard className="w-4 h-4 text-sky-700" />
                    <span>EFT Banking Details for 50% Deposit:</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-sky-700 block">Bank:</span>
                      <strong>{salon.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-sky-700 block">Account Holder:</span>
                      <strong>{salon.accountHolder}</strong>
                    </div>
                    <div>
                      <span className="text-sky-700 block">Account Number:</span>
                      <strong className="font-mono">{salon.accountNumber}</strong>
                    </div>
                    <div>
                      <span className="text-sky-700 block">Branch Code:</span>
                      <strong className="font-mono">{salon.branchCode}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-sky-800 pt-1">
                    Reference: <strong>{submittedBooking.clientName.replace(/\s+/g, "")}-Nails</strong>
                  </p>
                  {salon.snapScanId && (
                    <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-sky-800">
                        Or pay with SnapScan:
                      </span>
                      <a
                        href={`https://pos.snapscan.io/qr/${salon.snapScanId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-sky-700 hover:underline flex items-center gap-1"
                      >
                        <span>Open SnapScan Paylink</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedBooking(null);
                      setActiveTab("my-bookings");
                    }}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900 underline cursor-pointer"
                  >
                    View All My Appointments
                  </button>
                </div>
              </div>
            ) : (
              /* Self-Service Booking Form */
              <form
                onSubmit={handleSubmitBooking}
                className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Step 1: Selected Treatments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Step 1: Selected Treatments
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pricelists")}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      + Browse Menu
                    </button>
                  </div>

                  {selectedCombo ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-rose-700">
                          Package Combo Deal
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm">
                          {selectedCombo.title}
                        </h4>
                        <p className="text-xs text-stone-600">{selectedCombo.tagline}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-stone-900 text-base">
                          {formatZAR(selectedCombo.discountedPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedComboId(null)}
                          className="block text-[11px] font-semibold text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="p-3 rounded-2xl border border-stone-200 flex items-center justify-between bg-stone-50/60"
                        >
                          <div>
                            <h5 className="text-sm font-bold text-stone-900">
                              {service.name}
                            </h5>
                            <p className="text-xs text-stone-500">
                              {service.category} • ~{service.durationMinutes} mins
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-stone-900">
                              {formatZAR(service.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleServiceSelection(service.id)}
                              className="text-xs text-stone-400 hover:text-rose-600 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 2: Date & Time Slot */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Step 2: Choose Date & Time Slot
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Select Available Slot *
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {availableTimeSlots.map((slot) => {
                          const isSelected = bookingTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingTime(slot)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-stone-900 text-white shadow-xs"
                                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Client Details */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Step 3: Your Client Details
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lerato Molefe"
                        value={bookingClientName}
                        onChange={(e) => setBookingClientName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        WhatsApp / Phone (SA) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +27 82 345 6789"
                        value={bookingClientPhone}
                        onChange={(e) => setBookingClientPhone(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. lerato@gmail.com"
                        value={bookingClientEmail}
                        onChange={(e) => setBookingClientEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 4: Nail Inspo & Notes */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Step 4: Styling Preferences & Nail Inspo
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nail Shape, Length & Color Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Medium Almond, Milky Pink BIAB, Chrome French Tips"
                      value={nailInspoDetails}
                      onChange={(e) => setNailInspoDetails(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Promo Voucher Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. HUSH15 or MIDWEEK60"
                        value={appliedPromoCode}
                        onChange={(e) => setAppliedPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-stone-200 font-mono uppercase"
                      />
                      {appliedPromoCode && (
                        <span className="text-xs font-bold text-emerald-600 self-center">
                          Code Applied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 5: Summary & Deposit Total */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Estimated Duration:</span>
                    <span className="font-semibold text-stone-800">
                      ~{calculatedDuration} minutes
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Total Service Amount:</span>
                    <span className="font-bold text-stone-900 text-sm">
                      {formatZAR(calculatedTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-stone-200 text-rose-700 font-bold">
                    <span>{salon.depositPercentage}% Deposit Required to Confirm:</span>
                    <span className="text-sm">{formatZAR(depositRequired)}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 pt-1">
                    * Policy: 50% non-refundable deposit secures your slot. Banking EFT details will be provided immediately upon booking.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <span>Confirm Appointment & Generate WhatsApp Link</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= MY BOOKINGS TAB ================= */}
        {activeTab === "my-bookings" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  My Appointments & History
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Appointments logged under{" "}
                  <strong>{currentSession.client?.name || bookingClientName || "your profile"}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmittedBooking(null);
                  setActiveTab("book");
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                + New Booking
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">
                  No Bookings Found Yet
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  You haven't scheduled any appointments yet or your phone number hasn't been linked.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedBooking(null);
                    setActiveTab("book");
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600"
                >
                  Book Your First Appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => {
                  const services = menu
                    .filter((m) => b.serviceIds?.includes(m.id))
                    .map((m) => m.name)
                    .join(", ");

                  const isConfirmed = b.status === "confirmed";
                  const isDepositPaid = b.paymentStatus === "deposit_paid" || b.paymentStatus === "fully_paid";

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900">
                              {b.date} at {b.time}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isConfirmed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {b.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-stone-700 mt-1">
                            💅 {services || "Nail Services"}
                          </p>
                          {b.customNotes && (
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Note: {b.customNotes}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-stone-900 text-sm">
                            {formatZAR(b.totalAmount)}
                          </span>
                          <span
                            className={`block text-[10px] font-semibold mt-0.5 ${
                              isDepositPaid ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isDepositPaid
                              ? `✅ ${formatZAR(b.depositPaid)} Paid`
                              : `Deposit: ${formatZAR(b.depositRequired)} Due`}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-500">
                          Studio: {formatStudioLocation(salon)}
                        </span>

                        <a
                          href={generateWhatsAppBookingLink(
                            b,
                            services || "Nail Services",
                            salon,
                            "reminder"
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Studio</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STUDIO INFO & EFT TAB ================= */}
        {activeTab === "info" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Studio Location & Banking Details
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Everything you need to find us and pay for appointments.
              </p>
            </div>

            {/* Address & Contact Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span>Studio Address & Contact</span>
              </h3>

              <div className="space-y-2 text-xs text-stone-700">
                <p>
                  <strong>Physical Studio:</strong> {formatStudioLocation(salon)}
                </p>
                <p>
                  <strong>WhatsApp & Calls:</strong>{" "}
                  <a
                    href={`https://wa.me/${cleanPhoneNumber(salon.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 font-bold hover:underline"
                  >
                    {salon.phone}
                  </a>
                </p>
                <p>
                  <strong>Email:</strong> {salon.email}
                </p>
                <p>
                  <strong>Opening Hours:</strong> Monday – Saturday: 08:30 – 18:30 (Sundays by bridal appointment)
                </p>
              </div>
            </div>

            {/* EFT Banking Details Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                <span>South African Banking Details (EFT)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs">
                <div>
                  <span className="text-stone-500 block">Bank Name:</span>
                  <strong className="text-stone-900 text-sm">{salon.bankName}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Account Holder:</span>
                  <strong className="text-stone-900 text-sm">{salon.accountHolder}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Account Number:</span>
                  <strong className="text-stone-900 font-mono text-sm">
                    {salon.accountNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Branch Code:</span>
                  <strong className="text-stone-900 font-mono text-sm">
                    {salon.branchCode}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Account Type:</span>
                  <strong className="text-stone-900 text-sm">{salon.accountType}</strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Payment Reference:</span>
                  <strong className="text-rose-700 text-sm">[Your Name]-Nails</strong>
                </div>
              </div>

              {salon.snapScanId && (
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-stone-600">
                    SnapScan Merchant Paylink:{" "}
                    <strong className="font-mono">{salon.snapScanId}</strong>
                  </div>
                  <a
                    href={`https://pos.snapscan.io/qr/${salon.snapScanId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs"
                  >
                    Open SnapScan
                  </a>
                </div>
              )}
            </div>

            {/* Studio Policy */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-2">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-stone-500" />
                <span>Appointment Policies</span>
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {salon.cancellationPolicy ||
                  "50% non-refundable deposit required to confirm your booking. Rescheduling permitted with minimum 24 hours notice. 15-minute grace period applies."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
