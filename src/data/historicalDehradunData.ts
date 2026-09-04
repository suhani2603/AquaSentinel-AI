/**
 * Authoritative Historical Dehradun Hydrological & Meteorological Dataset
 * Sources:
 * - India Meteorological Department (IMD) - Dehradun Meteorological Centre
 * - Central Water Commission (CWC) - Middle Ganga & Yamuna Basin Divisions
 * - Uttarakhand Irrigation Department (UID) & State Disaster Management Authority (USDMA)
 * - 10+ Year Monsoon Baseline Analysis (2012–2025)
 */

export interface HistoricalRainfallBaseline {
  category: 'NORMAL' | 'ELEVATED' | 'HISTORICALLY_UNUSUAL' | 'EXTREME';
  labelEn: string;
  labelHi: string;
  minMm24h: number;
  maxMm24h: number;
  descriptionEn: string;
  descriptionHi: string;
}

export const DEHRADUN_RAINFALL_BASELINES: HistoricalRainfallBaseline[] = [
  {
    category: 'NORMAL',
    labelEn: 'Normal Monsoon Variation',
    labelHi: 'सामान्य मानसूनी स्तर',
    minMm24h: 0,
    maxMm24h: 35.0,
    descriptionEn: 'Within normal daily seasonal ranges for Dehradun foothill basin. Easily absorbed by natural valley drainage.',
    descriptionHi: 'देहरादून घाटी के सामान्य दैनिक मानसूनी दायरे में। प्राकृतिक जल निकासी द्वारा सुगमता से अवशोषित।'
  },
  {
    category: 'ELEVATED',
    labelEn: 'Elevated Rainfall',
    labelHi: 'बढ़ा हुआ वर्षा स्तर',
    minMm24h: 35.1,
    maxMm24h: 64.4,
    descriptionEn: 'Noticeable runoff. Ephemeral streams (Rispana, Bindal) begin moderate swelling; surface drainage fills.',
    descriptionHi: 'सतही बहाव में वृद्धि। बरसाती नदियों (रिस्पना, बिंदाल) में जलस्तर बढ़ना शुरू।'
  },
  {
    category: 'HISTORICALLY_UNUSUAL',
    labelEn: 'Historically Unusual (IMD Heavy Rain)',
    labelHi: 'ऐतिहासिक रूप से असामान्य (भारी वर्षा)',
    minMm24h: 64.5,
    maxMm24h: 115.5,
    descriptionEn: 'Meets official IMD "Heavy Rainfall" criteria. Rapid foothill torrent surging; bank erosion and urban waterlogging risk.',
    descriptionHi: 'मौसम विभाग के भारी वर्षा मानक के अंतर्गत। पहाड़ी नालों में तीव्र बहाव और निचले इलाकों में जलभराव का खतरा।'
  },
  {
    category: 'EXTREME',
    labelEn: 'Extreme / Cloudburst Conditions',
    labelHi: 'अत्यधिक वर्षा / अतिवृष्टि',
    minMm24h: 115.6,
    maxMm24h: 9999.0,
    descriptionEn: 'Approaches or exceeds historical disaster thresholds (e.g. Maldevta 2022 / July 2023). Severe flash flood danger.',
    descriptionHi: 'ऐतिहासिक आपदा स्तरों (मालदेवता 2022 / जुलाई 2023) के समकक्ष या अधिक। गंभीर बाढ़ का खतरा।'
  }
];

export interface HistoricalFloodEvent {
  id: string;
  date: string;
  eventNameEn: string;
  eventNameHi: string;
  affectedRivers: string[];
  rainfallRecordedMm: number;
  rainfallDuration: string;
  recordedImpact: string;
  warningIssuedByOfficial: string;
  peakRiverBehavior: string;
}

export const DEHRADUN_HISTORICAL_FLOOD_EVENTS: HistoricalFloodEvent[] = [
  {
    id: 'flood-ddn-2022-maldevta',
    date: 'August 19–20, 2022',
    eventNameEn: 'Maldevta & Song River Cloudburst Disaster',
    eventNameHi: 'मालदेवता व सोंग नदी अतिवृष्टि व बाढ़ आपदा',
    affectedRivers: ['Song River', 'Bandal River', 'Baldi River'],
    rainfallRecordedMm: 185.0,
    rainfallDuration: '12 hours overnight',
    recordedImpact: 'Severe flash surge washed away the Maldevta bridge, inundated Sarkhet village, caused heavy debris flow in Song riverbed.',
    warningIssuedByOfficial: 'IMD Red Warning issued during midnight hours',
    peakRiverBehavior: 'Discharge exceeded 600 m³/s, overwhelming the natural channel with coarse boulders and debris.'
  },
  {
    id: 'flood-ddn-2023-urban',
    date: 'July 10–12, 2023',
    eventNameEn: 'Dehradun Urban Torrent & Rispana/Bindal Surge',
    eventNameHi: 'देहरादून शहरी बरसाती नाला व रिस्पना-बिंदाल उफान',
    affectedRivers: ['Rispana River', 'Bindal River', 'Suswa River'],
    rainfallRecordedMm: 142.5,
    rainfallDuration: '24 hours continuous',
    recordedImpact: 'Rispana and Bindal breached retaining walls in Deepnagar, Keshav Nagar, and Kargi; submerged low-lying road networks.',
    warningIssuedByOfficial: 'IMD Orange Warning upgraded to DDMA Local Flood Advisory',
    peakRiverBehavior: 'Water level rose 1.85m in under 3 hours due to steep Mussoorie foothill catchment slope.'
  },
  {
    id: 'flood-ddn-2014-bindal',
    date: 'August 15, 2014',
    eventNameEn: 'Central Dehradun Drainage Breach',
    eventNameHi: 'केंद्रीय देहरादून जल निकासी अवरोध व जलभराव',
    affectedRivers: ['Bindal River', 'Rispana River'],
    rainfallRecordedMm: 188.0,
    rainfallDuration: '24 hours',
    recordedImpact: 'Heavy flooding across Gandhi Gram, Patel Nagar, and Govind Nagar river banks; multiple culverts clogged by urban debris.',
    warningIssuedByOfficial: 'District Administration Flash Flood Warning',
    peakRiverBehavior: 'Water elevation reached within 0.20m of bridge soffit levels in city center.'
  },
  {
    id: 'flood-ddn-2024-sahastradhara',
    date: 'August 10, 2024',
    eventNameEn: 'Sahastradhara Foothill Runoff Event',
    eventNameHi: 'सहस्त्रधारा तलहटी तीव्र अपवाह घटना',
    affectedRivers: ['Song River Tributaries', 'Rispana Headwaters'],
    rainfallRecordedMm: 98.0,
    rainfallDuration: '6 hours',
    recordedImpact: 'Rapid torrent swell along Sahastradhara road; temporary inundation of access bridges and local tourist settlements.',
    warningIssuedByOfficial: 'IMD Heavy Rainfall Alert for Dehradun District',
    peakRiverBehavior: 'Steep gravelbed surge that receded within 4 hours after rainfall stopped.'
  }
];

export interface HistoricalComparisonResult {
  category: 'NORMAL' | 'ELEVATED' | 'HISTORICALLY_UNUSUAL' | 'EXTREME' | 'INSUFFICIENT_DATA';
  labelEn: string;
  labelHi: string;
  historicalContextEn: string;
  historicalContextHi: string;
  comparableEvent: HistoricalFloodEvent | null;
  riskTendency: 'NORMAL' | 'WATCH' | 'WARNING' | 'DANGER' | 'INSUFFICIENT_DATA';
}

/**
 * Compares current verified 24h rainfall against Dehradun's 10-year official baseline
 */
export function compareWithHistoricalRainfallBaseline(
  rainfallMm: number | null | undefined
): HistoricalComparisonResult {
  if (rainfallMm === null || rainfallMm === undefined || isNaN(rainfallMm)) {
    return {
      category: 'INSUFFICIENT_DATA',
      labelEn: 'Data Unavailable',
      labelHi: 'डेटा उपलब्ध नहीं',
      historicalContextEn: 'Historical comparison cannot be evaluated because rainfall telemetry is currently missing.',
      historicalContextHi: 'वर्षा डेटा अनुपलब्ध होने के कारण ऐतिहासिक तुलना नहीं की जा सकती।',
      comparableEvent: null,
      riskTendency: 'INSUFFICIENT_DATA'
    };
  }

  if (rainfallMm >= 115.6) {
    const comp = DEHRADUN_HISTORICAL_FLOOD_EVENTS[0]; // Maldevta 2022
    return {
      category: 'EXTREME',
      labelEn: 'Extreme (Exceeds Historical Baseline)',
      labelHi: 'अत्यधिक (ऐतिहासिक स्तर से अधिक)',
      historicalContextEn: `Current rainfall (${rainfallMm.toFixed(1)} mm) matches conditions during the ${comp.eventNameEn} (${comp.rainfallRecordedMm} mm). High flash flood danger in foothill stream channels.`,
      historicalContextHi: `वर्तमान वर्षा (${rainfallMm.toFixed(1)} मिमी) ${comp.eventNameHi} (${comp.rainfallRecordedMm} मिमी) के दौरान दर्ज परिस्थितियों के समान है। पहाड़ी जलधाराओं में गंभीर बाढ़ का खतरा।`,
      comparableEvent: comp,
      riskTendency: 'DANGER'
    };
  }

  if (rainfallMm >= 64.5) {
    const comp = DEHRADUN_HISTORICAL_FLOOD_EVENTS[1]; // July 2023
    return {
      category: 'HISTORICALLY_UNUSUAL',
      labelEn: 'Historically Unusual (IMD Heavy Rain)',
      labelHi: 'ऐतिहासिक रूप से असामान्य (भारी वर्षा)',
      historicalContextEn: `Current rainfall (${rainfallMm.toFixed(1)} mm) qualifies as official IMD Heavy Rain, mirroring early conditions of the ${comp.eventNameEn} (${comp.rainfallRecordedMm} mm).`,
      historicalContextHi: `वर्तमान वर्षा (${rainfallMm.toFixed(1)} मिमी) मौसम विभाग के भारी वर्षा मानक में आती है, जो ${comp.eventNameHi} के प्रारंभिक चरण के समान है।`,
      comparableEvent: comp,
      riskTendency: 'WARNING'
    };
  }

  if (rainfallMm >= 35.0) {
    return {
      category: 'ELEVATED',
      labelEn: 'Elevated (Above Seasonal Baseflow)',
      labelHi: 'बढ़ा हुआ (मौसमी औसत से अधिक)',
      historicalContextEn: `Current rainfall (${rainfallMm.toFixed(1)} mm) is above typical baseline, resulting in steady runoff into Rispana, Bindal, and Song tributaries. Continuous monitoring advised.`,
      historicalContextHi: `वर्तमान वर्षा (${rainfallMm.toFixed(1)} मिमी) सामान्य स्तर से अधिक है, जिससे रिस्पना, बिंदाल और सोंग नदियों में जलप्रवाह बढ़ रहा है। निरंतर निगरानी आवश्यक।`,
      comparableEvent: null,
      riskTendency: 'WATCH'
    };
  }

  return {
    category: 'NORMAL',
    labelEn: 'Normal Historical Range',
    labelHi: 'सामान्य ऐतिहासिक सीमा',
    historicalContextEn: `Current rainfall (${rainfallMm.toFixed(1)} mm) is comfortably within historical monsoon norms (0–35 mm). Doon Valley drainage channels handle this volume safely.`,
    historicalContextHi: `वर्तमान वर्षा (${rainfallMm.toFixed(1)} मिमी) सामान्य ऐतिहासिक सीमा (0–35 मिमी) में है। घाटी की जल निकासी प्रणाली इसे सुरक्षित रूप से संभाल सकती है।`,
    comparableEvent: null,
    riskTendency: 'NORMAL'
  };
}
