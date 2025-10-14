'use client';

import { Suspense } from "react";
import Footer from "./components/layout/Footer";
import SidebarDesktop from "./components/layout/SidebarDesktop";
import Map from "./components/ui/Map";
import { MapProvider } from "./components/context/MapContext";
import Header from "./components/layout/Header";
import { SidebarProvider } from "./components/context/SidebarContext";
import FloatingRouteDetailsButton from "./components/ui/FloatingRouteDetailsButton";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MapProvider>
          <SidebarProvider>
            <div className="view-container">
              <Header isAdmin={false} />
              <div className="main-area">
                <SidebarDesktop />
                <main className="map-area">
                  <Map />
                  <FloatingRouteDetailsButton />
                </main>
              </div>
            </div>
          </SidebarProvider>
        <Footer />
      </MapProvider>
    </Suspense>
  );
}
