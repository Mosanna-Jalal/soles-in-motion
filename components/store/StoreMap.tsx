"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Clock, ExternalLink, MapPin, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { cn } from "@/lib/utils";
import { mapLinks } from "@/lib/maps";

// Free vector tiles (OpenStreetMap data) — no API key, commercial use allowed.
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

const PIN_HTML = `
  <span class="store-pin__ring"></span>
  <span class="store-pin__ring"></span>
  <span class="store-pin__dot">
    <svg viewBox="0 0 64 64" width="22" height="22" aria-hidden="true">
      <path d="M14 40c6 0 10-3 14-8l6-8c3-4 7-6 12-6h4v6h-4c-3 0-5 1-7 4l-6 8c-5 7-11 10-19 10h-4v-6z" fill="#0b0b0c"/>
      <rect x="12" y="46" width="40" height="5" rx="2.5" fill="#0b0b0c"/>
    </svg>
  </span>`;

export default function StoreMap({
  lat,
  lng,
  name,
  address,
  hours,
  className,
  compact = false,
}: {
  lat: number;
  lng: number;
  name: string;
  address: string;
  hours?: string;
  className?: string;
  /** Only show the action buttons (when name/address are already shown next to the map). */
  compact?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { once: true, margin: "200px" });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const links = mapLinks(lat, lng);

  useEffect(() => {
    if (!inView || !container.current) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;
    const timeout = setTimeout(() => !cancelled && !map?.loaded() && setState("error"), 15000);

    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (cancelled || !container.current) return;
        ml.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${ml.getVersion()}`);
        map = new ml.Map({
          container: container.current,
          style: STYLE_URL,
          center: [lng, lat],
          zoom: 12.5,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map.addControl(new ml.NavigationControl({ visualizePitch: true }), "top-right");

        const pin = document.createElement("div");
        pin.className = "store-pin";
        pin.innerHTML = `${PIN_HTML}<span class="store-pin__label"></span>`;
        pin.querySelector(".store-pin__label")!.textContent = name;
        new ml.Marker({ element: pin, anchor: "center" }).setLngLat([lng, lat]).addTo(map);

        map.once("load", () => {
          if (cancelled || !map) return;
          setState("ready");
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          map.flyTo({ center: [lng, lat], zoom: 16.4, pitch: 52, bearing: -18, duration: reduce ? 0 : 3200, essential: true });
        });
      } catch (err) {
        console.warn("[map] unavailable", err);
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      map?.remove();
    };
  }, [inView, lat, lng, name]);

  return (
    <div ref={wrap} className={cn("relative overflow-hidden rounded-[28px] border border-line bg-ink-2", className)}>
      <div ref={container} className={cn("absolute inset-0 transition-opacity duration-1000", state === "ready" ? "opacity-100" : "opacity-0")} />

      <AnimatePresence>
        {state !== "ready" && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#1b1b1e,#0b0b0c)]"
            aria-hidden={state === "loading"}
          >
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{ backgroundImage: "linear-gradient(#2c2c31 1px, transparent 1px), linear-gradient(90deg, #2c2c31 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
            <span className="relative grid h-12 w-12 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-volt/40" />
              <MapPin className="relative h-6 w-6 text-volt" />
            </span>
            {state === "error" && <p className="absolute bottom-6 text-xs text-mist">Map preview unavailable — use the buttons to open it in Google Maps.</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "pointer-events-none absolute",
          compact ? "left-3 top-3 sm:left-5 sm:top-5" : "inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm",
        )}
      >
        {compact ? (
          <div className="pointer-events-auto flex flex-wrap gap-2">
            <a href={links.directions} target="_blank" rel="noreferrer" className="btn-volt px-4 py-2.5 text-xs shadow-2xl">
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
            <a href={links.open} target="_blank" rel="noreferrer" className="btn border border-line bg-ink/85 px-4 py-2.5 text-xs text-bone backdrop-blur-xl hover:bg-bone hover:text-ink">
              Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
        <div className="pointer-events-auto rounded-2xl border border-line bg-ink/85 p-5 shadow-2xl backdrop-blur-xl">
          <p className="eyebrow flex items-center gap-2 text-volt">
            <MapPin className="h-3.5 w-3.5" /> Find us
          </p>
          <p className="display mt-2 text-3xl">{name}</p>
          <p className="mt-1 text-sm text-bone/80">{address}</p>
          {hours && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mist">
              <Clock className="h-3.5 w-3.5" /> {hours}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={links.directions} target="_blank" rel="noreferrer" className="btn-volt px-4 py-2.5 text-xs">
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
            <a href={links.open} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2.5 text-xs">
              Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
