import SideSection from "../../ui/sidebar/SideSection";
import SideOption from "../../ui/sidebar/SideOption";
import { useMap } from "../../context/MapContext";
import Browser from "../../ui/Browser";
import StepButton from "../../ui/StepButton";
import type { StepProps } from "@/app/types/stepProps";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import { useSidebar } from "../../context/SidebarContext";

export default function MainStep() {
  const { flyToCampus, campusData } = useMap();
  const { setQueryParam } = useSidebar();
  return (
    <ul
      {...StepTagAttributes}
    >
      <Browser />
      <br />
      <SideSection title="Listado de Campus" icon="map">
        {campusData.map((campus) => (
          <SideOption
            key={campus.id_campus}
            title={campus.nombre_campus}
            onClick={() => { setQueryParam('campus', campus.id_campus.toString()) }}
          />
        ))}
      </SideSection>
      <div style={{
        marginTop: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px" // separación entre botones
      }}>
        <StepButton step="SuggestStep" text="Propone un lugar" icon="add_location" />
        <StepButton step="CommentStep" text="Enviar sugerencia" icon="mail" />
      </div>

    </ul>
  );
}
