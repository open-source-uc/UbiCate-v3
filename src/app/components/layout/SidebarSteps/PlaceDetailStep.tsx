'use client';

import type { StepProps } from "@/app/types/stepProps";
import type { FeatureCollection } from "geojson";
import { StepTagAttributes } from "@/app/types/stepTagAttributes";
import { useState, useEffect } from "react";
import type { Place, Image as ImageType } from "@/app/types/placeType";
import { marked } from "marked";
import { useSidebar } from "../../context/SidebarContext";

import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import NextImage from "next/image";

type PlaceWithGeo = Place & {
  featureCollection?: FeatureCollection;
  geojson?: unknown;
  images: ImageType[];
};

type SizedImage = ImageType & { width?: number; height?: number };

// Calcula tamaño real de una imagen base64 (solo en browser)
function getImageSize(base64: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1200, h: 800 }); // fallback
    img.src = base64; // usa el base64 completo tal como viene
  });
}


export default function PlaceDetailStep({ data }: StepProps) {
  const [place, setPlace] = useState<PlaceWithGeo | null>(null);
  const [sized, setSized] = useState<SizedImage[] | null>(null);
  const [sharing, setSharing] = useState(false);
  const { clearQueryParams } = useSidebar();

  useEffect(() => {
    if (!data?.placeId) return;
    const pid = String(data.placeId);
    setPlace(null);
    fetch(`/api/places/${pid}`)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar el lugar');
        return res.json();
      })
      .then(data => {
        setPlace(data);
      })
      .catch(() => {
        setPlace(null);
      });
  }, [data?.placeId]);

  // Calcula tamaños reales
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!place?.images?.length) {
        setSized(null);
        return;
      }
      const results = await Promise.all(
        place.images
          .filter(img => !!img.binario)
          .map(async img => {
            try {
              const { w, h } = await getImageSize(img.binario as string);
              return { ...img, width: w, height: h } as SizedImage;
            } catch {
              return { ...img, width: 1200, height: 800 } as SizedImage;
            }
          })
      );
      if (!cancelled) setSized(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [place?.images]);

  // Inicializa PhotoSwipe + UI (bullets + caption)
  useEffect(() => {
    if (!sized?.length) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: ".uc-gallery",
      children: "a",
      pswpModule: () => import("photoswipe"),
    });

    lightbox.on("uiRegister", () => {
      const pswp = lightbox.pswp as any;
      if (!pswp || !pswp.ui || typeof pswp.ui.registerElement !== "function") return;

      const ui = pswp.ui as any;

      // Bullets indicator
      ui.registerElement({
        name: "bulletsIndicator",
        className: "pswp__bullets-indicator",
        appendTo: "wrapper",
        onInit: (el: HTMLElement, instance: any) => {
          const bullets: HTMLDivElement[] = [];
          let active = -1;

          for (let i = 0; i < instance.getNumItems(); i++) {
            const b = document.createElement("div");
            b.className = "pswp__bullet";
            b.onclick = () => instance.goTo(bullets.indexOf(b));
            el.appendChild(b);
            bullets.push(b);
          }

          instance.on("change", () => {
            if (active >= 0) bullets[active].classList.remove("pswp__bullet--active");
            bullets[instance.currIndex].classList.add("pswp__bullet--active");
            active = instance.currIndex;
          });
        },
      });

      // Caption centrado (usa title/alt del <img>)
      ui.registerElement({
        name: "customCaption",
        order: 9,
        isButton: false,
        appendTo: "root",
        className: "pswp__custom-caption",
        html: "",
        onInit: (el: HTMLElement, instance: any) => {
          const update = () => {
            const slideEl = instance.currSlide?.data?.element as Element | null;
            let txt = "";
            if (slideEl) {
              const img = slideEl.querySelector("img");
              txt = img?.getAttribute("title") || img?.getAttribute("alt") || "";
            }
            if (txt) {
              el.classList.remove("hidden-caption-content");
              el.innerHTML = txt;
            } else {
              el.classList.add("hidden-caption-content");
              el.innerHTML = "";
            }
          };
          instance.on("afterInit", update);
          instance.on("change", update);
        },
      });
    });

    lightbox.init();
    return () => lightbox.destroy();
  }, [sized]);

  if (!place) {
    return <ul {...StepTagAttributes}>cargando…</ul>;
  }

  function handleStepBack() {
    data?.__removePlacePolygon?.();
    clearQueryParams();
  }

  async function handleSharePlace(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    
    if (!place) return;
    
    setSharing(true);

    try {
      // Generar URL con el placeId para abrir el lugar completo
      const shareUrl = `${window.location.origin}/?menu=PlaceDetailStep&placeId=${place.id_lugar}`;
      const message = `📍 ${place.nombre_lugar} - ${place.nombre_campus}\n${shareUrl}`;

      // Intentar usar Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${place.nombre_lugar} - UC`,
            text: message,
            url: shareUrl
          });
        } catch {
          // Usuario canceló
        }
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Enlace copiado al portapapeles:\n' + shareUrl);
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('❌ Error al compartir ubicación');
    } finally {
      setSharing(false);
    }
  }

  return (
    <ul {...StepTagAttributes}>
      <button className="uc-btn btn-featured" onClick={handleStepBack}>
        Volver
        <i className="uc-icon">arrow_back_ios_new</i>
      </button>
      <br />
      <h1 style={{ fontSize: "1.5rem" }}>{place.nombre_lugar}</h1>
      
      {/* Botón Compartir */}
      <a 
        href="#" 
        className="uc-btn btn-secondary"
        onClick={handleSharePlace}
        style={{ 
          marginTop: '10px', 
          marginBottom: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {sharing ? 'Compartiendo...' : 'Compartir'}
        <i className="uc-icon">share</i>
      </a>
      
      <span className="uc-tag" style={{ fontSize: "1.2rem", marginTop: 10 }}>
        {place.nombre_tipo_lugar}
      </span>
      <span style={{ fontSize: "1.2rem", marginTop: 10, fontStyle: "italic" }}>
        Campus {place.nombre_campus}
      </span>
      {place.descripcion && (
        <span
          dangerouslySetInnerHTML={{ __html: marked(place.descripcion) }}
          style={{ marginTop: 10 }}
        />
      )}
      {place.premio && (
        <span style={{ marginTop: 10 }}>Premio: {place.premio}</span>
      )}
      <span>{place.arquitecto}</span>

      {/* Galería: 2 columnas, ocupa todo el ancho */}
      <div
        className="uc-gallery"
        style={{
          maxWidth: 800,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
        }}
      >
        {sized?.map((image, i) => {
const base64 = image.binario;
const mimeType = image.mime_type || "image/jpeg"; // fallback por si acaso
const base64Src = base64.startsWith("data:") 
  ? base64 
  : `data:${mimeType};base64,${base64}`;
console.log(image.width, image.height)
          return image.binario ? (
            
            <a
              key={`${place.id_ubicacion_geografica}-${i}`}
              href={base64Src}
              data-pswp-width={image.width}
              data-pswp-height={image.height}
              data-cropped="true"
              style={{ display: "block", width: "100%", height: "100%" }}
            >
              
              <NextImage
                src={base64Src}
                alt={place.nombre_lugar || `Imagen ${i + 1}`}
                title={image.descripcion || place.nombre_lugar}
                width={image.width}
                height={image.height}
                loading="lazy"
                sizes="(max-width: 600px) 100vw, 50vw"
                style={{ width: "100%", height: "auto", borderRadius: 6 }}
                unoptimized
              />
            </a>
          ) : null;
        })}
      </div>
    </ul>
  );
}
