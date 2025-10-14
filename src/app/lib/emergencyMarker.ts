import mapboxgl from 'mapbox-gl';

export function createEmergencyMarker(map: mapboxgl.Map, lat: number, lng: number) {
  // Centrar el mapa en la ubicación compartida
  map.flyTo({
    center: [lng, lat],
    zoom: 18,
    essential: true,
    duration: 2000
  });

  // Crear elemento HTML personalizado para el marcador
  const el = document.createElement('div');
  el.className = 'custom-emergency-marker';
  el.setAttribute('data-tippy-content', '<strong style="color: #F7C400;">🚨 Ubicación de Emergencia</strong>');
  el.classList.add('uc-tooltip');
  el.innerHTML = `
    <div style="
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(247, 196, 0, 0.3);
        animation: pulse 2s ease-out infinite;
      "></div>
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        background: #F7C400;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      ">
        <i class="uc-icon" style="
          color: #173F8A;
          font-size: 28px;
          line-height: 1;
        ">person_pin_circle</i>
      </div>
    </div>
  `;

  // Agregar la animación CSS
  if (!document.getElementById('emergency-marker-styles')) {
    const style = document.createElement('style');
    style.id = 'emergency-marker-styles';
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Agregar marcador personalizado
  const marker = new mapboxgl.Marker({ 
    element: el,
    anchor: 'center'
  })
    .setLngLat([lng, lat])
    .setPopup(
      new mapboxgl.Popup({ 
        offset: 30,
        closeButton: true,
        className: 'emergency-popup'
      })
        .setHTML(`
          <div style="padding: 12px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
              <i class="uc-icon" style="color: #F7C400; font-size: 24px;">person_pin_circle</i>
              <strong style="color: #173F8A; font-size: 16px;">Ubicación de Emergencia</strong>
            </div>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>
          </div>
        `)
    )
    .addTo(map);

  // Abrir el popup automáticamente
  marker.togglePopup();
  
  return marker;
}
