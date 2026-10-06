import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  Booking,
  ClientProfile,
  ComboDeal,
  Invoice,
  MenuItem,
  SalonProfile,
  SpecialOffer,
} from "./types";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with ignoreUndefinedProperties to prevent undefined value errors
export const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.warn("Firestore Notice: ", JSON.stringify(errInfo));
  return errInfo;
}

// Utility: Strip undefined or invalid values before sending to Firestore
export function cleanDoc<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Salon Document ID
export const SALON_ID = "hush-rosebank";

// Firestore Realtime Collections References
const salonDocRef = doc(db, "salons", SALON_ID);
const bookingsColRef = collection(db, "salons", SALON_ID, "bookings");
const clientsColRef = collection(db, "salons", SALON_ID, "clients");
const menuColRef = collection(db, "salons", SALON_ID, "menu");
const combosColRef = collection(db, "salons", SALON_ID, "combos");
const specialsColRef = collection(db, "salons", SALON_ID, "specials");
const invoicesColRef = collection(db, "salons", SALON_ID, "invoices");

// Test Connection on Boot
export async function testConnection(): Promise<boolean> {
  try {
    const snap = await getDocFromServer(salonDocRef);
    console.log("Firestore cloud database connected successfully. Salon exists:", snap.exists());
    return true;
  } catch (error) {
    console.warn("Firestore cloud connection notice:", error);
    return false;
  }
}

// Cloud Database Sync Methods
export async function saveSalonProfileToCloud(profile: SalonProfile): Promise<boolean> {
  const path = `salons/${SALON_ID}`;
  try {
    const cleaned = cleanDoc(profile);
    await setDoc(salonDocRef, cleaned, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function saveBookingToCloud(booking: Booking): Promise<boolean> {
  const path = `salons/${SALON_ID}/bookings/${booking.id}`;
  try {
    const cleaned = cleanDoc(booking);
    await setDoc(doc(db, "salons", SALON_ID, "bookings", booking.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteBookingFromCloud(bookingId: string): Promise<boolean> {
  const path = `salons/${SALON_ID}/bookings/${bookingId}`;
  try {
    await deleteDoc(doc(db, "salons", SALON_ID, "bookings", bookingId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function saveClientProfileToCloud(client: ClientProfile): Promise<boolean> {
  const path = `salons/${SALON_ID}/clients/${client.id}`;
  try {
    const cleaned = cleanDoc(client);
    await setDoc(doc(db, "salons", SALON_ID, "clients", client.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteClientFromCloud(clientId: string): Promise<boolean> {
  const path = `salons/${SALON_ID}/clients/${clientId}`;
  try {
    await deleteDoc(doc(db, "salons", SALON_ID, "clients", clientId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function saveMenuItemToCloud(item: MenuItem): Promise<boolean> {
  const path = `salons/${SALON_ID}/menu/${item.id}`;
  try {
    const cleaned = cleanDoc(item);
    await setDoc(doc(db, "salons", SALON_ID, "menu", item.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteMenuItemFromCloud(itemId: string): Promise<boolean> {
  const path = `salons/${SALON_ID}/menu/${itemId}`;
  try {
    await deleteDoc(doc(db, "salons", SALON_ID, "menu", itemId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function saveInvoiceToCloud(invoice: Invoice): Promise<boolean> {
  const path = `salons/${SALON_ID}/invoices/${invoice.id}`;
  try {
    const cleaned = cleanDoc(invoice);
    await setDoc(doc(db, "salons", SALON_ID, "invoices", invoice.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteInvoiceFromCloud(invoiceId: string): Promise<boolean> {
  const path = `salons/${SALON_ID}/invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, "salons", SALON_ID, "invoices", invoiceId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function saveComboToCloud(combo: ComboDeal): Promise<boolean> {
  const path = `salons/${SALON_ID}/combos/${combo.id}`;
  try {
    const cleaned = cleanDoc(combo);
    await setDoc(doc(db, "salons", SALON_ID, "combos", combo.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function saveSpecialToCloud(special: SpecialOffer): Promise<boolean> {
  const path = `salons/${SALON_ID}/specials/${special.id}`;
  try {
    const cleaned = cleanDoc(special);
    await setDoc(doc(db, "salons", SALON_ID, "specials", special.id), cleaned, {
      merge: true,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Initial seed helper if Firestore collections are fresh
export async function seedInitialFirestoreData(
  profile: SalonProfile,
  initialMenu: MenuItem[],
  initialCombos: ComboDeal[],
  initialSpecials: SpecialOffer[],
  initialClients?: ClientProfile[],
  initialBookings?: Booking[]
) {
  try {
    // 1. Seed salon profile ONLY if missing in Firestore
    const salonSnapshot = await getDoc(salonDocRef);
    if (!salonSnapshot.exists()) {
      console.log("Seeding initial salon profile to Firestore...");
      await saveSalonProfileToCloud(profile);
    }

    // 2. Check menu collection
    const menuSnapshot = await getDocs(menuColRef);
    if (menuSnapshot.empty) {
      console.log("Seeding initial HUSH nails menu & deals to Firestore...");
      for (const m of initialMenu) {
        await saveMenuItemToCloud(m);
      }
      for (const c of initialCombos) {
        await saveComboToCloud(c);
      }
      for (const s of initialSpecials) {
        await saveSpecialToCloud(s);
      }
    }

    // 3. Check clients collection
    if (initialClients && initialClients.length > 0) {
      const clientsSnapshot = await getDocs(clientsColRef);
      if (clientsSnapshot.empty) {
        console.log("Seeding initial client profiles to Firestore...");
        for (const cl of initialClients) {
          await saveClientProfileToCloud(cl);
        }
      }
    }

    // 4. Check bookings collection
    if (initialBookings && initialBookings.length > 0) {
      const bookingsSnapshot = await getDocs(bookingsColRef);
      if (bookingsSnapshot.empty) {
        console.log("Seeding initial bookings to Firestore...");
        for (const bk of initialBookings) {
          await saveBookingToCloud(bk);
        }
      }
    }
  } catch (error) {
    console.warn("Could not seed initial data to cloud:", error);
  }
}

// Force sync all local data to Firestore
export async function syncAllLocalDataToCloud(data: {
  salon: SalonProfile;
  menu: MenuItem[];
  combos: ComboDeal[];
  specials: SpecialOffer[];
  clients: ClientProfile[];
  bookings: Booking[];
  invoices: Invoice[];
}) {
  await saveSalonProfileToCloud(data.salon);
  for (const m of data.menu) await saveMenuItemToCloud(m);
  for (const c of data.combos) await saveComboToCloud(c);
  for (const s of data.specials) await saveSpecialToCloud(s);
  for (const cl of data.clients) await saveClientProfileToCloud(cl);
  for (const bk of data.bookings) await saveBookingToCloud(bk);
  for (const inv of data.invoices) await saveInvoiceToCloud(inv);
}

// Subscribe to real-time updates from Firestore
export function subscribeToFirestore(callbacks: {
  onSalonUpdate: (profile: SalonProfile) => void;
  onBookingsUpdate: (bookings: Booking[]) => void;
  onClientsUpdate: (clients: ClientProfile[]) => void;
  onMenuUpdate: (menu: MenuItem[]) => void;
  onCombosUpdate: (combos: ComboDeal[]) => void;
  onSpecialsUpdate: (specials: SpecialOffer[]) => void;
  onInvoicesUpdate: (invoices: Invoice[]) => void;
  onCloudConnected?: (connected: boolean) => void;
}) {
  const unsubs: (() => void)[] = [];

  // Salon Profile
  unsubs.push(
    onSnapshot(
      salonDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callbacks.onSalonUpdate(docSnap.data() as SalonProfile);
          callbacks.onCloudConnected?.(true);
        }
      },
      (err) => {
        console.warn("Salon listener warning:", err);
      }
    )
  );

  // Bookings
  unsubs.push(
    onSnapshot(
      bookingsColRef,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((d) => list.push(d.data() as Booking));
        // Sort newest first
        list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        callbacks.onBookingsUpdate(list);
        callbacks.onCloudConnected?.(true);
      },
      (err) => {
        console.warn("Bookings listener warning:", err);
      }
    )
  );

  // Clients
  unsubs.push(
    onSnapshot(
      clientsColRef,
      (snapshot) => {
        const list: ClientProfile[] = [];
        snapshot.forEach((d) => list.push(d.data() as ClientProfile));
        list.sort((a, b) => a.name.localeCompare(b.name));
        callbacks.onClientsUpdate(list);
      },
      (err) => {
        console.warn("Clients listener warning:", err);
      }
    )
  );

  // Menu Items
  unsubs.push(
    onSnapshot(
      menuColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: MenuItem[] = [];
          snapshot.forEach((d) => list.push(d.data() as MenuItem));
          callbacks.onMenuUpdate(list);
        }
      },
      (err) => {
        console.warn("Menu listener warning:", err);
      }
    )
  );

  // Combos
  unsubs.push(
    onSnapshot(
      combosColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ComboDeal[] = [];
          snapshot.forEach((d) => list.push(d.data() as ComboDeal));
          callbacks.onCombosUpdate(list);
        }
      },
      (err) => {
        console.warn("Combos listener warning:", err);
      }
    )
  );

  // Specials
  unsubs.push(
    onSnapshot(
      specialsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SpecialOffer[] = [];
          snapshot.forEach((d) => list.push(d.data() as SpecialOffer));
          callbacks.onSpecialsUpdate(list);
        }
      },
      (err) => {
        console.warn("Specials listener warning:", err);
      }
    )
  );

  // Invoices
  unsubs.push(
    onSnapshot(
      invoicesColRef,
      (snapshot) => {
        const list: Invoice[] = [];
        snapshot.forEach((d) => list.push(d.data() as Invoice));
        list.sort((a, b) => b.number.localeCompare(a.number));
        callbacks.onInvoicesUpdate(list);
      },
      (err) => {
        console.warn("Invoices listener warning:", err);
      }
    )
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}
