INSERT INTO ubicacion_geografica (descripcion, fecha_creacion, geojson, fk_id_tipo_geojson, fk_id_estado_ubicacion_geografica)
VALUES (?, DATETIME('now'), json(?), ?, ?);
