select 
	r.id_ruta,
	r.nombre_ruta,
	r.icono,
	r.color_icono,
	ug.id_ubicacion_geografica,
	ug.geojson,
	ug.descripcion,
	ug.fk_id_estado_ubicacion_geografica as estado_ubicacion_geografica,
	c.id_campus,
	c.nombre_campus
from ruta r
join ubicacion_geografica ug
	on r.fk_id_ubicacion_geografica = ug.id_ubicacion_geografica
join campus c
	on r.fk_id_campus = c.id_campus
where ug.fk_id_tipo_geojson = 3    -- Ruta
and r.id_ruta = ?                  -- ID específico