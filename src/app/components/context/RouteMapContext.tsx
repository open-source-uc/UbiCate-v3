"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { FeatureCollection } from "geojson";

interface RouteMapContextType {
  routeGeojson: FeatureCollection | null;
  placesGeojson: FeatureCollection[];
}

const RouteMapContext = createContext<RouteMapContextType | undefined>(undefined);

export const useRouteMapContext = () => {
  const context = useContext(RouteMapContext);
  if (context === undefined) {
    throw new Error("useRouteMapContext must be used within a RouteMapProvider");
  }
  return context;
};

interface RouteMapProviderProps {
  children: ReactNode;
  routeGeojson: FeatureCollection | null;
  placesGeojson?: FeatureCollection[];
}

export const RouteMapProvider: React.FC<RouteMapProviderProps> = ({ 
  children, 
  routeGeojson, 
  placesGeojson = [] 
}) => {
  const value = {
    routeGeojson,
    placesGeojson
  };

  return (
    <RouteMapContext.Provider value={value}>
      {children}
    </RouteMapContext.Provider>
  );
};