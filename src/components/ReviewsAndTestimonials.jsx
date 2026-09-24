import styled, { keyframes } from "styled-components";
import { BsFillStarFill } from "react-icons/bs";
import { useState, useEffect, useRef } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import { useSwipeable } from "react-swipeable";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import EditableField from './EditableField';


// Keyframes for animations (DEFINED EARLY)
const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

const slideInLeft = keyframes`
  from {
    transform: translateX(+100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutLeft = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const slideInRight = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Styled Components (DEFINED EARLY)
const Star = styled.span`
  color: ${(props) => (props.$filled ? "var(--primary-color)" : "var(--secondary-text)")};
  font-size: 1.1rem;
  margin-right: 2px;
`;

const TestimonialCardWrapper = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
  width: 100%;

  &.animating-next .testimonial-card-content {
    animation: ${slideOutRight} 0.7s forwards;
  }

  &.animating-prev .testimonial-card-content {
    animation: ${slideOutLeft} 0.7s forwards;
  }

  &:not(.animating-next):not(.animating-prev) .testimonial-card-content.entering-next {
    animation: ${slideInLeft} 0.7s forwards;
  }

  &:not(.animating-next):not(.animating-prev) .testimonial-card-content.entering-prev {
    animation: ${slideInRight} 0.7s forwards;
  }

  
`;

const CarouselContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%; /* Constrain width to column size */
  margin: 0 auto;
  position: relative;
  min-height: 200px;
  overflow: hidden; /* Ensure arrows are clipped within this container */

  @media screen and (max-width: 1023px) {
    min-height: auto;
  }
`;

const Section = styled.section`
  width: 100%;
  margin: 2rem auto 0 auto;
  padding: 1rem 0; /* Align padding */
  text-align: center;
  
  a {
    text-decoration: none;
    color: var(--primary-text, #160529);
    transition: var(--default-transition);
  }

  @media screen and (max-width: 1023px) {
    width: 90%;
    padding: 1rem;
    height:auto;
    margin-bottom: 0.5rem;
  }
`;

const SectionHeader = styled.div`
  text-align: center;

  h1 {
    font-size: 1.5rem;;
    color: var(--app-primary-text-color, var(--primary-color, var(--primary-text)));
    margin-bottom: 0.75rem;
    width:80%;
    margin:auto;
  }
  p {
    font-size: 1rem;
    color: var(--primary-text);
    width:80%;
    margin:auto; 
    margin: 0 auto;
    line-height: 1.6;
  }
`;



const ContentContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem; /* Added gap between columns */
  width: 100%;

  @media screen and (min-width: 1081px) {
    flex-direction: row;
    align-items: flex-start;
  }

  @media screen and (max-width: 1080px) {
    flex-direction: column;
    align-items: center;
    gap: 3rem; /* Clear separation between Google and Facebook on mobile */
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  flex: 1;
  min-width: 300px;
  width: 100%;

  @media screen and (max-width: 1080px) {
    width: 100%;
    min-width: unset;
    gap: 0;
  }
`;

const RatingCard = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0; /* Removed padding so .info can stretch fully */
  width: 100%;
  box-sizing: border-box;
  
  .quill-editor-container {
    background-color: white;
    color: black;
    margin: 0.5rem 0;
  }
  
  .image {
    img {
      height: 60px;
      width: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      transition: filter 0.3s ease;
    }
    img:hover {
      filter: brightness(110%);
    }
  }

  .info {
    border-radius: 8px;
    align-items: center;
    text-align: center;
    justify-content: center;
    background-color: var(--card-grey)!important;
    display: flex;
    gap: 0rem;
    padding: 1rem;
    box-shadow: 0 6px 6px 0 var(--secondary-text),
      0 2px 6px 4px var(--secondary-text);
    margin: 1.25rem auto 0 auto;
    width: 100%;

    .details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      justify-content: center;
      text-align: center;
      align-items: center;
      margin: auto;
      width: 100%;

      .link-field {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 250px;
        cursor: pointer;
        padding: 0.2rem;
        text-align: left;
      }

      h4,
      .review,
      .stars-value {
        font-size: 1.1rem;
        margin: auto;
        justify-content: center;
        right: 0;
        left: 0;
        align-items: center;
        text-align: center;
      }

      .stars-details {
        display: flex;
        gap: 0.5rem;
        margin: auto;
        justify-content: center;
        align-items: center;
        text-align: center;

        .stars-value {
          color: var(--primary-text);
          font-size: 1.1rem;
          line-height: 1;
        }

        .reviews-stars {
          display: flex;
          align-items: center;
          justify-content: center;
          svg {
            font-size: 1.1rem; /* Unified font size */
            color: var(--app-primary-text-color, var(--primary-color));
          }
        }
      }
    }
  }

  .info:hover {
    background-color: var(--white-text);
    transition: var(--default-transition);
    box-shadow: 0 3px 3px 0 var(--secondary-text),
      0 3px 3px 3px var(--secondary-text);
  }

  @media screen and (max-width: 1080px) {
    max-width: 280px; /* Consistent max-width for mobile */
    margin: 0 auto; /* Center the card */
    
    .image {
      margin-bottom: 0.75rem;
      img {
        height: 60px;
        width: 60px;
        object-fit: contain;
      }
    }
    
    .info {
      width: 100%;
      box-sizing: border-box;
      padding: 0.85rem 0.5rem;
      margin: 0 auto;
      position: static;
      bottom: auto;
    }
    .info .details {
      font-size: 1.1rem; /* Unified font size */
    }
    .info .details .stars-details .stars-value {
      font-size: 1.1rem; /* Unified font size */
    }
    .info .details .stars-details .reviews-stars svg {
      font-size: 1.1rem; /* Unified font size */
    }
  }

  @media screen and (max-width: 768px) {
    .info .details .link-field {
      width: 150px;
    }
  }
`;

const FacebookIframe = styled.iframe`
  border: 1px solid var(--secondary-text);
 
  justify-content:center;
  border-radius: 12px;
  margin: 0 0;
  align-items:center;
  background-color: var(--white-text);
  width: 100%;
  pointer-events: none;
`;

const FacebookIframeWrapper = styled.div`
  position: relative;
  width: 25rem;
  margin: 0 auto;
  cursor: pointer;

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    display: none;
  }
`;

const GoogleTestimonialsWrapper = styled.div`
  @media screen and (max-width: 1080px) {
    display: none;
  }
`;

const FacebookTestimonialsWrapper = styled.div`
  @media screen and (max-width: 1080px) {
    display: none;
  }
`;

const TestimonialCard = styled.div`
  background-color: var(--card-grey, #ffffff);
  border: 1px solid var(--border-color, var(--secondary-text));
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  margin: 0 auto;
  position: relative;
  
@media screen and (min-width: 280px) and (max-width: 1080px) {
  width: 100%;
  }
  .card-top-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-text);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .user-info {
    flex-grow: 1;
    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-text);
      text-decoration: none;

    }
    .user-details {
      font-size: 0.7rem;
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

    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;

    .google-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    span {
      font-size: 1.4rem;
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
      font-size: 0.7rem;
      color: var(--primary-text);
    }

    .new-badge {
      font-size: 0.6rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color, var(--secondary-text));
      color: var(--primary-text);
      background-color: var(--card-grey, var(--white-text));
    }
  }

  .description {
    font-size: 0.8rem;
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
`;

// Helper component for star rating display
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

// Helper function to format relative date (IMPROVED VERSION)
const formatRelativeDate = (commentDateString) => {
  const parts = commentDateString.split(/[-/]/); // parts será ["YYYY", "MM", "DD"]
  let commentDate;

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    commentDate = new Date(year, month, day);

  } else {
    commentDate = new Date(commentDateString);
  }

  if (isNaN(commentDate.getTime())) {
    console.error("Error: Fecha inválida para el comentario:", commentDateString);
    return "Error al calcular la fecha";
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  commentDate.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - commentDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const futureDiffDays = Math.abs(diffDays);
    if (futureDiffDays === 0) return "Hoy";
    if (futureDiffDays === 1) return "Mañana";
    return `En ${futureDiffDays} día${futureDiffDays === 1 ? "" : "s"}`;
  }


  if (diffDays === 0) {
    return "Hoy";
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays === 1 ? "" : "s"}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks === 1 ? "" : "s"}`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30.4375);
    return `Hace ${months} mes${months === 1 ? "" : "es"}`;
  } else {
    const years = Math.floor(diffDays / 365.25);
    return `Hace ${years} año${years === 1 ? "" : "s"}`;
  }
};


export default function ReviewsAndTestimonials({
  isEditable = false,
  ratingsData: propRatingsData,
  tituloCalificaciones: propTitulo,
  sectionDescriptionTestimonials: propDescription,
  editingField,
  setEditingField,
  onSave,
  onFileSelect,
}) {

  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  // Internal state for standalone mode
  const [internalRatingsData, setInternalRatingsData] = useState([
    { title: 'Google', reviews: '0 opiniones', stars: '0.0', image: '', link: '#' },
    { title: 'Facebook', reviews: '0 opiniones', stars: '0.0', image: '', link: '#' }
  ]);
  const [internalTitulo, setInternalTitulo] = useState('Nuestras Calificaciones');
  const [internalDescription, setInternalDescription] = useState('Opiniones reales que podés encontrar en nuestras redes.');

  // State for Testimonials (always internal)
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState("next");
  const [googleLogoUrl, setGoogleLogoUrl] = useState("https://iili.io/d3RD4Pp.png");
  const [facebookPosts, setFacebookPosts] = useState([]);
  const [currentFbIndex, setCurrentFbIndex] = useState(0);
  const [isFbAnimating, setIsFbAnimating] = useState(false);
  const [fbAnimationDirection, setFbAnimationDirection] = useState("next");

  const handleImageClick = (target) => {
    if (isEditable) {
      setUploadTarget(target);
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    if (e.target.files && e.target.files[0] && uploadTarget) {
      onFileSelect(e.target.files[0], uploadTarget);
    }
  };

  // Fetch data for standalone mode
  useEffect(() => {
    if (!propRatingsData) {
      const fetchDataCalificaciones = async () => {
        const db = getDatabase(app);
        const dbRef25 = ref(db, "datosId/25");
        const snapshot25 = await get(dbRef25);
        if (snapshot25.exists()) {
          const data = snapshot25.val();
          setInternalRatingsData([
            // Index 0 (Left) is Google
            { title: data.nombre_red_2 || 'Google', reviews: `${data.cantidad_calificaciones_google || '0'} opiniones`, stars: data.estrellas_google || '0.0', image: data.link_imagen_Maps || '', link: data.link_google || '#' },
            // Index 1 (Right) is Facebook
            { title: data.nombre_red_1 || 'Facebook', reviews: `${data.cantidad_calificaciones_facebook || '0'} opiniones`, stars: data.estrellas_facebook || '0.0', image: data.link_imagen_facebook || '', link: data.link_facebook || '#' }
          ]);
        }

        const dbRef29 = ref(db, "datosId/29");
        const snapshot29 = await get(dbRef29);
        if (snapshot29.exists()) {
          const data = snapshot29.val();
          setInternalTitulo(data.contenido30 || 'Nuestras Calificaciones');
          setInternalDescription(data.contenido32 || 'Opiniones reales que podés encontrar en nuestras redes.');
        }
      };
      fetchDataCalificaciones();
    }
  }, [propRatingsData]);

  const ratingsData = propRatingsData || internalRatingsData;
  const tituloCalificaciones = propTitulo !== undefined ? propTitulo : internalTitulo;
  const sectionDescriptionTestimonials = propDescription !== undefined ? propDescription : internalDescription;

  const normalizeTestimonioPublico = (t, index) => {
    return {
      id: `new-testimonial-${index}`,
      name: t.nombre || "Usuario Anónimo",
      avatarInitial: (t.avatar || t.nombre?.charAt(0) || "U").toUpperCase(),
      isLocalGuide: t.es_local_guide || false,
      opinionsCount: t.opiniones_usuario,
      photosCount: t.fotos_usuario,
      rating: parseFloat(t.calificacion) || 0,
      dateRelative: formatRelativeDate(t.fecha),
      isNew: t.es_nuevo,
      text: t.texto,
      fullTextLink: t.link_opinion_completa || "#",
      source: t.red || "Google",
      link: t.link_red_testimonio || "#",
    };
  };

  const handleNextGoogle = () => {
    setIsAnimating(true);
    setAnimationDirection("next");
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      setIsAnimating(false);
    }, animationDuration);
  };

  const handlePrevGoogle = () => {
    setIsAnimating(true);
    setAnimationDirection("prev");
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
      setIsAnimating(false);
    }, animationDuration);
  };

  useEffect(() => {
    const fetchDataTestimonials = async () => {
      const db = getDatabase(app);
      let allGoogleTestimonials = [];
      try {
        const newTestimonialsDataRef = ref(db, `datosId/1/testimonios`);
        const newTestimonialsSnapshot = await get(newTestimonialsDataRef);
        if (newTestimonialsSnapshot.exists()) {
          const newTestimonialsRaw = newTestimonialsSnapshot.val();
          const newTestimonialsArray = Array.isArray(newTestimonialsRaw) ? newTestimonialsRaw : Object.values(newTestimonialsRaw || {});
          const normalizedNewTestimonials = newTestimonialsArray.map(normalizeTestimonioPublico);
          allGoogleTestimonials = normalizedNewTestimonials;
        } else {
          console.log("No testimonials found at datosId/1/testimonios.");
        }
        setTestimonials(allGoogleTestimonials);
      } catch (error) {
        console.error("Error fetching data from Firebase for testimonials:", error);
      }
    };
    fetchDataTestimonials();
  }, []);

  useEffect(() => {
    const fetchFacebookPosts = async () => {
      const db = getDatabase(app);
      const postsRef = ref(db, 'datosId/1/publicaciones_embebidas');
      try {
        const snapshot = await get(postsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const postsArray = Array.isArray(data) ? data.filter(p => p) : Object.values(data || {});
          setFacebookPosts(postsArray);
        } else {
          console.log("No se encontraron publicaciones embebidas de Facebook en la base de datos.");
          setFacebookPosts([]);
        }
      } catch (error) {
        console.error("Error al obtener las publicaciones de Facebook desde Firebase:", error);
        setFacebookPosts([]);
      }
    };
    fetchFacebookPosts();
  }, []);

  const animationDuration = 700;
  const intervalTime = 9000;

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setAnimationDirection("next");
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
          setIsAnimating(false);
        }, animationDuration);
      }, intervalTime);
      return () => clearInterval(interval);
    }
  }, [testimonials.length, animationDuration, intervalTime]);

  useEffect(() => {
    if (facebookPosts.length > 1) {
      const interval = setInterval(() => {
        setIsFbAnimating(true);
        setFbAnimationDirection("next");
        setTimeout(() => {
          setCurrentFbIndex((prevIndex) => (prevIndex + 1) % facebookPosts.length);
          setIsFbAnimating(false);
        }, animationDuration);
      }, intervalTime);
      return () => clearInterval(interval);
    }
  }, [facebookPosts.length, animationDuration, intervalTime]);



  const currentTestimonial = testimonials[currentIndex];
  const currentFacebookPost = facebookPosts[currentFbIndex];

  const googleSwipeHandlers = useSwipeable({
    onSwipedLeft: handleNextGoogle,
    onSwipedRight: handlePrevGoogle,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const handleNextFacebook = () => {
    setIsFbAnimating(true);
    setFbAnimationDirection("next");
    setTimeout(() => {
      setCurrentFbIndex((prevIndex) => (prevIndex + 1) % facebookPosts.length);
      setIsFbAnimating(false);
    }, animationDuration);
  };

  const handlePrevFacebook = () => {
    setIsFbAnimating(true);
    setFbAnimationDirection("prev");
    setTimeout(() => {
      setCurrentFbIndex((prevIndex) => (prevIndex - 1 + facebookPosts.length) % facebookPosts.length);
      setIsFbAnimating(false);
    }, animationDuration);
  };

  const facebookSwipeHandlers = useSwipeable({
    onSwipedLeft: handleNextFacebook,
    onSwipedRight: handlePrevFacebook,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const commonEditableProps = { isEditable, editingField, setEditingField, onSave };

  return (
    <Section id="reviews-and-testimonials">
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} style={{ display: 'none' }} accept="image/*" />
      <SectionHeader>
        <EditableField as="h1" fieldKey="main_title" value={tituloCalificaciones} {...commonEditableProps} />
        <EditableField as="p" fieldKey="main_description" value={sectionDescriptionTestimonials} {...commonEditableProps} />
      </SectionHeader>

      <ContentContainer>
        {/* Left Column: Google Ratings & Testimonials */}
        <Column>
          {ratingsData && ratingsData[0] && (
            isEditable ? (
              <RatingCard>
                <div className="image">
                  <img
                    src={ratingsData[0].image || null}
                    alt={ratingsData[0].title}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"; }}
                    onClick={(e) => {
                      if (isEditable) {
                        e.preventDefault();
                        handleImageClick('google_image');
                      }
                    }}
                    style={isEditable ? { cursor: 'pointer' } : {}}
                  />
                </div>
                <div className="info">
                  <div className="details">
                    <EditableField as="h4" fieldKey="google_title" value={ratingsData[0].title} {...commonEditableProps} />
                    <EditableField as="span" className="review" fieldKey="google_reviews" value={ratingsData[0].reviews} isNumeric={true} {...commonEditableProps} />
                    <div className="stars-details">
                      <EditableField as="span" className="stars-value" fieldKey="google_stars" value={ratingsData[0].stars} {...commonEditableProps} />
                      <div className="reviews-stars"><BsFillStarFill /></div>
                    </div>
                    {isEditable && (
                      <>
                        <EditableField as="p" fieldKey="google_link" value={ratingsData[0].link} {...commonEditableProps} className="link-field" />
                      </>
                    )}
                  </div>
                </div>
              </RatingCard>
            ) : (
              <a href={ratingsData[0].link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
                <RatingCard>
                  <div className="image">
                    <img
                      src={ratingsData[0].image || null}
                      alt={ratingsData[0].title}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"; }}
                      onClick={(e) => {
                        if (isEditable) {
                          e.preventDefault();
                          handleImageClick('google_image');
                        }
                      }}
                      style={isEditable ? { cursor: 'pointer' } : {}}
                    />
                  </div>
                  <div className="info">
                    <div className="details">
                      <EditableField as="h4" fieldKey="google_title" value={ratingsData[0].title} {...commonEditableProps} />
                      <EditableField as="span" className="review" fieldKey="google_reviews" value={ratingsData[0].reviews} isNumeric={true} {...commonEditableProps} />
                      <div className="stars-details">
                        <EditableField as="span" className="stars-value" fieldKey="google_stars" value={ratingsData[0].stars} {...commonEditableProps} />
                        <div className="reviews-stars"><BsFillStarFill /></div>
                      </div>
                      {isEditable && (
                        <>
                          <EditableField as="p" fieldKey="google_link" value={ratingsData[0].link} {...commonEditableProps} className="link-field" />
                        </>
                      )}
                    </div>
                  </div>
                </RatingCard>
              </a>
            )
          )}

          <GoogleTestimonialsWrapper>
            <CarouselWrapper>
              {testimonials.length > 0 ? (
                <CarouselContainer {...googleSwipeHandlers}>
                  <ArrowButton direction="left" onClick={handlePrevGoogle}><BsChevronLeft /></ArrowButton>
                  {currentTestimonial && (
                    <TestimonialCardWrapper className={isAnimating ? `animating-${animationDirection}` : ""}>
                      <div className={`testimonial-card-content ${isAnimating ? '' : `entering-${animationDirection}`}`}>
                        <TestimonialCard onClick={() => {
                          const targetLink = (currentTestimonial.fullTextLink && currentTestimonial.fullTextLink !== '#') 
                            ? currentTestimonial.fullTextLink 
                            : (ratingsData[0]?.link && ratingsData[0].link !== '#' ? ratingsData[0].link : null);
                          if (targetLink) window.open(targetLink, '_blank');
                        }}>
                          <div className="card-top-row">
                            <div className="avatar">{currentTestimonial.avatarInitial}</div>
                            <div className="user-info">
                              <p className="user-name">{currentTestimonial.name}</p>
                              <div />
                              <div className="user-details">
                                {currentTestimonial.isLocalGuide && <span>Local Guide • </span>}
                                {currentTestimonial.opinionsCount > 0 && <span>{currentTestimonial.opinionsCount} opiniones</span>}
                                {currentTestimonial.photosCount > 0 && <span> • {currentTestimonial.photosCount} fotos</span>}
                              </div>
                            </div>
                            <button className="report-button" aria-label="Ver opinión completa" onClick={(e) => {
                              e.stopPropagation();
                              const targetLink = (currentTestimonial.fullTextLink && currentTestimonial.fullTextLink !== '#') 
                                ? currentTestimonial.fullTextLink 
                                : (ratingsData[0]?.link && ratingsData[0].link !== '#' ? ratingsData[0].link : null);
                              if (targetLink) window.open(targetLink, '_blank');
                            }}>
                              <p>{googleLogoUrl ? <img src={googleLogoUrl} alt="google logo" className="google-logo" /> : <span>🔗</span>}</p>
                            </button>
                          </div>
                          <div className="rating-info">
                            <StarRating rating={currentTestimonial.rating} />
                            <span className="date-relative">{currentTestimonial.dateRelative}</span>
                            {currentTestimonial.isNew && <span className="new-badge">NUEVO</span>}
                          </div>
                          <p className="description">
                            {currentTestimonial.text}
                            {ratingsData[0] && ratingsData[0].link && ratingsData[0].link !== "#" && (
                              <a href={ratingsData[0].link} target="_blank" rel="noopener noreferrer" className="see-full-review" onClick={(e) => e.stopPropagation()}>Ver más opiniones</a>
                            )}
                          </p>
                        </TestimonialCard>
                      </div>
                    </TestimonialCardWrapper>
                  )}
                  <ArrowButton direction="right" onClick={handleNextGoogle}><BsChevronRight /></ArrowButton>
                </CarouselContainer>
              ) : (
                <p>No hay testimonios de Google para mostrar en este momento.</p>
              )}
            </CarouselWrapper>
          </GoogleTestimonialsWrapper>
        </Column>

        {/* Right Column: Facebook Ratings & Testimonials */}
        <Column>
          {ratingsData && ratingsData[1] && (
            isEditable ? (
              <RatingCard>
                <div className="image">
                  <img
                    src={ratingsData[1].image || null}
                    alt={ratingsData[1].title}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"; }}
                    onClick={(e) => {
                      if (isEditable) {
                        e.preventDefault();
                        handleImageClick('facebook_image');
                      }
                    }}
                    style={isEditable ? { cursor: 'pointer' } : {}}
                  />
                </div>
                <div className="info">
                  <div className="details">
                    <EditableField as="h4" fieldKey="facebook_title" value={ratingsData[1].title} {...commonEditableProps} />
                    <EditableField as="span" className="review" fieldKey="facebook_reviews" value={ratingsData[1].reviews} isNumeric={true} {...commonEditableProps} />
                    <div className="stars-details">
                      <EditableField as="span" className="stars-value" fieldKey="facebook_stars" value={ratingsData[1].stars} {...commonEditableProps} />
                      <div className="reviews-stars"><BsFillStarFill /></div>
                    </div>
                    {isEditable && (
                      <>
                        <EditableField as="p" fieldKey="facebook_link" value={ratingsData[1].link} {...commonEditableProps} className="link-field" />
                      </>
                    )}
                  </div>
                </div>
              </RatingCard>
            ) : (
              <a href={ratingsData[1].link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
                <RatingCard>
                  <div className="image">
                    <img
                      src={ratingsData[1].image || null}
                      alt={ratingsData[1].title}
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"; }}
                      onClick={(e) => {
                        if (isEditable) {
                          e.preventDefault();
                          handleImageClick('facebook_image');
                        }
                      }}
                      style={isEditable ? { cursor: 'pointer' } : {}}
                    />
                  </div>
                  <div className="info">
                    <div className="details">
                      <EditableField as="h4" fieldKey="facebook_title" value={ratingsData[1].title} {...commonEditableProps} />
                      <EditableField as="span" className="review" fieldKey="facebook_reviews" value={ratingsData[1].reviews} isNumeric={true} {...commonEditableProps} />
                      <div className="stars-details">
                        <EditableField as="span" className="stars-value" fieldKey="facebook_stars" value={ratingsData[1].stars} {...commonEditableProps} />
                        <div className="reviews-stars"><BsFillStarFill /></div>
                      </div>
                      {isEditable && (
                        <>
                          <EditableField as="p" fieldKey="facebook_link" value={ratingsData[1].link} {...commonEditableProps} className="link-field" />
                        </>
                      )}
                    </div>
                  </div>
                </RatingCard>
              </a>
            )
          )}

          <FacebookTestimonialsWrapper>
            <CarouselWrapper>
              {facebookPosts.length > 0 ? (
                <CarouselContainer {...facebookSwipeHandlers}>
                  <ArrowButton direction="left" onClick={handlePrevFacebook}><BsChevronLeft /></ArrowButton>
                  {currentFacebookPost && (
                    <TestimonialCardWrapper className={isFbAnimating ? `animating-${fbAnimationDirection}` : ""}>
                      <div className={`testimonial-card-content ${isFbAnimating ? '' : `entering-${fbAnimationDirection}`}`}>
                        {currentFacebookPost && currentFacebookPost.src ? (
                          <FacebookIframeWrapper onClick={() => {
                            const url = new URL(currentFacebookPost.src);
                            const href = url.searchParams.get('href');
                            if (href) window.open(href, '_blank');
                          }}>
                            <FacebookIframe key={currentFacebookPost.src} src={currentFacebookPost.src} height={currentFacebookPost.height || '500'} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" />
                          </FacebookIframeWrapper>
                        ) : (
                          <p>No se pudo cargar la publicación.</p>
                        )}
                      </div>
                    </TestimonialCardWrapper>
                  )}
                  <ArrowButton direction="right" onClick={handleNextFacebook}><BsChevronRight /></ArrowButton>
                </CarouselContainer>
              ) : (
                <p>No hay publicaciones de Facebook para mostrar.</p>
              )}
            </CarouselWrapper>
          </FacebookTestimonialsWrapper>
        </Column>
      </ContentContainer>
    </Section>
  );
}

const CarouselWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  margin-top: 2rem;
  width: 100%;

  @media screen and (min-width: 1024px) {
    width: 100%; 
    margin-bottom: 0;
  }

  @media screen and (max-width: 1023px) {
    max-width: 300px; /* Consistent max-width for mobile */
    margin: 0 auto; /* Center the carousel */
  }
`;

const ArrowButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  
  background-color: rgba(255, 255, 255, 0.3); /* More transparent */
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;

  ${(props) => (props.direction === "left" ? `left: 0rem;` : `right: 0rem;`)} /* Directly on the edges */

  &:hover {
    background-color: rgba(255, 255, 255, 0.6); /* Slightly less transparent on hover */
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    display:none;
  }
`;
