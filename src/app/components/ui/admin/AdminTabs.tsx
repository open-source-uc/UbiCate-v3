"use client";
import { useState, useEffect, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = {
  label: string;
  value: string;
  component: ReactNode;
};

type AdminTabsProps = {
  tabs: Tab[];
  defaultTab?: string;
  basePath: string; // Para construir la URL correcta
};

export default function AdminTabs({ tabs, defaultTab, basePath }: AdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || defaultTab || tabs[0]?.value || "tab-01";
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
    router.push(`${basePath}?tab=${activeTab}`);
  }, [activeTab, router, basePath]);

  useEffect(() => {
    // Sync the activeTab with the URL parameter on mount
    setActiveTab(initialTab);
  }, [initialTab]);

  // Encontrar el componente del tab activo
  const activeTabComponent = tabs.find(tab => tab.value === activeTab)?.component;

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
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs para escritorio */}
      <ul className="uc-tabs d-none d-lg-flex">
        {tabs.map((tab) => (
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
        {activeTabComponent}
      </div>
    </div>
  );
}