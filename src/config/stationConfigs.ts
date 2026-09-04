import { ThresholdType } from '../types';

export interface StationSourceMapping {
  id: string;
  city: string;
  stateOrRegion: string;
  country: string;
  riverName: string;
  basinName: string;
  gaugeStationName: string;
  cwcStationCode?: string;
  imdStationCode?: string;
  latitude: number;
  longitude: number;
  catchmentAreaKm2: number;
  focusDescription: string;
  
  // Official Benchmark Thresholds
  normalStage: number; // m
  alertStage: number; // m
  warningStage: number; // m
  criticalStage: number; // m (Danger Mark)
  bankfullLevel: number; // m
  designPeakFlow: number; // m³/s
  thresholdType: ThresholdType;
  warningStageLabel: string;
  criticalStageLabel: string;

  // Verified Data Sources
  waterLevelSource: string;
  dischargeSource: string;
  rainfallSource: string;
  reservoirSource: string;
  officialDataSourceUrl: string;

  // Available Capabilities
  availableDataSources: {
    riverLevel: boolean;
    discharge: boolean;
    rainfall: boolean;
    weather: boolean;
    reservoir: boolean;
  };

  // Upstream Dam Configuration
  upstreamDamConfig: {
    id: string;
    name: string;
    river: string;
    distanceUpstreamKm: number | null;
    travelTimeToStationHours: number | null;
    isAvailable: boolean;
    sourceAttribution: string;
    note: string;
  };
}

export const DEHRADUN_STATION_CONFIGS: StationSourceMapping[] = [
  // 1. DEHRADUN — Song River (Maldevta - Doiwala Catchment)
  {
    id: 'station-dehradun-song',
    city: 'Dehradun',
    stateOrRegion: 'Uttarakhand',
    country: 'India',
    riverName: 'Song River',
    basinName: 'Song River Basin (Maldevta - Doiwala Catchment)',
    gaugeStationName: 'Song River Gauge (Maldevta / Raiwala Confluence)',
    cwcStationCode: 'UK-DDN-SONG-01',
    imdStationCode: 'IMD-DDN-42111',
    latitude: 30.3165,
    longitude: 78.0322,
    catchmentAreaKm2: 780,
    focusDescription: 'Monitors mountain rainfall-driven runoff, steep foothill water levels, and flash flood surges in the Song River basin (Maldevta, Raipur, and Doiwala plains). Rainfall-driven catchment with no direct upstream storage dam.',
    normalStage: 1.20,
    alertStage: 2.50,
    warningStage: 3.20,
    criticalStage: 4.50,
    bankfullLevel: 3.80,
    designPeakFlow: 850,
    thresholdType: 'PROTOTYPE_CONFIGURED',
    warningStageLabel: 'Foothill Warning Mark (3.20 m)',
    criticalStageLabel: 'Foothill Danger Mark (4.50 m)',
    waterLevelSource: 'Uttarakhand Irrigation Dept / Foothill Network Station #01',
    dischargeSource: 'Hydro-Geomorphological Cross-Section Rating',
    rainfallSource: 'India Meteorological Department (IMD) / Jolly Grant AWS',
    reservoirSource: 'Data unavailable (Rainfall-driven catchment; no direct upstream storage dam)',
    officialDataSourceUrl: 'https://mausam.imd.gov.in / https://cwc.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: false
    },
    upstreamDamConfig: {
      id: 'dam-dehradun-song-none',
      name: 'No Upstream Storage Dam',
      river: 'Song River System',
      distanceUpstreamKm: null,
      travelTimeToStationHours: null,
      isAvailable: false,
      sourceAttribution: 'Data unavailable',
      note: 'Rainfall & mountain runoff driven basin; no upstream storage dam regulates Song River.'
    }
  },

  // 2. DEHRADUN — Rispana River (Sahastradhara - Central Urban Corridor)
  {
    id: 'station-dehradun-rispana',
    city: 'Dehradun',
    stateOrRegion: 'Uttarakhand',
    country: 'India',
    riverName: 'Rispana River',
    basinName: 'Rispana Ephemeral Foothill Catchment (Urban Doon Corridor)',
    gaugeStationName: 'Rispana Stream Gauge (Sahastradhara Foothill & Rispana Bridge)',
    cwcStationCode: 'UK-DDN-RISP-02',
    imdStationCode: 'IMD-DDN-SAHAS',
    latitude: 30.3421,
    longitude: 78.0585,
    catchmentAreaKm2: 95,
    focusDescription: 'Seasonal ephemeral torrent originating in Mussoorie/Sahastradhara foothills. Extremely rapid response with short lag time (30-45 minutes) during heavy rain; traverses dense central Dehradun settlements.',
    normalStage: 0.80,
    alertStage: 2.10,
    warningStage: 2.80,
    criticalStage: 3.90,
    bankfullLevel: 3.30,
    designPeakFlow: 380,
    thresholdType: 'PROTOTYPE_CONFIGURED',
    warningStageLabel: 'Foothill Warning Mark (2.80 m)',
    criticalStageLabel: 'Urban Danger Mark (3.90 m)',
    waterLevelSource: 'State Hydrology & Urban Drainage Gauge Station #02',
    dischargeSource: 'Hydro-Geomorphological Cross-Section Rating',
    rainfallSource: 'IMD / UKSDMA Sahastradhara & Karanpur Stations',
    reservoirSource: 'Data unavailable (Rainfall-driven catchment; no direct upstream storage dam)',
    officialDataSourceUrl: 'https://mausam.imd.gov.in / https://usdma.uk.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: false
    },
    upstreamDamConfig: {
      id: 'dam-dehradun-rispana-none',
      name: 'No Upstream Storage Dam',
      river: 'Rispana Ephemeral Torrent',
      distanceUpstreamKm: null,
      travelTimeToStationHours: null,
      isAvailable: false,
      sourceAttribution: 'Data unavailable',
      note: 'Ephemeral torrent driven directly by Mussoorie foothill rainfall runoff.'
    }
  },

  // 3. DEHRADUN — Bindal River (Mussoorie Foothills - Cantt Corridor)
  {
    id: 'station-dehradun-bindal',
    city: 'Dehradun',
    stateOrRegion: 'Uttarakhand',
    country: 'India',
    riverName: 'Bindal River',
    basinName: 'Bindal Ephemeral Basin (Mussoorie Foothills - Cantt Corridor)',
    gaugeStationName: 'Bindal Stream Gauge (Bindal Bridge / Keshav Nagar)',
    cwcStationCode: 'UK-DDN-BIND-03',
    imdStationCode: 'IMD-DDN-FRI',
    latitude: 30.3245,
    longitude: 78.0287,
    catchmentAreaKm2: 85,
    focusDescription: 'Monitors runoff from western Mussoorie foothills traversing Dehradun Cantt, Gandhi Gram, and urban core towards Suswa confluence. Subject to rapid flash swelling and debris obstruction during intense spells.',
    normalStage: 0.75,
    alertStage: 1.95,
    warningStage: 2.60,
    criticalStage: 3.70,
    bankfullLevel: 3.10,
    designPeakFlow: 340,
    thresholdType: 'PROTOTYPE_CONFIGURED',
    warningStageLabel: 'Foothill Warning Mark (2.60 m)',
    criticalStageLabel: 'Urban Danger Mark (3.70 m)',
    waterLevelSource: 'State Hydrology & Urban Drainage Gauge Station #03',
    dischargeSource: 'Hydro-Geomorphological Cross-Section Rating',
    rainfallSource: 'IMD FRI Kaulagarh & Asharori AWS',
    reservoirSource: 'Data unavailable (Rainfall-driven catchment; no direct upstream storage dam)',
    officialDataSourceUrl: 'https://mausam.imd.gov.in / https://usdma.uk.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: false
    },
    upstreamDamConfig: {
      id: 'dam-dehradun-bindal-none',
      name: 'No Upstream Storage Dam',
      river: 'Bindal Ephemeral Stream',
      distanceUpstreamKm: null,
      travelTimeToStationHours: null,
      isAvailable: false,
      sourceAttribution: 'Data unavailable',
      note: 'Ephemeral torrent driven directly by western Mussoorie foothill runoff.'
    }
  }
];

export const OTHER_CITY_CONFIGS: StationSourceMapping[] = [

  // 2. RISHIKESH (Ganga River - Upper Reach)
  {
    id: 'station-rishikesh-ganga',
    city: 'Rishikesh',
    stateOrRegion: 'Uttarakhand',
    country: 'India',
    riverName: 'Ganga River (Upper Reach)',
    basinName: 'Upper Ganga Basin (Garhwal Himalayas)',
    gaugeStationName: 'CWC Triveni Ghat / Rishikesh Hydrological Station',
    cwcStationCode: 'CWC-UK-RSH-02',
    imdStationCode: 'IMD-UK-GARHWAL',
    latitude: 30.1033,
    longitude: 78.2948,
    catchmentAreaKm2: 21700,
    focusDescription: 'Tracks Upper Ganga discharge influenced by the Bhagirathi-Alaknanda confluence at Devprayag and regulated releases from the Tehri Dam hydro complex.',
    normalStage: 336.50,
    alertStage: 338.50,
    warningStage: 339.50,
    criticalStage: 340.50,
    bankfullLevel: 339.80,
    designPeakFlow: 6500,
    thresholdType: 'OFFICIAL_CWC',
    warningStageLabel: 'Official CWC Warning Level (339.50 m)',
    criticalStageLabel: 'Official CWC Danger Level (340.50 m)',
    waterLevelSource: 'Central Water Commission (CWC) / NWIC Portal',
    dischargeSource: 'CWC River Gauge Telemetry Network',
    rainfallSource: 'India Meteorological Department (IMD) Rishikesh AWS',
    reservoirSource: 'Tehri Hydro Development Corporation (THDC) / CWC Reservoir Telemetry',
    officialDataSourceUrl: 'https://cwc.gov.in / https://indiawris.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: true
    },
    upstreamDamConfig: {
      id: 'dam-tehri',
      name: 'Tehri Dam Hydro Complex',
      river: 'Bhagirathi River (Upper Ganga Headwaters)',
      distanceUpstreamKm: 72,
      travelTimeToStationHours: 8,
      isAvailable: true,
      sourceAttribution: 'THDC / CWC Daily Reservoir Bulletin',
      note: 'Monitors regulated Bhagirathi discharge into Upper Ganga reach (Travel time ~8h).'
    }
  },

  // 3. HARIDWAR (Ganga River - Plains Entry & Canal Headworks)
  {
    id: 'station-haridwar-ganga',
    city: 'Haridwar',
    stateOrRegion: 'Uttarakhand',
    country: 'India',
    riverName: 'Ganga River (Plains Entry & Headworks)',
    basinName: 'Upper Ganga Basin',
    gaugeStationName: 'Bhimgoda Barrage / Har Ki Pauri CWC Gauge Station #03',
    cwcStationCode: 'CWC-UK-HDW-03',
    imdStationCode: 'IMD-UK-HDW-01',
    latitude: 29.9457,
    longitude: 78.1642,
    catchmentAreaKm2: 23100,
    focusDescription: 'Monitors Ganga flow where river transitions from Himalayan foothills into northern plains, splitting flow between Main Ganga and the Upper Ganga Canal at Bhimgoda Barrage.',
    normalStage: 291.50,
    alertStage: 292.80,
    warningStage: 293.00,
    criticalStage: 294.00,
    bankfullLevel: 293.40,
    designPeakFlow: 7500,
    thresholdType: 'OFFICIAL_CWC',
    warningStageLabel: 'Official CWC Warning Level (293.00 m)',
    criticalStageLabel: 'Official CWC Danger Level (294.00 m)',
    waterLevelSource: 'Central Water Commission (CWC) / NWIC Portal',
    dischargeSource: 'UP Irrigation Dept & CWC Hydro Telemetry',
    rainfallSource: 'India Meteorological Department (IMD) Haridwar Observatory',
    reservoirSource: 'Bhimgoda Barrage Headworks Telemetry (UP Irrigation)',
    officialDataSourceUrl: 'https://cwc.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: true
    },
    upstreamDamConfig: {
      id: 'dam-bhimgoda',
      name: 'Bhimgoda Barrage & Headworks',
      river: 'Ganga River',
      distanceUpstreamKm: 4,
      travelTimeToStationHours: 1,
      isAvailable: true,
      sourceAttribution: 'UP Irrigation & Water Resources Dept',
      note: 'Regulates water split between Main Riverbed and Upper Ganga Canal.'
    }
  },

  // 4. DELHI (Yamuna River)
  {
    id: 'station-delhi-yamuna',
    city: 'Delhi',
    stateOrRegion: 'National Capital Territory',
    country: 'India',
    riverName: 'Yamuna River',
    basinName: 'Ganges-Yamuna Basin',
    gaugeStationName: 'CWC Old Railway Bridge (Loha Pul) Gauge #07',
    cwcStationCode: 'CWC-DL-ORB-07',
    imdStationCode: 'IMD-DL-SFD-42182',
    latitude: 28.6652,
    longitude: 77.2435,
    catchmentAreaKm2: 19500,
    focusDescription: 'Demonstrates Yamuna river-flow and downstream urban flood risk at Delhi Old Railway Bridge, tracking upstream flood surges released from Hathnikund Barrage (Haryana).',
    normalStage: 203.00,
    alertStage: 204.50,
    warningStage: 205.33,
    criticalStage: 206.00,
    bankfullLevel: 205.00,
    designPeakFlow: 5000,
    thresholdType: 'OFFICIAL_CWC',
    warningStageLabel: 'Official CWC Warning Level (205.33 m)',
    criticalStageLabel: 'Official CWC Danger Mark (206.00 m)',
    waterLevelSource: 'Central Water Commission (CWC) / NWIC Portal',
    dischargeSource: 'CWC Yamuna Basin Hydrological Telemetry',
    rainfallSource: 'India Meteorological Department (IMD) Delhi (Safdarjung AWS)',
    reservoirSource: 'Haryana Irrigation Dept / CWC Hathnikund Barrage Node',
    officialDataSourceUrl: 'https://cwc.gov.in / https://mausam.imd.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: true
    },
    upstreamDamConfig: {
      id: 'dam-hathnikund',
      name: 'Hathnikund Barrage',
      river: 'Yamuna River (Yamunanagar, Haryana)',
      distanceUpstreamKm: 220,
      travelTimeToStationHours: 48,
      isAvailable: true,
      sourceAttribution: 'Haryana Irrigation / CWC Telemetry Feed',
      note: 'Upstream barrage flood surge requires ~48 to 72 hours to reach Old Railway Bridge Delhi.'
    }
  },

  // 5. AGRA (Yamuna River - Middle Reach)
  {
    id: 'station-agra-yamuna',
    city: 'Agra',
    stateOrRegion: 'Uttar Pradesh',
    country: 'India',
    riverName: 'Yamuna River (Middle Reach)',
    basinName: 'Yamuna Sub-Basin',
    gaugeStationName: 'CWC Strachey Bridge / Agra Waterworks Gauge #05',
    cwcStationCode: 'CWC-UP-AGR-05',
    imdStationCode: 'IMD-UP-AGR-42261',
    latitude: 27.1767,
    longitude: 78.0081,
    catchmentAreaKm2: 44200,
    focusDescription: 'Demonstrates Yamuna river-flow and flood risk downstream of Delhi and Mathura, tracking attenuated flood waves discharged past Gokul Barrage.',
    normalStage: 148.50,
    alertStage: 150.50,
    warningStage: 151.40,
    criticalStage: 152.40,
    bankfullLevel: 151.60,
    designPeakFlow: 4200,
    thresholdType: 'OFFICIAL_CWC',
    warningStageLabel: 'Official CWC Warning Level (151.40 m)',
    criticalStageLabel: 'Official CWC Danger Level (152.40 m)',
    waterLevelSource: 'Central Water Commission (CWC) / NWIC Portal',
    dischargeSource: 'CWC Middle Yamuna Division Gauge',
    rainfallSource: 'India Meteorological Department (IMD) Agra Observatory',
    reservoirSource: 'UP Jal Nigam / Gokul Barrage Mathura Telemetry',
    officialDataSourceUrl: 'https://cwc.gov.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: true
    },
    upstreamDamConfig: {
      id: 'dam-gokul-okhla',
      name: 'Gokul Barrage (Mathura) & Okhla Chain',
      river: 'Yamuna River',
      distanceUpstreamKm: 58,
      travelTimeToStationHours: 20,
      isAvailable: true,
      sourceAttribution: 'UP Irrigation / Jal Nigam Telemetry',
      note: 'Downstream receiving station for Yamuna flood wave attenuation from Gokul Barrage.'
    }
  },

  // 6. PATNA (Ganga River - Middle-Lower Confluence Reach)
  {
    id: 'station-patna-ganga',
    city: 'Patna',
    stateOrRegion: 'Bihar',
    country: 'India',
    riverName: 'Ganga River (Middle-Lower Confluence Reach)',
    basinName: 'Main Ganges Basin (Ghaghara / Gandak / Sone Confluence)',
    gaugeStationName: 'CWC Gandhi Ghat & Digha Ghat Monitoring Station #06',
    cwcStationCode: 'CWC-BR-PAT-06',
    imdStationCode: 'IMD-BR-PAT-42492',
    latitude: 25.5941,
    longitude: 85.1376,
    catchmentAreaKm2: 890000,
    focusDescription: 'Tracks Ganga river stage at Patna, heavily influenced by combined tributary inflows from Ghaghara, Gandak, and Sone rivers with backwater swelling.',
    normalStage: 47.00,
    alertStage: 48.60,
    warningStage: 49.50,
    criticalStage: 50.52,
    bankfullLevel: 49.80,
    designPeakFlow: 45000,
    thresholdType: 'OFFICIAL_CWC',
    warningStageLabel: 'Official CWC Warning Level (49.50 m at Gandhi Ghat)',
    criticalStageLabel: 'Official CWC Danger Level (50.52 m at Gandhi Ghat)',
    waterLevelSource: 'Central Water Commission (CWC) / NWIC Portal',
    dischargeSource: 'CWC Middle Ganga Division Hydrological Network',
    rainfallSource: 'India Meteorological Department (IMD) Patna Airport AWS',
    reservoirSource: 'Bihar WRD / Indrapuri Barrage (Sone) Telemetry',
    officialDataSourceUrl: 'https://cwc.gov.in / https://fmis.bih.nic.in',
    availableDataSources: {
      riverLevel: true,
      discharge: true,
      rainfall: true,
      weather: true,
      reservoir: true
    },
    upstreamDamConfig: {
      id: 'dam-sone-indrapuri',
      name: 'Indrapuri Barrage (Sone River Confluence)',
      river: 'Sone River (Major Ganga Tributary)',
      distanceUpstreamKm: 110,
      travelTimeToStationHours: 30,
      isAvailable: true,
      sourceAttribution: 'Bihar Water Resources Dept (WRD) / CWC',
      note: 'Patna flood dynamics are driven by combined upstream Ganga + Gandak + Ghaghara + Sone inflows.'
    }
  }
];

export const VERIFIED_STATION_CONFIGS: StationSourceMapping[] = [
  ...DEHRADUN_STATION_CONFIGS,
  ...OTHER_CITY_CONFIGS
];

/**
 * Stations exposed in the primary AquaSentinel UI (Dehradun rivers only for this version)
 */
export const ACTIVE_UI_STATION_CONFIGS: StationSourceMapping[] = DEHRADUN_STATION_CONFIGS;

export function getStationConfig(stationId: string): StationSourceMapping | undefined {
  return VERIFIED_STATION_CONFIGS.find((s) => s.id === stationId);
}

