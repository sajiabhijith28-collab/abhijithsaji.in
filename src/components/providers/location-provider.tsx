"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { haversineKm } from "@/lib/utils";

export interface CityCoordinate {
  city: string;
  latitude: number;
  longitude: number;
}

const SUPPORTED_CITY_COORDS: CityCoordinate[] = [
  { city: "Ponkunnam", latitude: 9.5662, longitude: 76.7628 },
];

interface LocationContextValue {
  city: string;
  setCity: (city: string) => void;
  detectLocation: () => void;
  isDetecting: boolean;
  availableCities: string[];
}

const LocationContext = createContext<LocationContextValue>({
  city: "Ponkunnam",
  setCity: () => {},
  detectLocation: () => {},
  isDetecting: false,
  availableCities: SUPPORTED_CITY_COORDS.map((c) => c.city),
});

export function LocationProvider({
  children,
  initialCities,
}: {
  children: React.ReactNode;
  initialCities?: string[];
}) {
  const cities =
    initialCities && initialCities.length > 0
      ? initialCities
      : SUPPORTED_CITY_COORDS.map((c) => c.city);

  const [city, setCityState] = useState<string>(cities[0] || "Ponkunnam");
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mydr_selected_city");
      if (saved && cities.includes(saved)) {
        setCityState(saved);
      } else {
        const fallback = cities[0] || "Ponkunnam";
        setCityState(fallback);
        window.localStorage.setItem("mydr_selected_city", fallback);
      }
    } catch {
      // ignore storage errors
    }
  }, [cities]);

  const setCity = (next: string) => {
    setCityState(next);
    try {
      window.localStorage.setItem("mydr_selected_city", next);
    } catch {
      // ignore
    }
  };

  const detectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(
        "Browser geolocation is not supported. Location set to Ponkunnam, Kerala."
      );
      setCity("Ponkunnam");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest = SUPPORTED_CITY_COORDS[0];
        let minDistance = Infinity;
        for (const item of SUPPORTED_CITY_COORDS) {
          const dist = haversineKm(
            latitude,
            longitude,
            item.latitude,
            item.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = item;
          }
        }
        setCity(nearest.city);
        setIsDetecting(false);
        if (minDistance <= 35) {
          toast.success(`GPS verified near ${nearest.city}, Kerala`);
        } else {
          toast.info(
            `My Dr exclusively serves Ponkunnam, Kerala — showing ${nearest.city} clinics.`
          );
        }
      },
      () => {
        setIsDetecting(false);
        setCity("Ponkunnam");
        toast.info("Location set to Ponkunnam, Kerala.");
      },
      { timeout: 7000 }
    );
  };

  return (
    <LocationContext.Provider
      value={{
        city,
        setCity,
        detectLocation,
        isDetecting,
        availableCities: cities,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}

