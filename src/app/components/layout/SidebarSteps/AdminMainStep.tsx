import SideSection from "../../ui/sidebar/SideSection";
import SideOption from "../../ui/sidebar/SideOption";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";

type AdminMainStepProps = {
  onClose?: () => void;
};

export default function AdminMainStep({ onClose }: AdminMainStepProps) {
  return (
    <ul
      {...StepTagAttributes}
    >
      <SideSection title="Gestión" icon="settings">
        <SideOption title="Gestionar Usuarios" href="/admin/users" onClick={onClose} icon="group" iconColor="#0176DE"/>
        <SideOption title="Gestionar Lugares" href="/admin/places" onClick={onClose} icon="place" iconColor="#0176DE"/>
        <SideOption title="Gestionar Tipos de Lugares" href="/admin/places/tipos" onClick={onClose} icon="category" iconColor="#0176DE"/>
        <SideOption title="Gestionar Rutas" href="/admin/routes" onClick={onClose} icon="route" iconColor="#0176DE"/>
      </SideSection>
      <SideSection title="Auditoría" icon="history">
        <SideOption title="Historial de Cambios de Lugares" href="/admin/historico/places" onClick={onClose} icon="timeline" iconColor="#0176DE"/>
        <SideOption title="Historial de Cambios de Rutas" href="/admin/historico/routes" onClick={onClose} icon="timeline" iconColor="#0176DE"/>
      </SideSection>
    </ul>
  );
}
