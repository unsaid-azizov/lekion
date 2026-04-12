"use client";

import { useEffect, useRef } from "react";
import type { MapPins } from "@/types";
import type L from "leaflet";

interface Props {
  pins: MapPins;
  onBoundsChange: (bounds: { south: number; west: number; north: number; east: number }) => void;
}

const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

export function MapContainer({ pins, onBoundsChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const iconsRef = useRef<{ person: L.DivIcon; business: L.DivIcon } | null>(null);

  const notifyBounds = (map: L.Map) => {
    const b = map.getBounds();
    onBoundsChange({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    });
  };

  // Watch theme changes and swap tiles
  useEffect(() => {
    const update = () => {
      if (!mapRef.current || !tileRef.current) return;
      const isDark = document.documentElement.classList.contains("dark");
      tileRef.current.setUrl(isDark ? TILES.dark : TILES.light);
    };

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      iconsRef.current = {
        person: L.divIcon({
          className: "",
          html: '<div style="width:10px;height:10px;background:#c8a55a;border-radius:50%;border:2px solid rgba(200,165,90,0.3);box-shadow:0 0 8px rgba(200,165,90,0.5)"></div>',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
        business: L.divIcon({
          className: "",
          html: '<div style="width:12px;height:12px;background:#d4a849;border-radius:50%;border:2px solid rgba(212,168,73,0.3);box-shadow:0 0 10px rgba(212,168,73,0.6)"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      };

      const MC = (await import("leaflet.markercluster")).default;
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false }).setView([55.75, 37.62], 10);
      const isDark = document.documentElement.classList.contains("dark");

      const tile = L.tileLayer(isDark ? TILES.dark : TILES.light, { maxZoom: 19 }).addTo(map);

      tileRef.current = tile;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      layerRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      }) as L.LayerGroup;
      map.addLayer(layerRef.current);
      mapRef.current = map;

      map.on("moveend", () => notifyBounds(map));
      notifyBounds(map);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current || !iconsRef.current) return;
    layerRef.current.clearLayers();

    (async () => {
      const L = (await import("leaflet")).default;

      for (const p of pins.people) {
        L.marker([p.lat, p.lng], { icon: iconsRef.current!.person })
          .bindPopup(`<b>${p.name}</b><br/>${p.profession || ""}`)
          .addTo(layerRef.current!);
      }

      for (const b of pins.businesses) {
        L.marker([b.lat, b.lng], { icon: iconsRef.current!.business })
          .bindPopup(`<b>${b.name}</b><br/>Rating: ${b.average_rating}`)
          .addTo(layerRef.current!);
      }
    })();
  }, [pins]);

  return <div ref={containerRef} className="w-full h-full" />;
}
