import SideSection from "../../ui/sidebar/SideSection";
import SideOption from "../../ui/sidebar/SideOption";
import { useMap } from "../../context/MapContext";
import Browser from "../../ui/Browser";
import StepButton from "../../ui/StepButton";
import type { StepProps } from "@/app/types/stepProps";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import { useSidebar } from "../../context/SidebarContext";


// PlacesStep.tsx
type PlacesStepProps = StepProps & { onClose?: () => void };

export default function PlacesStep() {
  const { currentCampus, placeNames, showPlaces, routes, showRoute } = useMap();
  const { setQueryParam, clearQueryParams, closeSidebar } = useSidebar();

  return (
    <ul {...StepTagAttributes}>
      <Browser />
      <br />
      <button className="uc-btn btn-featured" 
      onClick={()=>clearQueryParams()}
      >
        Campus {currentCampus?.nombre_campus}
        <i className="uc-icon">arrow_back_ios_new</i>
      </button>
      <br />
      <SideSection title="Lugares" icon="map">
        {placeNames.map((placeName) => (
          <SideOption
            key={placeName.id_tipo_lugar}
            title={placeName.nombre_tipo_lugar}
            placeId={placeName.id_tipo_lugar}
            onClick={() => {
              showPlaces(placeName.id_tipo_lugar);
              closeSidebar();                        
            }}
          />
        ))}
      </SideSection>

      <SideSection title="Rutas" icon="map">
        {routes.map((route) => (
          <SideOption
            key={`opción-ruta-${route.id_ruta}`}
            title={route.nombre_ruta}
            routeId={route.id_ruta}
            onClick={() => {
              showRoute(route.id_ruta);
              closeSidebar();                       
            }}
          />
        ))}
      </SideSection>
      <br />
      <div style={{
        marginTop: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px" 
      }}>
        <StepButton step="SuggestStep" text="Propone un lugar" icon="add_location" />
        <StepButton step="CommentStep" text="Enviar sugerencia" icon="mail" />
      </div>
    </ul>
  );
}
