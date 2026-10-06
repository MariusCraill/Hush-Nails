import React from "react";
import { SalonProfile, UserSession } from "../types";
import { SalonLogo } from "./SalonLogo";
import {
  Calendar,
  Sparkles,
  ReceiptText,
  UtensilsCrossed,
  CreditCard,
  Settings,
  Flame,
  Clock,
  Menu as MenuIcon,
  X,
  Share2,
  Edit3,
  Smartphone,
  User,
  ShieldCheck,
  Eye,
  Users,
  LogOut,
  Cloud,
} from "lucide-react";

export type TabType =
  | "bookings"
  | "clients"
  | "marketing"
  | "invoices"
  | "menu"
  | "payments"
  | "settings";

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  salon: SalonProfile;
  pendingBookingsCount: number;
  totalClientsCount?: number;
  onOpenApkGuide?: () => void;
  onOpenAuthModal?: () => void;
  onSwitchToClient?: () => void;
  onLogoutAdmin?: () => void;
  userSession?: UserSession;
  isCloudSynced?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  salon,
  pendingBookingsCount,
  totalClientsCount = 0,
  onOpenApkGuide,
  onOpenAuthModal,
  onSwitchToClient,
  onLogoutAdmin,
  userSession,
  isCloudSynced = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: "bookings" as TabType,
      label: "Bookings",
      icon: Calendar,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
    },
    {
      id: "clients" as TabType,
      label: "Client Profiles",
      icon: Users,
      badge: totalClientsCount > 0 ? totalClientsCount : undefined,
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      id: "marketing" as TabType,
      label: "Marketing & TikTok",
      icon: Sparkles,
      badge: "AI",
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "invoices" as TabType,
      label: "Quotes & Invoices",
      icon: ReceiptText,
    },
    {
      id: "menu" as TabType,
      label: "Service Menu & ZAR",
      icon: UtensilsCrossed,
    },
    {
      id: "payments" as TabType,
      label: "Payments",
      icon: CreditCard,
    },
    {
      id: "settings" as TabType,
      label: "Studio Settings",
      icon: Settings,
    },
  ];

  const handleTabClick = (tab: TabType) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-stone-200 min-h-screen fixed left-0 top-0 z-30">
        {/* Salon Branding - Clickable to edit in Settings */}
        <div className="p-6 border-b border-stone-100">
          <button
            type="button"
            onClick={() => onSelectTab("settings")}
            title="Click to edit salon name & logo"
            className="w-full text-left flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-stone-50 transition-colors group cursor-pointer"
          >
            <SalonLogo salon={salon} size="md" />
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-1">
                <h1 className="font-bold text-stone-900 text-base leading-tight truncate group-hover:text-stone-700">
                  {salon.salonName || "HUSH nails"}
                </h1>
                <Edit3 className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">
                {salon.tagline || "South Africa Salon Suite"}
              </p>
            </div>
          </button>

          <div className="mt-4 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/80 text-stone-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ZAR (Rands) Active
            </span>
            <span className="text-[11px] font-semibold text-stone-500">ZA 🇿🇦</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Operations & Growth
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-rose-300" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || (isActive ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-700")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 space-y-2">
          {/* Client Portal Switcher */}
          {onSwitchToClient && (
            <button
              type="button"
              onClick={onSwitchToClient}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-rose-600" />
                <span>Open Client Portal</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-bold group-hover:bg-rose-300">
                Pricelist & Combos
              </span>
            </button>
          )}

          {/* Admin Logout button */}
          {onLogoutAdmin && (
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Log Out of Admin</span>
              </span>
              <span className="text-[10px] text-stone-400">Lock</span>
            </button>
          )}

          {onOpenApkGuide && (
            <button
              onClick={onOpenApkGuide}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Android APK</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                APK
              </span>
            </button>
          )}

          {/* Cloud Database Status */}
          <div className="rounded-xl p-2.5 bg-white border border-stone-200/80 shadow-2xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isCloudSynced && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudSynced ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-stone-700">
                {isCloudSynced ? "Firestore Cloud Live" : "Local Database"}
              </span>
            </div>
            <Cloud className={`w-3.5 h-3.5 ${isCloudSynced ? "text-emerald-600" : "text-stone-400"}`} />
          </div>

          <div className="rounded-xl p-3 bg-stone-100/90 border border-stone-200/70 text-xs text-stone-600">
            <div className="flex items-center gap-1.5 font-medium text-stone-800 mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Optimal TikTok SA Time</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Peak SA engagement: <strong className="text-stone-800">18:30 - 20:30</strong>. Schedule reels today!
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelectTab("settings")}
          title="Click to edit salon name & logo"
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <SalonLogo salon={salon} size="sm" />
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-stone-900 text-sm leading-tight truncate max-w-[170px]">
                {salon.salonName || "HUSH nails"}
              </h1>
              <Edit3 className="w-3 h-3 text-stone-400" />
            </div>
            <p className="text-[10px] text-stone-500 font-medium">SA Salon Suite (ZAR)</p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {onSwitchToClient && (
            <button
              onClick={onSwitchToClient}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Client View</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[53px] z-30 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white border-b border-stone-200 p-4 space-y-2 shadow-xl">
            {onSwitchToClient && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSwitchToClient();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 mb-2"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>Open Client Portal (Pricelist & Combos)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                  View
                </span>
              </button>
            )}

            {onLogoutAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogoutAdmin();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 mb-2"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Log Out of Admin</span>
                </span>
                <span className="text-[10px] text-rose-500 font-bold">Lock</span>
              </button>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.badgeColor || (isActive ? "bg-stone-700 text-white" : "bg-stone-200 text-stone-700")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-2 py-1.5 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg relative min-w-[56px] transition-colors ${
                isActive ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-stone-900" : "text-stone-400"}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? "font-semibold text-stone-900" : ""}`}>
                {item.id === "marketing" ? "Marketing" : item.id === "invoices" ? "Quotes" : item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
