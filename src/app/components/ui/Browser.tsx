'use client';
import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useMap } from '../context/MapContext';
import MapManager from '@/app/lib/mapManager';
import type { FeatureCollection } from 'geojson';
import type { Place } from '@/app/types/placeType';
import { useSidebar } from '../context/SidebarContext';

type PlaceWithGeo = Place & {
  featureCollection?: FeatureCollection;
  geojson?: unknown;
};

export default function Browser() {
  const { places = [], mapRef } = useMap();
  const [value, setValue] = useState('');
  const { setQueryParam } = useSidebar();

  const fuse = useMemo(
    () =>
      new Fuse(places, {
        keys: ['nombre_lugar'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [places]
  );

  const results = useMemo(
    () => (value.trim() ? fuse.search(value).map(r => r.item as PlaceWithGeo) : []),
    [fuse, value]
  );

  
  const handlePlaceClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    place: PlaceWithGeo
  ) => {
    e.preventDefault();
    setValue('');

    const map = mapRef?.current;
    if (!map) return;

    const raw = place.featureCollection ?? place.geojson;
    if (!raw) return;

    const fc = MapManager.toFeatureCollection(raw);
    const pid = String(place.id_lugar);

    fc.features = (fc.features ?? []).map(f => ({
      ...f,
      id: pid,
      properties: {
        ...(f.properties ?? {}),
        placeId: pid,
        placeTypeId: place.id_tipo_lugar,
        placeName: place.nombre_lugar,   
      }
    }));
    (map as any).__removeRoutes?.();
    MapManager.drawPlaces(map, fc, { mode: "single" })
  };

  return (
    <div className="uc-form-group no-margin" style={{ position: 'relative', width: "100%" }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="uc-input-style w-icon search"
        placeholder="Buscar punto de interés.."
      />
      <span className="w-icon search" />
      {value && results.length > 0 && (
        <ul
          className="uc-table-list_content uc-card"
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '5px',
            zIndex: 30,
            width: "100%",
            maxHeight: 280,
            overflowY: 'auto',
            borderRadius: 8,
            padding: 8,
            backgroundColor: 'white',
          }}
        >
          {results.map((place, i) => (
            <li  key={place.id_lugar ?? `${place.nombre_lugar}-${i}`}>
              <a
                href="#"
                className="uc-btn btn-listed"
                onMouseDown={e => e.preventDefault()}
                onClick={e => handlePlaceClick(e, place)}
                style={{ display: "flex", flexDirection: "column", alignItems: "start" }}
              >
                <span style={{opacity: 0.6, fontStyle: "italic"}}>{place.nombre_campus}</span>
                <br />
                <span>{place.nombre_lugar}</span>           
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
