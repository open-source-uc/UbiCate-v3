UPDATE ubicacion_geografica
SET descripcion = ?,
    geojson = ?,
    fk_id_tipo_geojson = (SELECT id_tipo_geojson FROM tipo_geojson WHERE nombre_tipo_geojson = ?)
WHERE id_ubicacion_geografica = ?;
