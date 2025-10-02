SELECT DISTINCT
  r.id_ruta,
  r.nombre_ruta, 
  r.icono,
  r.color_icono
FROM ruta r
WHERE r.icono IS NOT NULL 
  AND r.color_icono IS NOT NULL
ORDER BY r.id_ruta;