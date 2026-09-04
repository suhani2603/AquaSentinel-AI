import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  UserSavedStation, 
  ObservationLog, 
  WhatIfScenario, 
  AquaSentinelMessage,
  EmergencyReport,
  CommunityPeopleReport,
  UserAlertPreference,
  IncidentStatus
} from '../types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Operational Error Logging
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Helper auth functions
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export const signOutUser = logOut;

// Recursive sanitization to avoid Firestore undefined value rejection
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// ----------------------------------------------------
// 1. User Saved Stations (Bookmarks & Custom Thresholds)
// Path: /users/{userId}/savedStations/{stationId}
// ----------------------------------------------------
export function subscribeToUserSavedStations(
  userId: string,
  onUpdate: (stations: UserSavedStation[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/savedStations`;
  const stationsRef = collection(db, 'users', userId, 'savedStations');
  const q = query(stationsRef, orderBy('savedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: UserSavedStation[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId,
        stationId: data.stationId || docSnap.id,
        stationName: data.stationName || '',
        riverName: data.riverName || '',
        customAlertFlowM3s: data.customAlertFlowM3s,
        customAlertStageMeters: data.customAlertStageMeters,
        notes: data.notes || '',
        savedAt: data.savedAt || new Date().toISOString()
      });
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) onError(err);
  });
}

export async function saveUserStation(userId: string, item: UserSavedStation): Promise<void> {
  if (!userId || !item.stationId) return;
  const path = `users/${userId}/savedStations/${item.stationId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savedStations', item.stationId);
    const dataToSave = sanitizeForFirestore({
      ...item,
      userId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteUserStation(userId: string, stationId: string): Promise<void> {
  if (!userId || !stationId) return;
  const path = `users/${userId}/savedStations/${stationId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savedStations', stationId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ----------------------------------------------------
// 2. User Observations & Field Logs
// Path: /users/{userId}/observations/{obsId}
// ----------------------------------------------------
export function subscribeToUserObservations(
  userId: string,
  onUpdate: (obs: ObservationLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/observations`;
  const obsRef = collection(db, 'users', userId, 'observations');
  const q = query(obsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: ObservationLog[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId,
        stationId: data.stationId || '',
        stationName: data.stationName || '',
        riverName: data.riverName || '',
        timestamp: data.timestamp || new Date().toISOString(),
        observerName: data.observerName || '',
        flowObserved: data.flowObserved,
        waterLevelObserved: data.waterLevelObserved,
        weatherCondition: data.weatherCondition || '',
        notes: data.notes || '',
        riskAssessment: data.riskAssessment || 'NORMAL'
      });
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) onError(err);
  });
}

export async function saveUserObservation(userId: string, obs: ObservationLog): Promise<void> {
  if (!userId || !obs.id) return;
  const path = `users/${userId}/observations/${obs.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'observations', obs.id);
    const dataToSave = sanitizeForFirestore({
      ...obs,
      userId
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteUserObservation(userId: string, obsId: string): Promise<void> {
  if (!userId || !obsId) return;
  const path = `users/${userId}/observations/${obsId}`;
  try {
    const docRef = doc(db, 'users', userId, 'observations', obsId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ----------------------------------------------------
// 3. User What-If Saved Scenarios
// Path: /users/{userId}/simulations/{simId}
// ----------------------------------------------------
export function subscribeToUserSimulations(
  userId: string,
  onUpdate: (sims: WhatIfScenario[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/simulations`;
  const simRef = collection(db, 'users', userId, 'simulations');
  const q = query(simRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: WhatIfScenario[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId,
        stationId: data.stationId || '',
        stationName: data.stationName || '',
        riverName: data.riverName || '',
        flowDeltaPercent: data.flowDeltaPercent || 0,
        additionalDamDischargeM3s: data.additionalDamDischargeM3s || 0,
        additionalRainfallMm: data.additionalRainfallMm || 0,
        baselineFlow: data.baselineFlow || 0,
        projectedFlow: data.projectedFlow || 0,
        baselineWaterLevel: data.baselineWaterLevel || 0,
        projectedWaterLevel: data.projectedWaterLevel || 0,
        baselineRiskScore: data.baselineRiskScore || 0,
        projectedRiskScore: data.projectedRiskScore || 0,
        projectedRiskLevel: data.projectedRiskLevel || 'NORMAL',
        riskDelta: data.riskDelta || 0,
        aiAnalysis: data.aiAnalysis || '',
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) onError(err);
  });
}

export async function saveUserSimulation(userId: string, sim: WhatIfScenario): Promise<void> {
  if (!userId || !sim.id) return;
  const path = `users/${userId}/simulations/${sim.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'simulations', sim.id);
    const dataToSave = sanitizeForFirestore({
      ...sim,
      userId
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteUserSimulation(userId: string, simId: string): Promise<void> {
  if (!userId || !simId) return;
  const path = `users/${userId}/simulations/${simId}`;
  try {
    const docRef = doc(db, 'users', userId, 'simulations', simId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// ----------------------------------------------------
// 4. Emergency Reports & Responder Coordination
// Path: /emergency_reports/{reportId}
// ----------------------------------------------------
export function subscribeToEmergencyReports(
  onUpdate: (reports: EmergencyReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'emergency_reports';
  const reportsRef = collection(db, 'emergency_reports');
  const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const list: EmergencyReport[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: data.userId || '',
        userDisplayName: data.userDisplayName || 'Anonymous Reporter',
        isAnonymous: data.isAnonymous || false,
        stationId: data.stationId || '',
        locationName: data.locationName || '',
        landmark: data.landmark || '',
        latitude: data.latitude,
        longitude: data.longitude,
        gpsAccuracy: data.gpsAccuracy,
        gpsCapturedAt: data.gpsCapturedAt,
        peopleNeedingAssistance: data.peopleNeedingAssistance || 1,
        hasChildren: !!data.hasChildren,
        hasElderly: !!data.hasElderly,
        hasMobilityIssues: !!data.hasMobilityIssues,
        urgency: data.urgency || 'HIGH',
        description: data.description || '',
        situationType: data.situationType,
        contactNumber: data.contactNumber || '',
        status: data.status || 'REPORTED',
        photoUrl: data.photoUrl,
        photoName: data.photoName,
        photoSizeBytes: data.photoSizeBytes,
        videoUrl: data.videoUrl,
        videoName: data.videoName,
        videoSizeBytes: data.videoSizeBytes,
        evidenceStatus: data.evidenceStatus || (data.photoUrl || data.videoUrl ? 'CITIZEN_SUBMITTED_PENDING_VERIFICATION' : undefined),
        isResponderVerified: !!data.isResponderVerified,
        verifiedBy: data.verifiedBy,
        verificationNotes: data.verificationNotes,
        assignedTeam: data.assignedTeam,
        flagCount: data.flagCount || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) onError(err);
  });
}

export async function createEmergencyReport(report: Omit<EmergencyReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isResponderVerified'>): Promise<string> {
  const reportId = `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `emergency_reports/${reportId}`;
  try {
    const docRef = doc(db, 'emergency_reports', reportId);
    const newReport: EmergencyReport = {
      ...report,
      id: reportId,
      status: 'REPORTED',
      isResponderVerified: false,
      flagCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, sanitizeForFirestore(newReport));
    return reportId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function updateIncidentStatus(
  reportId: string, 
  status: IncidentStatus, 
  verifiedBy?: string, 
  verificationNotes?: string,
  assignedTeam?: string
): Promise<void> {
  const path = `emergency_reports/${reportId}`;
  try {
    const docRef = doc(db, 'emergency_reports', reportId);
    const updateData: Partial<EmergencyReport> = {
      status,
      isResponderVerified: status !== 'REPORTED' && status !== 'UNDER_REVIEW',
      updatedAt: new Date().toISOString()
    };
    if (verifiedBy) updateData.verifiedBy = verifiedBy;
    if (verificationNotes) updateData.verificationNotes = verificationNotes;
    if (assignedTeam) updateData.assignedTeam = assignedTeam;

    await setDoc(docRef, sanitizeForFirestore(updateData), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function flagEmergencyReport(reportId: string, reason?: string): Promise<void> {
  const path = `emergency_reports/${reportId}`;
  try {
    const docRef = doc(db, 'emergency_reports', reportId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentFlags = snap.data().flagCount || 0;
      await setDoc(docRef, { 
        flagCount: currentFlags + 1,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

// ----------------------------------------------------
// 5. Community People Reporting
// Path: /community_people_reports/{reportId}
// ----------------------------------------------------
export function subscribeToCommunityPeopleReports(
  onUpdate: (reports: CommunityPeopleReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'community_people_reports';
  const ref = collection(db, 'community_people_reports');
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(q, (snapshot) => {
    const list: CommunityPeopleReport[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: data.userId,
        stationId: data.stationId,
        locationArea: data.locationArea,
        reportedCount: data.reportedCount || 0,
        notes: data.notes,
        createdAt: data.createdAt || new Date().toISOString()
      });
    });
    onUpdate(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, path);
    if (onError) onError(err);
  });
}

export async function createCommunityPeopleReport(
  report: Omit<CommunityPeopleReport, 'id' | 'createdAt'>
): Promise<string> {
  const reportId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `community_people_reports/${reportId}`;
  try {
    const docRef = doc(db, 'community_people_reports', reportId);
    const newReport: CommunityPeopleReport = {
      ...report,
      id: reportId,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, sanitizeForFirestore(newReport));
    return reportId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// ----------------------------------------------------
// 6. User Alert Preferences
// Path: /users/{userId}/preferences/alerts
// ----------------------------------------------------
export async function saveUserAlertPreferences(prefs: UserAlertPreference): Promise<void> {
  if (!prefs.userId) return;
  const path = `users/${prefs.userId}/preferences/alerts`;
  try {
    const docRef = doc(db, 'users', prefs.userId, 'preferences', 'alerts');
    await setDoc(docRef, sanitizeForFirestore({
      ...prefs,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function getUserAlertPreferences(userId: string): Promise<UserAlertPreference | null> {
  if (!userId) return null;
  const path = `users/${userId}/preferences/alerts`;
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'alerts');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserAlertPreference;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}
