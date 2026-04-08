"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export interface AddressData {
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  display_name?: string;
}

interface Props {
  value: string;
  onChange: (data: AddressData) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function AddressInput({ value, onChange, placeholder = "Начните вводить адрес...", required, className }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchAddress = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&accept-language=ru`)
        .then((r) => r.json())
        .then((results: NominatimResult[]) => {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        })
        .catch(() => {});
    }, 300);
  }, []);

  const selectSuggestion = useCallback((result: NominatimResult) => {
    const a = result.address;
    const road = a.road || a.pedestrian || "";
    const house = a.house_number || "";
    const address = [road, house].filter(Boolean).join(", ");
    const city = a.city || a.town || a.village || a.state || "";
    const country = a.country || "";

    setQuery(result.display_name);
    setSuggestions([]);
    setShowSuggestions(false);

    onChange({
      address: address || result.display_name,
      city,
      country,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    });
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          required={required}
          className={`pl-8 ${className || ""}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchAddress(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
        />
      </div>
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
              onClick={() => selectSuggestion(s)}
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Reverse-geocode lat/lng into AddressData */
export function reverseGeocode(lat: number, lng: number): Promise<AddressData | null> {
  return fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`)
    .then((r) => r.json())
    .then((data) => {
      if (!data.address) return null;
      const a = data.address;
      const road = a.road || a.pedestrian || "";
      const house = a.house_number || "";
      const address = [road, house].filter(Boolean).join(", ");
      const city = a.city || a.town || a.village || a.state || "";
      const country = a.country || "";
      return {
        address: address || data.display_name,
        city,
        country,
        latitude: lat,
        longitude: lng,
        display_name: data.display_name,
      };
    })
    .catch(() => null);
}
