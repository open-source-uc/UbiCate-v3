import AdminPageContainer from "../../components/ui/admin/AdminPageContainer";
import RouteAdminTabs from "./AdminRouteTabs";

export default function RoutesPage() {
  return (
    <AdminPageContainer 
      title="Gestión de Rutas"
      actionButton={
        <a
          href="/admin/routes/add"
          className="uc-btn btn-secondary btn-sm"
          style={{ transform: "scale(0.9)" }}
        >
          <span style={{ paddingRight: "10px", whiteSpace: "nowrap" }}>
            Agregar Ruta
          </span>
          <i className="uc-icon">add</i>
        </a>
      }
    >
      <RouteAdminTabs />
    </AdminPageContainer>
  );
}
