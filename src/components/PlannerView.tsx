import React, { useMemo, useState } from "react";
import {
  Booking,
  MenuItem,
  PlannerSettings,
  PlannerTask,
  PlannerTaskKind,
  SalonProfile,
  SocialPlatform,
} from "../types";
import {
  addDays,
  applyContent,
  buildDayPlan,
  buildIcs,
  fetchSlotContent,
  formatLongDate,
  getDayLoad,
  getPeakWindows,
  bookingsForDate,
  taskDateTime,
  todayStr,
} from "../utils/planner";
import { notificationsSupported, showSystemNotification } from "../hooks/usePlannerReminders";
import {
  Bell,
  BellOff,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Flame,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Scissors,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

interface PlannerViewProps {
  tasks: PlannerTask[];
  settings: PlannerSettings;
  bookings: Booking[];
  menu: MenuItem[];
  salon: SalonProfile;
  onTasksChange: (tasks: PlannerTask[]) => void;
  onSettingsChange: (s: PlannerSettings) => void;
  onOpenBookings: () => void;
  onToast: (msg: string) => void;
}

const KIND_META: Record<PlannerTaskKind, { label: string; color: string; icon: React.ElementType }> = {
  post: { label: "Post", color: "bg-rose-100 text-rose-800 border-rose-200", icon: Sparkles },
  promo: { label: "Fill open slots", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Flame },
  prep: { label: "Content prep", color: "bg-sky-100 text-sky-800 border-sky-200", icon: Wand2 },
  followup: { label: "Follow-up", color: "bg-violet-100 text-violet-800 border-violet-200", icon: MessageCircle },
  custom: { label: "Custom", color: "bg-stone-100 text-stone-700 border-stone-200", icon: Clock },
};

const PLATFORMS: SocialPlatform[] = ["TikTok", "Instagram", "WhatsApp Status", "Facebook"];

const PLATFORM_LINKS: Record<SocialPlatform, string> = {
  TikTok: "https://www.tiktok.com/upload",
  Instagram: "https://www.instagram.com/",
  Facebook: "https://www.facebook.com/",
  "WhatsApp Status": "https://web.whatsapp.com/",
};

export const PlannerView: React.FC<PlannerViewProps> = ({
  tasks,
  settings,
  bookings,
  menu,
  salon,
  onTasksChange,
  onSettingsChange,
  onOpenBookings,
  onToast,
}) => {
  const [date, setDate] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTime, setNewTime] = useState("10:00");
  const [newTitle, setNewTitle] = useState("");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    notificationsSupported() ? Notification.permission : "unsupported"
  );

  const dayBookings = useMemo(() => bookingsForDate(bookings, date), [bookings, date]);
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.date === date).sort((a, b) => a.time.localeCompare(b.time)),
    [tasks, date]
  );
  const load = getDayLoad(bookings, date, settings);
  const isToday = date === todayStr();

  // Merge bookings and tasks into one chronological timeline
  const timeline = useMemo(() => {
    const rows: ({ type: "booking"; time: string; b: Booking } | { type: "task"; time: string; t: PlannerTask })[] = [
      ...dayBookings.map((b) => ({ type: "booking" as const, time: b.time, b })),
      ...dayTasks.map((t) => ({ type: "task" as const, time: t.time, t })),
    ];
    return rows.sort((a, b) => a.time.localeCompare(b.time));
  }, [dayBookings, dayTasks]);

  const nextUp = useMemo(() => {
    const now = Date.now();
    return dayTasks.find((t) => t.status === "planned" && taskDateTime(t.date, t.time).getTime() >= now - 10 * 60000);
  }, [dayTasks]);

  const serviceName = (id: string) => menu.find((m) => m.id === id)?.name;

  const replaceDay = (newDayTasks: PlannerTask[]) =>
    onTasksChange([...tasks.filter((t) => t.date !== date), ...newDayTasks]);

  const handlePlan = async () => {
    setBusy(true);
    try {
      // Keep what the owner already did or added; re-plan the rest
      const keep = dayTasks.filter((t) => t.source === "manual" || t.status !== "planned");
      const plan = buildDayPlan({ date, bookings, settings, keep });
      const content = await fetchSlotContent(plan.tasks, salon, menu, plan.load.bookingCount);
      const filled = applyContent(plan.tasks, content);
      replaceDay([...keep, ...filled]);
      setSummary(plan.summary);
      if (filled.length === 0) onToast("No free time left to plan on this day.");
      else onToast(`Planned ${filled.length} slots for ${formatLongDate(date)}.`);
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async (t: PlannerTask) => {
    setBusy(true);
    try {
      const content = await fetchSlotContent([t], salon, menu, load.bookingCount);
      onTasksChange(applyContent(tasks, content));
      onToast("New content generated.");
    } finally {
      setBusy(false);
    }
  };

  const updateTask = (id: string, patch: Partial<PlannerTask>) =>
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const handleCopy = (t: PlannerTask) => {
    const text = [t.hook, t.caption, (t.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
    navigator.clipboard?.writeText(text);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const t: PlannerTask = {
      id: `plan-m-${Date.now()}`,
      date,
      time: newTime,
      durationMinutes: 30,
      kind: "custom",
      title: newTitle.trim(),
      reason: "Added by you",
      status: "planned",
      source: "manual",
    };
    replaceDay([...dayTasks, t]);
    setNewTitle("");
    setShowAdd(false);
  };

  const enableNotifications = async () => {
    if (!notificationsSupported()) {
      onSettingsChange({ ...settings, notificationsEnabled: true });
      onToast("This browser can't show system alerts. In-app reminders are on; use the calendar export for phone alerts.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    onSettingsChange({ ...settings, notificationsEnabled: true });
    if (result === "granted") {
      showSystemNotification("HUSH nails reminders are on 🔔", "You'll be alerted before each planned slot.", "hush-test");
      onToast("Reminders enabled.");
    } else {
      onToast("Alerts blocked by the browser. In-app reminders are on; allow notifications in site settings for system alerts.");
    }
  };

  const disableNotifications = () => {
    onSettingsChange({ ...settings, notificationsEnabled: false });
    onToast("Reminders turned off.");
  };

  const downloadIcs = () => {
    const upcoming = tasks.filter((t) => t.date >= todayStr() && t.status === "planned");
    if (upcoming.length === 0) {
      onToast("Nothing planned yet. Tap 'Plan my day' first.");
      return;
    }
    const blob = new Blob([buildIcs(upcoming, settings.leadMinutes)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hush-nails-day-plan.ics";
    a.click();
    URL.revokeObjectURL(url);
    onToast("Calendar file downloaded. Open it to add alerts to your phone calendar.");
  };

  // Next 7 days strip
  const week = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), i));

  const remindersOn = settings.notificationsEnabled;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900">Plan My Day</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Powered
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            One tap builds your day: it works around your bookings, adds ads when you're quiet, writes the posts, and reminds you at the best times.
          </p>
        </div>
        <button
          onClick={handlePlan}
          disabled={busy}
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-60 rounded-xl shadow-sm transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-rose-300" />}
          <span>{dayTasks.some((t) => t.source === "auto") ? "Re-plan this day" : "Plan my day with AI"}</span>
        </button>
      </div>

      {/* Week strip */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDate(addDays(date, -1))}
          className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const l = getDayLoad(bookings, d, settings);
            const [y, m, dd] = d.split("-").map(Number);
            const dt = new Date(y, m - 1, dd);
            const active = d === date;
            const planned = tasks.filter((t) => t.date === d && t.status === "planned").length;
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`rounded-xl px-1 py-2 text-center border transition-colors ${
                  active ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 hover:bg-stone-50"
                }`}
              >
                <div className={`text-[10px] font-semibold uppercase ${active ? "text-rose-300" : "text-stone-400"}`}>
                  {dt.toLocaleDateString("en-ZA", { weekday: "short" })}
                </div>
                <div className="text-sm font-bold">{dd}</div>
                <div className={`text-[10px] ${active ? "text-stone-300" : l.bookingCount === 0 ? "text-amber-600 font-semibold" : "text-stone-500"}`}>
                  {l.bookingCount === 0 ? "empty" : `${l.bookingCount} booked`}
                </div>
                {planned > 0 && <div className={`text-[9px] ${active ? "text-stone-400" : "text-rose-500"}`}>{planned} tasks</div>}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setDate(addDays(date, 1))}
          className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50"
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{isToday ? "Today" : "Selected day"}</div>
          <div className="text-sm font-bold text-stone-900 mt-1">{formatLongDate(date)}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Bookings</div>
          <div className="text-2xl font-bold text-stone-900">{load.bookingCount}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Diary full</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-stone-900">{load.loadPct}%</div>
            <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
              <div
                className={`h-full ${load.loadPct < 40 ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{ width: `${load.loadPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Next up</div>
          <div className="text-sm font-bold text-stone-900 mt-1 truncate">
            {nextUp ? `${nextUp.time} · ${nextUp.title}` : "Nothing planned"}
          </div>
        </div>
      </div>

      {/* AI insight */}
      {(summary || (load.loadPct < 40 && dayTasks.length === 0)) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-3">
          <Flame className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            {summary || (
              <>
                {load.bookingCount === 0 ? "No bookings on this day." : `Only ${load.bookingCount} booking${load.bookingCount > 1 ? "s" : ""} on this day.`}{" "}
                Tap <strong>Plan my day with AI</strong> and I'll schedule extra advertising slots to fill the diary.
              </>
            )}
          </div>
        </div>
      )}

      {/* Reminders panel */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${remindersOn ? "bg-emerald-100" : "bg-stone-100"}`}>
              {remindersOn ? <Bell className="w-5 h-5 text-emerald-700" /> : <BellOff className="w-5 h-5 text-stone-400" />}
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">
                Reminders {remindersOn ? "are on" : "are off"}
              </div>
              <div className="text-xs text-stone-500">
                {remindersOn
                  ? `Alerts ${settings.leadMinutes} min before each slot${
                      permission === "granted" ? "." : permission === "unsupported" ? " (in-app only on this browser)." : " (in-app only; allow notifications in your browser for system alerts)."
                    }`
                  : "Get a nudge before every post and appointment."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {remindersOn ? (
              <button onClick={disableNotifications} className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700">
                Turn off
              </button>
            ) : (
              <button onClick={enableNotifications} className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Turn on reminders
              </button>
            )}
            <button onClick={downloadIcs} className="px-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5" title="Alerts that also work when this app is closed">
              <Download className="w-3.5 h-3.5" /> Add to phone calendar
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600">
              {showSettings ? "Hide options" : "Options"}
            </button>
          </div>
        </div>

        {remindersOn && (
          <p className="text-[11px] text-stone-400">
            Browser alerts only fire while this page is open. For alerts when it's closed, use <strong>Add to phone calendar</strong>.
          </p>
        )}

        {showSettings && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
            <label className="text-xs font-semibold text-stone-700">
              Day starts
              <input type="time" value={settings.workStart} onChange={(e) => onSettingsChange({ ...settings, workStart: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            </label>
            <label className="text-xs font-semibold text-stone-700">
              Day ends
              <input type="time" value={settings.workEnd} onChange={(e) => onSettingsChange({ ...settings, workEnd: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            </label>
            <label className="text-xs font-semibold text-stone-700">
              Remind me
              <select value={settings.leadMinutes} onChange={(e) => onSettingsChange({ ...settings, leadMinutes: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm">
                {[5, 10, 15, 30, 60].map((m) => (
                  <option key={m} value={m}>{m} min before</option>
                ))}
              </select>
            </label>
            <div className="space-y-2 text-xs font-semibold text-stone-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.autoPlanDaily} onChange={(e) => onSettingsChange({ ...settings, autoPlanDaily: e.target.checked })} />
                Auto-plan each day when I open the app
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={settings.remindBookings} onChange={(e) => onSettingsChange({ ...settings, remindBookings: e.target.checked })} />
                Remind me of client appointments
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-stone-400" /> Your schedule
          </h2>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900">
            <Plus className="w-3.5 h-3.5" /> Add my own slot
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddCustom} className="p-3 rounded-2xl bg-white border border-stone-200 flex flex-wrap gap-2 items-end">
            <label className="text-xs font-semibold text-stone-700">
              Time
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1 block px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            </label>
            <label className="text-xs font-semibold text-stone-700 flex-1 min-w-[180px]">
              What
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Restock acrylic powder" className="mt-1 block w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            </label>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-stone-900 rounded-xl">Add</button>
          </form>
        )}

        {timeline.length === 0 && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-stone-200 text-center">
            <CalendarCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">Nothing on the schedule yet</p>
            <p className="text-xs text-stone-500 mt-1">Tap “Plan my day with AI” and your day fills itself in.</p>
          </div>
        )}

        {timeline.map((row) => {
          if (row.type === "booking") {
            const b = row.b;
            return (
              <div key={`b-${b.id}`} className="flex gap-3 items-stretch">
                <div className="w-14 pt-3 text-sm font-bold text-stone-900 shrink-0">{b.time}</div>
                <button
                  onClick={onOpenBookings}
                  className="flex-1 text-left p-3 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <Scissors className="w-4 h-4" /> {b.clientName}
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">Client</span>
                  </div>
                  <div className="text-xs text-emerald-800 mt-0.5">
                    {b.durationMinutes} min · {b.serviceIds.map(serviceName).filter(Boolean).join(", ") || "Appointment"}
                  </div>
                </button>
              </div>
            );
          }
          const t = row.t;
          const meta = KIND_META[t.kind];
          const Icon = meta.icon;
          const open = expanded === t.id;
          const hasContent = !!(t.hook || t.caption);
          const done = t.status === "done";
          const skipped = t.status === "skipped";
          return (
            <div key={t.id} className="flex gap-3 items-stretch">
              <div className="w-14 pt-3 text-sm font-bold text-stone-900 shrink-0">{t.time}</div>
              <div className={`flex-1 rounded-2xl bg-white border ${done ? "border-emerald-200 opacity-70" : skipped ? "border-stone-200 opacity-50" : "border-stone-200"} overflow-hidden`}>
                <div className="p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${done || skipped ? "line-through text-stone-500" : "text-stone-900"}`}>{t.title}</span>
                      {t.isPeak && !done && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">PEAK TIME</span>
                      )}
                      {done && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">DONE</span>}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">{t.reason}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {t.status === "planned" && (
                        <>
                          <button onClick={() => updateTask(t.id, { status: "done" })} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                            <Check className="w-3 h-3" /> Done
                          </button>
                          <button onClick={() => updateTask(t.id, { status: "skipped" })} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200">
                            Skip
                          </button>
                        </>
                      )}
                      {t.status !== "planned" && (
                        <button onClick={() => updateTask(t.id, { status: "planned" })} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200">
                          Undo
                        </button>
                      )}
                      <input
                        type="time"
                        value={t.time}
                        onChange={(e) => e.target.value && updateTask(t.id, { time: e.target.value })}
                        className="px-2 py-1 text-xs rounded-lg border border-stone-200 bg-stone-50"
                        aria-label="Change time"
                      />
                      {hasContent && (
                        <button onClick={() => setExpanded(open ? null : t.id)} className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100">
                          {open ? "Hide post" : "View post"}
                        </button>
                      )}
                      <button onClick={() => onTasksChange(tasks.filter((x) => x.id !== t.id))} className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 ml-auto" aria-label="Delete slot">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {open && hasContent && (
                  <div className="px-3 pb-3 pt-0 border-t border-stone-100 bg-stone-50/60 space-y-2">
                    {t.format && <div className="text-[11px] text-stone-500 pt-2"><strong>Format:</strong> {t.format}</div>}
                    {t.hook && <div className="text-xs"><strong className="text-stone-700">Hook:</strong> {t.hook}</div>}
                    {t.caption && <p className="text-xs text-stone-700 whitespace-pre-line">{t.caption}</p>}
                    {t.hashtags && <div className="text-[11px] text-rose-700">{t.hashtags.join(" ")}</div>}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleCopy(t)} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-900 text-white">
                        {copied === t.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === t.id ? "Copied" : "Copy caption"}
                      </button>
                      {t.platform && (
                        <a href={PLATFORM_LINKS[t.platform]} target="_blank" rel="noreferrer" className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100">
                          Open {t.platform}
                        </a>
                      )}
                      <button onClick={() => handleRegenerate(t)} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-50">
                        <RefreshCw className="w-3 h-3" /> New idea
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Peak times guide */}
      <div className="p-4 rounded-2xl bg-stone-900 text-white">
        <div className="flex items-center gap-2 text-sm font-bold mb-3">
          <Flame className="w-4 h-4 text-rose-400" /> Best times to post on {formatLongDate(date)} (SAST)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLATFORMS.map((p) => (
            <div key={p} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs font-bold text-rose-300 mb-1">{p}</div>
              {getPeakWindows(p, date).map((w) => (
                <div key={w.start} className="flex justify-between text-[11px] text-stone-300">
                  <span>{w.start}–{w.end}</span>
                  <span className="text-stone-500">{w.rank === 1 ? "best" : w.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-stone-500 mt-3">
          General benchmarks for South African audiences. Your own followers may differ: check each app's insights and adjust times in the schedule above.
        </p>
      </div>
    </div>
  );
};
