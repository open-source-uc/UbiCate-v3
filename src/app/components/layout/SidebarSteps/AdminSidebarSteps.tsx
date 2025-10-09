"use client";

import AdminMainStep from "./AdminMainStep";
import { useEffect, useState } from "react";

type AdminSidebarStepsProps = {
  onClose?: () => void; 
};

export default function AdminSidebarSteps({ onClose }: AdminSidebarStepsProps){
    const [step, setStep] = useState("AdminMainStep");

    useEffect(() => {
        const h = (e: any) => setStep(e.detail?.step || "AdminMainStep");
        window.addEventListener("admin:set-step", h as any);
        return () => window.removeEventListener("admin:set-step", h as any);
    }, []);

    switch (step) {
        case "AdminMainStep":
            return <AdminMainStep onClose={onClose} />;
        default:
            return <AdminMainStep onClose={onClose} />;
    }
    
}
