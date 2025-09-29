import type { Feature, FeatureCollection } from "geojson";
import type { PlaceName } from "@/app/types/placeNameType";

export default class MapUtils {
  private static iconMap: Map<number, { icon: string; color: string }> = new Map();

  // Método para inicializar el mapa desde la API
  static async initPlaceIcons() {
    try {
      const res = await fetch("/api/places/getTypes", { cache: "no-store" });
      if (!res.ok) throw new Error("Error cargando tipos de lugar");

      const data: PlaceName[] = await res.json();
      this.iconMap.clear();
      data.forEach((place) => {
        this.iconMap.set(place.id_tipo_lugar, {
          icon: place.icono,
          color: place.color_icono,
        });
      });
    } catch (err) {
      console.error("[MapUtils] No se pudieron cargar los íconos:", err);
    }
  }

  // Devuelve icono + color por ID, o valores por defecto
  static idToIcon(id: number) {
    return this.iconMap.get(id) ?? { icon: "question_mark", color: "#2b2c2c" };
  }

    static routeIdToColor(id: string) {
        switch (id){
            case '1': return "#ffaa00";
            case '2': return "#21ff06";
            case '3': return "#20ffff";
            default: return "#0176DE"
        }        
    }

    static routeIdToIcon(id: number) {
        switch (id){
            case 1: return "theater_comedy";
            case 2: return "hiking";
            case 3: return "self_improvement";
            default: return "question_mark"
        }        
    }

    static toFeatureCollection(data: unknown): FeatureCollection | null {
      if (!data) return null;
      let v: unknown = data;
    
      if (typeof v === "string") {
        try { v = JSON.parse(v) as unknown; } catch { return null; }
      }
      function isRecord(v: unknown): v is Record<string, unknown> {
            return typeof v === "object" && v !== null;
        }
        function isFeatureCollection(v: unknown): v is FeatureCollection {
            return isRecord(v) && v["type"] === "FeatureCollection" && Array.isArray(v["features"]);
        }
        function isFeature(v: unknown): v is Feature {
            return isRecord(v) && v["type"] === "Feature";
        }
      if (isFeatureCollection(v)) return v;
      if (isFeature(v))          return { type: "FeatureCollection", features: [v] };
      if (Array.isArray(v))      return { type: "FeatureCollection", features: v as Feature[] };
    
      return null;
    }

    static shadeColor = (input: string, t: number) => {
        try {
            // normaliza a rgb
            let r=0,g=0,b=0;
            if (/^#/.test(input)) {
            const hex = input.replace('#','');
            const n = hex.length === 3
                ? hex.split('').map(h=>h+h).join('')
                : hex.padEnd(6,'0').slice(0,6);
            r = parseInt(n.slice(0,2),16);
            g = parseInt(n.slice(2,4),16);
            b = parseInt(n.slice(4,6),16);
            } else if (typeof document !== 'undefined') {
            const tmp = document.createElement('span');
            tmp.style.color = input;
            document.body.appendChild(tmp);
            const rgb = getComputedStyle(tmp).color; // "rgb(r, g, b)"
            document.body.removeChild(tmp);
            const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
            if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
            }
            const mix = (c:number, t:number) => {
            // t<0 mix con negro; t>0 mix con blanco
            const target = t < 0 ? 0 : 255;
            const p = Math.min(1, Math.max(-1, t));
            return Math.round((target - c) * Math.abs(p) + c);
            };
            const rr = mix(r, t), gg = mix(g, t), bb = mix(b, t);
            const toHex = (x:number) => x.toString(16).padStart(2,'0');
            return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
        } catch { return input; }
    };
}