import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Users, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  LogIn, 
  Info,
  Navigation,
  Activity,
  UserCheck,
  Search,
  Filter,
  Shield,
  Layers,
  Camera,
  Video,
  Trash2,
  RefreshCw,
  Eye,
  Lock,
  FileImage,
  FileVideo,
  Sparkles,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EmergencyReport, IncidentStatus, MonitoringStation, EvidenceVerificationStatus } from '../types';
import { 
  subscribeToEmergencyReports, 
  createEmergencyReport, 
  updateIncidentStatus 
} from '../lib/firebase';
import { INITIAL_STATIONS } from '../data/stationsData';

interface EmergencyRescueViewProps {
  currentStation?: MonitoringStation;
  currentUser: User | null;
  onSignIn?: () => void;
  onSelectStation?: (stationId: string) => void;
}

export const EmergencyRescueView: React.FC<EmergencyRescueViewProps> = ({
  currentStation: propStation,
  currentUser,
  onSignIn,
}) => {
  const currentStation = propStation || INITIAL_STATIONS[0];
  const [activeTab, setActiveTab] = useState<'submit_report' | 'rescue_intel' | 'my_reports'>('submit_report');
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [emergencyType, setEmergencyType] = useState<string>('Rising Water');
  const [locationName, setLocationName] = useState<string>(currentStation?.city || 'Dehradun');
  const [landmark, setLandmark] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  
  // GPS Geotagging State
  const [gpsCoords, setGpsCoords] = useState<{ lat?: number; lon?: number }>({});
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Photo Evidence State
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Video Evidence State
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoSizeBytes, setVideoSizeBytes] = useState<number | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Media Modal Preview State
  const [previewMedia, setPreviewMedia] = useState<{ type: 'photo' | 'video'; url: string; title: string } | null>(null);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeToEmergencyReports(
      (data) => {
        setReports(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching emergency reports:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Browser High-Accuracy GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);
        const timestamp = new Date(pos.timestamp || Date.now()).toISOString();

        setGpsCoords({ lat, lon });
        setGpsAccuracy(accuracy);
        setGpsTimestamp(timestamp);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setGpsLoading(false);
        setGpsError('Unable to access your location. You can enter your landmark/address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Client-Side Photo Compression & Processing
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setIsProcessingPhoto(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const approxSize = Math.round((compressedDataUrl.length * 3) / 4);

          setPhotoDataUrl(compressedDataUrl);
          setPhotoName(file.name);
          setPhotoSizeBytes(approxSize);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setSubmitError('Failed to process selected image.');
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setSubmitError('Failed to read image file.');
      setIsProcessingPhoto(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoName(null);
    setPhotoSizeBytes(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Client-Side Video Processing & Validation
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setSubmitError('Please select a valid video file (MP4, WEBM, MOV).');
      return;
    }

    // Max 15MB check for rapid disaster-zone transmission
    if (file.size > 15 * 1024 * 1024) {
      setSubmitError('Video is too large for rapid transmission. Please select a clip under 15MB (approx 10-20 seconds).');
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    setIsProcessingVideo(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setVideoDataUrl(dataUrl);
      setVideoName(file.name);
      setVideoSizeBytes(file.size);
      setIsProcessingVideo(false);
    };

    reader.onerror = () => {
      setSubmitError('Failed to read video file.');
      setIsProcessingVideo(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveVideo = () => {
    setVideoDataUrl(null);
    setVideoName(null);
    setVideoSizeBytes(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Submit Emergency Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Authentication Guard
    if (!currentUser) {
      setSubmitError('Please sign in to submit a verified citizen rescue report.');
      return;
    }

    // Rate Limiting & Anti-Spam (30s cooldown)
    const now = Date.now();
    if (now - lastSubmissionTime < 30000) {
      const waitSec = Math.ceil((30000 - (now - lastSubmissionTime)) / 1000);
      setSubmitError(`Rate limit: Please wait ${waitSec} seconds before submitting another report.`);
      return;
    }

    // Validation
    if (!locationName.trim()) {
      setSubmitError('Please specify the city/area location.');
      return;
    }
    if (peopleCount < 1 || peopleCount > 200) {
      setSubmitError('Please enter a valid count of people (1 to 200).');
      return;
    }

    setIsSubmitting(true);

    try {
      const hasMedia = !!photoDataUrl || !!videoDataUrl;
      const reportData: Omit<EmergencyReport, 'id'> = {
        stationId: currentStation.id,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Citizen Reporter',
        contactNumber: contactNumber.trim() || undefined,
        peopleNeedingAssistance: peopleCount,
        urgency: emergencyType === 'People Trapped' ? 'CRITICAL' : 'HIGH',
        status: 'REPORTED', // Submitted
        locationName: locationName.trim(),
        landmark: landmark.trim() || undefined,
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lon,
        gpsAccuracy: gpsAccuracy || undefined,
        gpsCapturedAt: gpsTimestamp || undefined,
        situationType: emergencyType,
        description: `${emergencyType}: ${description.trim() || 'Urgent rescue assistance requested.'}`,
        
        // Media Evidence
        photoUrl: photoDataUrl || undefined,
        photoName: photoName || undefined,
        photoSizeBytes: photoSizeBytes || undefined,
        videoUrl: videoDataUrl || undefined,
        videoName: videoName || undefined,
        videoSizeBytes: videoSizeBytes || undefined,
        evidenceStatus: hasMedia ? 'CITIZEN_SUBMITTED_PENDING_VERIFICATION' : undefined,

        hasChildren: false,
        hasElderly: false,
        hasMobilityIssues: false,
        isAnonymous: false,
        isResponderVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await createEmergencyReport(reportData);
      setLastSubmissionTime(now);
      setSubmitSuccess('Report submitted successfully with geo-tagged intelligence! Rescue status: Submitted (REPORTED).');
      
      // Reset form
      setLandmark('');
      setDescription('');
      setContactNumber('');
      handleRemovePhoto();
      handleRemoveVideo();
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format File Size
  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Status mapping: Submitted → Under Review → Verified → Resolved
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ✓ Resolved
          </span>
        );
      case 'VERIFIED':
      case 'TEAM_ASSIGNED':
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ⚡ Verified / Dispatched
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            🔍 Under Review
          </span>
        );
      case 'REPORTED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            📋 Submitted
          </span>
        );
    }
  };

  // Aggregate Rescue Intelligence by Location
  const areaGroups: Record<string, { totalPeople: number; reportCount: number; verifiedCount: number; mediaEvidenceCount: number }> = {};
  reports.forEach((r) => {
    const areaKey = r.locationName || currentStation.city;
    if (!areaGroups[areaKey]) {
      areaGroups[areaKey] = { totalPeople: 0, reportCount: 0, verifiedCount: 0, mediaEvidenceCount: 0 };
    }
    areaGroups[areaKey].totalPeople += r.peopleNeedingAssistance || 1;
    areaGroups[areaKey].reportCount += 1;
    if (r.status === 'VERIFIED' || r.status === 'RESOLVED' || r.isResponderVerified) {
      areaGroups[areaKey].verifiedCount += 1;
    }
    if (r.photoUrl || r.videoUrl) {
      areaGroups[areaKey].mediaEvidenceCount += 1;
    }
  });

  const myReports = currentUser 
    ? reports.filter(r => r.userId === currentUser.uid) 
    : [];

  return (
    <div id="sos-rescue-page" className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Official Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Important Emergency Notice:</span>
          AquaSentinel is a citizen crowdsourced coordination tool and is <strong>NOT</strong> a replacement for official government emergency services. For immediate life-saving rescue, please call <strong>112 (National Emergency Helpline)</strong> or <strong>1070 / 1078 (NDRF Disaster Helpline)</strong>.
        </div>
      </div>

      {/* Page Header & Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              SOS Citizen Rescue Center
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Report trapped citizens, flood inundations, upload photo/video evidence, and view aggregated community assistance intelligence.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('submit_report')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'submit_report'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            🆘 Report Incident
          </button>
          <button
            onClick={() => setActiveTab('rescue_intel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rescue_intel'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            📊 Rescue Intelligence
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveTab('my_reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_reports'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              My Reports ({myReports.length})
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SUBMIT RESCUE REPORT FORM */}
      {activeTab === 'submit_report' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Submit Citizen Rescue Report
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              All submissions are geo-tagged and reviewed by disaster volunteers and rescue coordination teams.
            </p>
          </div>

          {!currentUser ? (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  Sign In Required to Report Incidents
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  To prevent abuse, spam, and unverified reports during crisis response, please sign in before submitting.
                </p>
              </div>
              <button
                onClick={onSignIn}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Sign In with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-5">
              
              {/* 1. People Count & Emergency Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Number of People Needing Help *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                    required
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Emergency Situation Type *
                  </label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Rising Water">🌊 Rising Water / Flash Inundation</option>
                    <option value="Road Blocked">🚧 Road Blocked / Submerged Bridge</option>
                    <option value="People Trapped">🏠 People Trapped on Rooftop / High Ground</option>
                    <option value="Evacuation Needed">🚨 Evacuation Needed for Vulnerable (Elderly/Children)</option>
                    <option value="Medical Emergency">🚑 Medical Assistance Needed in Flood Zone</option>
                    <option value="Landslide Threat">⛰️ Landslide / Debris Flow Threat</option>
                    <option value="Other">⚠️ Other Emergency</option>
                  </select>
                </div>
              </div>

              {/* 2. Location & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    City / Area *
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    required
                    placeholder="e.g. Dehradun, Rispana Valley"
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Landmark / Address
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Shiv Mandir, House #24"
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* 3. High-Accuracy GPS Geotagging Module */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      GPS Geotagging (Exact Coordinate Capture)
                    </span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Attaching exact GPS helps rescue boats and field teams reach your location quickly.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gpsLoading}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    <span>{gpsLoading ? 'Requesting your location...' : gpsCoords.lat ? 'Update GPS' : '📍 Use Current Location'}</span>
                  </button>
                </div>

                {gpsCoords.lat && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-mono">
                      📍 Lat: {gpsCoords.lat}°N, Lon: {gpsCoords.lon}°E {gpsAccuracy ? `(Accuracy: ±${gpsAccuracy}m)` : ''}
                    </span>
                    <span className="font-semibold text-[10px] uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded">
                      Geo-Tagged ✓
                    </span>
                  </div>
                )}

                {gpsError && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    {gpsError}
                  </div>
                )}
              </div>

              {/* 4. Situation Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Situation Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Water is waist-deep on ground floor. 2 children and 1 elderly person need boat assistance."
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* 5. Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Contact Phone Number (For Rescue Confirmation)
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* 6. PHOTO & VIDEO EVIDENCE UPLOAD FIELDS (Placed Before Submit) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Visual Incident Evidence (Photo & Video)
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Upload ground photos or short video clips to help responders assess water levels and terrain blockage.
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold">
                    Optional
                  </span>
                </div>

                {/* Upload Action Buttons (Large & Obvious for Mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Photo Action Button */}
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload-input"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-purple-500 dark:hover:border-purple-400 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
                    >
                      <Camera className="w-5 h-5 text-purple-600" />
                      <span>{isProcessingPhoto ? 'Processing Photo...' : photoDataUrl ? '📷 Replace Photo' : '📷 Upload Photo'}</span>
                    </button>
                  </div>

                  {/* Video Action Button */}
                  <div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                      id="video-upload-input"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isProcessingVideo}
                      className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 hover:border-sky-500 dark:hover:border-sky-400 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
                    >
                      <Video className="w-5 h-5 text-sky-600" />
                      <span>{isProcessingVideo ? 'Processing Video...' : videoDataUrl ? '🎥 Replace Video' : '🎥 Upload Video'}</span>
                    </button>
                  </div>

                </div>

                {/* Photo Preview Card */}
                {photoDataUrl && (
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div 
                        onClick={() => setPreviewMedia({ type: 'photo', url: photoDataUrl, title: photoName || 'Incident Photo' })}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 cursor-pointer group"
                      >
                        <img 
                          src={photoDataUrl} 
                          alt="Uploaded evidence preview" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <FileImage className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                            {photoName || 'photo_evidence.jpg'}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          {formatBytes(photoSizeBytes)} • Compressed for Emergency Feed
                        </span>
                        <span className="inline-block text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Citizen-submitted evidence — Pending verification
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Video Preview Card */}
                {videoDataUrl && (
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-sky-200 dark:border-sky-900/60 space-y-2.5 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-sky-600" />
                        <div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                            {videoName || 'video_evidence.mp4'} ({formatBytes(videoSizeBytes)})
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 inline-block mt-0.5">
                            Citizen-submitted evidence — Pending verification
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Video</span>
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                      <video 
                        controls 
                        src={videoDataUrl} 
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Privacy & Confidentiality Notice */}
                <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Protected:</strong> Exact coordinates, media metadata, and contact numbers are encrypted and routed exclusively to disaster response teams and authorized personnel.
                  </span>
                </div>

              </div>

              {/* Error & Success Feedback */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Rescue Report...' : 'Submit Rescue Report'}</span>
              </button>

            </form>
          )}

        </div>
      )}

      {/* TAB 2: RESCUE INTELLIGENCE AGGREGATED SUMMARY */}
      {activeTab === 'rescue_intel' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Aggregated Rescue Intelligence Overview
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Approximate scale of assistance requests grouped by geographic basin to help responders prioritize.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(areaGroups).length === 0 ? (
                <div className="col-span-full text-center py-6 text-xs text-zinc-400">
                  No community rescue requests currently active across monitored areas.
                </div>
              ) : (
                Object.entries(areaGroups).map(([area, data]) => (
                  <div 
                    key={area}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          📍 {area}
                        </h4>
                      </div>
                      {data.mediaEvidenceCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> {data.mediaEvidenceCount} with media
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                        <span>Reported needing assistance:</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{data.totalPeople} people</strong>
                      </div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                        <span>Rescue reports:</span>
                        <strong>{data.reportCount} reports</strong>
                      </div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                        <span>Reports verified:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{data.verifiedCount} verified</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Reports List with Media Badges */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Live Field Reports Feed ({reports.length})
            </h4>

            {reports.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                No active citizen reports logged.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          📍 {r.locationName} {r.landmark ? `• ${r.landmark}` : ''}
                        </span>
                        {r.latitude && r.longitude && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                            GPS Geotagged
                          </span>
                        )}
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {r.description}
                    </p>

                    {/* Media Attachments in Feed */}
                    {(r.photoUrl || r.videoUrl) && (
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center gap-2">
                        {r.photoUrl && (
                          <button
                            onClick={() => setPreviewMedia({ type: 'photo', url: r.photoUrl!, title: `Evidence: ${r.locationName}` })}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold hover:bg-purple-100 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>View Photo Evidence</span>
                          </button>
                        )}

                        {r.videoUrl && (
                          <button
                            onClick={() => setPreviewMedia({ type: 'video', url: r.videoUrl!, title: `Video Evidence: ${r.locationName}` })}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold hover:bg-sky-100 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Watch Video Evidence</span>
                          </button>
                        )}

                        <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Citizen-submitted evidence — Pending verification
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>People: <strong className="text-zinc-700 dark:text-zinc-200">{r.peopleNeedingAssistance}</strong></span>
                      <span>Reported: {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY SUBMITTED REPORTS */}
      {activeTab === 'my_reports' && currentUser && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Your Submitted Citizen Reports
          </h3>

          {myReports.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 text-center">
              You have not submitted any rescue reports yet.
            </p>
          ) : (
            myReports.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    📍 {r.locationName} {r.landmark ? `(${r.landmark})` : ''}
                  </span>
                  {getStatusBadge(r.status)}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  {r.description}
                </p>

                {/* Attached Photo/Video Previews */}
                {(r.photoUrl || r.videoUrl) && (
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Attached Evidence</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {r.photoUrl && (
                        <div 
                          onClick={() => setPreviewMedia({ type: 'photo', url: r.photoUrl!, title: 'Submitted Photo Evidence' })}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-600 bg-black cursor-pointer group shrink-0"
                        >
                          <img src={r.photoUrl} alt="Report photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {r.videoUrl && (
                        <button
                          onClick={() => setPreviewMedia({ type: 'video', url: r.videoUrl!, title: 'Submitted Video Evidence' })}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-200 dark:border-sky-800 hover:bg-sky-200 cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>Play Attached Video</span>
                        </button>
                      )}

                      <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        Citizen-submitted evidence — Pending verification
                      </span>
                    </div>
                  </div>
                )}

                {r.latitude && r.longitude && (
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    📍 Geotag: {r.latitude}°N, {r.longitude}°E {r.gpsAccuracy ? `(±${r.gpsAccuracy}m accuracy)` : ''}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span>People: <strong>{r.peopleNeedingAssistance}</strong></span>
                  <span>Submitted: {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FULLSCREEN MEDIA PREVIEW MODAL */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewMedia(null)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {previewMedia.title}
                </h4>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Citizen-submitted evidence — Pending verification
                </span>
              </div>

              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              {previewMedia.type === 'photo' ? (
                <img 
                  src={previewMedia.url} 
                  alt="Full preview evidence" 
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              ) : (
                <video 
                  controls 
                  autoPlay 
                  src={previewMedia.url} 
                  className="max-h-[70vh] w-auto max-w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
