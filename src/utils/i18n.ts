import { AppLanguage, RiskLevel } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  selectLocation: string;
  currentAreaStatus: string;
  
  // Statuses
  normal: string;
  normalDesc: string;
  watch: string;
  watchDesc: string;
  highRisk: string;
  highRiskDesc: string;
  critical: string;
  criticalDesc: string;

  // 6 Information Cards
  rainfallCardTitle: string;
  riverCardTitle: string;
  floodRiskCardTitle: string;
  forecastCardTitle: string;
  officialAlertsCardTitle: string;
  rescueCommunityCardTitle: string;
  localReportsCardTitle: string;
  viewRescueReports: string;
  submitRescueReport: string;
  riskLowDesc: string;
  riskWatchDesc: string;
  riskHighDesc: string;
  riskCriticalDesc: string;
  reasonsForRisk: string;

  // Metric Labels
  currentLevel: string;
  trend: string;
  rising: string;
  falling: string;
  steady: string;
  change3h: string;
  warningLevel: string;
  dangerLevel: string;
  todayRain: string;
  rainIntensity: string;
  rainProbability: string;
  updated: string;
  nextUpdateIn: string;
  source: string;
  status: string;
  noActiveAlerts: string;
  activeRescueReports: string;
  peopleNeedingAssistance: string;
  verifiedReports: string;
  pendingVerification: string;

  // Navigation
  navOverview: string;
  navRiver: string;
  navForecast: string;
  navAlerts: string;
  navAssistant: string;
  navRescue: string;
  navTesting: string;

  // Alerts & Notifications
  getLocalAlerts: string;
  alertSubscriptionTitle: string;
  alertSubscriptionDesc: string;
  heavyRainfallAlerts: string;
  riverLevelAlerts: string;
  officialFloodAlerts: string;
  highRiskChangesAlerts: string;
  emergencySosAlerts: string;
  enableAlertsBtn: string;
  alertsEnabled: string;

  // Forecast
  now: string;
  next6Hours: string;
  today: string;
  tomorrow: string;
  sevenDayForecast: string;
  riverTrend: string;
  weatherCondition: string;

  // Gemini Assistant
  askGemini: string;
  speakToGemini: string;
  listening: string;
  stopListening: string;
  listenResponse: string;
  geminiPlaceholder: string;
  send: string;

  // Dam & Upstream
  upstreamRelease: string;
  upstreamDamUnavailable: string;
  downstreamResponseWindow: string;
  downstreamCannotEstimate: string;
  verifiedStatus: string;

  // General & Disclaimers
  officialWarningNotice: string;
  safetyDisclaimer: string;
  liveData: string;
  latestAvailable: string;
  forecastData: string;
  officialWarning: string;
  citizenReport: string;
  technicalDetails: string;
  damAndDataDetails: string;
  sourcesVerified: string;
  lastUpdated: string;
  officialInstructionsFollow: string;
  unavailableData: string;
  demoModeNotice: string;
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  en: {
    appName: 'AquaSentinel',
    appSubtitle: 'Hydrological Safety & Flood Risk Intelligence',
    selectLocation: 'Select Location',
    currentAreaStatus: 'CURRENT AREA STATUS',

    normal: 'NORMAL',
    normalDesc: 'No immediate flood risk detected.',
    watch: 'WATCH',
    watchDesc: 'Conditions are changing. Monitor updates.',
    highRisk: 'HIGH RISK',
    highRiskDesc: 'Flood risk is increasing.',
    critical: 'CRITICAL',
    criticalDesc: 'Immediate safety action may be required.',

    rainfallCardTitle: 'Rainfall',
    riverCardTitle: 'River',
    floodRiskCardTitle: 'Flood Risk',
    forecastCardTitle: 'Forecast',
    officialAlertsCardTitle: 'Official Alerts',
    rescueCommunityCardTitle: 'Rescue & Community',
    localReportsCardTitle: 'Local Reports',
    viewRescueReports: 'VIEW RESCUE REPORTS',
    submitRescueReport: 'SUBMIT RESCUE REPORT',
    riskLowDesc: 'Conditions are currently stable.',
    riskWatchDesc: 'Rainfall and river levels are increasing. Keep monitoring.',
    riskHighDesc: 'Flood risk is increasing. Follow local advisories.',
    riskCriticalDesc: 'Immediate safety precautions may be required.',
    reasonsForRisk: 'Primary Risk Factors',

    currentLevel: 'Current level',
    trend: 'Trend',
    rising: '↑ Rising',
    falling: '↓ Falling',
    steady: '→ Steady',
    change3h: 'Change in last 3h',
    warningLevel: 'Warning Level',
    dangerLevel: 'Danger Level',
    todayRain: 'Today\'s Rain',
    rainIntensity: 'Intensity',
    rainProbability: 'Rain probability',
    updated: 'Updated',
    nextUpdateIn: 'Next update in',
    source: 'Source',
    status: 'Status',
    noActiveAlerts: 'No active official flood warnings for this station.',
    activeRescueReports: 'Active Rescue Reports',
    peopleNeedingAssistance: 'People needing assistance',
    verifiedReports: 'Verified reports',
    pendingVerification: 'Pending verification',

    navOverview: 'Overview',
    navRiver: 'River & Rainfall',
    navForecast: 'Forecast',
    navAlerts: 'Official Alerts',
    navAssistant: 'Ask Gemini',
    navRescue: 'SOS Rescue',
    navTesting: 'Testing / Demo',

    getLocalAlerts: '🔔 GET LOCAL ALERTS',
    alertSubscriptionTitle: 'Subscribe to Local Safety Alerts',
    alertSubscriptionDesc: 'Allow notifications to receive AquaSentinel safety alerts for your selected location.',
    heavyRainfallAlerts: 'Heavy rainfall alerts (IMD sync)',
    riverLevelAlerts: 'River-level surge alerts (CWC sync)',
    officialFloodAlerts: 'Official flood warnings & advisories',
    highRiskChangesAlerts: 'High-risk & critical status shifts',
    emergencySosAlerts: 'Local citizen emergency reports',
    enableAlertsBtn: 'Enable Notifications',
    alertsEnabled: '✓ Safety Alerts Subscribed',

    now: 'NOW',
    next6Hours: 'NEXT 6 HOURS',
    today: 'TODAY',
    tomorrow: 'TOMORROW',
    sevenDayForecast: '7-DAY FORECAST',
    riverTrend: 'RIVER TREND',
    weatherCondition: 'Weather Conditions',

    askGemini: 'Ask Gemini',
    speakToGemini: '🎤 Speak to Gemini',
    listening: 'Listening...',
    stopListening: 'Stop',
    listenResponse: '🔊 Listen to response',
    geminiPlaceholder: 'Ask about river levels, rainfall, or flood risks...',
    send: 'Send',

    upstreamRelease: 'UPSTREAM RELEASE',
    upstreamDamUnavailable: 'Upstream dam/barrage release data unavailable.',
    downstreamResponseWindow: 'Estimated downstream response window: approximately',
    downstreamCannotEstimate: 'Downstream response cannot currently be estimated reliably.',
    verifiedStatus: 'VERIFIED',

    officialWarningNotice: '⚠️ OFFICIAL WARNING',
    safetyDisclaimer: 'AquaSentinel is an AI-assisted information and coordination platform. It is NOT a replacement for official government warnings, district administration, emergency services, police, or disaster management authorities. For life-threatening emergencies, call 112 or 1070 / 1078 (NDRF).',
    liveData: 'LIVE DATA',
    latestAvailable: 'LATEST AVAILABLE',
    forecastData: 'FORECAST',
    officialWarning: 'OFFICIAL ALERT',
    citizenReport: 'CITIZEN REPORT',
    technicalDetails: 'Technical Details',
    damAndDataDetails: 'Dam & Hydrological Details',
    sourcesVerified: 'Data sources verified',
    lastUpdated: 'Last updated',
    officialInstructionsFollow: 'Always follow official instructions from local disaster management authorities.',
    unavailableData: 'UNAVAILABLE DATA',
    demoModeNotice: 'DEMO ONLY — NOT REAL-WORLD DATA'
  },
  hi: {
    appName: 'एक्वासेंटिनल (AquaSentinel)',
    appSubtitle: 'जल विज्ञान सुरक्षा एवं बाढ़ जोखिम निगरानी प्रणाली',
    selectLocation: 'स्थान चुनें',
    currentAreaStatus: 'वर्तमान क्षेत्र स्थिति',

    normal: 'सामान्य (NORMAL)',
    normalDesc: 'कोई तात्कालिक बाढ़ खतरा नहीं है। जलस्तर सामान्य है।',
    watch: 'सतर्कता (WATCH)',
    watchDesc: 'स्थिति बदल रही है। निरंतर अपडेट पर नज़र रखें।',
    highRisk: 'उच्च जोखिम (HIGH RISK)',
    highRiskDesc: 'बाढ़ का खतरा बढ़ रहा है। संवेदनशील क्षेत्रों से दूरी बनाएं।',
    critical: 'गंभीर / आपातकाल (CRITICAL)',
    criticalDesc: 'तात्कालिक सुरक्षात्मक कदम और निकासी की आवश्यकता हो सकती है।',

    rainfallCardTitle: 'वर्षा (Rainfall)',
    riverCardTitle: 'नदी जलस्तर (River)',
    floodRiskCardTitle: 'बाढ़ जोखिम (Flood Risk)',
    forecastCardTitle: 'पूर्वानुमान (Forecast)',
    officialAlertsCardTitle: 'आधिकारिक चेतावनियां (Official Alerts)',
    rescueCommunityCardTitle: 'बचाव एवं नागरिक रिपोर्ट (Rescue & Community)',
    localReportsCardTitle: 'नागरिक रिपोर्ट (Local Reports)',
    viewRescueReports: 'बचाव रिपोर्ट देखें (VIEW RESCUE REPORTS)',
    submitRescueReport: 'मदद की अपील दर्ज करें (SUBMIT RESCUE REPORT)',
    riskLowDesc: 'वर्तमान स्थिति सामान्य एवं सुरक्षित है।',
    riskWatchDesc: 'वर्षा और नदी जलस्तर बढ़ रहे हैं। निरंतर निगरानी रखें।',
    riskHighDesc: 'बाढ़ का खतरा बढ़ रहा है। स्थानीय परामर्श का पालन करें।',
    riskCriticalDesc: 'तात्कालिक सुरक्षा और सावधानी बरतने की आवश्यकता है।',
    reasonsForRisk: 'जोखिम के मुख्य कारण',

    currentLevel: 'वर्तमान जलस्तर',
    trend: 'प्रवृत्ति (Trend)',
    rising: '↑ बढ़ रहा है (Rising)',
    falling: '↓ घट रहा है (Falling)',
    steady: '→ स्थिर (Steady)',
    change3h: 'पिछले 3 घंटों में परिवर्तन',
    warningLevel: 'चेतावनी स्तर (Warning)',
    dangerLevel: 'खतरा स्तर (Danger)',
    todayRain: 'आज की वर्षा',
    rainIntensity: 'तीव्रता',
    rainProbability: 'वर्षा की संभावना',
    updated: 'अपडेट हुआ',
    nextUpdateIn: 'अगला अपडेट',
    source: 'स्रोत (Source)',
    status: 'स्थिति',
    noActiveAlerts: 'इस स्टेशन के लिए कोई आधिकारिक बाढ़ चेतावनी सक्रिय नहीं है।',
    activeRescueReports: 'सक्रिय बचाव रिपोर्ट',
    peopleNeedingAssistance: 'सहायता की आवश्यकता वाले लोग',
    verifiedReports: 'सत्यापित रिपोर्टें',
    pendingVerification: 'सत्यापन लंबित',

    navOverview: 'मुख्य पृष्ठ',
    navRiver: 'नदी एवं वर्षा',
    navForecast: 'मौसम पूर्वानुमान',
    navAlerts: 'सरकारी अलर्ट',
    navAssistant: 'जेमिनी से पूछें',
    navRescue: 'नागरिक बचाव (SOS)',
    navTesting: 'टेस्टिंग / डेमो',

    getLocalAlerts: '🔔 स्थानीय अलर्ट प्राप्त करें',
    alertSubscriptionTitle: 'स्थानीय सुरक्षा अलर्ट सब्सक्राइब करें',
    alertSubscriptionDesc: 'अपने चुने हुए क्षेत्र के लिए एक्वासेंटिनल सुरक्षा अलर्ट प्राप्त करने के लिए नोटिफिकेशन की अनुमति दें।',
    heavyRainfallAlerts: 'भारी वर्षा अलर्ट (IMD स्रोत)',
    riverLevelAlerts: 'नदी जलस्तर वृद्धि अलर्ट (CWC स्रोत)',
    officialFloodAlerts: 'आधिकारिक बाढ़ चेतावनियां एवं परामर्श',
    highRiskChangesAlerts: 'उच्च जोखिम स्थिति परिवर्तन अलर्ट',
    emergencySosAlerts: 'नागरिक आपातकालीन बचाव रिपोर्टें',
    enableAlertsBtn: 'नोटिफिकेशन सक्षम करें',
    alertsEnabled: '✓ सुरक्षा अलर्ट सक्रिय हैं',

    now: 'अभी (NOW)',
    next6Hours: 'अगले 6 घंटे (NEXT 6 HOURS)',
    today: 'आज (TODAY)',
    tomorrow: 'कल (TOMORROW)',
    sevenDayForecast: '7-दिवसीय पूर्वानुमान (7-DAY FORECAST)',
    riverTrend: 'नदी जलस्तर का अनुमान (RIVER TREND)',
    weatherCondition: 'मौसम की स्थिति',

    askGemini: 'जेमिनी से पूछें',
    speakToGemini: '🎤 जेमिनी से बोलें',
    listening: 'सुन रहे हैं...',
    stopListening: 'रोकें',
    listenResponse: '🔊 उत्तर सुनें',
    geminiPlaceholder: 'नदी के जलस्तर, बारिश या बाढ़ के खतरे के बारे में पूछें...',
    send: 'भेजें',

    upstreamRelease: 'अपस्ट्रीम बांध / बैराज डिस्चार्ज',
    upstreamDamUnavailable: 'अपस्ट्रीम बांध/बैराज जल निकासी का डेटा उपलब्ध नहीं है।',
    downstreamResponseWindow: 'डाउनस्ट्रीम प्रभाव पहुंचने का अनुमानित समय: लगभग',
    downstreamCannotEstimate: 'डाउनस्ट्रीम प्रभाव का वर्तमान में विश्वसनीय अनुमान नहीं लगाया जा सकता।',
    verifiedStatus: 'सत्यापित (VERIFIED)',

    officialWarningNotice: '⚠️ आधिकारिक चेतावनी',
    safetyDisclaimer: 'एक्वासेंटिनल एक एआई-सहायक सूचना एवं समन्वय मंच है। यह आधिकारिक सरकारी चेतावनियों, जिला प्रशासन, आपातकालीन सेवाओं, पुलिस या आपदा प्रबंधन प्राधिकरणों का विकल्प नहीं है। जीवन-रक्षक आपात स्थिति के लिए तुरंत 112 या 1070 / 1078 (NDRF) पर संपर्क करें।',
    liveData: 'लाइव डेटा (LIVE DATA)',
    latestAvailable: 'नवीनतम उपलब्ध (LATEST AVAILABLE)',
    forecastData: 'पूर्वानुमान (FORECAST)',
    officialWarning: 'आधिकारिक चेतावनी (OFFICIAL ALERT)',
    citizenReport: 'नागरिक रिपोर्ट (CITIZEN REPORT)',
    technicalDetails: 'तकनीकी विवरण (Technical Details)',
    damAndDataDetails: 'बांध एवं जल विज्ञान विवरण (Dam & Data Details)',
    sourcesVerified: 'डेटा स्रोत सत्यापित (Data sources verified)',
    lastUpdated: 'अंतिम अपडेट (Last updated)',
    officialInstructionsFollow: 'स्थानीय आपदा प्रबंधन प्राधिकरणों के आधिकारिक निर्देशों का सदैव पालन करें।',
    unavailableData: 'डेटा अनुपलब्ध',
    demoModeNotice: 'केवल डेमो — वास्तविक डेटा नहीं'
  }
};

export function getTranslation(lang: AppLanguage): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
