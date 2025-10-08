"use client"

import { useMap } from "../context/MapContext";

export default function FloatingRouteDetailsButton() {
  const { activeRoute } = useMap();

  if (!activeRoute) {
    return null;
  }

  const handleClick = () => {
    // Dispatch custom event to open route details in sidebar
    const event = new CustomEvent("route:open-in-sidebar", {
      detail: {
        routeId: activeRoute.id_ruta,
        route: activeRoute,
      },
    });
    window.dispatchEvent(event);
    
    // Dispatch sidebar:open event to open mobile sidebar
    window.dispatchEvent(new Event("sidebar:open"));
  };

  const buttonColor = activeRoute.color_icono || "#2563eb";

  return (
    <button
      onClick={handleClick}
      className="floating-route-details-btn"
      title="Ver detalles de la ruta"
      aria-label="Ver detalles de la ruta"
    >
      <span className="material-icons">info</span>
      
      <style jsx>{`
        .floating-route-details-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: ${buttonColor};
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .floating-route-details-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .floating-route-details-btn:active {
          transform: scale(0.95);
        }

        /* Móvil: ajustar posición */
        @media (max-width: 991.98px) {
          .floating-route-details-btn {
            top: 16px;
            right: 16px;
          }
        }
      `}</style>
    </button>
  );
}
