import SidebarSteps from "./SidebarSteps/SidebarSteps";

export default function SidebarDesktop(){

  return (
    <aside className="col-lg-3 d-none d-lg-block SidebarDesktop" style={{userSelect: "none", minWidth: "360px"}}>
        <SidebarSteps/>
    </aside>
  );
}
