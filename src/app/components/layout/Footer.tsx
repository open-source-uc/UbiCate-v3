"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="uc-footer" suppressHydrationWarning>
      <div className="container pb-80">
        <div className="row" data-accordion>
          <div className="col-lg-3">
            <div className="mb-40">
              <Link href="/">
                <Image
                    src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/logo-uc-blanco.svg"
                    alt="Pontificia Universidad Católica de Chile"
                    style={{ maxWidth: "240px" }}
                    width={1536}
                    height={825.6}
                    className="img-fluid"
                  />
                </Link>
              <p className="uc-subtitle subtitle-extended color-white mt-32">
                Nombre de Facultad
              </p>
              <p className="my-24 mr-28">
                Avda. Libertador Bernardo O’Higgins 340, Santiago - Chile
              </p>
              <Link href="https://maps.app.goo.gl/eoJZo7KLPSAUyofQ6">¿Cómo llegar?</Link>
              <br/>
              <ul className="uc-footer_social">
                <li>
                  <Link href="#https://x.com/ucatolica">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-twitter.svg"
                      alt="Twitter"
                      style={{ maxWidth: "22px" }}
                      width={22}
                      height={18}
                      className="img-fluid"
                    />
                  </Link>
                </li>
                <li>
                  <Link href="https://web.facebook.com/ucatolica/">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-facebook.svg"
                      alt="Facebook"
                      style={{ maxWidth: "23px" }}
                      width={12}
                      height={23}
                      className="img-fluid"
                    />
                  </Link>
                </li>
                <li>
                  <Link href="https://www.instagram.com/ucatolicaoficial">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-instagram.svg"
                      alt="Instagram"
                      style={{ maxWidth: "21px" }}
                      width={21}
                      height={21}
                      className="img-fluid"
                    />
                  </Link>
                </li>
                <li>
                  <Link href="https://cl.linkedin.com/school/ucatolica/">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-linkedin.svg"
                      alt="Linkedin"
                      style={{ maxWidth: "21px" }}
                      width={21}
                      height={21}
                      className="img-fluid"
                    />
                  </Link>
                </li>
                <li>
                  <Link href="https://www.youtube.com/channel/UCDEFrY_oSd00GEKj5fPnmlw">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-youtube.svg"
                      alt="Youtube"
                      style={{ maxWidth: "24px" }}
                      width={24}
                      height={17}
                      className="img-fluid"
                    />
                  </Link>
                </li>
                <li>
                  <Link href="https://www.flickr.com/photos/universidadcatolica/">
                    <Image
                      src="https://kit-digital-uc-prod.s3.amazonaws.com/assets/social-icon-flickr.svg"
                      alt="Flickr"
                      style={{ maxWidth: "21px" }}
                      width={21}
                      height={21}
                      className="img-fluid"
                    />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-4">
            <div
              className="uc-footer_list-title footer-collapse-title" suppressHydrationWarning
              data-collapse="footerNavExample01"
            >
              La universidad
            </div>
            <ul
              className="uc-footer_list footer-collapse"
              data-toggle="footerNavExample01"
            >
              <li><Link href="https://www.uc.cl/programas-de-estudio">Programas de estudio</Link></li>
              <li><Link href="https://www.uc.cl/investigacion">Investigación</Link></li>
              <li><Link href="https://www.uc.cl/extension">Extensión</Link></li>
              <li><Link href="https://www.uc.cl/universidad">La Universidad</Link></li>
              <li><Link href="https://www.uc.cl/codigo-de-honor/">Código de Honor</Link></li>
              <li><Link href="https://donaciones.uc.cl/">Donaciones</Link></li>
              <li><Link href="https://admision.uc.cl/">Admisión</Link></li>
            </ul>
          </div>

          <div className="col-lg-4">
            <div
              className="uc-footer_list-title footer-collapse-title"
              data-collapse="footerNavExample02"
              suppressHydrationWarning
            >
              Servicios
            </div>
            <ul
              className="uc-footer_list footer-collapse"
              data-toggle="footerNavExample02"
            >
              <li><Link href="https://www.ucchristus.cl/">Red Salud UC</Link></li>
              <li><Link href="https://www12.uc.cl/validcert/inicio/inicio.jsp">Validación de Certificados</Link></li>
              <li><Link href="https://pagoaranceles.uc.cl/jsp/mdp_inicio.jsp">Pago de Matrículas</Link></li>
              <li><Link href="#">Pago de Créditos</Link></li>
              <li><Link href="https://uccatolica.trabajando.cl/">Trabaja en la UC</Link></li>
              <li><Link href="/login">Acceso Administrador</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
