"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProposedPlacesTab from "./ProposedPlacesTab";
import ApprovedPlacesTab from "./ApprovedPlacesTab";

const TABS = [
  { label: "Lugares Propuestos", value: "tab-01" },
  { label: "Lugares Aprobados", value: "tab-02" },
];

export default function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "tab-01"; // Default to 'tab-01'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Esto permite sincronizar el select con los botones
  useEffect(() => {
    const links = document.querySelectorAll("[data-tabtarget]");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const value = (e.target as HTMLElement).getAttribute("data-tabtarget");
        if (value) setActiveTab(value);
      });
    });
  }, []);

  useEffect(() => {
    // Update the URL when the activeTab changes
    router.push(`/admin/places?tab=${activeTab}`);
  }, [activeTab, router]);

  useEffect(() => {
    // Sync the activeTab with the URL parameter on mount
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="uc-tabpanel" data-tabpanel>
      {/* Tabs para móviles */}
      <div className="uc-card card-bg--gray card-radius--none card-border--none d-block d-lg-none mb-32">
        <div className="uc-card_body">
          <label htmlFor="tabSelect">
            <strong>Seleccione tab</strong>
          </label>
          <select
            id="tabSelect"
            className="uc-input-style"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {TABS.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs para escritorio */}
      <ul className="uc-tabs d-none d-lg-flex">
        {TABS.map((tab) => (
          <li className="uc-tabs_item" key={tab.value}>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                className={`uc-tabs_item-link ${
                  activeTab === tab.value ? "is-active" : ""
                }`}
                data-tabtarget={tab.value}
              >
                {tab.label}
              </a>
          </li>
        ))}
      </ul>

      <div className="uc-tab-body" style={{ marginTop: "24px" }}>
        {activeTab === "tab-01" && <ProposedPlacesTab />}
        {activeTab === "tab-02" && <ApprovedPlacesTab />}
      </div>
    </div>
  );
}
