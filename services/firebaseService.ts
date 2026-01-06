import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { AttendanceRecord, UserProfile } from "../types";

// --- USERS ---

// Fetches all users. Since the list is small (<50), this is cheap.
// It also fetches their current status which is stored on the user doc.
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, "users"), orderBy("firstName"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserProfile));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const createUserProfile = async (user: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...user,
      currentStatus: 'Çıkış', // Default
      createdAt: serverTimestamp(),
      avatarColor: `bg-${['blue', 'indigo', 'purple', 'emerald', 'yellow', 'red'][Math.floor(Math.random()*6)]}-600`
    });
    return { id: docRef.id, ...user } as UserProfile;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

// --- LOGS ---

// Log Action: Adds a log AND updates the user's status in one go.
// This allows the main dashboard to update without reading the logs collection.
export const logAction = async (user: UserProfile, type: 'Giriş' | 'Çıkış') => {
  try {
    // 1. Add to history log
    await addDoc(collection(db, "attendance_logs"), {
      userId: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      type: type,
      timestamp: serverTimestamp()
    });

    // 2. Update user current status (Cheap Read Optimization)
    const userRef = doc(db, "users", user.id);
    await updateDoc(userRef, {
      currentStatus: type,
      lastSeen: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error logging action:", error);
    return false;
  }
};

// COST OPTIMIZED: Get only last 20 logs for a specific user
export const fetchUserLogs = async (userId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, "attendance_logs"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(20) // CRITICAL: Limit reads
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AttendanceRecord));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};