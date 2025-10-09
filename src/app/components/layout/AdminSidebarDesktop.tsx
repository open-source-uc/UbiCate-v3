import AdminSidebarSteps from "./SidebarSteps/AdminSidebarSteps";

export default function AdminSidebarDesktop(){
  return (
    <aside className="col-lg-3 d-none d-lg-block SidebarDesktop" style={{userSelect: "none", minWidth: "360px"}}>
        <AdminSidebarSteps/>
    </aside>
  );
}
