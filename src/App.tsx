import React, { useState, useEffect } from "react";
import { Navigation, TabType } from "./components/Navigation";
import { BookingsView } from "./components/BookingsView";
import { MenuView } from "./components/MenuView";
import { InvoicesView } from "./components/InvoicesView";
import { MarketingView } from "./components/MarketingView";
import { PlannerView } from "./components/PlannerView";
import { usePlannerReminders } from "./hooks/usePlannerReminders";
import {
  DEFAULT_PLANNER_SETTINGS,
  applyContent,
  buildDayPlan,
  fetchSlotContent,
  addDays,
  todayStr,
} from "./utils/planner";
import { PaymentsView } from "./components/PaymentsView";
import { SettingsView } from "./components/SettingsView";
import { ApkExportModal } from "./components/ApkExportModal";
import { ClientPortalView } from "./components/ClientPortalView";
import { ClientsView } from "./components/ClientsView";
import { AuthModal } from "./components/AuthModal";
import {
  Booking,
  Invoice,
  InvoiceItem,
  MarketingPost,
  MenuItem,
  SalonProfile,
  UserSession,
  ComboDeal,
  SpecialOffer,
  ClientProfile,
  PlannerTask,
  PlannerSettings,
} from "./types";
import {
  DEFAULT_BOOKINGS,
  DEFAULT_INVOICES,
  DEFAULT_MARKETING_POSTS,
  DEFAULT_SALON_PROFILE,
  DEFAULT_CLIENTS,
} from "./data/defaultData";
import { DEFAULT_MENU } from "./data/defaultMenu";
import { DEFAULT_COMBOS, DEFAULT_SPECIALS } from "./data/defaultSpecials";
import { cleanPhoneNumber } from "./utils/formatters";
import { CheckCircle2, X, Eye, ShieldCheck, User, LogOut, Cloud } from "lucide-react";
import {
  testConnection,
  saveSalonProfileToCloud,
  saveBookingToCloud,
  deleteBookingFromCloud,
  saveClientProfileToCloud,
  deleteClientFromCloud,
  saveMenuItemToCloud,
  deleteMenuItemFromCloud,
  saveInvoiceToCloud,
  deleteInvoiceFromCloud,
  seedInitialFirestoreData,
  subscribeToFirestore,
} from "./firebase";

export default function App() {
  // Tabs
  const [currentTab, setCurrentTab] = useState<TabType>("planner");
  const [showGlobalApkModal, setShowGlobalApkModal] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

  // User Role Session: The client portal is open to all to view by default
  const [session, setSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem("hush_nails_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear old dummy client profile if any
        if (parsed.client && (parsed.client.name === "Lerato Molefe" && parsed.client.id === "cli-lerato")) {
          return { role: "client" };
        }
        return parsed;
      }
    } catch {}
    return { role: "client" };
  });

  // Admin authentication state: only admin access requires admin username & password
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hush_nails_admin_auth") === "true";
    } catch {
      return false;
    }
  });

  // Client database for HUSH nails
  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem("hush_nails_clients");
      if (saved) {
        const parsed: ClientProfile[] = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DEFAULT_CLIENTS;
      }
      return DEFAULT_CLIENTS;
    } catch {
      return DEFAULT_CLIENTS;
    }
  });

  // Auth modal mode
  const [authModalMode, setAuthModalMode] = useState<"admin" | "client_lookup">("admin");

  // Combos & Specials
  const [combos, setCombos] = useState<ComboDeal[]>(() => {
    try {
      const saved = localStorage.getItem("hush_nails_combos");
      return saved ? JSON.parse(saved) : DEFAULT_COMBOS;
    } catch {
      return DEFAULT_COMBOS;
    }
  });

  const [specials, setSpecials] = useState<SpecialOffer[]>(() => {
    try {
      const saved = localStorage.getItem("hush_nails_specials");
      return saved ? JSON.parse(saved) : DEFAULT_SPECIALS;
    } catch {
      return DEFAULT_SPECIALS;
    }
  });

  // State with LocalStorage Persistence
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_menu");
      return saved ? JSON.parse(saved) : DEFAULT_MENU;
    } catch {
      return DEFAULT_MENU;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_bookings");
      if (saved) {
        const parsed: Booking[] = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DEFAULT_BOOKINGS;
      }
      return DEFAULT_BOOKINGS;
    } catch {
      return DEFAULT_BOOKINGS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_invoices");
      if (saved) {
        const parsed: Invoice[] = JSON.parse(saved);
        return parsed.length > 0 ? parsed : DEFAULT_INVOICES;
      }
      return DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
    }
  });

  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_marketing");
      return saved ? JSON.parse(saved) : DEFAULT_MARKETING_POSTS;
    } catch {
      return DEFAULT_MARKETING_POSTS;
    }
  });

  const [salon, setSalon] = useState<SalonProfile>(() => {
    try {
      const saved = localStorage.getItem("nail_studio_profile");
      if (saved) {
        const parsed: SalonProfile = JSON.parse(saved);
        if (!parsed.salonName || parsed.salonName === "Luxe Claws Nail Studio" || parsed.salonName === "NailStudio Pro") {
          parsed.salonName = "HUSH nails";
          if (parsed.email === "bookings@luxeclaws.co.za") {
            parsed.email = "bookings@hushnails.co.za";
          }
          if (parsed.accountHolder === "Luxe Claws Studio Pty Ltd") {
            parsed.accountHolder = "HUSH Nails Pty Ltd";
          }
          if (parsed.snapScanId === "luxeclaws-rosebank") {
            parsed.snapScanId = "hushnails-rosebank";
          }
          localStorage.setItem("nail_studio_profile", JSON.stringify(parsed));
        }
        return parsed;
      }
      return DEFAULT_SALON_PROFILE;
    } catch {
      return DEFAULT_SALON_PROFILE;
    }
  });

  // AI Day Planner: tasks + settings (local to this device)
  const [plannerTasks, setPlannerTasks] = useState<PlannerTask[]>(() => {
    try {
      const saved = localStorage.getItem("hush_planner_tasks");
      const cutoff = addDays(todayStr(), -7);
      return saved ? (JSON.parse(saved) as PlannerTask[]).filter((t) => t.date >= cutoff) : [];
    } catch {
      return [];
    }
  });

  const [plannerSettings, setPlannerSettings] = useState<PlannerSettings>(() => {
    try {
      const saved = localStorage.getItem("hush_planner_settings");
      return saved ? { ...DEFAULT_PLANNER_SETTINGS, ...JSON.parse(saved) } : DEFAULT_PLANNER_SETTINGS;
    } catch {
      return DEFAULT_PLANNER_SETTINGS;
    }
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("nail_studio_menu", JSON.stringify(menu));
    } catch (e) {}
  }, [menu]);

  useEffect(() => {
    try {
      localStorage.setItem("nail_studio_bookings", JSON.stringify(bookings));
    } catch (e) {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem("nail_studio_invoices", JSON.stringify(invoices));
    } catch (e) {}
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_nails_clients", JSON.stringify(clients));
    } catch (e) {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem("nail_studio_marketing", JSON.stringify(marketingPosts));
    } catch (e) {}
  }, [marketingPosts]);

  useEffect(() => {
    try {
      localStorage.setItem("nail_studio_profile", JSON.stringify(salon));
    } catch (e) {}
  }, [salon]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_nails_session", JSON.stringify(session));
    } catch (e) {}
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_nails_admin_auth", String(isAdminLoggedIn));
    } catch (e) {}
  }, [isAdminLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_nails_combos", JSON.stringify(combos));
    } catch (e) {}
  }, [combos]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_nails_specials", JSON.stringify(specials));
    } catch (e) {}
  }, [specials]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_planner_tasks", JSON.stringify(plannerTasks));
    } catch (e) {}
  }, [plannerTasks]);

  useEffect(() => {
    try {
      localStorage.setItem("hush_planner_settings", JSON.stringify(plannerSettings));
    } catch (e) {}
  }, [plannerSettings]);

  // Connect to Google Cloud Firebase Firestore & Listen to Real-Time Updates
  useEffect(() => {
    // 1. Validate connection to Firestore on app boot
    testConnection().then((connected) => {
      setIsCloudSynced(connected);
    });

    // 2. Seed initial salon data, menu, combos, specials, clients & bookings if cloud collections are fresh
    seedInitialFirestoreData(salon, menu, combos, specials, clients, bookings);

    // 3. Subscribe to real-time live database updates across all devices
    const unsubscribe = subscribeToFirestore({
      onSalonUpdate: (cloudSalon) => {
        setSalon((prev) => ({ ...prev, ...cloudSalon }));
        setIsCloudSynced(true);
      },
      onBookingsUpdate: (cloudBookings) => {
        if (cloudBookings.length > 0) {
          setBookings(cloudBookings);
        } else {
          setBookings((current) => {
            if (current.length > 0) {
              current.forEach((b) => saveBookingToCloud(b));
            }
            return current;
          });
        }
        setIsCloudSynced(true);
      },
      onClientsUpdate: (cloudClients) => {
        if (cloudClients.length > 0) {
          setClients(cloudClients);
        } else {
          setClients((current) => {
            if (current.length > 0) {
              current.forEach((c) => saveClientProfileToCloud(c));
            }
            return current;
          });
        }
      },
      onMenuUpdate: (cloudMenu) => {
        if (cloudMenu.length > 0) {
          setMenu(cloudMenu);
        }
      },
      onCombosUpdate: (cloudCombos) => {
        if (cloudCombos.length > 0) {
          setCombos(cloudCombos);
        }
      },
      onSpecialsUpdate: (cloudSpecials) => {
        if (cloudSpecials.length > 0) {
          setSpecials(cloudSpecials);
        }
      },
      onInvoicesUpdate: (cloudInvoices) => {
        if (cloudInvoices.length > 0) {
          setInvoices(cloudInvoices);
        } else {
          setInvoices((current) => {
            if (current.length > 0) {
              current.forEach((i) => saveInvoiceToCloud(i));
            }
            return current;
          });
        }
      },
      onCloudConnected: (connected) => {
        setIsCloudSynced(connected);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Planner reminders (toast + system notification) while the admin is signed in
  usePlannerReminders({
    enabled: session.role === "admin" && plannerSettings.notificationsEnabled,
    tasks: plannerTasks,
    bookings,
    settings: plannerSettings,
    onReminder: (msg) => showToast(`⏰ ${msg}`, "info"),
  });

  // Auto-plan today once per day when the admin opens the app
  const latestPlannerInputs = React.useRef({ plannerTasks, bookings, plannerSettings, salon, menu });
  latestPlannerInputs.current = { plannerTasks, bookings, plannerSettings, salon, menu };
  useEffect(() => {
    if (session.role !== "admin" || !plannerSettings.autoPlanDaily) return;
    const today = todayStr();
    try {
      if (localStorage.getItem("hush_planner_autoplan_date") === today) return;
    } catch {}
    // Wait briefly so cloud bookings have loaded before planning around them
    const timer = setTimeout(async () => {
      const { plannerTasks, bookings, plannerSettings, salon, menu } = latestPlannerInputs.current;
      try {
        localStorage.setItem("hush_planner_autoplan_date", today);
      } catch {}
      const existing = plannerTasks.filter((t) => t.date === today);
      if (existing.length > 0) return;
      const plan = buildDayPlan({ date: today, bookings, settings: plannerSettings });
      if (plan.tasks.length === 0) return;
      const content = await fetchSlotContent(plan.tasks, salon, menu, plan.load.bookingCount);
      setPlannerTasks((prev) =>
        prev.some((t) => t.date === today) ? prev : [...prev, ...applyContent(plan.tasks, content)]
      );
      showToast("Today's plan is ready ✨ (auto-planned)");
    }, 2500);
    return () => clearTimeout(timer);
  }, [session.role, plannerSettings.autoPlanDaily]);

  // Check URL query parameters for WhatsApp client invite link (?client=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const clientIdParam = params.get("client");
      if (clientIdParam) {
        const cleanParam = cleanPhoneNumber(clientIdParam);
        const matched = clients.find(
          (c) =>
            c.id === clientIdParam ||
            (cleanParam && cleanPhoneNumber(c.phone) === cleanParam)
        );
        if (matched) {
          setSession({ role: "client", client: matched });
          showToast(`Welcome ${matched.name}! Loaded your personal profile.`);
        }
      }
    } catch {}
  }, [clients]);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentTab]);

  // Menu Handlers
  const handleAddService = (service: MenuItem) => {
    setMenu([service, ...menu]);
    saveMenuItemToCloud(service);
    showToast(`Added "${service.name}" to treatment menu.`);
  };

  const handleUpdateService = (updated: MenuItem) => {
    setMenu(menu.map((m) => (m.id === updated.id ? updated : m)));
    saveMenuItemToCloud(updated);
    showToast(`Updated "${updated.name}" pricing & details.`);
  };

  const handleDeleteService = (id: string) => {
    setMenu(menu.filter((m) => m.id !== id));
    deleteMenuItemFromCloud(id);
    showToast("Service removed from menu.");
  };

  const handleResetMenu = () => {
    setMenu(DEFAULT_MENU);
    DEFAULT_MENU.forEach((item) => saveMenuItemToCloud(item));
    showToast("Service menu reset to South African salon defaults.");
  };

  // Booking Handlers
  const handleAddBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
    saveBookingToCloud(booking);

    // Automatically ensure this client is saved in the salon's client profiles
    const cleanPhone = cleanPhoneNumber(booking.clientPhone);
    if (cleanPhone) {
      setClients((prevClients) => {
        const existingIdx = prevClients.findIndex(
          (c) => cleanPhoneNumber(c.phone) === cleanPhone
        );
        if (existingIdx >= 0) {
          const updated = [...prevClients];
          const updatedClient: ClientProfile = {
            ...updated[existingIdx],
            lastVisit: booking.date,
            preferredStyle: booking.nailInspoDetails || updated[existingIdx].preferredStyle,
            notes: booking.customNotes
              ? `${updated[existingIdx].notes ? updated[existingIdx].notes + " • " : ""}${booking.customNotes}`
              : updated[existingIdx].notes,
          };
          updated[existingIdx] = updatedClient;
          saveClientProfileToCloud(updatedClient);
          return updated;
        } else {
          const newCli: ClientProfile = {
            id: `cli-${Date.now().toString().slice(-6)}`,
            name: booking.clientName,
            phone: booking.clientPhone,
            email: booking.clientEmail,
            preferredStyle: booking.nailInspoDetails,
            notes: booking.customNotes,
            createdAt: new Date().toISOString(),
            lastVisit: booking.date,
            isVip: false,
          };
          saveClientProfileToCloud(newCli);
          return [newCli, ...prevClients];
        }
      });
    }

    showToast(`Appointment booked for ${booking.clientName}!`);
  };

  const handleUpdateBooking = (updated: Booking) => {
    setBookings(bookings.map((b) => (b.id === updated.id ? updated : b)));
    saveBookingToCloud(updated);
    showToast(`Booking for ${updated.clientName} updated.`);
  };

  const handleDeleteBooking = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id));
    deleteBookingFromCloud(id);
    showToast("Booking deleted.");
  };

  // Client Management Handlers
  const handleAddClient = (client: ClientProfile) => {
    setClients((prev) => [client, ...prev]);
    saveClientProfileToCloud(client);
    showToast(`Added client profile for ${client.name}.`);
  };

  const handleUpdateClient = (updated: ClientProfile) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    saveClientProfileToCloud(updated);
    showToast(`Updated profile for ${updated.name}.`);
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    deleteClientFromCloud(id);
    showToast("Client profile removed.");
  };

  const handleSelectClientForPortal = (client: ClientProfile) => {
    setSession({ role: "client", client });
    showToast(`Switched to Client Portal for ${client.name}.`);
  };

  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem("hush_nails_admin_auth");
    setSession({ role: "client" });
    showToast("Logged out of Admin. Open Client Portal is active.");
  };

  const handleSetSession = (newSession: UserSession) => {
    if (newSession.role === "admin") {
      setIsAdminLoggedIn(true);
      localStorage.setItem("hush_nails_admin_auth", "true");
      setSession({ role: "admin" });
      showToast("Logged in as Salon Admin (Full Access).");
    } else {
      setSession(newSession);
      showToast(`Welcome ${newSession.client?.name || "Client"}! Profile loaded.`);
    }
  };

  // Convert Booking to Invoice
  const handleConvertToInvoice = (booking: Booking) => {
    const items: InvoiceItem[] = booking.serviceIds.map((id) => {
      const menuItem = menu.find((m) => m.id === id);
      return {
        id: `item-${Date.now()}-${id}`,
        description: menuItem?.name || "Custom Nail Treatment",
        qty: 1,
        unitPrice: menuItem?.price || booking.totalAmount,
        total: menuItem?.price || booking.totalAmount,
      };
    });

    const nextSeq = String(invoices.filter((i) => i.type === "invoice").length + 1).padStart(3, "0");
    const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
    const balanceDue = Math.max(0, subtotal - booking.depositPaid);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: `INV-2026-${nextSeq}`,
      type: "invoice",
      date: new Date().toISOString().split("T")[0],
      dueDate: booking.date,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      clientEmail: booking.clientEmail,
      bookingId: booking.id,
      items,
      subtotal,
      discount: 0,
      depositPaid: booking.depositPaid,
      balanceDue,
      status: booking.paymentStatus === "fully_paid" ? "paid" : "sent",
      paymentMethod: booking.paymentMethod || "eft",
      notes: `Appointment on ${booking.date} at ${booking.time}. Please quote INV-2026-${nextSeq} on EFT transfer.`,
    };

    setInvoices([newInvoice, ...invoices]);
    saveInvoiceToCloud(newInvoice);
    setCurrentTab("invoices");
    showToast(`Generated Invoice #${newInvoice.number} from booking!`);
  };

  // Invoice Handlers
  const handleAddInvoice = (invoice: Invoice) => {
    setInvoices([invoice, ...invoices]);
    saveInvoiceToCloud(invoice);
    showToast(`Created ${invoice.type === "quote" ? "Quote" : "Tax Invoice"} #${invoice.number}`);
  };

  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices(invoices.map((i) => (i.id === updated.id ? updated : i)));
    saveInvoiceToCloud(updated);
    showToast(`Updated document #${updated.number}`);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter((i) => i.id !== id));
    deleteInvoiceFromCloud(id);
    showToast("Document deleted.");
  };

  // Marketing Post Handlers
  const handleAddPost = (post: MarketingPost) => {
    setMarketingPosts([post, ...marketingPosts]);
    showToast(`Scheduled post for ${post.scheduledDate} at ${post.scheduledTime}`);
  };

  const handleUpdatePost = (updated: MarketingPost) => {
    setMarketingPosts(marketingPosts.map((p) => (p.id === updated.id ? updated : p)));
    showToast("Marketing post updated.");
  };

  const handleDeletePost = (id: string) => {
    setMarketingPosts(marketingPosts.filter((p) => p.id !== id));
    showToast("Post removed from calendar.");
  };

  // Backup & Restore
  const handleExportAllData = () => {
    const backup = {
      version: 1,
      date: new Date().toISOString(),
      salon,
      menu,
      bookings,
      invoices,
      marketingPosts,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nail_studio_full_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    showToast("Studio backup downloaded successfully.");
  };

  const handleImportData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.salon) setSalon(data.salon);
      if (data.menu) setMenu(data.menu);
      if (data.bookings) setBookings(data.bookings);
      if (data.invoices) setInvoices(data.invoices);
      if (data.marketingPosts) setMarketingPosts(data.marketingPosts);
      showToast("Studio database restored from backup!");
    } catch {
      alert("Invalid backup file format.");
    }
  };

  const pendingBookingsCount = bookings.filter(
    (b) => b.status === "upcoming" || b.paymentStatus === "unpaid"
  ).length;

  // If Client Portal is active
  if (session.role === "client") {
    return (
      <div className="min-h-screen bg-stone-50 font-sans">
        <ClientPortalView
          salon={salon}
          menu={menu}
          bookings={bookings}
          invoices={invoices}
          currentSession={session}
          combos={combos}
          specials={specials}
          onAddBooking={handleAddBooking}
          onOpenAdminLogin={() => {
            setAuthModalMode("admin");
            setIsAuthModalOpen(true);
          }}
          onOpenProfileLookup={() => {
            setAuthModalMode("client_lookup");
            setIsAuthModalOpen(true);
          }}
          onClearClientProfile={() => {
            setSession({ role: "client" });
            showToast("Cleared loaded client profile.");
          }}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentSession={session}
          onSetSession={handleSetSession}
          salon={salon}
          clients={clients}
          initialMode={authModalMode}
        />

        {/* Toast Notification Alert */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-stone-900 text-white shadow-xl border border-stone-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin View (Default - Full Access)
  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      {/* Admin Top Status Bar */}
      <div className="bg-stone-900 text-stone-300 px-4 py-1.5 text-xs flex items-center justify-between border-b border-stone-800 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-white flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salon Admin Mode (Full Access)</span>
          </span>
          <span className="hidden sm:inline text-stone-400">
            — Managing bookings, client profiles, quotes, invoices & ZAR settings
          </span>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[10px] font-semibold">
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span>Firestore Live</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSession({ role: "client" });
              showToast("Viewing Open Client Portal.");
            }}
            className="flex items-center gap-1.5 text-rose-300 hover:text-rose-100 font-bold underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Client Portal (Pricelist & Combos)</span>
          </button>
          <button
            type="button"
            onClick={handleLogoutAdmin}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-medium border border-rose-800/60 cursor-pointer"
            title="Lock Admin Dashboard"
          >
            <LogOut className="w-3 h-3" />
            <span>Log Out Admin</span>
          </button>
        </div>
      </div>

      {/* Navigation (Sidebar on Desktop, Header + Bottom Nav on Mobile) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        salon={salon}
        pendingBookingsCount={pendingBookingsCount}
        totalClientsCount={clients.length}
        onOpenApkGuide={() => setShowGlobalApkModal(true)}
        onOpenAuthModal={() => {
          setAuthModalMode("admin");
          setIsAuthModalOpen(true);
        }}
        onSwitchToClient={() => {
          setSession({ role: "client" });
        }}
        onLogoutAdmin={handleLogoutAdmin}
        userSession={session}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72 flex flex-col pb-24 lg:pb-12">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {currentTab === "planner" && (
            <PlannerView
              tasks={plannerTasks}
              settings={plannerSettings}
              bookings={bookings}
              menu={menu}
              salon={salon}
              onTasksChange={setPlannerTasks}
              onSettingsChange={setPlannerSettings}
              onOpenBookings={() => setCurrentTab("bookings")}
              onToast={(m) => showToast(m, "info")}
            />
          )}

          {currentTab === "bookings" && (
            <BookingsView
              bookings={bookings}
              invoices={invoices}
              menu={menu}
              salon={salon}
              onAddBooking={handleAddBooking}
              onUpdateBooking={handleUpdateBooking}
              onDeleteBooking={handleDeleteBooking}
              onConvertToInvoice={handleConvertToInvoice}
            />
          )}

          {currentTab === "clients" && (
            <ClientsView
              clients={clients}
              bookings={bookings}
              invoices={invoices}
              salon={salon}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onSelectClientForPortal={handleSelectClientForPortal}
            />
          )}

          {currentTab === "marketing" && (
            <MarketingView
              posts={marketingPosts}
              menu={menu}
              salon={salon}
              onAddPost={handleAddPost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          )}

          {currentTab === "invoices" && (
            <InvoicesView
              invoices={invoices}
              menu={menu}
              bookings={bookings}
              salon={salon}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

          {currentTab === "menu" && (
            <MenuView
              menu={menu}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
              onResetMenu={handleResetMenu}
            />
          )}

          {currentTab === "payments" && (
            <PaymentsView
              bookings={bookings}
              invoices={invoices}
              salon={salon}
              onUpdateBooking={handleUpdateBooking}
              onUpdateInvoice={handleUpdateInvoice}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView
              salon={salon}
              onUpdateSalon={(updated) => {
                setSalon(updated);
                saveSalonProfileToCloud(updated);
                showToast("Studio profile & EFT details updated!");
              }}
              onExportAllData={handleExportAllData}
              onImportData={handleImportData}
              isCloudSynced={isCloudSynced}
            />
          )}
        </div>
      </main>

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-stone-900 text-white shadow-xl border border-stone-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-stone-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Global APK Export Modal */}
      <ApkExportModal
        isOpen={showGlobalApkModal}
        onClose={() => setShowGlobalApkModal(false)}
        salonName={salon.salonName}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentSession={session}
        onSetSession={handleSetSession}
        salon={salon}
        clients={clients}
        initialMode={authModalMode}
      />
    </div>
  );
}

