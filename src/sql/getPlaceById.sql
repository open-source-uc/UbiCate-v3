SELECT
  l.id_lugar,
  c.id_campus,
  tl.id_tipo_lugar,
  ug.id_ubicacion_geografica,
  tl.nombre_tipo_lugar,
  l.nombre_lugar,
  c.nombre_campus,
  ug.descripcion,
  eug.nombre_estado,
  ug.fk_id_estado_ubicacion_geografica,
  tg.nombre_tipo_geojson,
  tg.id_tipo_geojson,
  ug.geojson,
  l.arquitecto,
  l.premio,
  l.facultad,
  pl.numero_piso AS piso_punto
FROM lugar l
JOIN tipo_lugar tl ON l.fk_id_tipo_lugar = tl.id_tipo_lugar
JOIN campus c ON l.fk_id_campus = c.id_campus
JOIN ubicacion_geografica ug ON l.fk_id_ubicacion_geografica = ug.id_ubicacion_geografica
JOIN estado_ubicacion_geografica eug ON ug.fk_id_estado_ubicacion_geografica = eug.id_estado_ubicacion_geografica
JOIN tipo_geojson tg ON ug.fk_id_tipo_geojson = tg.id_tipo_geojson
LEFT JOIN piso_lugar pl ON pl.fk_id_lugar = l.id_lugar
WHERE l.id_lugar = ?;
