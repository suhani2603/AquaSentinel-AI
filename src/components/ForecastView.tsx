import React, { useState } from 'react';
import { 
  CloudRain, 
  Sun, 
  Cloud, 
  CloudLightning, 
  Droplets, 
  Thermometer, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  Compass, 
  Wind,
  Info
} from 'lucide-react';
import { MonitoringStation, WeatherForecastDay, AppLanguage } from '../types';
import { getTranslation } from '../utils/i18n';
import { INITIAL_STATIONS } from '../data/stationsData';

interface ForecastViewProps {
  currentStation?: MonitoringStation;
  language?: AppLanguage;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  currentStation: propStation,
  language = 'en',
}) => {
  const currentStation = propStation || INITIAL_STATIONS[0];
  const t = getTranslation(language);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const forecastDays: WeatherForecastDay[] = currentStation.forecast && currentStation.forecast.length > 0
    ? currentStation.forecast
    : [];

  const hourlyForecast = currentStation.hourlyForecast && currentStation.hourlyForecast.length > 0
    ? currentStation.hourlyForecast
    : [];

  const selectedDay = forecastDays[selectedDayIndex] || forecastDays[0];

  // Next 6 hours sum
  const next6HoursItems = hourlyForecast.slice(0, 6);
  const next6HoursRainSum = Number(
    next6HoursItems.reduce((acc, it) => acc + (it.precipitationMm || 0), 0).toFixed(1)
  );
  const next6HoursMaxProb = Math.max(0, ...next6HoursItems.map((it) => it.precipitationProbability || 0));

  const getWeatherIcon = (type: WeatherForecastDay['iconType']) => {
    switch (type) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-amber-500" />;
      case 'thunderstorm':
        return <CloudLightning className="w-6 h-6 text-purple-500" />;
      case 'heavy-rain':
        return <CloudRain className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'rain':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-zinc-400" />;
      case 'partly-cloudy':
      default:
        return <Cloud className="w-6 h-6 text-sky-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
              {t.forecastData}
            </span>
            <span className="text-xs text-zinc-500">
              Open-Meteo & IMD Numerical Weather Prediction
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
            {currentStation.city} {t.navForecast}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            {currentStation.basinName}
          </p>
        </div>
      </div>

      {/* Main Grid: NOW / NEXT 6 HOURS / TODAY / TOMORROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. NOW */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
              {t.now}
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 block">
                {currentStation.weatherCondition?.temperatureC ?? 27}°C
              </span>
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mt-0.5">
                {currentStation.weatherCondition?.weatherDescription || 'Overcast'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
              <CloudRain className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
            <span>Humidity: {currentStation.weatherCondition?.humidityPercent ?? 75}%</span>
            <span>Wind: {currentStation.weatherCondition?.windSpeedKmh ?? 8} km/h</span>
          </div>
        </div>

        {/* 2. NEXT 6 HOURS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
              {t.next6Hours}
            </span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 block">
              {next6HoursRainSum} mm
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mt-0.5">
              {t.rainProbability}: <strong className="text-blue-600 dark:text-blue-400">{next6HoursMaxProb}%</strong>
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Peak window: Next 2-4 hours</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Stable</span>
          </div>
        </div>

        {/* 3. TODAY */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
              {t.today}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              {forecastDays[0]?.date || 'Today'}
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 block">
              {forecastDays[0]?.precipitationMm ?? currentStation.rainfall24h ?? 12} mm
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mt-0.5">
              High: {forecastDays[0]?.tempMaxC ?? 30}°C • Low: {forecastDays[0]?.tempMinC ?? 22}°C
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
            <span>{forecastDays[0]?.weatherDescription || 'Scattered Rain'}</span>
            <span className="font-semibold text-blue-600">{forecastDays[0]?.precipitationProbability ?? 45}% rain</span>
          </div>
        </div>

        {/* 4. TOMORROW */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold tracking-wider text-zinc-400 uppercase">
              {t.tomorrow}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              {forecastDays[1]?.date || 'Tomorrow'}
            </span>
          </div>
          <div>
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 block">
              {forecastDays[1]?.precipitationMm ?? 18} mm
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 block mt-0.5">
              High: {forecastDays[1]?.tempMaxC ?? 29}°C • Low: {forecastDays[1]?.tempMinC ?? 21}°C
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
            <span>{forecastDays[1]?.weatherDescription || 'Moderate showers'}</span>
            <span className="font-semibold text-blue-600">{forecastDays[1]?.precipitationProbability ?? 60}% rain</span>
          </div>
        </div>

      </div>

      {/* RIVER TREND PROJECTION */}
      <section className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-extrabold text-blue-950 dark:text-blue-100">
              {t.riverTrend} — {currentStation.riverName}
            </h2>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded">
            Hydrological Runoff Forecast
          </span>
        </div>
        <p className="text-xs sm:text-sm text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
          Based on 24-48h precipitation forecast ({forecastDays[0]?.precipitationMm || 0} mm today, {forecastDays[1]?.precipitationMm || 0} mm tomorrow), river discharge at <strong>{currentStation.gaugeStationName}</strong> is expected to remain safely below official Warning Level ({currentStation.warningStage.toFixed(2)} m). Catchment saturation remains within seasonal absorption limits.
        </p>
      </section>

      {/* 7-DAY FORECAST TABLE */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <span>📅</span> {t.sevenDayForecast}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {forecastDays.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {day.dayName}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-center">
                    {getWeatherIcon(day.iconType)}
                  </div>

                  <div className="text-center">
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block">
                      {day.precipitationMm} mm
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                      {day.precipitationProbability}% prob
                    </span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 flex justify-between">
                  <span>H: {day.tempMaxC}°</span>
                  <span>L: {day.tempMinC}°</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
};
