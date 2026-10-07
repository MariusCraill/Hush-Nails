import React, { useState, useEffect } from "react";
import { SalonProfile } from "../types";
import { SalonLogo } from "./SalonLogo";
import { ApkExportModal } from "./ApkExportModal";
import { formatStudioLocation, getGoogleMapsLink } from "../utils/formatters";
import {
  Save,
  Building2,
  Phone,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Download,
  Upload,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
  Trash2,
  ExternalLink,
  Cloud,
  Database,
  Radio,
} from "lucide-react";

interface SettingsViewProps {
  salon: SalonProfile;
  onUpdateSalon: (updated: SalonProfile) => void;
  onExportAllData: () => void;
  onImportData: (jsonData: string) => void;
  isCloudSynced?: boolean;
}

const PRESET_EMOJIS = ["💅", "✨", "💎", "👑", "🌸", "🦋", "💄", "⚡", "🌺", "🖤", "🪄", "🌟"];

export const SettingsView: React.FC<SettingsViewProps> = ({
  salon,
  onUpdateSalon,
  onExportAllData,
  onImportData,
  isCloudSynced = true,
}) => {
  const [formData, setFormData] = useState<SalonProfile>(salon);
  const [saved, setSaved] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  // Keep form fields synced when cloud profile is loaded or updated
  useEffect(() => {
    setFormData(salon);
  }, [salon]);

  const handleChange = (field: keyof SalonProfile, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSalon(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (1.5MB for localStorage performance)
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please upload a logo image smaller than 1.5MB for fast loading.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData((prev) => ({
          ...prev,
          logoType: "image",
          logoUrl: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Studio &amp; Brand Settings</h1>
          <p className="text-sm text-stone-500 mt-1">
            Customize your salon identity, editable logo, South African EFT banking details, and export as an Android APK.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowApkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>Export Android APK</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saved ? "Settings Saved!" : "Save Settings"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Identity & Logo Customizer */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-stone-700" />
              <h3 className="font-bold text-stone-900 text-sm">Salon Brand &amp; Editable Logo</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600">
              Live Brand Header
            </span>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <SalonLogo salon={formData} size="lg" roundedClassName="rounded-2xl" />
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                  Current Studio Branding
                </span>
                <h4 className="text-lg font-bold text-stone-900 leading-tight">
                  {formData.salonName || "Your Studio Name"}
                </h4>
                <p className="text-xs text-stone-500">{formData.tagline || "Your salon slogan here"}</p>
              </div>
            </div>

            <div className="text-xs text-stone-500 bg-white px-3 py-2 rounded-lg border border-stone-200/80">
              Appears on: <strong className="text-stone-700">Invoices, Quotes, Sidebar, WhatsApp &amp; Mobile Nav</strong>
            </div>
          </div>

          {/* Logo Type Selector & Upload Controls */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-stone-700">
              Choose Logo Format
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Emoji / Icon */}
              <button
                type="button"
                onClick={() => handleChange("logoType", "emoji")}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  formData.logoType !== "image"
                    ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center text-base shrink-0">
                  {formData.logoEmoji || "💅"}
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Salon Emoji / Icon</span>
                  <span className="text-[11px] text-stone-500">Pick from curated beauty symbols</span>
                </div>
              </button>

              {/* Option B: Custom Image Upload */}
              <button
                type="button"
                onClick={() => handleChange("logoType", "image")}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  formData.logoType === "image"
                    ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-sm shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Upload Logo Image</span>
                  <span className="text-[11px] text-stone-500">Upload your own PNG, JPG or SVG</span>
                </div>
              </button>
            </div>

            {/* If Emoji Selected */}
            {formData.logoType !== "image" && (
              <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-3">
                <span className="text-xs font-semibold text-stone-700 block">
                  Select Quick Salon Icon:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleChange("logoEmoji", emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        formData.logoEmoji === emoji
                          ? "bg-stone-900 text-white border-stone-900 scale-110 shadow-xs"
                          : "bg-white border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <label className="text-xs text-stone-600 font-medium">Or type custom emoji:</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.logoEmoji || ""}
                    onChange={(e) => handleChange("logoEmoji", e.target.value)}
                    placeholder="💅"
                    className="w-16 px-2.5 py-1 text-center text-sm rounded-lg border border-stone-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* If Image Selected */}
            {formData.logoType === "image" && (
              <div className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-3">
                <span className="text-xs font-semibold text-stone-700 block">
                  Upload Logo File (PNG, JPG, or SVG):
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Logo File from Device</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("logoUrl", "");
                        handleChange("logoType", "emoji");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo Image</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Or paste online Logo Image URL:
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl || ""}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    placeholder="https://example.com/my-salon-logo.png"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Salon Name and Tagline Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Salon Name *
              </label>
              <input
                type="text"
                required
                value={formData.salonName}
                onChange={(e) => handleChange("salonName", e.target.value)}
                placeholder="e.g. HUSH nails"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="e.g. Bespoke Sculpted Acrylics & BIAB"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nail Artist / Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Business WhatsApp / Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Studio Physical / Street Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="e.g. 30 Mandarin Rd or Studio 4, 142 Oxford Road"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-rose-500"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                The street address included in WhatsApp client links, booking confirmations, and tax invoices.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                City / Suburb &amp; Postal Code (South Africa)
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g. Johannesburg, 2196 or Randburg"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-rose-500"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                City or suburb for navigation directions.
              </span>
            </div>

            {/* Live WhatsApp Address Preview & Quick Save */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Live WhatsApp &amp; Invoices Address Preview
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Immediately save address changes to cloud and update all WhatsApp links"
                >
                  {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saved ? "Address Saved!" : "Save Studio Address"}</span>
                </button>
              </div>

              <div className="space-y-1 font-mono text-xs text-stone-800 bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">📍</span>
                  <span className="font-semibold text-stone-900">
                    {formatStudioLocation(formData) || "No address set yet"}
                  </span>
                </div>
                {formatStudioLocation(formData) && (
                  <div className="flex items-start gap-2 text-stone-500 text-[11px] pt-1 border-t border-stone-100">
                    <span className="shrink-0">🗺️</span>
                    <span className="truncate">
                      Maps: {getGoogleMapsLink(formatStudioLocation(formData), formData.salonName)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Android APK & Mobile Installation Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">Export Android APK / Native Phone App</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              Android Ready
            </span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            Need this app as an installable <code className="bg-stone-800 text-stone-200 px-1 py-0.5 rounded font-mono">.apk</code> on your or your clients' Android phone? You can generate an APK via <strong>Capacitor</strong> in Android Studio, package it directly online with <strong>PWABuilder</strong>, or install it instantly via Chrome.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowApkModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-stone-900 hover:bg-stone-100 transition-colors shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open APK Export Guide &amp; Commands</span>
            </button>
          </div>
        </div>

        {/* EFT Banking Details for Invoices & WhatsApp */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-stone-700" />
              <h3 className="font-bold text-stone-900 text-sm">South African EFT Banking Details</h3>
            </div>
            <span className="text-xs text-stone-400">Included on all invoices</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FNB / Standard Bank / Capitec"
                value={formData.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Account Holder *
              </label>
              <input
                type="text"
                required
                value={formData.accountHolder}
                onChange={(e) => handleChange("accountHolder", e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                value={formData.branchCode}
                onChange={(e) => handleChange("branchCode", e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Account Type
              </label>
              <input
                type="text"
                value={formData.accountType}
                onChange={(e) => handleChange("accountType", e.target.value)}
                placeholder="Cheque / Savings / Current"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                SnapScan Paylink / Merchant ID
              </label>
              <input
                type="text"
                value={formData.snapScanId}
                onChange={(e) => handleChange("snapScanId", e.target.value)}
                placeholder="e.g. hushnails-rosebank"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* Admin Security & Login Credentials */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-stone-900 text-sm">Salon Admin Login &amp; Security</h3>
            </div>
            <span className="text-xs text-stone-400">Restricts salon management access</span>
          </div>

          <p className="text-xs text-stone-500">
            The client portal is open to all visitors to browse pricelists and specials. Only salon staff require this username and password to manage bookings, clients, quotes, and pricing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Username *
              </label>
              <input
                type="text"
                required
                value={formData.adminUsername || "admin"}
                onChange={(e) => handleChange("adminUsername", e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Password *
              </label>
              <input
                type="text"
                required
                value={formData.adminPassword || "hush2026"}
                onChange={(e) => handleChange("adminPassword", e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 font-mono"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Saved locally on your studio device.
              </span>
            </div>
          </div>
        </div>

        {/* Deposit Policy & Terms */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">Deposit Policy &amp; Cancellation Terms</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Default Booking Deposit (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.depositPercentage}
                  onChange={(e) => handleChange("depositPercentage", Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  %
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cancellation &amp; Grace Period Notice
              </label>
              <textarea
                rows={2}
                value={formData.cancellationPolicy}
                onChange={(e) => handleChange("cancellationPolicy", e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200"
              />
            </div>
          </div>

          {/* Direct Save Button for Studio Settings & Address */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-stone-500">
              Address &amp; banking changes save immediately to Firestore cloud and update all WhatsApp links.
            </span>
            <button
              type="submit"
              onClick={handleSave}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Studio Profile &amp; Address Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Studio Profile &amp; Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Cloud Database Status */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-stone-900 text-sm">Firebase Firestore Cloud Database</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Cloud Sync Active</span>
            </span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            All appointments booked by clients on their phones, client profile updates, treatment prices, and EFT invoices are synchronized live across all devices using Google Cloud Firestore.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] font-semibold text-stone-500 block">Cloud Project</span>
              <span className="font-mono font-medium text-stone-800">fit-box-8wgw1</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] font-semibold text-stone-500 block">Firestore Database ID</span>
              <span className="font-mono text-[11px] font-medium text-stone-800 break-all">ai-studio-nailstudiopro-24265d06-d402-4260-9378-c5a117c34481</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] font-semibold text-stone-500 block">Sync Architecture</span>
              <span className="text-stone-800 font-medium">Real-time WebSocket &amp; onSnapshot</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <span className="text-[11px] font-semibold text-stone-500 block">Collections Path</span>
              <span className="font-mono text-stone-800 font-medium">salons/hush-rosebank/*</span>
            </div>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <h3 className="font-bold text-stone-900 text-sm">Data Backup &amp; Export</h3>
          <p className="text-xs text-stone-500">
            Export a full JSON snapshot of your service menu, client bookings, invoices, and marketing schedule for safekeeping.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onExportAllData}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Studio Backup (.json)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </form>

      {/* APK Export Guidance Modal */}
      <ApkExportModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        salonName={formData.salonName}
      />
    </div>
  );
};

