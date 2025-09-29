SELECT
  id_imagen,
  fk_id_ubicacion_geografica,
  binario,
  descripcion,
  mime_type
FROM imagen
WHERE fk_id_ubicacion_geografica = ?;
