import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal @firebase/firestore 10s backend timeout console.error when operating in offline/restricted networks
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

function initCloudFirestore() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initCloudFirestore();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function isOfflineOrExpectedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /client is offline|unavailable|network-request-failed|could not reach|failed to get document|deadline-exceeded|permission-denied|unauthenticated|cancelled|quota-exceeded|internal/i.test(
    msg
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  if (!isOfflineOrExpectedError(error)) {
    console.warn('Firestore Notice: ', JSON.stringify(errInfo));
  }
}


// Compute SHA-256 digital fingerprint for anti-cheat duplicate activity verification
export async function computeActivityFingerprint(
  filename: string,
  distanceKm: number,
  elapsedSeconds: number,
  avgHeartRate: number
): Promise<string> {
  const raw = `${filename.trim().toLowerCase()}|${distanceKm.toFixed(2)}|${elapsedSeconds}|${avgHeartRate}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoded = new TextEncoder().encode(raw);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 64);
    } catch {
      // Fallback below
    }
  }
  return `sha256_${btoa(unescape(encodeURIComponent(raw))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`;
}

export interface CloudUserVaultPayload {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  referralCode: string;
  lockedPoolBalance: number;
  totalKm: number;
  invitedFriendsCount: number;
  streakDays: number;
  battleWins: number;
  battleLosses: number;
  battleRating: number;
  firstLogin: boolean;
  firstActivity: boolean;
  firstInvite: boolean;
}

function sanitizeString(val: string, fallback: string, maxLen: number): string {
  const clean = (val || '').trim();
  if (!clean) return fallback.slice(0, maxLen);
  return clean.slice(0, maxLen);
}

function clampNumber(val: number, min: number, max: number): number {
  const n = Number.isFinite(val) ? val : min;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

export async function signInWithGoogleCloud(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutCloud(): Promise<void> {
  await fbSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

export async function loadOrCreateCloudUserVault(
  fbUser: FirebaseUser,
  seed: CloudUserVaultPayload
): Promise<CloudUserVaultPayload> {
  const uid = fbUser.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        fullName: String(d.fullName || seed.fullName),
        username: String(d.username || seed.username),
        email: String(d.email || fbUser.email || seed.email),
        phone: String(d.phone || seed.phone),
        referralCode: String(d.referralCode || seed.referralCode),
        lockedPoolBalance: Number(d.lockedPoolBalance ?? seed.lockedPoolBalance),
        totalKm: Number(d.totalKm ?? seed.totalKm),
        invitedFriendsCount: Number(d.invitedFriendsCount ?? seed.invitedFriendsCount),
        streakDays: Number(d.streakDays ?? seed.streakDays),
        battleWins: Number(d.battleWins ?? seed.battleWins),
        battleLosses: Number(d.battleLosses ?? seed.battleLosses),
        battleRating: Number(d.battleRating ?? seed.battleRating),
        firstLogin: Boolean(d.firstLogin),
        firstActivity: Boolean(d.firstActivity),
        firstInvite: Boolean(d.firstInvite),
      };
    }
  } catch (error) {
    if (isOfflineOrExpectedError(error)) {
      return seed;
    }
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const createPayload = {
    ownerId: uid,
    fullName: sanitizeString(fbUser.displayName || seed.fullName, 'دونده دوپول', 100),
    username: sanitizeString(
      (fbUser.email ? fbUser.email.split('@')[0] : seed.username).replace(/[^a-zA-Z0-9_-]/g, '_'),
      'runner_dopool',
      60
    ),
    email: sanitizeString(fbUser.email || seed.email, 'runner@dopool.ir', 120),
    phone: sanitizeString(seed.phone, '09120000000', 30),
    referralCode: sanitizeString(seed.referralCode, 'DP-8834', 32),
    lockedPoolBalance: clampNumber(seed.lockedPoolBalance, 0, 1000000),
    totalKm: clampNumber(seed.totalKm, 0, 500000),
    invitedFriendsCount: Math.floor(clampNumber(seed.invitedFriendsCount, 0, 100000)),
    streakDays: Math.floor(clampNumber(seed.streakDays, 0, 10000)),
    battleWins: Math.floor(clampNumber(seed.battleWins, 0, 100000)),
    battleLosses: Math.floor(clampNumber(seed.battleLosses, 0, 100000)),
    battleRating: Math.floor(clampNumber(seed.battleRating, 0, 10000)),
    firstLogin: Boolean(seed.firstLogin),
    firstActivity: Boolean(seed.firstActivity),
    firstInvite: Boolean(seed.firstInvite),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, createPayload);
  } catch (error) {
    if (!isOfflineOrExpectedError(error)) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  }

  return {
    fullName: createPayload.fullName,
    username: createPayload.username,
    email: createPayload.email,
    phone: createPayload.phone,
    referralCode: createPayload.referralCode,
    lockedPoolBalance: createPayload.lockedPoolBalance,
    totalKm: createPayload.totalKm,
    invitedFriendsCount: createPayload.invitedFriendsCount,
    streakDays: createPayload.streakDays,
    battleWins: createPayload.battleWins,
    battleLosses: createPayload.battleLosses,
    battleRating: createPayload.battleRating,
    firstLogin: createPayload.firstLogin,
    firstActivity: createPayload.firstActivity,
    firstInvite: createPayload.firstInvite,
  };
}

export async function syncCloudUserVaultUpdate(
  payload: CloudUserVaultPayload
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = currentUser.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        ownerId: uid,
        fullName: sanitizeString(payload.fullName, 'دونده دوپول', 100),
        username: sanitizeString(payload.username.replace(/[^a-zA-Z0-9_-]/g, '_'), 'runner_dopool', 60),
        email: sanitizeString(currentUser.email || payload.email, 'runner@dopool.ir', 120),
        phone: sanitizeString(payload.phone, '09120000000', 30),
        referralCode: sanitizeString(payload.referralCode, 'DP-8834', 32),
        lockedPoolBalance: clampNumber(payload.lockedPoolBalance, 0, 1000000),
        totalKm: clampNumber(payload.totalKm, 0, 500000),
        invitedFriendsCount: Math.floor(clampNumber(payload.invitedFriendsCount, 0, 100000)),
        streakDays: Math.floor(clampNumber(payload.streakDays, 0, 10000)),
        battleWins: Math.floor(clampNumber(payload.battleWins, 0, 100000)),
        battleLosses: Math.floor(clampNumber(payload.battleLosses, 0, 100000)),
        battleRating: Math.floor(clampNumber(payload.battleRating, 0, 10000)),
        firstLogin: Boolean(payload.firstLogin),
        firstActivity: Boolean(payload.firstActivity),
        firstInvite: Boolean(payload.firstInvite),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    await updateDoc(userRef, {
      fullName: sanitizeString(payload.fullName, 'دونده دوپول', 100),
      username: sanitizeString(payload.username.replace(/[^a-zA-Z0-9_-]/g, '_'), 'runner_dopool', 60),
      phone: sanitizeString(payload.phone, '09120000000', 30),
      lockedPoolBalance: clampNumber(payload.lockedPoolBalance, 0, 1000000),
      totalKm: clampNumber(payload.totalKm, 0, 500000),
      invitedFriendsCount: Math.floor(clampNumber(payload.invitedFriendsCount, 0, 100000)),
      streakDays: Math.floor(clampNumber(payload.streakDays, 0, 10000)),
      battleWins: Math.floor(clampNumber(payload.battleWins, 0, 100000)),
      battleLosses: Math.floor(clampNumber(payload.battleLosses, 0, 100000)),
      battleRating: Math.floor(clampNumber(payload.battleRating, 0, 10000)),
      firstLogin: Boolean(payload.firstLogin),
      firstActivity: Boolean(payload.firstActivity),
      firstInvite: Boolean(payload.firstInvite),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (!isOfflineOrExpectedError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export async function recordCloudRunActivity(activity: {
  id: string;
  title: string;
  filename: string;
  distanceKm: number;
  elapsedSeconds: number;
  avgHeartRate: number;
  paceMinPerKm: number;
  status: 'ACCEPTED' | 'REJECTED';
  poolReward: number;
  source: string;
}): Promise<string> {
  const fileHash = await computeActivityFingerprint(
    activity.filename,
    activity.distanceKm,
    activity.elapsedSeconds,
    activity.avgHeartRate
  );

  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return fileHash;
  }

  const uid = currentUser.uid;
  const cleanId = activity.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || `act_${Date.now()}`;
  const actPath = `users/${uid}/activities/${cleanId}`;
  const actRef = doc(db, 'users', uid, 'activities', cleanId);

  try {
    await setDoc(actRef, {
      ownerId: uid,
      title: sanitizeString(activity.title, 'دویدن دوپول', 120),
      filename: sanitizeString(activity.filename, 'Run.fit', 120),
      fileHash: sanitizeString(fileHash, 'sha256_run_hash', 128),
      distanceKm: clampNumber(activity.distanceKm, 0, 250),
      elapsedSeconds: Math.floor(clampNumber(activity.elapsedSeconds, 0, 172800)),
      avgHeartRate: Math.floor(clampNumber(activity.avgHeartRate, 30, 240)),
      paceMinPerKm: clampNumber(activity.paceMinPerKm, 1, 120),
      status: activity.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
      poolReward: clampNumber(activity.poolReward, 0, 50000),
      source: sanitizeString(activity.source, 'Smartwatch', 60),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, actPath);
  }

  return fileHash;
}

export async function recordCloudCashout(cashout: {
  id: string;
  poolAmount: number;
  tomanAmount: number;
  shebaNumber: string;
  bankName: string;
  status: 'PENDING' | 'PROCESSED';
  trackingCode: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const uid = currentUser.uid;
  const cleanId = cashout.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || `csh_${Date.now()}`;
  const cshPath = `users/${uid}/cashouts/${cleanId}`;
  const cshRef = doc(db, 'users', uid, 'cashouts', cleanId);

  try {
    await setDoc(cshRef, {
      ownerId: uid,
      poolAmount: clampNumber(cashout.poolAmount, 20, 1000000),
      tomanAmount: clampNumber(cashout.tomanAmount, 100000, 5000000000),
      shebaNumber: sanitizeString(cashout.shebaNumber, 'IR000000000000000000000000', 34),
      bankName: sanitizeString(cashout.bankName, 'بانک عضو شتاب', 60),
      status: cashout.status === 'PROCESSED' ? 'PROCESSED' : 'PENDING',
      trackingCode: sanitizeString(cashout.trackingCode, 'PAYA-100000', 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, cshPath);
  }
}
