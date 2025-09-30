"use client";
import AdminTabs from "../places/AdminTabs";

export default function Page() {
  return (
    <div style={{ padding: "24px" }}>
      <h3 className="mobileManageUserTitle">Gestionar Lugares</h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: "20px",
          alignItems: "center",
        }}
      >
        <h3 className="desktopManageUserTitle">Gestionar Lugares</h3>
      </div>

      <AdminTabs />
    </div>
  );
}
