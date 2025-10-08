"use client"

import { useMap } from "../context/MapContext";

export default function FloatingRouteDetailsButton() {
  const { activeRoute } = useMap();

  if (!activeRoute) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
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
    <a
      href="#"
      onClick={handleClick}
      className="uc-btn btn-secondary floating-route-details-btn"
      title="Ver detalles de la ruta"
      aria-label="Ver detalles de la ruta"
    >
      Ver Detalles de la Ruta
      <i className="uc-icon" style={{ marginLeft: '8px' }}>visibility</i>
      
      <style jsx>{`
        .floating-route-details-btn {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: ${buttonColor} !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .floating-route-details-btn:hover {
          background-color: ${buttonColor} !important;
          opacity: 0.9;
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .floating-route-details-btn:active {
          transform: translateX(-50%) scale(0.98);
        }

        /* Móvil: ajustar posición */
        @media (max-width: 991.98px) {
          .floating-route-details-btn {
            bottom: 16px;
          }
        }
      `}</style>
    </a>
  );
}
