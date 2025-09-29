select
    ca.id_campus,
    ca.nombre_campus,
    ug.descripcion,
    ug.fecha_creacion,
    eu.nombre_estado,
    tg.nombre_tipo_geojson,
    ug.geojson
from campus ca
join ubicacion_geografica ug on 
	ug.id_ubicacion_geografica = ca.fk_id_ubicacion_geografica
join tipo_geojson tg on 
	tg.id_tipo_geojson = ug.fk_id_tipo_geojson
join estado_ubicacion_geografica eu on 
	eu.id_estado_ubicacion_geografica = ug.fk_id_estado_ubicacion_geografica
where eu.id_estado_ubicacion_geografica = 2;