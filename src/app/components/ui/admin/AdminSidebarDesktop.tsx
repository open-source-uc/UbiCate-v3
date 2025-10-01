import SideSection from "../sidebar/SideSection";
import SideOption from "../sidebar/SideOption";

export default function AdminSidebarDesktop(){
    return (
         <aside className="col-lg-3 d-none d-lg-block SidebarDesktop" style={{userSelect: "none"}}>
            <ul
              className="nav uc-navbar-side uc-navbar-side-fit py-40"
              suppressHydrationWarning
              style={{ overflowY: "scroll", padding: "20px 10px"}}
            >

                <SideSection title="Gestión" icon="settings">
                  <SideOption title="Gestionar Usuarios" href="/admin/users"/>
                  <SideOption title="Gestionar Lugares" href="/admin/places"/>
                  <SideOption title="Gestionar Tipos de Lugares" href="/admin/places/tipos"/>
              </SideSection>

            </ul>
          </aside>
    );
}