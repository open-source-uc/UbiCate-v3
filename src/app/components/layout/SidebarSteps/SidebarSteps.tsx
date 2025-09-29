"use client";

import MainStep from "./MainStep";
import PlacesStep from "./PlacesStep";
import { useEffect, useState } from "react";
import SuggestStep from "./SuggestStep";
import PlaceDetailStep from "./PlaceDetailStep";
import CommentStep from "./CommentStep";
import { useSidebar } from "../../context/SidebarContext";

type SidebarStepsProps = {
  onClose?: () => void; 
};

export default function SidebarSteps({ onClose }: SidebarStepsProps){
    const { step, setQueryParam, clearQueryParams } = useSidebar();
    const [placeData, setPlaceData] = useState();


    useEffect(() => {
        clearQueryParams();
        const h = (e: any) => { setPlaceData(e.detail); setQueryParam("menu", "PlaceDetailStep"); };
        window.addEventListener("place:open-in-sidebar", h as any);
        return () => window.removeEventListener("place:open-in-sidebar", h as any);
    }, []);

    useEffect(() => {
        clearQueryParams();
        const h = (e: any) => setQueryParam("menu", e.detail?.step);
        window.addEventListener("ui:set-step", h as any);
        return () => window.removeEventListener("ui:set-step", h as any);
    }, []);



    switch (step) {
        case "MainStep":
            return <MainStep />;
        case "PlacesStep":
            return <PlacesStep />;
        case "SuggestStep":
            return <SuggestStep />;
        case "PlaceDetailStep":
            return <PlaceDetailStep data={placeData} />;
        case "CommentStep":
            return <CommentStep />;
        default:
            return <MainStep />;
    }
    
}
