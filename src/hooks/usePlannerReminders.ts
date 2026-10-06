import { useEffect, useRef } from "react";
import { Booking, PlannerSettings, PlannerTask } from "../types";
import { taskDateTime } from "../utils/planner";

const STORAGE_KEY = "hush_planner_notified";
const STALE_AFTER_MS = 10 * 60 * 1000; // don't fire reminders for slots started >10 min ago

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export async function showSystemNotification(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    // Android Chrome only allows notifications via a service worker registration
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(title, { body, tag });
      return;
    }
  } catch {}
  try {
    new Notification(title, { body, tag });
  } catch {}
}

const loadFired = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveFired = (s: Set<string>) => {
  try {
    // keep the list from growing forever
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s).slice(-300)));
  } catch {}
};

interface Options {
  enabled: boolean; // salon admin is logged in and reminders are on
  tasks: PlannerTask[];
  bookings: Booking[];
  settings: PlannerSettings;
  onReminder: (message: string) => void;
}

/**
 * Checks every 20s for planner slots (and client appointments) that are about
 * to start. Fires an in-app toast and, if permission was granted, a system
 * notification. Browsers only run this while the app is open, so the planner
 * also offers a calendar (.ics) export for alerts when the app is closed.
 */
export function usePlannerReminders({ enabled, tasks, bookings, settings, onReminder }: Options) {
  const latest = useRef({ tasks, bookings, settings, onReminder });
  latest.current = { tasks, bookings, settings, onReminder };

  useEffect(() => {
    if (!enabled) return;
    const fired = loadFired();

    const check = () => {
      const { tasks, bookings, settings, onReminder } = latest.current;
      const now = Date.now();
      const lead = settings.leadMinutes * 60000;

      const items: { key: string; at: number; title: string; body: string }[] = [];
      tasks
        .filter((t) => t.status === "planned")
        .forEach((t) => {
          const at = taskDateTime(t.date, t.time).getTime();
          items.push({
            key: `task:${t.id}:${t.time}:${t.date}`,
            at,
            title: `${t.time} · ${t.title}`,
            body: t.platform ? `Time to post on ${t.platform}. Your content is ready in Plan My Day.` : t.reason,
          });
        });
      if (settings.remindBookings) {
        bookings
          .filter((b) => b.status !== "cancelled" && b.status !== "no_show" && b.status !== "completed")
          .forEach((b) => {
            items.push({
              key: `booking:${b.id}:${b.date}:${b.time}`,
              at: taskDateTime(b.date, b.time).getTime(),
              title: `${b.time} · Client: ${b.clientName}`,
              body: "Appointment starting soon. Get your station ready.",
            });
          });
      }

      let changed = false;
      for (const it of items) {
        if (fired.has(it.key)) continue;
        if (now >= it.at - lead && now <= it.at + STALE_AFTER_MS) {
          fired.add(it.key);
          changed = true;
          onReminder(`${it.title}`);
          showSystemNotification(`HUSH nails: ${it.title}`, it.body, it.key);
        }
      }
      if (changed) saveFired(fired);
    };

    check();
    const timer = setInterval(check, 20000);
    return () => clearInterval(timer);
  }, [enabled]);
}
