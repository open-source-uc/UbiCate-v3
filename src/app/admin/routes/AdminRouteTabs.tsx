"use client";
import AdminTabs from "../../components/ui/admin/AdminTabs";
import PendingRoutesTab from "./PendingRoutesTab";
import PublishedRoutesTab from "./PublishedRoutesTab";

const ROUTE_TABS = [
  { 
    label: "Rutas Ocultas", 
    value: "tab-01", 
    component: <PendingRoutesTab /> 
  },
  { 
    label: "Rutas Publicadas", 
    value: "tab-02", 
    component: <PublishedRoutesTab /> 
  },
];

export default function RouteAdminTabs() {
  return (
    <AdminTabs 
      tabs={ROUTE_TABS}
      defaultTab="tab-01"
      basePath="/admin/routes"
    />
  );
}