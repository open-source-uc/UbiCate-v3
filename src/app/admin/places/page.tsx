"use client";
import AdminTabs from "../places/AdminTabs";

const PageTitle: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ marginBottom: "2rem", textAlign: "left" }}>
    <h1 style={{ fontSize: "2rem", color: "#0176DE", margin: 0 }}>{title}</h1>
  </div>
);

export default function Page() {
  return (
    <div style={{ padding: "24px" }}>
      <PageTitle title="Gestionar Lugares" />

      <AdminTabs />
    </div>
  );
}
