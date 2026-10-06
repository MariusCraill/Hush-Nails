import React, { useState, useMemo } from "react";
import { ClientProfile, Booking, Invoice, SalonProfile } from "../types";
import { formatZAR, cleanPhoneNumber, copyToClipboard, formatStudioLocation } from "../utils/formatters";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Share2,
  Copy,
  Check,
  Crown,
  Edit2,
  Trash2,
  ExternalLink,
  MessageCircle,
  FileText,
  Clock,
  Heart,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ClientsViewProps {
  clients: ClientProfile[];
  bookings: Booking[];
  invoices: Invoice[];
  salon: SalonProfile;
  onAddClient: (client: ClientProfile) => void;
  onUpdateClient: (client: ClientProfile) => void;
  onDeleteClient: (clientId: string) => void;
  onSelectClientForPortal: (client: ClientProfile) => void;
  onOpenBookingForClient?: (client: ClientProfile) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  bookings,
  invoices,
  salon,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForPortal,
  onOpenBookingForClient,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVip, setFilterVip] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [isVip, setIsVip] = useState(false);

  const openCreateModal = () => {
    setEditingClient(null);
    setName("");
    setPhone("");
    setEmail("");
    setPreferredStyle("");
    setNotes("");
    setIsVip(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClientProfile) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setPreferredStyle(c.preferredStyle || "");
    setNotes(c.notes || "");
    setIsVip(!!c.isVip);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingClient) {
      const updated: ClientProfile = {
        ...editingClient,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        preferredStyle: preferredStyle.trim() || undefined,
        notes: notes.trim() || undefined,
        isVip,
      };
      onUpdateClient(updated);
    } else {
      const cleanPhoneDigits = phone.replace(/[^0-9]/g, "").slice(-6) || Date.now().toString().slice(-6);
      const newClient: ClientProfile = {
        id: `cli-${cleanPhoneDigits}-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        preferredStyle: preferredStyle.trim() || undefined,
        notes: notes.trim() || undefined,
        isVip,
        createdAt: new Date().toISOString(),
      };
      onAddClient(newClient);
    }

    setIsModalOpen(false);
  };

  // Helper to generate personalized portal link
  const getClientPortalUrl = (client: ClientProfile) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    return `${origin}${pathname}?client=${encodeURIComponent(client.id)}`;
  };

  // Generate WhatsApp invite link
  const generateWhatsAppInviteLink = (client: ClientProfile) => {
    const cleanPhone = cleanPhoneNumber(client.phone);
    const portalUrl = getClientPortalUrl(client);
    const locationStr = formatStudioLocation(salon);
    const message = `💅 *${salon.salonName} — Your Client Profile & Online Bookings*

Hello ${client.name}! ✨

We have created your personal profile at *${salon.salonName}*.

You can view our live treatment pricelist, browse secret specials & combo deals, and book appointments directly with your saved profile anytime:
👉 ${portalUrl}

${locationStr ? `📍 *Location:* ${locationStr}\n` : ""}📞 WhatsApp: ${salon.phone}

We look forward to pampering your nails! 💕`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppMessageText = (client: ClientProfile) => {
    const portalUrl = getClientPortalUrl(client);
    const locationStr = formatStudioLocation(salon);
    return `💅 *${salon.salonName} — Your Client Profile & Online Bookings*

Hello ${client.name}! ✨

We have created your personal profile at *${salon.salonName}*.

You can view our live treatment pricelist, browse secret specials & combo deals, and book appointments directly with your saved profile anytime:
👉 ${portalUrl}

${locationStr ? `📍 *Location:* ${locationStr}\n` : ""}📞 WhatsApp: ${salon.phone}

We look forward to pampering your nails! 💕`;
  };

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyMessage = async (client: ClientProfile) => {
    const text = getWhatsAppMessageText(client);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedMsgId(client.id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    }
  };

  const handleCopyLink = async (client: ClientProfile) => {
    const url = getClientPortalUrl(client);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Stats calculation
  const clientStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { totalVisits: number; totalSpend: number; upcomingCount: number; lastDate?: string }
    >();

    clients.forEach((c) => {
      const cPhoneClean = cleanPhoneNumber(c.phone);
      const cNameLower = c.name.toLowerCase();

      const matchedBookings = bookings.filter((b) => {
        const bPhone = cleanPhoneNumber(b.clientPhone);
        const bName = b.clientName.toLowerCase();
        return (cPhoneClean && bPhone.includes(cPhoneClean)) || (cNameLower && bName.includes(cNameLower));
      });

      const totalVisits = matchedBookings.filter((b) => b.status === "completed").length;
      const upcomingCount = matchedBookings.filter((b) => b.status === "upcoming" || b.status === "confirmed").length;
      const totalSpend = matchedBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

      const dates = matchedBookings.map((b) => b.date).sort();
      const lastDate = dates.length > 0 ? dates[dates.length - 1] : undefined;

      map.set(c.id, { totalVisits, totalSpend, upcomingCount, lastDate });
    });

    return map;
  }, [clients, bookings]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (filterVip && !c.isVip) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.preferredStyle && c.preferredStyle.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    });
  }, [clients, filterVip, searchQuery]);

  const totalSpendAll = useMemo(() => {
    let sum = 0;
    clientStatsMap.forEach((val) => {
      sum += val.totalSpend;
    });
    return sum;
  }, [clientStatsMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              <span>Client Profiles & WhatsApp Logins</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {clients.length} {clients.length === 1 ? "Client" : "Clients"}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Manage your salon clients, store custom nail preferences &amp; inspo notes, and generate personalized WhatsApp profile links so clients can view their history and live pricelists.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/80">
            <span className="text-rose-500 font-bold">📍</span>
            <span>Studio Location in WhatsApp:</span>
            <span className="font-semibold text-stone-900">{formatStudioLocation(salon) || "No address configured"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Create New Client</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Total Clients
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{clients.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">In your studio database</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>VIP Clients</span>
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {clients.filter((c) => c.isVip).length}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Priority booking tier</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Client Appointments
          </p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{bookings.length}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Tracked bookings</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Client Revenue
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatZAR(totalSpendAll)}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Lifetime appointments</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, phone number, nail style, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterVip(!filterVip)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              filterVip
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>VIPs Only</span>
          </button>
        </div>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
            💅
          </div>
          <div>
            <h3 className="font-bold text-stone-900 text-base">
              {clients.length === 0 ? "No Clients in Database Yet" : "No Clients Match Your Search"}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              {clients.length === 0
                ? "Click 'Create New Client' to add your first client profile with custom nail preferences and generate their 1-tap WhatsApp portal link."
                : "Try adjusting your search query or removing the VIP filter."}
            </p>
          </div>
          {clients.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Create First Client Profile</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const stats = clientStatsMap.get(client.id) || {
              totalVisits: 0,
              totalSpend: 0,
              upcomingCount: 0,
            };
            const portalUrl = getClientPortalUrl(client);
            const isExpanded = expandedClientId === client.id;

            // Client bookings
            const clientBookings = bookings.filter((b) => {
              const cPhoneClean = cleanPhoneNumber(client.phone);
              const bPhone = cleanPhoneNumber(b.clientPhone);
              return (
                (cPhoneClean && bPhone.includes(cPhoneClean)) ||
                b.clientName.toLowerCase() === client.name.toLowerCase()
              );
            });

            return (
              <div
                key={client.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-stone-900 text-base leading-tight">
                            {client.name}
                          </h3>
                          {client.isVip && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Crown className="w-3 h-3 text-amber-600" />
                              VIP Client
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-stone-700">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {client.phone}
                          </span>
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete client profile for ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Nail Inspo & Preferences Tag */}
                  {(client.preferredStyle || client.notes) && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-100/80 text-xs space-y-1">
                      {client.preferredStyle && (
                        <div className="flex items-start gap-1.5 text-rose-950 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>Style & Shape:</strong> {client.preferredStyle}
                          </span>
                        </div>
                      )}
                      {client.notes && (
                        <div className="flex items-start gap-1.5 text-stone-600">
                          <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Notes / Cuticle Care:</strong> {client.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Stats Pill */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 p-2.5 rounded-2xl bg-stone-50 border border-stone-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Visits
                      </span>
                      <span className="font-bold text-stone-800">{stats.totalVisits} completed</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Upcoming
                      </span>
                      <span
                        className={`font-bold ${
                          stats.upcomingCount > 0 ? "text-rose-600" : "text-stone-500"
                        }`}
                      >
                        {stats.upcomingCount} booked
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Total Spend
                      </span>
                      <span className="font-bold text-emerald-700">
                        {formatZAR(stats.totalSpend)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-2">
                  {/* WhatsApp Profile Access Button */}
                  <div className="flex items-center gap-2">
                    <a
                      href={generateWhatsAppInviteLink(client)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                      title="Send personalized portal link via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send WhatsApp Portal Link</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(client)}
                      className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Copy personal portal link"
                    >
                      {copiedId === client.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(client)}
                      className="px-2.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy full pre-formatted WhatsApp invite message"
                    >
                      {copiedMsgId === client.id ? (
                        <span className="text-emerald-700 font-bold">Message Copied!</span>
                      ) : (
                        <span className="text-[11px] text-stone-600">Copy Text</span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectClientForPortal(client)}
                      className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Portal as {client.name.split(" ")[0]}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                      className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 text-[11px] font-medium cursor-pointer"
                    >
                      <span>{clientBookings.length} bookings history</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Booking History */}
                  {isExpanded && (
                    <div className="pt-2 mt-2 border-t border-stone-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-stone-400 uppercase">
                        Bookings for {client.name}:
                      </p>
                      {clientBookings.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">
                          No bookings recorded yet for this client.
                        </p>
                      ) : (
                        clientBookings.map((b) => (
                          <div
                            key={b.id}
                            className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-stone-800">
                                {b.date} at {b.time}
                              </span>
                              <span className="text-stone-400 text-[11px] block">
                                Status: {b.status} • {b.paymentStatus}
                              </span>
                            </div>
                            <span className="font-bold text-stone-900">
                              {formatZAR(b.totalAmount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  💅
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingClient ? "Edit Client Profile" : "Create New Salon Client"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Add client contact details and nail preferences
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Naledi Molefe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+27 82 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Used for WhatsApp invite & booking alerts
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="client@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Preferred Nail Style, Length & Shape
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medium Square, BIAB natural base with micro French"
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Treatment Notes & Cuticle Sensitivity
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sensitive eponychium, allergic to acetone soak-offs, prefers dry prep"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
                <input
                  type="checkbox"
                  id="vipCheckbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="vipCheckbox" className="text-xs font-semibold text-amber-950 cursor-pointer">
                  Tag as VIP Client (Highlight in bookings & pricelist deals)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                >
                  {editingClient ? "Save Changes" : "Create Client & Generate Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
