import styled, { keyframes } from "styled-components";
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";

// Ya no necesitamos el ReportIcon SVG si lo vamos a reemplazar con una imagen

const StarRating = ({ rating }) => {
  const stars = [];
  const totalStars = 5;
  for (let i = 1; i <= totalStars; i++) {
    stars.push(
      <Star key={i} $filled={i <= rating}>
        ★
      </Star>
    );
  }
  return <div className="star-rating-display">{stars}</div>;
};

const formatRelativeDate = (commentDateString) => {
  let formattedDateString = commentDateString;
  const parts = commentDateString.split(/[-/]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);

    if (year < 100) {
      year += 2000;
    }

    const commentDate = new Date(year, month, day);

    if (isNaN(commentDate.getTime())) {
      return "Fecha inválida";
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - commentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30.44);
      return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Hace ${years} año${years === 1 ? '' : 's'}`;
    }
  } else {
    const commentDate = new Date(commentDateString);
    if (isNaN(commentDate.getTime())) {
      return "Fecha inválida";
    }
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - commentDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30.44);
      return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Hace ${years} año${years === 1 ? '' : 's'}`;
    }
  }
};


export default function Testimonial() {
  const [sectionTitle, setSectionTitle] = useState("¿Qué dicen de nosotros?");
  const [sectionDescription, setSectionDescription] = useState(
    ""
  );
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Para el carrusel de testimonios
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('next'); // 'next' o 'prev'
  const [googleLogoUrl, setGoogleLogoUrl] = useState(""); // Nuevo estado para la URL del logo de Google

  const [facebookPosts, setFacebookPosts] = useState([
    { src: "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fveronica.raina%2Fposts%2Fpfbid0hGNdqqNpHs3CcVDECMB2TWunvteodbMdEsJFz2qYPue24WhpCeQ8LXp9ZSLYKZtAl&show_text=true&width=500", height: "188px" },
    { src: "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpaula.mola.92%2Fposts%2Fpfbid02wzcc77etQYdDA93HgV1KaikrzuwvsTvDkSqjC7oXsdDNbbRLiQSSSruw2HSpxdY7l&show_text=true&width=500", height: "158px" },
    { src: "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fbarbara.selack%2Fposts%2Fpfbid02sJ8p1TbC8FF6tdbEYMvX8DT5rBMM2Fb9XBhXPmyewuN3Pou9g89ceyM2ZXbiXxMDl&show_text=true&width=500", height: "185px" },
  ]);
  const [currentFbIndex, setCurrentFbIndex] = useState(0); // Para el carrusel de Facebook
  const [isFbAnimating, setIsFbAnimating] = useState(false);
  const [fbAnimationDirection, setFbAnimationDirection] = useState('next');

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      try {
        const sectionInfoRef = ref(db, "datosId/29");
        const sectionInfoSnapshot = await get(sectionInfoRef);
        if (sectionInfoSnapshot.exists()) {
          const sectionData = sectionInfoSnapshot.val();
          setSectionTitle(sectionData.contenido31 || "¿Qué dicen de nosotros?");
          setSectionDescription(
            sectionData.contenido32 ||
            "Opiniones reales que podés encontrar en nuestras redes."
          );
        }

        const testimonialsDataRef = ref(db, "datosId/25");
        const testimonialsSnapshot = await get(testimonialsDataRef);
        if (testimonialsSnapshot.exists()) {
          const data = testimonialsSnapshot.val();
          setGoogleLogoUrl(data.link_imagen_facebook || ""); // Cargar la URL del logo de Google

          const loadedTestimonials = [];
          let i = 1;
          while (data[`testimonio_${i}`]) {
            const name = data[`nombre_testimonio_${i}`] || "Usuario Anónimo";
            const formattedDate = formatRelativeDate(data[`fecha_comentario_${i}`]);

            loadedTestimonials.push({
              id: `testimonial-${i}`,
              name: name,
              avatarInitial: (data[`avatar_inicial_testimonio_${i}`] || name.charAt(0) || "U").toUpperCase(),
              isLocalGuide: data[`es_local_guide_${i}`] || false,
              opinionsCount: data[`opiniones_usuario_${i}`] || 0,
              photosCount: data[`fotos_usuario_${i}`] || 0,
              rating: data[`calificacion_${i}`] || 0,
              dateRelative: formattedDate,
              isNew: data[`es_nuevo_${i}`] || false,
              text: data[`testimonio_${i}`],
              fullTextLink: data[`link_opinion_completa_${i}`] || "#",
              source: data[`red_testimonio_${i}`] || "Web",
              link: data[`link_red_testimonio_${i}`] || "#",
            });
            i++;
          }
          setTestimonials(loadedTestimonials);
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };
    fetchData();
  }, []);

  // DURACIÓN DE LA ANIMACIÓN Y DEL INTERVALO
  const animationDuration = 700; // 0.7 segundos
  const intervalTime = 10000;   // 10 segundos

  // useEffect para el cambio automático y la animación del carrusel de TESTIMONIOS (Firebase)
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setAnimationDirection('next'); // Para que la animación de salida sea hacia la derecha

        setTimeout(() => {
          setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % testimonials.length
          );
          setIsAnimating(false); // Reinicia el estado de animación para la próxima entrada
        }, animationDuration);

      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [testimonials.length, animationDuration, intervalTime]);

  // --- NUEVO useEffect para el cambio automático y la animación del carrusel de FACEBOOK ---
  useEffect(() => {
    if (facebookPosts.length > 1) {
      const interval = setInterval(() => {
        setIsFbAnimating(true);
        setFbAnimationDirection('next'); // Para que la animación de salida sea hacia la derecha

        setTimeout(() => {
          setCurrentFbIndex((prevIndex) =>
            (prevIndex + 1) % facebookPosts.length
          );
          setIsFbAnimating(false); // Reinicia el estado de animación para la próxima entrada de Facebook
        }, animationDuration);

      }, intervalTime); // Mismo intervalo

      return () => clearInterval(interval);
    }
  }, [facebookPosts.length, animationDuration, intervalTime]);
  // -----------------------------------------------------------------------------------------

  const currentTestimonial = testimonials[currentIndex];
  const currentFacebookPost = facebookPosts[currentFbIndex];

  return (
    <Section id="testimonios">


      <MainCarouselsContainer> {/* Nuevo contenedor principal para los dos carruseles */}
        {/* CARRUSEL DE TESTIMONIOS (Firebase) */}
        <CarouselWrapper>
          {testimonials.length > 0 ? (
            <CarouselContainer>
              {currentTestimonial && (
                <TestimonialCardWrapper className={isAnimating ? `animating-${animationDirection}` : ''}>
                  <div
                    className="testimonial-card"
                    onClick={() => window.open(currentTestimonial.fullTextLink, '_blank')}
                  >
                    <div className="card-top-row">
                      <div className="avatar">{currentTestimonial.avatarInitial}</div>
                      <div className="user-info">
                        <a href={currentTestimonial.link} target="_blank" rel="noopener noreferrer" className="user-name" onClick={(e) => e.stopPropagation()}>
                          {currentTestimonial.name}
                        </a>
                        <div className="user-details">
                          {currentTestimonial.isLocalGuide && <span>Local Guide • </span>}
                          {currentTestimonial.opinionsCount > 0 && <span>{currentTestimonial.opinionsCount} opiniones</span>}
                          {currentTestimonial.photosCount > 0 && <span> • {currentTestimonial.photosCount} fotos</span>}
                        </div>
                      </div>
                      {/* REEMPLAZO DEL ICONO DE REPORTE CON LA IMAGEN DE GOOGLE */}
                      <button className="report-button" aria-label="Ver opinión completa" onClick={(e) => e.stopPropagation()}>
                        <a href={currentTestimonial.fullTextLink} target="_blank" rel="noopener noreferrer" className="see-full-review" onClick={(e) => e.stopPropagation()}>
                                                      {googleLogoUrl ? (
                                                        googleLogoUrl && <img src={googleLogoUrl} className="google-logo" />                          ) : (
                            // Opcional: un icono de respaldo si la URL de Google no está disponible
                            <span>🔗</span>
                          )}
                        </a>
                      </button>
                    </div>

                    <div className="rating-info">
                      <StarRating rating={currentTestimonial.rating} />
                      <span className="date-relative">{currentTestimonial.dateRelative}</span>
                      {currentTestimonial.isNew && <span className="new-badge">NUEVO</span>}
                    </div>

                    <p className="description">
                      {currentTestimonial.text}
                      {currentTestimonial.fullTextLink && currentTestimonial.fullTextLink !== "#" && (
                        <a href={currentTestimonial.fullTextLink} target="_blank" rel="noopener noreferrer" className="see-full-review" onClick={(e) => e.stopPropagation()}>
                          Ver más opiniones                              </a>
                      )}
                    </p>
                  </div>
                </TestimonialCardWrapper>
              )}
            </CarouselContainer>
          ) : (
            <p>No hay testimonios para mostrar en este momento.</p>
          )}
        </CarouselWrapper>

        {/* CARRUSEL DE PUBLICACIONES DE FACEBOOK */}
        <CarouselWrapper>
          <CarouselContainer>
            {facebookPosts.length > 0 ? (
              currentFacebookPost && (
                <TestimonialCardWrapper className={isFbAnimating ? `animating-${fbAnimationDirection}` : ''}>
                  <FacebookIframe
                    src={currentFacebookPost.src}
                    width="500"
                    height={currentFacebookPost.height}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  ></FacebookIframe>
                </TestimonialCardWrapper>
              )
            ) : (
              <p>No hay publicaciones de Facebook para mostrar.</p>
            )}
          </CarouselContainer>
        </CarouselWrapper>
      </MainCarouselsContainer>
    </Section>
  );
}

// Keyframes para las animaciones (AHORA DERECHA A IZQUIERDA)
const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%); /* Sale hacia la derecha */
    opacity: 0;
  }
`;

const slideInLeft = keyframes`
  from {
    transform: translateX(-100%); /* Viene desde la izquierda */
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Estilos existentes (Star, Section)
const Star = styled.span`
  color: ${props => (props.$filled ? 'var(--primary-color)' : 'var(--secondary-text)')};
  font-size: 1.1rem;
  margin-right: 2px;
`;

const TestimonialCardWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  overflow: hidden;

  /* Animación de salida (la tarjeta actual se mueve hacia la derecha) */
  &.animating-next {
    animation: ${slideOutRight} 0.7s forwards; /* Usa slideOutRight con 0.7s */
  }

  /* Animación de entrada (la nueva tarjeta viene desde la izquierda) */
  &:not(.animating-next) .testimonial-card,
  &:not(.animating-next) iframe {
    animation: ${slideInLeft} 0.7s forwards; /* Usa slideInLeft con 0.7s */
  }
`;

const CarouselContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  max-width: 500px; /* Ajusta el max-width para cada carrusel */
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  min-height: 200px; /* Asegura un mínimo de altura para que el carrusel sea visible */
`;

const Section = styled.section`
  width: 100%;
  margin: 3rem auto;
  padding: 1rem 0; /* Align padding with NewContactSection */

  @media (max-width: 1080px) {
    width: 75%;
    padding: 1rem;
  }


  .section-header {
    text-align: center;
    margin-bottom: 0rem; /* Ajustado a 0 */
    h1 {
      font-size: clamp(1.8rem, 5vw, 2.2rem);
      color: var(--app-primary-text-color, var(--primary-color, var(--primary-text)));
      margin-bottom: 0.75rem;
    }
    p {
      font-size: clamp(1rem, 4vw, 1.1rem);
      color: var(--primary-text, var(--primary-text));
      max-width: 650px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }
  }


  .testimonial-card-wrapper {
  }

  .testimonial-card {
    background-color: var(--card-grey, #ffffff);
    border: 1px solid var(--border-color, var(--secondary-text));
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    cursor: pointer;

    min-width: 300px;
    max-width: 500px; /* Ajusta el max-width para la tarjeta si es necesario */
    width: 100%;

    .card-top-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color:var(--primary-text);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .user-info {
      flex-grow: 1;
      .user-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--primary-text);
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }
      .user-details {
        font-size: 0.8rem;
        color: var(--primary-text);
        span {
          margin-right: 4px;
        }
      }
    }

    .report-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        /* Remover el color de texto si solo va a haber una imagen */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem; /* Ajusta el tamaño del botón para la imagen */
        height: 2rem; /* Ajusta el tamaño del botón para la imagen */
        &:hover {
            background-color: rgba(0,0,0,0.05);
        }
        .google-logo {
            width: 100%; /* La imagen ocupa todo el ancho del botón */
            height: 100%; /* La imagen ocupa toda la altura del botón */
            object-fit: contain; /* Asegura que la imagen se escale sin cortarse */
            
            transition: filter 0.3s ease;
        }
        &:hover .google-logo {
           
        }
        /* Estilo para el icono de respaldo si la URL no está */
        span {
            font-size: 1.5rem;
            color: var(--primary-color);
        }
    }


    .rating-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: -4px;
      margin-bottom: 4px;

      .star-rating-display {
        display: flex;
      }

      .date-relative {
        font-size: 0.8rem;
        color: var(--primary-text);
      }

      .new-badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--border-color, var(--secondary-text));
        color: var(--primary-text);
        background-color: var(--card-grey, var(--white-text));
      }
    }

    .description {
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--primary-text, #202124);

      .see-full-review {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--primary-color);
        text-decoration: none;
        margin-left: 4px;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
  .testimonial-card:hover {


  }

  @media screen and (max-width: 768px) {
    width: 90%;
    .testimonial-card {
      min-width: unset;
    }
  }
`;

// --- NUEVOS ESTILOS PARA ORGANIZAR LOS CARRUSELES Y EL IFRAME ---

const MainCarouselsContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Permite que los elementos se envuelvan a la siguiente línea */
  justify-content: center; /* Centra los carruseles */
  gap: 2rem; /* Espacio entre los carruseles */
  margin-top: 3rem; /* Espacio superior para el contenedor principal */

  @media screen and (min-width: 1024px) { /* Para pantallas de escritorio */
    flex-direction: row; /* En fila */
    align-items: flex-start; /* Alinea los carruseles por arriba */
    padding: 0 1rem; /* Pequeño padding lateral para que no toque los bordes */
  }

  @media screen and (max-width: 1023px) { /* Para tablets y móviles */
    flex-direction: column; /* Apilados en columna */
    align-items: center; /* Centra los carruseles en columna */
  }
`;


const CarouselWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem; /* Espacio entre los carruseles cuando están apilados (móviles) */
  flex-grow: 1; /* Permite que crezcan para ocupar el espacio disponible */

  /* Para escritorio, cada carrusel ocupa aproximadamente la mitad del ancho */
  @media screen and (min-width: 1024px) {
    width: calc(50% - 1rem); /* 50% menos la mitad del gap para evitar overflow */
    max-width: 550px; /* Limita el ancho de cada carrusel para que no sean gigantes */
    margin-bottom: 0; /* Elimina el margen inferior en escritorio */
  }

  @media screen and (max-width: 1023px) {
    width: 90%; /* Ancho en móviles */
    max-width: 600px; /* Asegura que en móviles tampoco se haga excesivamente grande */
  }
`;

const FacebookIframe = styled.iframe`
  border: none;
  overflow: hidden;
  max-width: 100%; /* Asegura que el iframe sea responsive */
  width: 600px; /* Mantiene el ancho original pero responsive */
  height: 600px;
  border-radius: 8px; /* Aplica bordes redondeados al iframe */

  &:hover {

  }

  /* Asegura que el iframe se ajuste al contenedor del carrusel en móviles */
  @media screen and (max-width: 600px) {
    width: 100%; /* El iframe ocupa todo el ancho disponible en móviles */
  }
`;