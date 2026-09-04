import { TestScenario } from '../types';

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'scenario-1-normal',
    number: 1,
    title: 'SCENARIO 1 — NORMAL CONDITIONS',
    shortName: 'Normal Conditions',
    description: 'Normal rainfall, stable river baseflow, and safe water levels across the basin within nominal channel bounds.',
    targetCity: 'Dehradun',
    targetStationId: 'station-dehradun-song',
    inputs: {
      rainfall_mm: 14.5,
      rainfall_description: 'Light seasonal showers (14.5 mm / 24h)',
      flow_m3s: 135,
      previous_flow_m3s: 130,
      flow_change_percent: 3.8,
      water_level_m: 1.45,
      previous_water_level_m: 1.42,
      dam_name: null,
      dam_release_m3s: null,
      previous_dam_release_m3s: null,
      dam_gate_status: null
    },
    expectedRiskLevel: 'NORMAL'
  },
  {
    id: 'scenario-2-gradual-rise',
    number: 2,
    title: 'SCENARIO 2 — GRADUAL RIVER RISE',
    shortName: 'Gradual River Rise',
    description: 'River flow and water level gradually increase over several observation cycles as upstream mountain runoff collects steadily.',
    targetCity: 'Rishikesh',
    targetStationId: 'station-rishikesh-ganga',
    inputs: {
      rainfall_mm: 38.0,
      rainfall_description: 'Moderate steady catchment rain (38.0 mm / 24h)',
      flow_m3s: 2950,
      previous_flow_m3s: 2480,
      flow_change_percent: 18.9,
      water_level_m: 338.90,
      previous_water_level_m: 338.10,
      dam_name: 'Tehri Dam',
      dam_release_m3s: 850,
      previous_dam_release_m3s: 720,
      dam_gate_status: 'Power canal and regulated service spillways active'
    },
    expectedRiskLevel: 'WATCH'
  },
  {
    id: 'scenario-3-rapid-flow',
    number: 3,
    title: 'SCENARIO 3 — RAPID FLOW INCREASE',
    shortName: 'Rapid Flow Increase',
    description: 'A sudden, sharp surge in river flow (Previous: 2,100 m³/s → Current: 3,600 m³/s, +71.4%), triggering an immediate rapid flow alert.',
    targetCity: 'Delhi',
    targetStationId: 'station-delhi-yamuna',
    inputs: {
      rainfall_mm: 45.0,
      rainfall_description: 'Scattered monsoon rain (45.0 mm / 24h)',
      flow_m3s: 3600,
      previous_flow_m3s: 2100,
      flow_change_percent: 71.4,
      water_level_m: 205.65,
      previous_water_level_m: 204.60,
      dam_name: 'Hathnikund Barrage',
      dam_release_m3s: 3600,
      previous_dam_release_m3s: 2100,
      dam_gate_status: '14 Spillway gates opened'
    },
    expectedTriggerBanner: 'RAPID FLOW INCREASE DETECTED',
    expectedRiskLevel: 'WARNING'
  },
  {
    id: 'scenario-4-heavy-rainfall',
    number: 4,
    title: 'SCENARIO 4 — HEAVY RAINFALL',
    shortName: 'Heavy Catchment Rainfall',
    description: 'Catchment precipitation spikes dramatically (115 mm / 24h), initiating rapid surface runoff and elevating foothill stream levels.',
    targetCity: 'Dehradun',
    targetStationId: 'station-dehradun-song',
    inputs: {
      rainfall_mm: 115.0,
      rainfall_description: 'Intense cloudburst & foothill downpour (115.0 mm / 24h)',
      flow_m3s: 580,
      previous_flow_m3s: 220,
      flow_change_percent: 163.6,
      water_level_m: 3.65,
      previous_water_level_m: 1.80,
      dam_name: null,
      dam_release_m3s: null,
      previous_dam_release_m3s: null,
      dam_gate_status: null
    },
    expectedTriggerBanner: 'HEAVY CATCHMENT PRECIPITATION & RAPID SURGE',
    expectedRiskLevel: 'WARNING'
  },
  {
    id: 'scenario-5-dam-release',
    number: 5,
    title: 'SCENARIO 5 — DAM RELEASE INCREASE',
    shortName: 'Simulated Dam Release',
    description: 'A clearly simulated upstream dam-release event (Previous: 1,500 m³/s → Current: 3,000 m³/s, +100% surge). Not an actual dam release.',
    targetCity: 'Haridwar',
    targetStationId: 'station-haridwar-ganga',
    inputs: {
      rainfall_mm: 22.0,
      rainfall_description: 'Normal seasonal background (22.0 mm / 24h)',
      flow_m3s: 3400,
      previous_flow_m3s: 2100,
      flow_change_percent: 61.9,
      water_level_m: 293.45,
      previous_water_level_m: 292.30,
      dam_name: 'Bhimgoda Barrage & Upper Reach',
      dam_release_m3s: 3000,
      previous_dam_release_m3s: 1500,
      dam_gate_status: 'SIMULATED: 12 Sluices opened under simulation'
    },
    expectedTriggerBanner: 'SIMULATED DAM RELEASE INCREASE',
    expectedRiskLevel: 'WARNING'
  },
  {
    id: 'scenario-6-combined-risk',
    number: 6,
    title: 'SCENARIO 6 — COMBINED HIGH-RISK CONDITIONS',
    shortName: 'Combined High Risk',
    description: 'Compound multi-factor risk: heavy rainfall (95 mm) + rapid river flow surge (+85%) + water stage breaching danger mark + emergency simulated barrage release.',
    targetCity: 'Delhi',
    targetStationId: 'station-delhi-yamuna',
    inputs: {
      rainfall_mm: 95.0,
      rainfall_description: 'Severe regional deluge (95.0 mm / 24h)',
      flow_m3s: 4600,
      previous_flow_m3s: 2400,
      flow_change_percent: 91.7,
      water_level_m: 206.35,
      previous_water_level_m: 204.80,
      dam_name: 'Hathnikund Barrage',
      dam_release_m3s: 4800,
      previous_dam_release_m3s: 2200,
      dam_gate_status: 'SIMULATED: All 18 Spillway gates fully discharging'
    },
    expectedTriggerBanner: 'COMPOUND HIGH RISK: CRITICAL STAGE & SURGE BREACH',
    expectedRiskLevel: 'CRITICAL'
  }
];
