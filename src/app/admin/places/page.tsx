"use client";
import AdminTabs from "../places/AdminTabs";
import AdminPageContainer from "../../components/ui/admin/AdminPageContainer";

export default function Page() {
  return (
    <AdminPageContainer title="Gestionar Lugares">
      <AdminTabs />
    </AdminPageContainer>
  );
}
