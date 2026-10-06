import React, { useState } from "react";
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Download,
  Terminal,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({
  isOpen,
  onClose,
  salonName,
}) => {
  const [activeMethod, setActiveMethod] = useState<"capacitor" | "pwabuilder" | "pwa">("capacitor");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const appPackageName = "com." + (salonName || "hushnails").toLowerCase().replace(/[^a-z0-9]/g, "") + ".app";

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-auto relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Export as Android APK</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Turn your {salonName || "HUSH nails"} app into a standalone installable Android application (.apk)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="flex gap-2 p-1.5 bg-stone-100 rounded-xl mt-6">
          <button
            onClick={() => setActiveMethod("capacitor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeMethod === "capacitor"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Capacitor APK (Native Studio)</span>
          </button>

          <button
            onClick={() => setActiveMethod("pwabuilder")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeMethod === "pwabuilder"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PWABuilder (No Code / Cloud APK)</span>
          </button>

          <button
            onClick={() => setActiveMethod("pwa")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeMethod === "pwa"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Instant Mobile Install (Zero Build)</span>
          </button>
        </div>

        {/* Method 1: Capacitor */}
        {activeMethod === "capacitor" && (
          <div className="mt-6 space-y-4">
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-600 leading-relaxed">
              <strong className="text-stone-900 font-semibold">Recommended for full APK export:</strong>{" "}
              Capacitor wraps your React + Vite project into a real native Android Studio project and outputs a
              signed or debug <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800 font-mono">.apk</code> file.
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-800">
                    Step 1: Download code & install Capacitor
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        "npm install @capacitor/core @capacitor/cli @capacitor/android",
                        "cap-step-1"
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {copiedIndex === "cap-step-1" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIndex === "cap-step-1" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mb-2">
                  First, download this project (via Settings &gt; Export or Download ZIP) and open a terminal in the folder:
                </p>
                <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-xs overflow-x-auto">
                  npm install @capacitor/core @capacitor/cli @capacitor/android
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-800">
                    Step 2: Initialize Capacitor & configure Web Dir
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `npx cap init "${salonName || "HUSH nails"}" "${appPackageName}" --web-dir dist`,
                        "cap-step-2"
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {copiedIndex === "cap-step-2" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIndex === "cap-step-2" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-xs overflow-x-auto">
                  npx cap init "{salonName || "HUSH nails"}" "{appPackageName}" --web-dir dist
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-800">
                    Step 3: Build Vite & add Android platform
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard("npm run build && npx cap add android && npx cap copy", "cap-step-3")
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {copiedIndex === "cap-step-3" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIndex === "cap-step-3" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-xs overflow-x-auto">
                  npm run build && npx cap add android && npx cap copy
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-800">
                    Step 4: Open in Android Studio & Generate APK
                  </span>
                  <button
                    onClick={() => copyToClipboard("npx cap open android", "cap-step-4")}
                    className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900"
                  >
                    {copiedIndex === "cap-step-4" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedIndex === "cap-step-4" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="bg-stone-900 text-stone-100 p-2.5 rounded-lg font-mono text-xs overflow-x-auto mb-2">
                  npx cap open android
                </div>
                <p className="text-[11px] text-stone-600">
                  Inside Android Studio: Click <strong className="text-stone-900">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
                  Your APK will be ready in <code className="bg-stone-100 text-stone-800 px-1 py-0.5 rounded font-mono">android/app/build/outputs/apk/debug/app-debug.apk</code> to transfer directly to any phone!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Method 2: PWABuilder */}
        {activeMethod === "pwabuilder" && (
          <div className="mt-6 space-y-4">
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl text-xs text-stone-600 leading-relaxed">
              <strong className="text-stone-900 font-semibold">Fastest cloud APK packaging:</strong>{" "}
              If your app is deployed online (via AI Studio Cloud Run, Vercel, Netlify, etc.), you can generate an Android APK directly through Microsoft &amp; Google's free PWABuilder service with zero command-line tools.
            </div>

            <ol className="space-y-3 text-xs text-stone-700">
              <li className="p-3.5 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-stone-900 block font-semibold mb-0.5">
                    Deploy your app or get your public live URL
                  </strong>
                  <span>
                    Click the <strong>Share</strong> or <strong>Deploy</strong> button in AI Studio to get your public web URL.
                  </span>
                </div>
              </li>

              <li className="p-3.5 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-stone-900 block font-semibold mb-0.5">
                    Visit PWABuilder.com
                  </strong>
                  <p className="mb-2">Enter your URL into PWABuilder and click "Start".</p>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors"
                  >
                    <span>Open PWABuilder.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>

              <li className="p-3.5 rounded-xl border border-stone-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-stone-900 block font-semibold mb-0.5">
                    Click "Package for Android" &amp; Download APK
                  </strong>
                  <span>
                    PWABuilder compiles a Google Trusted Web Activity (TWA) package. Download the signed APK for testing or the AAB package ready for Google Play Store upload.
                  </span>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Method 3: Direct Mobile PWA */}
        {activeMethod === "pwa" && (
          <div className="mt-6 space-y-4">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
              <strong className="font-semibold">Instant Installation on any Android device:</strong>{" "}
              You do not actually need an APK to install this app on your phone! Modern Android devices let you install the app directly with an app icon on your home screen and full offline functionality.
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <h4 className="font-bold text-stone-900 mb-1">How to install on Android in 10 seconds:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-600 mt-2">
                  <li>Open this app in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> in the top-right corner of Chrome.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app will install as a native icon with your custom logo ({salonName}) and launch in full-screen mode without any browser URL bar.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                <h4 className="font-bold text-stone-900 mb-1">Can I send the APK to clients or staff?</h4>
                <p className="text-stone-600 text-xs">
                  Yes! Use <strong>Method 1 (Capacitor)</strong> to generate an <code className="bg-stone-200 px-1 py-0.5 rounded font-mono text-stone-800">app-debug.apk</code> file, which you can share directly via WhatsApp, Google Drive, or email to install onto any Android smartphone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Target Platform: Android 8.0+ (Oreo to Android 15)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
