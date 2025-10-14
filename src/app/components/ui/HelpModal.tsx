'use client';

import { useState, useEffect } from 'react';

export default function HelpModal(){
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleShareLocation = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setSharing(true);

    try {
      // Obtener ubicación actual del usuario
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Generar URL de compartir (directamente en la raíz)
          const shareUrl = `${window.location.origin}/?lat=${latitude}&lng=${longitude}`;
          const message = `🚨 EMERGENCIA - Estoy en esta ubicación en el campus UC:\n${shareUrl}`;
          
          // Intentar usar Web Share API (funciona en móviles)
          if (navigator.share) {
            try {
              await navigator.share({
                title: 'Ubicación de Emergencia UC',
                text: message,
                url: shareUrl
              });
            } catch {
              // Usuario canceló el compartir
            }
          } else {
            // Fallback: copiar al portapapeles
            await navigator.clipboard.writeText(shareUrl);
            alert('✅ Enlace copiado al portapapeles:\n' + shareUrl);
          }
          setSharing(false);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('❌ No se pudo obtener tu ubicación. Verifica los permisos de ubicación.');
          setSharing(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('❌ Error al compartir ubicación');
      setSharing(false);
    }
  };

  return (
    <>
      {/* Trigger button - floating in bottom-right */}
      <button
        type="button"
        className="uc-btn btn-inline"
        
        
      >
        <i aria-expanded={open}
        aria-controls="modalHelp"
        style={{    
          right: 24,
          bottom: 80,
          display: 'inline-flex',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          fontSize: 25,
        }} onClick={() => setOpen(true)} className="uc-icon icon-shape--rounded">warning</i>
      </button>

      {/* Modal markup - follows example structure but controlled by React */}
      {open && (
        <div
          className="uc-modal"
          role="dialog"
          aria-modal="true"
          id="modalHelp"
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1080, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
        >
          <div
            className="uc-modal_content uc-message"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '96%', display: 'inline-block', borderRadius: 12, overflow: 'hidden' }}
          >
            <div style={{ position: 'relative', background: '#fff' }}>
              <button className="uc-message_close-button" data-mclosed onClick={() => setOpen(false)} style={{ position: 'absolute', right: 12, top: 12, zIndex: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <i className="uc-icon">close</i>
              </button>
              <br />
              <div className="uc-message_body" style={{ padding: 28, textAlign: 'center' }}>
                <h1 style={{ marginTop: 0, fontSize: 18 }}>En caso de emergencia en el campus,<br></br> comuníquese al siguiente número:</h1>
                <br />

                <div style={{ display: 'inline-block', backgroundColor: '#F7C400', borderRadius: 12, padding: '32px 20px', marginBottom: 18, textAlign: 'center', boxSizing: 'border-box' }}>
                  <a href="tel:+56955045000" style={{ color: '#0176DE', fontSize: 30, fontWeight: 800, textDecoration: 'underline', lineHeight: 1, display: 'inline-block' }}>+56 9 5504 5000</a>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <a
                    href="#"
                    className="uc-btn btn-secondary"
                    onClick={handleShareLocation}
                    style={{ display: 'inline-flex', width: 'auto', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', height: 36, fontSize: 14, gap: 8 }}
                  >
                    <span style={{ lineHeight: 1 }}>
                      {sharing ? 'Obteniendo ubicación...' : 'Compartir mi ubicación'}
                    </span>
                    <i className="uc-icon" style={{ marginLeft: 4, fontSize: 18 }}>
                      {sharing ? 'hourglass_empty' : 'person_pin_circle'}
                    </i>
                  </a>
                </div>
                <br />

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
