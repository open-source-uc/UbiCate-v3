export type PersonaBasicoResponse = {
  codigo_http: number;
  datos: {
    usuario: {
      nombre_usuario: string;
      identificador_usuario: string | null;
      roles_vigentes: string[];
      otros_identificadores: {
        PIDEM: number;
        codpers: number;
      };
    };
    persona: {
      datos_personales: {
        nombres: string;
        primer_apellido: string;
        segundo_apellido: string;
        nombre_social: string | null;
        RUT: {
          valor: string;
          digito_verificador: string;
        };
      };
      estamento: string[];
    };
  };
};
