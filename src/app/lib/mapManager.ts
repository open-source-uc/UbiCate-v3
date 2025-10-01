import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson';

import mapboxgl from 'mapbox-gl';
import MapUtils from '@/utils/MapUtils';
import { MAPBOX_STYLE_URL } from '../../themes/mapstyles';

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function isFeatureCollection(v: unknown): v is FeatureCollection {
  return isRecord(v) && v.type === 'FeatureCollection' && Array.isArray((v as { features?: unknown }).features);
}
function isFeature(v: unknown): v is Feature {
  return isRecord(v) && v.type === 'Feature';
}

type DrawMode = "multi" | "single";
type DrawOpts = {
  mode?: DrawMode;           // auto: array => "multi", objeto => "single"
  zoom?: boolean;            // default: true sólo en "single"
  showPolygonLabels?: boolean; // default: true
};

export class MapManager {
  /**
   * Elimina el layer y source 'prueba' del mapa si existen.
   */
  static removePruebaLayer(map: mapboxgl.Map) {
    const sourceId = "prueba-source";
    const layerId = "prueba-layer";
    if (map.getLayer(layerId)) {
      try { map.removeLayer(layerId); } catch {}
    }
    if (map.getSource(sourceId)) {
      try { map.removeSource(sourceId); } catch {}
    }
  }
  private map: mapboxgl.Map;
  private static drawnLayers = new Set<string>();

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  static handleMapLoad(map: mapboxgl.Map, onLoadedCallback: () => void) {
    try {
      console.log('[handleMapLoad] Registrando evento load del mapa...');
      map.on('load', () => {
        console.log('[handleMapLoad] Mapa cargado, aplicando tema personalizado...');
        this.applyCustomTheme(map);
        onLoadedCallback();
      });
    } catch (error) {
      console.error('[handleMapLoad] Error durante la carga del mapa:', error);
    }
  }

  static applyCustomTheme(map: mapboxgl.Map) {
    try {
      console.log(`[applyCustomTheme] Aplicando estilo: ${MAPBOX_STYLE_URL}`);
      map.setStyle(MAPBOX_STYLE_URL);
    } catch (error) {
      console.error('[applyCustomTheme] Error aplicando tema personalizado:', error);
    }
  }

  static toFeatureCollection(data: unknown): FeatureCollection {
    if (!data) {
      console.warn('[toFeatureCollection] Data vacía o undefined');
      return EMPTY_FC;
    }

    let v: unknown = data;

    if (typeof v === 'string') {
      try {
        v = JSON.parse(v) as unknown;
      } catch (err) {
        console.error('[toFeatureCollection] Error parseando string a JSON:', err);
        return EMPTY_FC;
      }
    }

    if (isFeatureCollection(v)) return v;
    if (isFeature(v)) return { type: 'FeatureCollection', features: [v] };
    if (Array.isArray(v)) return { type: 'FeatureCollection', features: v as Feature[] };

    console.warn('[toFeatureCollection] El dato no es FeatureCollection, Feature ni Array. Se devuelve vacío.');
    return EMPTY_FC;
  }

  static drawPolygons(map: mapboxgl.Map, campus: string, data: unknown) {
    try {
      console.log(`[drawPolygons] Dibujando campus "${campus}"`);

      const sourceId = `${campus}-source`;
      const layerId = `${campus}-layer`;
      const fc = this.toFeatureCollection(data);

      if (fc.features.length === 0) {
        console.warn(`[drawPolygons] No hay features para dibujar en ${campus}`);
      }

      const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (!src) {
        console.log(`[drawPolygons] Agregando nueva source: ${sourceId}`);
        map.addSource(sourceId, { type: 'geojson', data: fc });
      } else {
        console.log(`[drawPolygons] Actualizando source existente: ${sourceId}`);
        src.setData(fc);
      }

      if (!map.getLayer(layerId)) {
        console.log(`[drawPolygons] Agregando layer: ${layerId}`);
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': '#088', 'line-width': 3, 'line-dasharray': [2, 1] },
        });
        this.drawnLayers.add(layerId);
      } else {
        console.log(`[drawPolygons] Layer "${layerId}" ya existe, no se agrega de nuevo.`);
      }
    } catch (err) {
      console.error(`[drawPolygons] Error dibujando campus "${campus}":`, err);
    }
  }

 static drawRoutes(map: mapboxgl.Map, data: unknown, opts: { fit?: boolean, showEndpoints?: boolean } = {}) {
  try {
    if (!map.isStyleLoaded()) { map.once("load", () => this.drawRoutes(map, data, opts)); return; }
    (map as any).__removePlacePolygon?.();
    (map as any).__removePlacesPolygons?.();

    const sourceId  = "routes-source";
    const layerCase = "routes-casing";
    const layerLine = "routes-line";

    const toFC = (g:any): GeoJSON.FeatureCollection =>
      !g ? { type:"FeatureCollection", features:[] }
      : g.type==="FeatureCollection" ? g
      : g.type==="Feature" ? { type:"FeatureCollection", features:[g] }
      : Array.isArray(g) ? { type:"FeatureCollection", features:g }
      : { type:"FeatureCollection", features:[] };

    const getFlag = <T>(k:string, def:T):T => ((map as any)[`__routes__${k}`] ?? ((map as any)[`__routes__${k}`] = def));
    const setFlag = (k:string, v:any) => ((map as any)[`__routes__${k}`] = v);

    // normaliza + colores consistentes con iconos
    let auto = 0;
    const arr = Array.isArray(data) ? data : [data];
    const raw: GeoJSON.Feature[] = (arr as any[]).flatMap(it => {
      const fc = toFC(it);
      return (fc.features ?? []).map(f => {
        if (!f.geometry || (f.geometry.type !== "LineString" && f.geometry.type !== "MultiLineString")) return null;
        const p:any = { ...(f.properties ?? {}) };
        const rid = String(p.routeId ?? (f as any).id ?? `route-${auto++}`);
        const base = p.stroke || String(MapUtils.routeIdToColor(p.routeId)); // Use stroke if available
        const hov  = MapUtils.shadeColor(base, -0.18);
        const sel  = MapUtils.shadeColor(base, -0.35);
        return { ...f, id: rid, properties: { ...p, routeId: rid, routeColorBase: base, routeColorHover: hov, routeColorSelect: sel } } as GeoJSON.Feature;
      }).filter(Boolean) as GeoJSON.Feature[];
    });

    const fcAll: GeoJSON.FeatureCollection = { type:"FeatureCollection", features: raw };
    const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
    if (!src) map.addSource(sourceId, { type:"geojson", data: fcAll, promoteId:"routeId" });
    else src.setData(fcAll);

    const prevSel = getFlag<string | undefined>("selectedId", undefined);
    if (prevSel) { map.setFeatureState({ source: sourceId, id: prevSel }, { selected:false }); setFlag("selectedId", undefined); }
    const prevHover = getFlag<string | undefined>("hoverId", undefined);
    if (prevHover) { map.setFeatureState({ source: sourceId, id: prevHover }, { hover:false }); setFlag("hoverId", undefined); }

    const beforeId = (map.getStyle()?.layers || []).find((l:any)=>l.type==="symbol")?.id as string | undefined;

    const isSel:any   = ["==", ["feature-state","selected"], true];
    const isHover:any = ["==", ["feature-state","hover"], true];
    const widthExpr:any = ["case", isSel, 6, isHover, 5, 4];

    // color principal = base/hover/select exactos (sin bajar opacidad)
    const colorExpr:any = [
      "case",
      isSel,   ["to-color", ["get","routeColorSelect"]],
      isHover, ["to-color", ["get","routeColorHover"]],
               ["to-color", ["get","routeColorBase"]]
    ];

    // casing ahora es un borde oscuro del mismo tono (no blanco) para contraste, sin aclarar el centro
    const casingColor:any = ["to-color", ["get","routeColorSelect"]];

    if (!map.getLayer(layerCase)) {
      map.addLayer({ id:layerCase, type:"line", source:sourceId, layout:{ "line-cap":"round", "line-join":"round" }, paint:{
        "line-color": casingColor,
        "line-width": ["+", widthExpr, 2],
        "line-opacity": 0.3,    
        "line-blur": 0
      }}, beforeId);
    } else {
      map.setPaintProperty(layerCase, "line-color", casingColor);
      map.setPaintProperty(layerCase, "line-width", ["+", widthExpr, 2]);
      map.setPaintProperty(layerCase, "line-opacity", 0.3);
      map.setPaintProperty(layerCase, "line-blur", 0);
      if (beforeId) map.moveLayer(layerCase, beforeId);
    }

    if (!map.getLayer(layerLine)) {
      map.addLayer({ id:layerLine, type:"line", source:sourceId, layout:{ "line-cap":"round", "line-join":"round" }, paint:{
        "line-color": colorExpr,
        "line-width": widthExpr,
        "line-opacity": 0.3,      
        "line-blur": 0
      }}, layerCase);
    } else {
      map.setPaintProperty(layerLine, "line-color", colorExpr);
      map.setPaintProperty(layerLine, "line-width", widthExpr);
      map.setPaintProperty(layerLine, "line-opacity", 0.3);
      map.setPaintProperty(layerLine, "line-blur", 0);
      map.moveLayer(layerLine, layerCase);
    }

    // endpoints (opcional)
    const domKey = "__routes__domMarkers";
    const dom = (map as any)[domKey] as Map<string, mapboxgl.Marker[]> | undefined;
    if (dom) { for (const arr of dom.values()) arr.forEach(m=>m.remove()); dom.clear(); } else (map as any)[domKey] = new Map();
    const domMarkers = (map as any)[domKey] as Map<string, mapboxgl.Marker[]>;

    const makeIcon = (name:string, color:string) => {
      const el = document.createElement("i");
      el.className = "uc-icon";
      el.textContent = name;
      el.style.fontFamily = "Material Icons Outlined, Material Icons, uc-icon";
      el.style.fontSize = "22px";
      el.style.lineHeight = "1";
      el.style.color = color; // mismo tono
      el.style.userSelect = "none";
      return el;
    };

    const coordsOf = (f: GeoJSON.Feature): [number, number][] => {
      const g = f.geometry as any;
      if (g.type === "LineString") return g.coordinates as [number,number][];
      if (g.type === "MultiLineString") return (g.coordinates as [number,number][][])[0] ?? [];
      return [];
    };

    const showEndpoints = opts.showEndpoints ?? true;
    if (showEndpoints) {
      for (const f of raw) {
        const p:any = f.properties || {};
        const rid = String(p.routeId ?? f.id);
        const base = p.routeColorBase || "#0176DE";
        const endC = p.routeColorSelect || MapUtils.shadeColor(base, -0.35);
        const c = coordsOf(f); if (c.length < 2) continue;
        const start = new mapboxgl.Marker({ element: makeIcon("trip_origin", base), anchor:"center" }).setLngLat(c[0]).addTo(map);
        const end   = new mapboxgl.Marker({ element: makeIcon("flag", endC), anchor:"bottom" }).setLngLat(c[c.length-1]).addTo(map);
        domMarkers.set(rid, [start, end]);
      }
    }

    if (!getFlag<boolean>("handlersBound", false)) {
      const enter = () => (map.getCanvas().style.cursor = "pointer");
      const leave = () => {
        map.getCanvas().style.cursor = "";
        const cur = getFlag<string|undefined>("hoverId", undefined);
        if (cur) { map.setFeatureState({ source: sourceId, id: cur }, { hover:false }); setFlag("hoverId", undefined); }
      };
      const move = (e: mapboxgl.MapLayerMouseEvent) => {
        const f = e.features?.[0]; if (!f) return;
        const id = String((f.properties as any)?.routeId ?? f.id);
        const cur = getFlag<string|undefined>("hoverId", undefined);
        if (cur !== id) {
          if (cur) map.setFeatureState({ source: sourceId, id: cur }, { hover:false });
          map.setFeatureState({ source: sourceId, id }, { hover:true });
          setFlag("hoverId", id);
        }
      };
      const click = (e: mapboxgl.MapLayerMouseEvent) => {
        const f = e.features?.[0]; if (!f) return;
        const id = String((f.properties as any)?.routeId ?? f.id);
        const prev = getFlag<string|undefined>("selectedId", undefined);
        if (prev && prev !== id) map.setFeatureState({ source: sourceId, id: prev }, { selected:false });
        const same = prev === id;
        map.setFeatureState({ source: sourceId, id }, { selected: !same });
        setFlag("selectedId", !same ? id : undefined);
        const props = { ...(f.properties as any) };
        (map as any).__onRouteClick?.({ routeId:id, properties:props, lngLat:e.lngLat });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("route:open-in-sidebar", { detail: { routeId:id, properties:props } }));
          window.dispatchEvent(new Event("sidebar:open"));
        }
      };
      for (const lyr of [layerCase, layerLine]) {
        map.on("mouseenter", lyr, enter);
        map.on("mouseleave", lyr, leave);
        map.on("mousemove",  lyr, move);
        map.on("click",      lyr, click);
      }
      setFlag("handlersBound", true);
      setFlag("handlers", { enter, leave, move, click });
    }

    if (opts.fit ?? true) {
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      const push=(x:number,y:number)=>{ if (x<minX)minX=x; if (y<minY)minY=y; if (x>maxX)maxX=x; if (y>maxY)maxY=y; };
      for (const f of raw) {
        const g = f.geometry as any;
        if (g.type==="LineString") for (const [x,y] of g.coordinates as number[][]) push(x,y);
        else if (g.type==="MultiLineString") for (const seg of g.coordinates as number[][][]) for (const [x,y] of seg) push(x,y);
      }
      if (isFinite(minX)) map.fitBounds([[minX,minY],[maxX,maxY]], { padding: 60, maxZoom: 16, duration: 500 });
    }

    (map as any).__removeRoutes = () => {
      const hs = getFlag<any>("handlers", null);
      if (hs) {
        for (const lyr of [layerCase, layerLine]) {
          try { map.off("mouseenter", lyr, hs.enter); } catch {}
          try { map.off("mouseleave", lyr, hs.leave); } catch {}
          try { map.off("mousemove",  lyr, hs.move);  } catch {}
          try { map.off("click",      lyr, hs.click); } catch {}
        }
        setFlag("handlers", null);
        setFlag("handlersBound", false);
      }
      const sel = getFlag<string|undefined>("selectedId", undefined);
      if (sel) { try { map.setFeatureState({ source: sourceId, id: sel }, { selected:false }); } catch {} setFlag("selectedId", undefined); }
      const hov = getFlag<string|undefined>("hoverId", undefined);
      if (hov) { try { map.setFeatureState({ source: sourceId, id: hov }, { hover:false }); } catch {} setFlag("hoverId", undefined); }

      const domKey = "__routes__domMarkers";
      const d = (map as any)[domKey] as Map<string, mapboxgl.Marker[]> | undefined;
      if (d) { for (const arr of d.values()) arr.forEach(m=>{ try{m.remove();}catch{} }); d.clear(); }

      if (map.getLayer(layerLine)) try { map.removeLayer(layerLine); } catch {}
      if (map.getLayer(layerCase)) try { map.removeLayer(layerCase); } catch {}
      if (map.getSource(sourceId)) try { map.removeSource(sourceId); } catch {}
    };

  } catch (err) {
    console.error("[drawRoutes] Error:", err);
  }
}

static drawPlaces(
  map: mapboxgl.Map,
  data: unknown | unknown[],
  opts: { mode?: "multi" | "single"; zoom?: boolean; showPolygonLabels?: boolean } = {}
) {
  try {
    const rerun = () => {
      if (!map.isStyleLoaded()) return;
      map.off("idle", rerun);
      map.off("styledata", rerun);
      this.drawPlaces(map, data, opts);
    };

    if (!map.isStyleLoaded()) {
      map.on("idle", rerun);
      map.on("styledata", rerun);
      return;
    }

    const mode: "multi" | "single" = opts.mode ?? (Array.isArray(data) ? "multi" : "single");
    const prefix = mode === "multi" ? "places" : "place-single";
    const sourceId = `${prefix}-source`;
    const layerFill  = `${prefix}-fill`;
    const layerLine  = `${prefix}-line`;
    const layerLabel = `${prefix}-label`;

    // limpia el otro modo para no mezclar
    const otherPrefix = mode === "multi" ? "place-single" : "places";
    this.__removeByPrefix?.(map, otherPrefix);

    // helpers
    const toFC = (g: any): GeoJSON.FeatureCollection =>
      !g ? { type: "FeatureCollection", features: [] }
      : g.type === "FeatureCollection" ? g
      : g.type === "Feature" ? { type: "FeatureCollection", features: [g] }
      : Array.isArray(g) ? { type: "FeatureCollection", features: g }
      : { type: "FeatureCollection", features: [] };

    const fk = (k: string) => `__${prefix}__${k}`;
    const getFlag = <T>(k: string, def?: T): T | undefined => (map as any)[fk(k)] ?? def;
    const setFlag = (k: string, v: any) => ((map as any)[fk(k)] = v);

    const truthy = (v: any) => {
      if (v === true) return true;
      if (typeof v === "string") return ["true","1","yes","y","si","sí"].includes(v.trim().toLowerCase());
      if (typeof v === "number") return v === 1;
      return false;
    };

    const centroidOf = (f: GeoJSON.Feature): GeoJSON.Position | null => {
      const g = f.geometry; if (!g) return null;
      let sx=0, sy=0, n=0; const acc=(pt:number[])=>{ if (pt?.length>=2){ sx+=pt[0]; sy+=pt[1]; n++; } };
      if (g.type==="Polygon") (g.coordinates as number[][][]).forEach(r=>r.forEach(acc));
      else if (g.type==="MultiPolygon") (g.coordinates as number[][][][]).forEach(p=>p.forEach(r=>r.forEach(acc)));
      else if (g.type==="Point") return g.coordinates as GeoJSON.Position;
      else if (g.type==="MultiPoint") { const arr=g.coordinates as number[][]; return arr[0] ?? null; }
      else if (g.type==="LineString") (g.coordinates as number[][]).forEach(acc);
      else if (g.type==="MultiLineString") (g.coordinates as number[][][]).forEach(l=>l.forEach(acc));
      return n ? [sx/n, sy/n] : null;
    };

    const boundsOfPolys = (polys: GeoJSON.Feature[]) => {
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      const push=(x:number,y:number)=>{ if (x<minX)minX=x; if (y<minY)minY=y; if (x>maxX)maxX=x; if (y>maxY)maxY=y; };
      for (const f of polys) {
        const g = f.geometry as any; if (!g) continue;
        if (g.type==="Polygon") for (const ring of g.coordinates as number[][][]) for (const [x,y] of ring) push(x,y);
        if (g.type==="MultiPolygon") for (const poly of g.coordinates as number[][][][]) for (const ring of poly) for (const [x,y] of ring) push(x,y);
      }
      if (!isFinite(minX)) return null;
      return new mapboxgl.LngLatBounds([minX,minY],[maxX,maxY]);
    };

    // normaliza input
    let auto = 0;
    const arr = Array.isArray(data) ? data : [data];
    const rawFeatures: GeoJSON.Feature[] = (arr as any[]).flatMap((item) => {
      const fc = toFC(item);
      return (fc.features ?? []).map((f) => {
        const props: any = { ...(f.properties ?? {}) };
        const raw = props.placeId ?? (f as any).id ?? `${prefix}-${auto++}`;
        const pid = String(raw);
        return { ...f, id: pid, properties: { ...props, placeId: pid } } as GeoJSON.Feature;
      });
    });

    // group por placeId
    type Group = { pid: string; props: any; polys: GeoJSON.Feature[]; points: GeoJSON.Feature[] };
    const groups = new Map<string, Group>();
    for (const f of rawFeatures) {
      const pid = String((f.properties as any)?.placeId ?? f.id);
      const g = groups.get(pid) ?? { pid, props: { ...(f.properties as any) }, polys: [], points: [] };
      g.props = { ...g.props, ...(f.properties as any) };
      if (f.geometry?.type === "Point") g.points.push(f);
      else if (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") g.polys.push(f);
      groups.set(pid, g);
    }

    // source base
    const fcAll: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: rawFeatures };
    const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
    if (!src) map.addSource(sourceId, { type: "geojson", data: fcAll, promoteId: "placeId" });
    else src.setData(fcAll);

    // reset states
    const prevSel = getFlag<string>("selectedId", undefined);
    if (prevSel && map.getSource(sourceId)) {
      try { map.setFeatureState({ source: sourceId, id: prevSel }, { selected: false }); } catch {}
    }
    setFlag("selectedId", undefined);

    const prevPolyHover = getFlag<string>("polyHoverId", undefined);
    if (prevPolyHover && map.getSource(sourceId)) {
      try { map.setFeatureState({ source: sourceId, id: prevPolyHover }, { hover: false }); } catch {}
    }
    setFlag("polyHoverId", undefined);

    // order
    const beforeId = (map.getStyle()?.layers || []).find((l: any) => l.type === "symbol")?.id as string | undefined;

    // estilos polígonos
    const isSelected: any  = ["==", ["feature-state","selected"], true];
    const isHoverRaw: any  = ["==", ["feature-state","hover"], true];
    const isHoverOnly: any = ["all", ["!=", ["feature-state","selected"], true], isHoverRaw];
    const OUTLN="#03122E", BASE="#0176DE", HOVER="#173F8A", SELECT="#03122E";
    const fillColorExpr:any   = ["case", isSelected, SELECT, isHoverOnly, HOVER, BASE];
    const fillOpacityExpr:any = ["case", isSelected, 0.3,     isHoverOnly, 0.3,  0.3];
    const polyFilter:any = ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]];

    // fill
    if (!map.getLayer(layerFill)) {
      map.addLayer({ id: layerFill, type: "fill", source: sourceId, filter: polyFilter, paint: {
        "fill-color": fillColorExpr, "fill-opacity": fillOpacityExpr, "fill-outline-color": OUTLN
      }}, beforeId);
    } else {
      map.setFilter(layerFill, polyFilter);
      map.setPaintProperty(layerFill, "fill-color", fillColorExpr);
      map.setPaintProperty(layerFill, "fill-opacity", fillOpacityExpr);
      map.setPaintProperty(layerFill, "fill-outline-color", OUTLN);
      if (beforeId) map.moveLayer(layerFill, beforeId);
    }

    // line
    if (!map.getLayer(layerLine)) {
      map.addLayer({ id: layerLine, type: "line", source: sourceId, filter: polyFilter, paint: {
        "line-color": OUTLN, "line-opacity": 0.3, "line-width": 2
      }}, beforeId);
    } else {
      map.setFilter(layerLine, polyFilter);
      map.setPaintProperty(layerLine, "line-color", OUTLN);
      map.setPaintProperty(layerLine, "line-opacity", 0.3);
      map.setPaintProperty(layerLine, "line-width", 2);
      if (beforeId) map.moveLayer(layerLine, beforeId);
    }

    // labels de polígonos
    const showLabels = opts.showPolygonLabels ?? true;
    const textFieldPoly:any = ["coalesce", ["to-string", ["get","placeName"]], ["to-string", ["id"]]];
    if (showLabels) {
      if (!map.getLayer(layerLabel)) {
        map.addLayer({ id: layerLabel, type: "symbol", source: sourceId, filter: polyFilter, layout: {
          "text-field": textFieldPoly,
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 18, 12],
          "text-allow-overlap": false, "text-padding": 2
        }, paint: { "text-color":"#03122E","text-halo-color":"#FFFFFF","text-halo-width":1.2,"text-opacity":0.95 }}, beforeId);
      } else {
        map.setFilter(layerLabel, polyFilter);
        map.setLayoutProperty(layerLabel, "text-field", textFieldPoly);
        map.setLayoutProperty(layerLabel, "text-size", ["interpolate", ["linear"], ["zoom"], 10, 10, 18, 12]);
        map.setLayoutProperty(layerLabel, "text-allow-overlap", false);
        map.setLayoutProperty(layerLabel, "text-padding", 2);
        map.setPaintProperty(layerLabel, "text-color", "#03122E");
        map.setPaintProperty(layerLabel, "text-halo-color", "#FFFFFF");
        map.setPaintProperty(layerLabel, "text-halo-width", 1.2);
        map.setPaintProperty(layerLabel, "text-opacity", 0.95);
        if (beforeId) map.moveLayer(layerLabel, beforeId);
      }
    } else if (map.getLayer(layerLabel)) map.removeLayer(layerLabel);

    // ====== PUNTOS ======
    const ensureIconImage = (key: string, iconName: string, color: string) => {
      if (map.hasImage(key)) return;
      const SIZE = 28, P = 4; // Tamaño del ícono
      const c = document.createElement("canvas");
      c.width = c.height = SIZE + P*2;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0,0,c.width,c.height);
      
      // Solo dibujar el ícono en su color correspondiente
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${SIZE}px "Material Icons Outlined", "Material Icons", "uc-icon"`;
      ctx.fillText(iconName, c.width/2, c.height/2 + 1);
      
      const img = ctx.getImageData(0,0,c.width,c.height);
      map.addImage(key, img, { pixelRatio: 1 });
    };

    const pointFC: GeoJSON.Feature[] = [];
    for (const [pid, g] of groups) {
      const hasPoly = g.polys.length > 0;
      const preferOver = truthy(g.props?.markerOverPolygon);
      const shouldPoint = g.points.length > 0 ? true : (hasPoly ? preferOver : false);
      if (!shouldPoint) continue;

      let lnglat: [number, number] | null = null;
      if (g.points[0]?.geometry?.type === "Point") lnglat = (g.points[0].geometry as GeoJSON.Point).coordinates as [number, number];
      else if (hasPoly) { const c = centroidOf(g.polys[0]); if (c) lnglat = c as [number, number]; }
      if (!lnglat) continue;

      // Usar información directa de íconos si está disponible, sino usar MapUtils
      const spec = (() => { 
        try { 
          // Priorizar información directa de íconos en propiedades
          if (g.props?.placeIcon && g.props?.placeColor) {
            return { icon: g.props.placeIcon, color: g.props.placeColor };
          }
          // Fallback a MapUtils
          return MapUtils.idToIcon(g.props?.placeTypeId) || { icon:"home", color:"#0176DE" }; 
        } catch { 
          return { icon:"home", color:"#0176DE" }; 
        }
      })();
      const base = spec.color || "#0176DE";
      const hov  = MapUtils.shadeColor(base, -0.18);

      const baseKey  = `mi-${spec.icon}-${base.replace("#","")}-28`;
      const hoverKey = `mi-${spec.icon}-${hov.replace("#","")}-28`;

      if (mode === "multi") { ensureIconImage(baseKey, spec.icon, base); ensureIconImage(hoverKey, spec.icon, hov); }

      pointFC.push({
        type: "Feature",
        id: pid,
        properties: {
          placeId: pid,
          placeName: g.props?.placeName ?? pid,
          iconKey: baseKey,
          iconKeyHover: hoverKey,
          ...g.props
        },
        geometry: { type: "Point", coordinates: lnglat } as GeoJSON.Point
      } as any);
    }

    const ptSourceId = `${prefix}-points-source`;
    const ptsFC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: pointFC };
    const ptsrc = map.getSource(ptSourceId) as mapboxgl.GeoJSONSource | undefined;
    if (!ptsrc) map.addSource(ptSourceId, { type: "geojson", data: ptsFC, promoteId: "placeId" });
    else ptsrc.setData(ptsFC);

    // limpia hover de puntos por si quedó prendido
    {
      const prevPtHover = getFlag<string>("ptHoverId", undefined);
      if (prevPtHover && map.getSource(ptSourceId)) {
        try { map.setFeatureState({ source: ptSourceId, id: prevPtHover }, { hover:false }); } catch {}
      }
      setFlag("ptHoverId", undefined);
    }

    if (mode === "multi") {
      const layerPoint     = `${prefix}-point`;
      const layerPointHov  = `${prefix}-point-hover`;

      // BASE: con colisión
      if (!map.getLayer(layerPoint)) {
        map.addLayer({
          id: layerPoint, type: "symbol", source: ptSourceId,
          layout: {
            "icon-image": ["get", "iconKey"],
            "icon-size": 1,
            "icon-anchor": "center",
            "icon-allow-overlap": false,
            "icon-optional": false,
            "text-field": ["get", "placeName"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 18, 12],
            "text-variable-anchor": ["top","bottom","left","right","top-left","top-right","bottom-left","bottom-right"],
            "text-radial-offset": 0.8,
            "text-allow-overlap": false,
            "text-optional": false
          },
          paint: {
            "icon-opacity": ["case", ["==", ["feature-state","hover"], true], 0, 1],
            "text-opacity": ["case", ["==", ["feature-state","hover"], true], 0, 0.95],
            "text-color": "#000",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 1.2
          }
        }, beforeId);
      } else if (beforeId) map.moveLayer(layerPoint, beforeId);

      // OVERLAY HOVER: sin colisión
      if (!map.getLayer(layerPointHov)) {
        map.addLayer({
          id: layerPointHov, type: "symbol", source: ptSourceId,
          layout: {
            "icon-image": ["get", "iconKeyHover"],
            "icon-size": 1,
            "icon-anchor": "center",
            "icon-allow-overlap": true,
            "icon-optional": true,
            "text-field": ["get", "placeName"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 18, 12],
            "text-variable-anchor": ["top","bottom","left","right","top-left","top-right","bottom-left","bottom-right"],
            "text-radial-offset": 0.8,
            "text-allow-overlap": true,
            "text-optional": true,
            "symbol-sort-key": 1
          },
          paint: {
            "icon-opacity": ["case", ["==", ["feature-state","hover"], true], 1, 0],
            "text-opacity": ["case", ["==", ["feature-state","hover"], true], 0.95, 0],
            "text-color": "#03122E",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 1.2
          }
        }, layerPoint);
      } else map.moveLayer(layerPointHov, layerPoint);

      // Handlers hover/click (points)
      if (!getFlag<boolean>("ptHandlersBound", false)) {
        const setHover = (id?: string) => {
          const cur = getFlag<string>("ptHoverId", undefined);
          const srcOk = !!map.getSource(ptSourceId);
          if (cur && cur !== id && srcOk) try { map.setFeatureState({ source: ptSourceId, id: cur }, { hover:false }); } catch {}
          if (id && srcOk)               try { map.setFeatureState({ source: ptSourceId, id }, { hover:true }); } catch {}
          setFlag("ptHoverId", id);
        };
        const onMove = (e: mapboxgl.MapLayerMouseEvent) => {
          const f = e.features?.[0]; if (!f) return;
          const id = String((f.properties as any)?.placeId ?? f.id);
          setHover(id);
          map.getCanvas().style.cursor = "pointer";
        };
        const onLeave = () => { setHover(undefined); map.getCanvas().style.cursor = ""; };
        const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
          const f = e.features?.[0]; if (!f) return;
          const pid = String((f.properties as any)?.placeId ?? f.id);
          const any = groups.get(pid);
          const hasPoly = Boolean(any?.polys?.length);
          const cen = hasPoly ? centroidOf(any!.polys[0] as GeoJSON.Feature)! : (any?.points[0]?.geometry as GeoJSON.Point)?.coordinates as [number, number];
          const payload = { placeId: pid, properties: { ...(any?.props ?? {}) }, geometryType: hasPoly ? "Polygon" : "Point", lngLat: e.lngLat ?? (cen ? new mapboxgl.LngLat(cen[0], cen[1]) : undefined) };
          (map as any).__onPlaceClick?.(payload);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: payload }));
            window.dispatchEvent(new Event("sidebar:open"));
          }
        };

        // Solo eventos en la capa BASE (con colisión)
        map.on("mousemove", layerPoint, onMove);
        map.on("mouseleave", layerPoint, onLeave);
        map.on("click",     layerPoint, onClick);

        // Guard: si no estás sobre el base, limpia hover
        const onMapMove = (e: mapboxgl.MapMouseEvent) => {
          if (!map.getLayer(layerPoint)) { onLeave(); return; }
          let hits: mapboxgl.MapboxGeoJSONFeature[] = [];
          try { hits = map.queryRenderedFeatures(e.point, { layers: [layerPoint] }); } catch { hits = []; }
          if (!hits.length) onLeave();
        };
        map.on("mousemove", onMapMove);

        setFlag("ptHandlersBound", true);
        setFlag("ptHandlers", { onMove, onLeave, onClick, onMapMove });
      }
    } else {
      // SINGLE: DOM icon centrado + texto symbol (halo), hover de color
      const SIZE = 28;
      const buildIcon = (iconName: string, color: string) => {
        const root = document.createElement("div");
        Object.assign(root.style, { position:"relative", width:`${SIZE}px`, height:`${SIZE}px`, pointerEvents:"auto", display:"flex", alignItems:"center", justifyContent:"center" });
        const icon = document.createElement("i");
        icon.className = "material-icons";
        Object.assign(icon.style, { fontFamily:"Material Icons", fontSize:`${SIZE}px`, lineHeight:"1", color, userSelect:"none", textShadow:"0 0 1px #fff" });
        icon.textContent = iconName;
        root.appendChild(icon);
        return { root, icon };
      };

      const domKey = fk("domMarkers");
      let domMarkers = (map as any)[domKey] as Map<string, mapboxgl.Marker> | undefined;
      if (domMarkers) { for (const mk of domMarkers.values()) mk.remove(); domMarkers.clear(); }
      else domMarkers = new Map();

      for (const f of pointFC) {
        const p = f.properties as any;
        const spec = (() => { try { return MapUtils.idToIcon(p?.placeTypeId) || { icon:"home", color:"#0176DE" }; } catch { return { icon:"home", color:"#0176DE" }; }})();
        const base = spec.color || "#0176DE";
        const hov  = MapUtils.shadeColor(base, -0.18);

        const { root, icon } = buildIcon(spec.icon, base);
        root.addEventListener("mouseenter", () => { icon.style.color = hov; });
        root.addEventListener("mouseleave", () => { icon.style.color = base; });

        const mk = new mapboxgl.Marker({ element: root, anchor: "center" })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .addTo(map);

        root.addEventListener("click", (e) => {
          e.stopPropagation();
          (map as any).__onPlaceClick?.({ placeId: String(p.placeId ?? f.id), properties: { ...p }, geometryType: "Point", lngLat: mk.getLngLat() });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: { placeId:String(p.placeId ?? f.id), properties:{...p} } }));
            window.dispatchEvent(new Event("sidebar:open"));
          }
        });
        domMarkers.set(String(p.placeId ?? f.id), mk);
      }
      (map as any)[domKey] = domMarkers;

      const layerPointText = `${prefix}-pt-text`;
      if (!map.getLayer(layerPointText)) {
        map.addLayer({
          id: layerPointText, type: "symbol", source: ptSourceId,
          layout: {
            "text-field": ["get", "placeName"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 18, 12],
            "text-variable-anchor": ["top","bottom","left","right","top-left","top-right","bottom-left","bottom-right"],
            "text-radial-offset": 0.8,
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": "#03122E",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 1.2,
            "text-opacity": 0.95
          }
        }, beforeId);
      } else if (beforeId) map.moveLayer(layerPointText, beforeId);
    }

    // ===== handlers polígonos (hover+click) =====
    if (!getFlag<boolean>("handlersBound", false)) {
      const enter = () => (map.getCanvas().style.cursor = "pointer");
      const leave = () => {
        map.getCanvas().style.cursor = "";
        const cur = getFlag<string>("polyHoverId", undefined);
        if (!cur) return;
        if (map.getSource(sourceId)) {
          try { map.setFeatureState({ source: sourceId, id: cur }, { hover: false }); } catch {}
        }
        setFlag("polyHoverId", undefined);
      };
      const handleMove = (e: mapboxgl.MapLayerMouseEvent) => {
        const f = e.features?.[0]; if (!f) return;
        if (!map.getSource(sourceId)) return; // estilo en transición
        const pid = String((f.properties as any)?.placeId ?? f.id);
        const cur = getFlag<string>("polyHoverId", undefined);
        if (cur !== pid) {
          if (cur) try { map.setFeatureState({ source: sourceId, id: cur }, { hover: false }); } catch {}
          try { map.setFeatureState({ source: sourceId, id: pid }, { hover: true }); } catch {}
          setFlag("polyHoverId", pid);
        }
      };
      const click = (e: mapboxgl.MapLayerMouseEvent) => {
        const f = e.features?.[0]; if (!f) return;
        const pid = String((f.properties as any)?.placeId ?? f.id);
        const any = groups.get(pid);
        const hasPoly = Boolean(any?.polys?.length);
        const cen = hasPoly ? centroidOf(any!.polys[0] as GeoJSON.Feature)! : (any?.points[0]?.geometry as GeoJSON.Point)?.coordinates as [number, number];
        const payload = { placeId: pid, properties: { ...(any?.props ?? {}) }, geometryType: hasPoly ? "Polygon" : "Point", lngLat: e.lngLat ?? (cen ? new mapboxgl.LngLat(cen[0], cen[1]) : undefined) };
        (map as any).__onPlaceClick?.(payload);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("place:open-in-sidebar", { detail: payload }));
          window.dispatchEvent(new Event("sidebar:open"));
        }
      };

      for (const lyr of [layerFill, layerLine]) {
        map.on("mouseenter", lyr, enter);
        map.on("mouseleave", lyr, leave);
        map.on("mousemove",  lyr, handleMove);
        map.on("click",      lyr, click);
      }
      if (showLabels) {
        map.on("mouseenter", layerLabel, enter);
        map.on("mouseleave", layerLabel, leave);
        map.on("mousemove",  layerLabel, handleMove);
        map.on("click",      layerLabel, click);
      }

      // Guard global: si no hay ningún polígono bajo el cursor, limpia hover sí o sí
      const polyLayers = [layerFill, layerLine, ...(showLabels ? [layerLabel] : [])];
      let rafId = 0;
      const runRAF = (cb: FrameRequestCallback) => {
        if (typeof requestAnimationFrame === "function") {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(cb);
        } else {
          cb(0 as any);
        }
      };

      const onMapMovePoly = (e: mapboxgl.MapMouseEvent) => {
        runRAF(() => {
          try {
            if (!map || !map.isStyleLoaded()) return;

            const srcExists = !!map.getSource(sourceId);
            const live = polyLayers.filter((id) => !!map.getLayer(id));
            if (!live.length) {
              // nada que consultar
              if (srcExists) {
                const cur = getFlag<string>("polyHoverId", undefined);
                if (cur) { try { map.setFeatureState({ source: sourceId, id: cur }, { hover:false }); } catch {} }
              }
              setFlag("polyHoverId", undefined);
              map.getCanvas().style.cursor = "";
              return;
            }

            let hits: mapboxgl.MapboxGeoJSONFeature[] = [];
            try { hits = map.queryRenderedFeatures(e.point, { layers: live }); } catch { hits = []; }

            if (!hits.length) {
              const cur = getFlag<string>("polyHoverId", undefined);
              if (cur && srcExists) { try { map.setFeatureState({ source: sourceId, id: cur }, { hover:false }); } catch {} }
              setFlag("polyHoverId", undefined);
              map.getCanvas().style.cursor = "";
            }
          } catch { /* swallow */ }
        });
      };
      map.on("mousemove", onMapMovePoly);

      setFlag("handlersBound", true);
      setFlag("handlers", { enter, leave, handleMove, click, onMapMovePoly });
    }

    // ===== zoom =====
    const doZoom = opts.zoom ?? (mode === "single");
    if (doZoom && mode === "single") {
      const only = [...groups.values()][0];
      if (only?.polys?.length) {
        const b = boundsOfPolys(only.polys);
        if (b) map.fitBounds(b, { padding: 60, maxZoom: 18, duration: 500 });
      } else if (only?.points?.length) {
        const [lng, lat] = (only.points[0].geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center:[lng,lat], zoom:16, duration:500 });
      }
    }

    // cleanup alias
    (map as any)[`__remove_${prefix}`] = () => this.__removeByPrefix?.(map, prefix);
    if (mode === "single") (map as any).__removePlacePolygon = (map as any)[`__remove_${prefix}`];
    else (map as any).__removePlacesPolygons = (map as any)[`__remove_${prefix}`];

  } catch (err) {
    console.error(`[drawPlaces] Error:`, err);
  }
}












  // =============== PRIVATE ===============
private static __removeByPrefix(map: mapboxgl.Map, prefix: string) {
  const sourceId   = `${prefix}-source`;
  const layerFill  = `${prefix}-fill`;
  const layerLine  = `${prefix}-line`;
  const layerLabel = `${prefix}-label`;

  // 👉 también capas/ids de puntos
  const layerPoint     = `${prefix}-point`;
  const layerPointHov  = `${prefix}-point-hover`;
  const layerPointText = `${prefix}-pt-text`;
  const ptSourceId     = `${prefix}-points-source`;

  const fk = (k: string) => `__${prefix}__${k}`;
  const getFlag = <T>(k: string, def?: T): T | undefined => (map as any)[fk(k)] ?? def;
  const setFlag = (k: string, v: any) => ((map as any)[fk(k)] = v);

  // off handlers de polígonos
  const hs = getFlag<any>("handlers", null);
  if (hs) {
    for (const lyr of [layerFill, layerLine, layerLabel]) {
      try { map.off("mouseenter", lyr, hs.enter); } catch {}
      try { map.off("mouseleave", lyr, hs.leave); } catch {}
      try { map.off("mousemove",  lyr, hs.handleMove ?? hs.move); } catch {}
      try { map.off("click",      lyr, hs.click); } catch {}
    }
    setFlag("handlers", null);
    setFlag("handlersBound", false);
  }

  // off handlers de puntos
  const ph = getFlag<any>("ptHandlers", null);
  if (ph) {
    for (const lyr of [layerPoint, layerPointHov]) {
      try { map.off("mousemove", lyr, ph.onMove); } catch {}
      try { map.off("mouseleave", lyr, ph.onLeave); } catch {}
      try { map.off("click",      lyr, ph.onClick); } catch {}
    }
    try { map.off("mousemove", ph.onMapMove); } catch {}
    setFlag("ptHandlers", null);
    setFlag("ptHandlersBound", false);
  }

  // limpia feature-state
  const sel = getFlag<string>("selectedId", undefined);
  if (sel) { try { map.setFeatureState({ source: sourceId, id: sel }, { selected:false }); } catch {} setFlag("selectedId", undefined); }
  const hov = getFlag<string>("hoverId", undefined);
  if (hov) { try { map.setFeatureState({ source: sourceId, id: hov }, { hover:false }); } catch {} setFlag("hoverId", undefined); }

  // markers DOM
  const domKey = fk("domMarkers");
  const dm = (map as any)[domKey] as Map<string, mapboxgl.Marker> | undefined;
  if (dm) { for (const m of dm.values()) { try { m.remove(); } catch {} } dm.clear(); (map as any)[domKey] = new Map(); }

  // remove layers (puntos primero por dependencias)
  for (const id of [layerPointText, layerPointHov, layerPoint, layerLabel, layerFill, layerLine]) {
    if (id && map.getLayer(id)) try { map.removeLayer(id); } catch {}
  }
  // remove sources
  for (const sid of [ptSourceId, sourceId]) {
    if (sid && map.getSource(sid)) try { map.removeSource(sid); } catch {}
  }
}








  static extractBounds(data?: unknown): [number, number][] {
    try {
      const fc = this.toFeatureCollection(data);
      const out: [number, number][] = [];

      fc.features.forEach((f, i) => {
        const g = f.geometry as Geometry | null | undefined;
        if (!g) {
          console.warn(`[extractBounds] Feature ${i} no tiene geometría`);
          return;
        }

        switch (g.type) {
          case 'Polygon': {
            const coords = (g as Polygon).coordinates?.[0] ?? [];
            (coords as Position[]).forEach((c) => {
              if (c.length === 2) out.push([c[0], c[1]]);
            });
            break;
          }
          case 'MultiPolygon': {
            const coords = (g as MultiPolygon).coordinates ?? [];
            (coords as Position[][][]).flat(2).forEach((c) => {
              if (c.length === 2) out.push([c[0], c[1]]);
            });
            break;
          }
          case 'LineString': {
            const coords = (g as LineString).coordinates ?? [];
            (coords as Position[]).forEach((c) => {
              if (c.length === 2) out.push([c[0], c[1]]);
            });
            break;
          }
          case 'MultiLineString': {
            const coords = (g as MultiLineString).coordinates ?? [];
            (coords as Position[][]).flat(1).forEach((c) => {
              if (c.length === 2) out.push([c[0], c[1]]);
            });
            break;
          }
          case 'Point': {
            const c = g.coordinates as Position;
            if (Array.isArray(c) && c.length === 2) out.push([c[0], c[1]]);
            break;
          }
          default:
            console.warn(`[extractBounds] Tipo de geometría no soportado: ${g.type}`);
            break;
        }
      });

      console.log(`[extractBounds] Total coordenadas extraídas: ${out.length}`);
      return out;
    } catch (err) {
      console.error('[extractBounds] Error procesando datos:', err);
      return [];
    }
  }
}
// Al final del archivo:
export default MapManager;
