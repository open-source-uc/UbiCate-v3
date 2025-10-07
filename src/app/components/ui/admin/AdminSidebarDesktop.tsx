'use client';

import SideSection from "../sidebar/SideSection";
import SideOption from "../sidebar/SideOption";

export default function AdminSidebarDesktop(){
    return (
         <aside className="col-lg-3 d-none d-lg-block SidebarDesktop" style={{userSelect: "none", minWidth: "360px"}}>
            <ul
              className="nav uc-navbar-side uc-navbar-side-fit py-40"
              suppressHydrationWarning
              style={{ 
                overflowY: "auto", 
                padding: "20px 10px",
                display: "flex",
                flexDirection: "column"
              }}
            >
                <SideSection title="Gestión" icon="settings">
                  <SideOption title="Gestionar Usuarios" href="/admin/users" icon="group" iconColor="#0176DE"/>
                  <SideOption title="Gestionar Lugares" href="/admin/places" icon="place" iconColor="#0176DE"/>
                  <SideOption title="Gestionar Tipos de Lugares" href="/admin/places/tipos" icon="category" iconColor="#0176DE"/>
                  <SideOption title="Gestionar Rutas" href="/admin/routes" icon="route" iconColor="#0176DE"/>
              </SideSection>
              <SideSection title="Auditoría" icon="history">
                <SideOption title="Historial de Cambios de Lugares" href="/admin/historico/places" icon="timeline" iconColor="#0176DE"/>
                <SideOption title="Historial de Cambios de Rutas" href="/admin/historico/routes" icon="timeline" iconColor="#0176DE"/>
              </SideSection>
            </ul>
          </aside>
    );
}