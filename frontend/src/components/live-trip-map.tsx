"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  bus: LatLng | null;
  origin: LatLng | null;
  destination: LatLng | null;
  originLabel?: string;
  destinationLabel?: string;
  fresh?: boolean;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const MAP_ATTRIBUTION = '&copy; OpenStreetMap';

// Fallback: center of Turkey
const TURKEY_CENTER: LatLng = { lat: 39.0, lng: 35.0 };

declare global {
  interface Window {
    L: any;
  }
}

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('SSR');
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject('load-failed');
    document.body.appendChild(script);
  });
}

export function LiveTripMap({ bus, origin, destination, originLabel, destinationLabel, fresh }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ bus?: any; origin?: any; destination?: any; route?: any }>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const center = bus || origin || TURKEY_CENTER;
        const map = L.map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: bus ? 10 : 6,
          scrollWheelZoom: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: MAP_ATTRIBUTION,
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when coords change
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || status !== 'ready') return;

    const marks = markersRef.current;

    // Origin marker (green)
    if (origin && !marks.origin) {
      marks.origin = L.marker([origin.lat, origin.lng], {
        icon: L.divIcon({
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
      if (originLabel) marks.origin.bindTooltip(`<strong>Kalkış:</strong> ${originLabel}`);
    }

    // Destination marker (red)
    if (destination && !marks.destination) {
      marks.destination = L.marker([destination.lat, destination.lng], {
        icon: L.divIcon({
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
      if (destinationLabel) marks.destination.bindTooltip(`<strong>Varış:</strong> ${destinationLabel}`);
    }

    // Polyline origin → destination
    if (origin && destination && !marks.route) {
      marks.route = L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: '#6366f1', weight: 3, opacity: 0.5, dashArray: '6, 8' }
      ).addTo(map);
    }

    // Bus marker (indigo with pulse)
    if (bus) {
      const busIcon = L.divIcon({
        html: `<div style="position:relative;width:40px;height:40px;">
                 <div style="position:absolute;inset:0;border-radius:50%;background:${fresh ? '#6366f1' : '#94a3b8'};opacity:0.3;animation:${fresh ? 'livePulse 2s ease-out infinite' : 'none'}"></div>
                 <div style="position:absolute;inset:8px;border-radius:50%;background:${fresh ? '#6366f1' : '#64748b'};border:3px solid white;box-shadow:0 4px 12px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px">🚌</div>
               </div>
               <style>@keyframes livePulse{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.5);opacity:0}}</style>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (marks.bus) {
        marks.bus.setLatLng([bus.lat, bus.lng]);
        marks.bus.setIcon(busIcon);
      } else {
        marks.bus = L.marker([bus.lat, bus.lng], { icon: busIcon }).addTo(map);
      }
    }

    // Fit bounds if we have endpoints
    if (origin && destination) {
      const points = [origin, destination];
      if (bus) points.push(bus);
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    } else if (bus) {
      map.setView([bus.lat, bus.lng], 13);
    }
  }, [bus, origin, destination, originLabel, destinationLabel, fresh, status]);

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Harita yükleniyor</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <MapPin className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Harita yüklenemedi. İnternet bağlantını kontrol et.</p>
          </div>
        </div>
      )}

      {/* Status badge */}
      {status === 'ready' && (
        <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 shadow-sm">
          <span className={`w-2 h-2 rounded-full ${fresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-zinc-300">
            {bus ? (fresh ? 'Canlı' : 'Son Konum') : 'Henüz Konum Yok'}
          </span>
        </div>
      )}

      {/* Re-center button */}
      {status === 'ready' && bus && (
        <button
          onClick={() => mapRef.current?.setView([bus.lat, bus.lng], 13)}
          aria-label="Otobüse odaklan"
          className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Navigation className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}
    </div>
  );
}
