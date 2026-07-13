'use client';

import { useEffect, useMemo, useState } from 'react';
import { CloudSun, Droplets, RefreshCw, Sun, ThermometerSun, Wind } from 'lucide-react';

type WeatherState = {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  updatedAt: number;
};

const cacheKey = 'edrive-admin-weather-dubai';
const cacheMinutes = 10;

function round(value: number) {
  return Math.round(Number(value || 0));
}

function formatTime(value: number) {
  if (!value) return 'Live';
  return new Intl.DateTimeFormat('en-AE', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function readCachedWeather() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherState;
    if (!parsed?.updatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedWeather(value: WeatherState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // Ignore browser storage limits.
  }
}

export function LiveWeatherPill() {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState('');

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  async function loadWeather(force = false) {
    const cached = readCachedWeather();
    const isFresh = cached && Date.now() - cached.updatedAt < cacheMinutes * 60 * 1000;
    if (cached && (!force || isFresh)) {
      setWeather(cached);
      setLoading(false);
      if (isFresh) return;
    }

    if (!apiKey) {
      if (cached) {
        setWeather(cached);
        setIssue('');
      } else {
        setIssue('Weather unavailable');
      }
      setLoading(false);
      return;
    }

    try {
      setIssue('');
      const params = new URLSearchParams({ q: 'Dubai,AE', units: 'metric', appid: apiKey });
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Weather unavailable');
      const data = await response.json();
      const nextWeather: WeatherState = {
        temp: Number(data?.main?.temp || 0),
        feelsLike: Number(data?.main?.feels_like || 0),
        humidity: Number(data?.main?.humidity || 0),
        windSpeed: Number(data?.wind?.speed || 0),
        condition: String(data?.weather?.[0]?.main || 'Dubai'),
        updatedAt: Date.now()
      };
      setWeather(nextWeather);
      writeCachedWeather(nextWeather);
    } catch {
      if (cached) {
        setWeather(cached);
        setIssue('');
      } else {
        setIssue('Weather unavailable');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather();
    const interval = window.setInterval(() => loadWeather(true), cacheMinutes * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const subtitle = useMemo(() => {
    if (loading) return 'Loading live weather';
    if (issue) return issue;
    if (!weather) return 'Dubai live weather';
    return `${weather.condition} · Feels ${round(weather.feelsLike)}°C · ${round(weather.windSpeed * 3.6)} km/h · ${round(weather.humidity)}%`;
  }, [issue, loading, weather]);

  return (
    <button
      type="button"
      onClick={() => loadWeather(true)}
      className="hidden min-w-[15rem] items-center gap-2 rounded-2xl border border-white/80 bg-white/92 px-3 py-1.5 text-left text-xs text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(8,37,50,0.05)] transition hover:-translate-y-0.5 hover:text-primary-900 xl:flex"
      title="Refresh Dubai weather"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF6DF] text-gold-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_6px_14px_rgba(194,139,42,0.16)]">
        {loading ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : weather ? <ThermometerSun className="size-4" aria-hidden="true" /> : <CloudSun className="size-4" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 font-bold text-foreground">
          Dubai
          {weather ? <span className="text-gold-deep">{round(weather.temp)}°C</span> : <Sun className="size-3.5 text-gold" aria-hidden="true" />}
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground">{weather ? formatTime(weather.updatedAt) : 'Live'}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate">
          {weather ? <><Wind className="size-3" aria-hidden="true" /><Droplets className="ml-1 size-3" aria-hidden="true" /></> : null}
          <span className="truncate">{subtitle}</span>
        </p>
      </div>
    </button>
  );
}
