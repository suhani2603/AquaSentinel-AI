import { AquaSentinelMessage, MonitoringStation, WhatIfScenario } from '../types';

export interface AquaSentinelChatParams {
  message?: string;
  history?: AquaSentinelMessage[];
  stationData?: MonitoringStation;
  mode?: 'chat' | 'explain_risk' | 'explain_conditions' | 'explain_river' | 'explain_dam' | 'trend_analysis' | 'whatif' | 'summary';
  language?: 'en' | 'hi';
}

export interface AquaSentinelChatResponse {
  reply: string;
  mode: string;
  isFallback?: boolean;
}

export async function askAquaSentinel(
  paramsOrMessage: AquaSentinelChatParams | string,
  stationData?: MonitoringStation,
  history?: AquaSentinelMessage[],
  mode?: 'chat' | 'explain_risk' | 'explain_conditions' | 'explain_river' | 'explain_dam' | 'trend_analysis' | 'whatif' | 'summary',
  language: 'en' | 'hi' = 'en'
): Promise<AquaSentinelChatResponse> {
  const params: AquaSentinelChatParams = typeof paramsOrMessage === 'string'
    ? {
        message: paramsOrMessage,
        stationData,
        history,
        mode: mode || 'chat',
        language
      }
    : {
        ...paramsOrMessage,
        language: paramsOrMessage.language || language
      };

  try {
    const response = await fetch('/api/gemini/aquasentinel-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error contacting AquaSentinel Gemini API:', error);
    const station = params.stationData;
    const isHindi = params.language === 'hi';

    if (isHindi && station) {
      return {
        reply: `**${station.city} (${station.riverName}) के लिए जल स्थिति विवरण**\n\n` +
          `- **नदी का बहाव:** ${station.currentFlow?.toLocaleString()} m³/s (${station.flowChangePercent > 0 ? '+' : ''}${station.flowChangePercent?.toFixed(1)}%)\n` +
          `- **जलस्तर:** ${station.currentWaterLevel?.toFixed(2)} मीटर (चेतावनी स्तर: ${station.warningStage?.toFixed(2)}m, खतरे का स्तर: ${station.criticalStage?.toFixed(2)}m)\n` +
          `- **अपस्ट्रीम बांध:** ${station.upstreamDam?.name || 'बांध प्रणाली'} (${station.upstreamDam?.isAvailable && station.upstreamDam?.dischargeM3s ? `${station.upstreamDam.dischargeM3s.toLocaleString()} m³/s` : 'डेटा उपलब्ध नहीं'})\n` +
          `- **जोखिम स्तर:** **${station.riskLevel === 'NORMAL' ? 'सामान्य' : station.riskLevel === 'WATCH' ? 'निगरानी' : station.riskLevel === 'WARNING' ? 'चेतावनी' : 'गंभीर'}** (${station.riskScore}/100)\n\n` +
          `*सूचना: यह केवल स्थिति निगरानी हेतु है।*`,
        mode: params.mode || 'chat',
        isFallback: true
      };
    }

    return {
      reply: station
        ? `**Hydrological Telemetry Check for ${station.city} (${station.riverName})**\n\n` +
          `- **Measured Flow:** ${station.currentFlow?.toLocaleString()} m³/s (${station.flowChangePercent > 0 ? '+' : ''}${station.flowChangePercent?.toFixed(1)}% vs previous ${station.previousFlow?.toLocaleString()} m³/s)\n` +
          `- **River Stage:** ${station.currentWaterLevel?.toFixed(2)}m (Warning threshold: ${station.warningStage?.toFixed(2)}m, Critical: ${station.criticalStage?.toFixed(2)}m)\n` +
          `- **Upstream Dam:** ${station.upstreamDam?.name || 'Dam System'} (${station.upstreamDam?.isAvailable && station.upstreamDam?.dischargeM3s ? `${station.upstreamDam.dischargeM3s.toLocaleString()} m³/s discharge` : 'Data unavailable'})\n` +
          `- **Calculated Risk Index:** **${station.riskLevel}** (${station.riskScore}/100)\n\n` +
          `*Note: AquaSentinel risk scores are computed indicators for situational monitoring, not official government warnings.*`
        : 'Telemetry data is temporarily unavailable. Please retry shortly.',
      mode: params.mode || 'chat',
      isFallback: true
    };
  }
}

export async function fetchBasinSummary(station: MonitoringStation, language: 'en' | 'hi' = 'en'): Promise<{ summary: string; keyPoints: string[] }> {
  try {
    const response = await fetch('/api/gemini/basin-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stationData: station, language }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.summary || 'Situational summary generated.',
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : []
    };
  } catch (error) {
    console.error('Error fetching basin summary:', error);
    return {
      summary: `**Current Status: ${station.riskLevel} (${station.riskScore}/100)**. River flow at **${station.currentFlow?.toLocaleString()} m³/s** with water level at **${station.currentWaterLevel?.toFixed(2)}m** (Warning stage: ${station.warningStage?.toFixed(2)}m).`,
      keyPoints: [
        `Flow change: ${station.flowChangePercent > 0 ? '+' : ''}${station.flowChangePercent?.toFixed(1)}% vs previous measurement of ${station.previousFlow?.toLocaleString()} m³/s`,
        `Water stage: ${station.currentWaterLevel?.toFixed(2)}m against Critical threshold of ${station.criticalStage?.toFixed(2)}m`,
        station.isRapidIncrease ? '⚠️ Rapid flow increase detected within the latest hydrological window' : 'Hydrological discharge progressing within steady limits'
      ]
    };
  }
}

export async function evaluateWhatIfScenarioWithAI(
  scenario: WhatIfScenario,
  station: MonitoringStation,
  language: 'en' | 'hi' = 'en'
): Promise<{ assessment: string }> {
  try {
    const response = await fetch('/api/gemini/whatif-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioData: scenario,
        stationData: station,
        language
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return {
      assessment: data.assessment || 'Simulation assessment completed.'
    };
  } catch (error) {
    console.error('Error evaluating what-if scenario:', error);
    return {
      assessment: `### Hypothetical Scenario Evaluation (HYPOTHETICAL SIMULATION ESTIMATE)\n\n` +
        `Simulating a **${scenario.flowDeltaPercent >= 0 ? '+' : ''}${scenario.flowDeltaPercent}%** flow change and **+${scenario.additionalDamDischargeM3s} m³/s** upstream discharge:\n\n` +
        `- **Projected Flow:** ~${scenario.projectedFlow?.toLocaleString()} m³/s (Baseline: ${scenario.baselineFlow?.toLocaleString()} m³/s)\n` +
        `- **Projected River Stage:** ~${scenario.projectedWaterLevel?.toFixed(2)}m (Warning Stage: ${station.warningStage?.toFixed(2)}m, Critical: ${station.criticalStage?.toFixed(2)}m)\n` +
        `- **Projected Risk Score:** Shifts from ${scenario.baselineRiskScore}/100 to **${scenario.projectedRiskScore}/100 (${scenario.projectedRiskLevel})**.\n\n` +
        `*Notice: This is a scenario calculation model for situational decision-support and NOT a real forecast.*`
    };
  }
}
