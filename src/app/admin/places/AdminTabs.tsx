"use client";
import AdminTabs from "../../components/ui/admin/AdminTabs";
import ProposedPlacesTab from "./ProposedPlacesTab";
import ApprovedPlacesTab from "./ApprovedPlacesTab";

const PLACE_TABS = [
  { 
    label: "Lugares Propuestos", 
    value: "tab-01", 
    component: <ProposedPlacesTab /> 
  },
  { 
    label: "Lugares Aprobados", 
    value: "tab-02", 
    component: <ApprovedPlacesTab /> 
  },
];

export default function PlaceAdminTabs() {
  return (
    <AdminTabs 
      tabs={PLACE_TABS}
      defaultTab="tab-01"
      basePath="/admin/places"
    />
  );
}
