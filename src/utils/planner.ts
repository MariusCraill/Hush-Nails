import {
  Booking,
  MenuItem,
  PlannerSettings,
  PlannerTask,
  SalonProfile,
  SocialPlatform,
} from "../types";

export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  workStart: "09:00",
  workEnd: "18:00",
  notificationsEnabled: false,
  leadMinutes: 15,
  autoPlanDaily: true,
  remindBookings: true,
};

// ---------- date / time helpers (local time, not UTC) ----------
export const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayStr = (): string => toDateStr(new Date());

export const addDays = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
};

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const taskDateTime = (date: string, time: string): Date => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

export const formatLongDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// ---------- peak posting windows (SAST, general benchmarks) ----------
export interface PeakWindow {
  start: string;
  end: string;
  label: string;
  rank: 1 | 2 | 3; // 1 = best
}

const isWeekend = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay();
  return wd === 0 || wd === 6;
};

// General social-media benchmarks for South African audiences. These are
// starting points, not live analytics: the best times for *your* followers
// are in each platform's own insights page.
export function getPeakWindows(platform: SocialPlatform, dateStr: string): PeakWindow[] {
  const weekend = isWeekend(dateStr);
  switch (platform) {
    case "TikTok":
      return weekend
        ? [
            { start: "19:00", end: "21:00", label: "Weekend evening prime", rank: 1 },
            { start: "10:00", end: "12:00", label: "Weekend morning scroll", rank: 2 },
          ]
        : [
            { start: "18:30", end: "20:30", label: "Evening prime peak", rank: 1 },
            { start: "12:30", end: "13:45", label: "Lunch scrolling", rank: 2 },
            { start: "07:30", end: "09:00", label: "Morning commute", rank: 3 },
          ];
    case "Instagram":
      return weekend
        ? [
            { start: "10:00", end: "12:00", label: "Weekend late morning", rank: 1 },
            { start: "18:00", end: "20:00", label: "Weekend evening", rank: 2 },
          ]
        : [
            { start: "12:00", end: "13:30", label: "Lunch break", rank: 1 },
            { start: "18:00", end: "20:00", label: "After-work peak", rank: 2 },
            { start: "07:30", end: "09:00", label: "Morning commute", rank: 3 },
          ];
    case "Facebook":
      return weekend
        ? [{ start: "09:00", end: "11:00", label: "Weekend morning", rank: 1 }]
        : [
            { start: "09:00", end: "10:30", label: "Mid-morning", rank: 1 },
            { start: "13:00", end: "15:00", label: "Early afternoon", rank: 2 },
          ];
    case "WhatsApp Status":
    default:
      return weekend
        ? [
            { start: "08:00", end: "10:00", label: "Weekend morning", rank: 1 },
            { start: "17:00", end: "19:00", label: "Early evening", rank: 2 },
          ]
        : [
            { start: "07:00", end: "08:30", label: "Before work", rank: 1 },
            { start: "17:00", end: "18:30", label: "After work", rank: 2 },
            { start: "12:00", end: "13:00", label: "Lunch", rank: 3 },
          ];
  }
}

// ---------- scheduling ----------
interface Interval {
  start: number;
  end: number;
}

const overlaps = (a: Interval, list: Interval[]) =>
  list.some((b) => a.start < b.end && a.end > b.start);

export const bookingsForDate = (bookings: Booking[], date: string) =>
  bookings
    .filter((b) => b.date === date && b.status !== "cancelled" && b.status !== "no_show")
    .sort((a, b) => a.time.localeCompare(b.time));

export interface DayLoad {
  bookingCount: number;
  bookedMinutes: number;
  capacityMinutes: number;
  loadPct: number;
}

export function getDayLoad(bookings: Booking[], date: string, settings: PlannerSettings): DayLoad {
  const day = bookingsForDate(bookings, date);
  const bookedMinutes = day.reduce((s, b) => s + (b.durationMinutes || 60), 0);
  const capacityMinutes = Math.max(60, toMinutes(settings.workEnd) - toMinutes(settings.workStart));
  return {
    bookingCount: day.length,
    bookedMinutes,
    capacityMinutes,
    loadPct: Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100)),
  };
}

// How many marketing slots the day needs: quieter day => more advertising.
export function targetMarketingSlots(load: DayLoad): number {
  if (load.bookingCount === 0) return 6;
  if (load.loadPct < 40) return 5;
  if (load.loadPct < 70) return 3;
  return 2;
}

const PLATFORM_ORDER: SocialPlatform[] = [
  "TikTok",
  "Instagram",
  "WhatsApp Status",
  "Facebook",
];

let idCounter = 0;
const newId = () => `plan-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export interface BuildPlanInput {
  date: string;
  bookings: Booking[];
  settings: PlannerSettings;
  keep?: PlannerTask[]; // manual / completed tasks that must stay put
  now?: Date;
}

export function buildDayPlan({
  date,
  bookings,
  settings,
  keep = [],
  now = new Date(),
}: BuildPlanInput): { tasks: PlannerTask[]; summary: string; load: DayLoad } {
  const load = getDayLoad(bookings, date, settings);
  const dayBookings = bookingsForDate(bookings, date);
  const workStart = toMinutes(settings.workStart);
  const workEnd = toMinutes(settings.workEnd);

  // Earliest time we may schedule (nothing in the past)
  const isToday = date === toDateStr(now);
  const earliest = isToday ? Math.max(0, now.getHours() * 60 + now.getMinutes() + 5) : 0;

  const busy: Interval[] = dayBookings.map((b) => ({
    start: toMinutes(b.time),
    end: toMinutes(b.time) + (b.durationMinutes || 60),
  }));
  keep.forEach((t) =>
    busy.push({ start: toMinutes(t.time), end: toMinutes(t.time) + t.durationMinutes })
  );

  const placed: PlannerTask[] = [];
  const free = (start: number, dur: number) =>
    start >= earliest && !overlaps({ start, end: start + dur }, busy);
  const place = (task: Omit<PlannerTask, "id" | "date" | "time" | "status" | "source">, start: number) => {
    const t: PlannerTask = {
      ...task,
      id: newId(),
      date,
      time: fromMinutes(start),
      status: "planned",
      source: "auto",
    };
    busy.push({ start, end: start + task.durationMinutes });
    placed.push(t);
  };

  const wanted = targetMarketingSlots(load);
  const existingMarketing = keep.filter((t) => t.kind === "post" || t.kind === "promo").length;
  const needed = Math.max(0, wanted - existingMarketing);

  // Build candidate (platform, window) pairs, best-ranked first.
  const quiet = load.loadPct < 40;
  const candidates: { platform: SocialPlatform; w: PeakWindow }[] = [];
  PLATFORM_ORDER.forEach((p) =>
    getPeakWindows(p, date).forEach((w) => candidates.push({ platform: p, w }))
  );
  const platformWeight: Record<SocialPlatform, number> = {
    TikTok: 0,
    Instagram: 0.2,
    "WhatsApp Status": quiet ? 0 : 0.5, // direct-booking channel matters most on quiet days
    Facebook: 0.8,
  };
  candidates.sort(
    (a, b) => a.w.rank + platformWeight[a.platform] - (b.w.rank + platformWeight[b.platform])
  );

  const usedPlatformCount: Record<string, number> = {};
  const MIN_GAP = 60; // minutes between marketing slots
  const marketingStarts: number[] = keep
    .filter((t) => t.kind === "post" || t.kind === "promo")
    .map((t) => toMinutes(t.time));

  for (const { platform, w } of candidates) {
    if (placed.filter((t) => t.kind === "post" || t.kind === "promo").length >= needed) break;
    if ((usedPlatformCount[platform] || 0) >= 2) continue;
    const dur = 20;
    const ws = toMinutes(w.start);
    const we = toMinutes(w.end);
    // Try to land inside the window, in 15 minute steps
    let start: number | null = null;
    for (let s = ws; s + dur <= we; s += 15) {
      if (free(s, dur) && marketingStarts.every((m) => Math.abs(m - s) >= MIN_GAP)) {
        start = s;
        break;
      }
    }
    if (start === null) continue;
    const isPromo = platform === "WhatsApp Status" || (quiet && platform === "Instagram");
    place(
      {
        durationMinutes: dur,
        kind: isPromo ? "promo" : "post",
        platform,
        isPeak: true,
        title: isPromo
          ? `Fill open slots: ${platform} promo`
          : `Post to ${platform}`,
        reason: `${w.label} for ${platform} (${w.start}–${w.end})${
          isPromo && load.bookingCount < 3 ? ` · ${load.bookingCount === 0 ? "no bookings" : "light bookings"} today, so promote open slots` : ""
        }`,
      },
      start
    );
    marketingStarts.push(start);
    usedPlatformCount[platform] = (usedPlatformCount[platform] || 0) + 1;
  }

  // Fallback: if peak windows were all blocked, use the biggest free gaps
  let guard = 0;
  while (
    placed.filter((t) => t.kind === "post" || t.kind === "promo").length < Math.min(needed, 2) &&
    guard++ < 40
  ) {
    let found: number | null = null;
    for (let s = Math.max(workStart, earliest); s + 20 <= workEnd; s += 15) {
      if (free(s, 20) && marketingStarts.every((m) => Math.abs(m - s) >= MIN_GAP)) {
        found = s;
        break;
      }
    }
    if (found === null) break;
    const platform = PLATFORM_ORDER[placed.length % PLATFORM_ORDER.length];
    place(
      {
        durationMinutes: 20,
        kind: "post",
        platform,
        isPeak: false,
        title: `Post to ${platform}`,
        reason: "Peak windows are taken by clients, so this is the nearest free gap",
      },
      found
    );
    marketingStarts.push(found);
  }

  // Content prep: earliest free 30 min in work hours, ahead of the first
  // in-hours post if there is one (so the content exists before it's needed)
  const marketing = placed
    .filter((t) => t.kind === "post" || t.kind === "promo")
    .sort((a, b) => a.time.localeCompare(b.time));
  if (marketing.length > 0 && !keep.some((t) => t.kind === "prep")) {
    const firstInHours = marketing.find((t) => toMinutes(t.time) >= workStart);
    const limit = firstInHours ? toMinutes(firstInHours.time) : workEnd;
    const tryRange = (to: number) => {
      for (let s = Math.max(workStart, earliest); s + 30 <= to; s += 15) {
        if (free(s, 30)) return s;
      }
      return null;
    };
    const s = tryRange(limit) ?? tryRange(workEnd);
    if (s !== null) {
      {
        place(
          {
            durationMinutes: 30,
            kind: "prep",
            title: "Film & edit today's nail content",
            reason: "Capture photos/videos of your latest set so every post is ready to go",
          },
          s
        );
      }
    }
  }

  // Follow-ups: reply to DMs / rebook past clients near end of work day
  if (!keep.some((t) => t.kind === "followup")) {
    const startFrom = Math.max(workEnd - 30, earliest);
    for (let s = startFrom; s + 15 <= workEnd + 60; s += 15) {
      if (free(s, 15)) {
        place(
          {
            durationMinutes: 15,
            kind: "followup",
            title:
              load.bookingCount === 0
                ? "WhatsApp past clients: 'slots open this week'"
                : "Reply to DMs & confirm tomorrow's clients",
            reason:
              load.bookingCount === 0
                ? "No bookings yet. A personal message to past clients converts better than a post"
                : "Quick admin wrap-up keeps no-shows low",
          },
          s
        );
        break;
      }
    }
  }

  const marketingCount = placed.filter((t) => t.kind === "post" || t.kind === "promo").length;
  let summary: string;
  if (load.bookingCount === 0) {
    summary = `No bookings on this day, so I scheduled ${marketingCount} advertising slots at peak times to bring clients in.`;
  } else if (load.loadPct < 40) {
    summary = `${load.bookingCount} booking${load.bookingCount > 1 ? "s" : ""} (${load.loadPct}% full). There's room, so I added ${marketingCount} advertising slots.`;
  } else if (load.loadPct < 70) {
    summary = `${load.bookingCount} bookings (${load.loadPct}% full). Added ${marketingCount} posting slots around your clients.`;
  } else {
    summary = `A busy day (${load.loadPct}% full). Kept marketing light: ${marketingCount} quick posting slots.`;
  }

  return {
    tasks: placed.sort((a, b) => a.time.localeCompare(b.time)),
    summary,
    load,
  };
}

// ---------- AI content ----------
export interface SlotContent {
  id: string;
  title?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  format?: string;
}

export async function fetchSlotContent(
  tasks: PlannerTask[],
  salon: SalonProfile,
  menu: MenuItem[],
  bookingCount: number
): Promise<SlotContent[]> {
  const slots = tasks
    .filter((t) => (t.kind === "post" || t.kind === "promo") && t.platform)
    .map((t) => ({ id: t.id, platform: t.platform, kind: t.kind, time: t.time }));
  if (slots.length === 0) return [];
  try {
    const res = await fetch("/api/gemini/day-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonName: salon.salonName,
        city: salon.city,
        services: menu
          .filter((m) => m.isActive)
          .slice(0, 12)
          .map((m) => ({ name: m.name, price: m.price })),
        bookingCount,
        slots,
      }),
    });
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export function applyContent(tasks: PlannerTask[], content: SlotContent[]): PlannerTask[] {
  const byId = new Map(content.map((c) => [c.id, c]));
  return tasks.map((t) => {
    const c = byId.get(t.id);
    if (!c) return t;
    return {
      ...t,
      title: c.title || t.title,
      hook: c.hook,
      caption: c.caption,
      hashtags: c.hashtags,
      format: c.format,
    };
  });
}

// ---------- .ics export (alerts that work even when the app is closed) ----------
const icsStamp = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(
    d.getHours()
  ).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;

const icsEscape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function buildIcs(tasks: PlannerTask[], leadMinutes: number): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HUSH nails//Day Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  const stamp = icsStamp(new Date());
  tasks
    .filter((t) => t.status === "planned")
    .forEach((t) => {
      const start = taskDateTime(t.date, t.time);
      const end = new Date(start.getTime() + t.durationMinutes * 60000);
      const desc = [t.reason, t.hook && `Hook: ${t.hook}`, t.caption].filter(Boolean).join("\n\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${t.id}@hush-nails`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsStamp(start)}`,
        `DTEND:${icsStamp(end)}`,
        `SUMMARY:${icsEscape(t.title)}`,
        `DESCRIPTION:${icsEscape(desc)}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(t.title)}`,
        `TRIGGER:-PT${leadMinutes}M`,
        "END:VALARM",
        "END:VEVENT"
      );
    });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
