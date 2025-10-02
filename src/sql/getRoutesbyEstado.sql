SELECT 
  r.id_ruta,
  r.nombre_ruta,
  r.descripcion,
  r.icono,
  r.color_icono,
  c.nombre AS nombre_campus,
  ug.geojson,
  ug.estado_ubicacion_geografica
FROM ruta r
JOIN ubicacion_geografica ug ON r.id_ubicacion_geografica = ug.id_ubicacion_geografica
JOIN campus c ON ug.id_campus = c.id_campus
WHERE ug.estado_ubicacion_geografica = ?
ORDER BY r.id_ruta DESC;