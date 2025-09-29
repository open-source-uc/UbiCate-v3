UPDATE lugar
SET nombre_lugar = ?,
    fk_id_campus = ?,
    fk_id_tipo_lugar = ?,
    arquitecto = ?,
    premio = ?,
    facultad = ?
WHERE id_lugar = ?;
