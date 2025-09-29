// src/app/types/geojsonType.ts
import type { Feature, FeatureCollection, Geometry } from "geojson";

export type Data =
  | string
  | FeatureCollection
  | Feature<Geometry>
  | Feature<Geometry>[];
