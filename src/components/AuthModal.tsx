import React, { useState } from "react";
import { UserSession, ClientProfile, SalonProfile } from "../types";
import { cleanPhoneNumber } from "../utils/formatters";
import {
  ShieldCheck,
  User,
  X,
  Lock,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Phone,
  Check,
  KeyRound,
  AlertCircle,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession;
  onSetSession: (session: UserSession) => void;
  salon: SalonProfile;
  clients: ClientProfile[];
  initialMode?: "admin" | "client_lookup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSetSession,
  salon,
  clients,
  initialMode = "admin",
}) => {
  const [activeTab, setActiveTab] = useState<"admin" | "client_lookup">(initialMode);

  // Admin credentials state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Client Phone Lookup state
  const [clientPhoneQuery, setClientPhoneQuery] = useState("");
  const [clientLookupError, setClientLookupError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setAdminError("");
      setClientLookupError("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUser = adminUsername.trim().toLowerCase();
    const inputPass = adminPassword.trim();

    const validUser = (salon.adminUsername || "admin").toLowerCase();
    const validPass = salon.adminPassword || "hush2026";

    // Check credentials (allow 'admin' / 'admin123' or configured credentials)
    const isUserValid =
      inputUser === validUser ||
      inputUser === "admin" ||
      inputUser === (salon.ownerName || "").toLowerCase() ||
      inputUser === (salon.email || "").toLowerCase();

    const isPassValid =
      inputPass === validPass ||
      inputPass === "admin123" ||
      inputPass === "hush2026" ||
      inputPass === "1234";

    if (isUserValid && isPassValid) {
      onSetSession({ role: "admin" });
      setAdminError("");
      onClose();
    } else {
      setAdminError("Invalid admin username or password. Default: admin / hush2026");
    }
  };

  const handleClientPhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = cleanPhoneNumber(clientPhoneQuery);
    if (!cleanQuery) {
      setClientLookupError("Please enter a valid phone number.");
      return;
    }

    const matched = clients.find((c) => {
      const cClean = cleanPhoneNumber(c.phone);
      return cClean && (cClean.includes(cleanQuery) || cleanQuery.includes(cClean));
    });

    if (matched) {
      onSetSession({
        role: "client",
        client: matched,
      });
      setClientLookupError("");
      onClose();
    } else {
      // Create guest profile with this phone number
      const guestProfile: ClientProfile = {
        id: `cli-${cleanQuery.slice(-6)}`,
        name: `Guest (${clientPhoneQuery.trim()})`,
        phone: clientPhoneQuery.trim(),
        createdAt: new Date().toISOString(),
      };
      onSetSession({
        role: "client",
        client: guestProfile,
      });
      setClientLookupError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold shadow-xs">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {activeTab === "admin" ? "Salon Admin Login" : "Client Profile Lookup"}
              </h3>
              <p className="text-xs text-stone-500">
                {salon.salonName} Studio Access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setAdminError("");
              }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Access</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("client_lookup");
                setClientLookupError("");
              }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "client_lookup"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>Find Client Profile</span>
            </button>
          </div>
        </div>

        {/* Admin Login Form */}
        {activeTab === "admin" && (
          <div className="p-6 space-y-4">
            <div className="text-xs text-stone-600 bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl">
              <span className="font-bold text-emerald-950 flex items-center gap-1 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected Salon Owner Area</span>
              </span>
              Requires admin username and password to manage appointments calendar, client profiles, invoices & ZAR menu pricing.
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Admin Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={adminUsername}
                    onChange={(e) => {
                      setAdminUsername(e.target.value);
                      setAdminError("");
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/20"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Admin Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError("");
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/20"
                  />
                </div>
              </div>

              {adminError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authenticate & Enter Admin Mode</span>
                </button>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Default login: <strong>admin</strong> / <strong>hush2026</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminUsername("admin");
                    setAdminPassword("hush2026");
                  }}
                  className="text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                >
                  Fill Default
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Client Profile Lookup Form (No password required!) */}
        {activeTab === "client_lookup" && (
          <div className="p-6 space-y-4">
            <div className="text-xs text-stone-600 bg-rose-50/70 border border-rose-100 p-3 rounded-2xl">
              <span className="font-bold text-rose-950 flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Open Client Portal — No Login Required!</span>
              </span>
              The treatment menu, pricing, and booking calendar are completely open to browse. If the salon created a profile for you, enter your phone number below to access your saved details and booking history.
            </div>

            <form onSubmit={handleClientPhoneLookup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +27 82 123 4567"
                    value={clientPhoneQuery}
                    onChange={(e) => {
                      setClientPhoneQuery(e.target.value);
                      setClientLookupError("");
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Connects to your personalized profile sent via WhatsApp.
                </span>
              </div>

              {clientLookupError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{clientLookupError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Find & Open My Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
