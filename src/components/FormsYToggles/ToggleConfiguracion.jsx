import React, { useState } from "react";
import styled from "styled-components";
import FormPublicacionesEmbebidas from "./FormPublicacionesEmbebidas";
import FormPlantillaRecibo from "./FormPlantillaRecibo";
import FormTestimonios from "./FormTestimonios";
import FormIA from "./FormIA";
import AdminKnowledgeBaseEditor from "../FormsYToggles/AdminKnowledgeBaseEditor";
import CalendariosAdmin from "../Admin/CalendariosAdmin";
import FormImagenes from "./FormImagenes";
import InstagramAdminSettings from "./InstagramAdminSettings.jsx";
import ThemeSettings from "./ThemeSettings"; // Integrated Colores tab
import FormPrevisualizaciones from "./FormPrevisualizaciones";
import FormEmbudoReserva from "./FormEmbudoReserva"; // Import the new component
import FormEstadisticas from "./FormEstadisticas";

function ToggleConfiguracion() {
    const [toggleState, setToggleState] = useState(0);
    const toggleTab = (index) => {
        setToggleState(index);
    };

    return (
        <Section>

            <div className="container">

                <div className="bloc-tabs">

                    <ul className="header">

                        <li
                            className={toggleState === 40 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(40), setToggleState(40) }}
                        >
                            Colores (Apariencia)
                        </li>

                        <li
                            className={toggleState === 41 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(41), setToggleState(41) }}
                        >
                            Calendarios
                        </li>

                        <li
                            className={toggleState === 32 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(32), setToggleState(32) }}
                        >
                            Plantilla de recibo
                        </li>

                        <li
                            className={toggleState === 36 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(36), setToggleState(36) }}
                        >
                            Redes y Video
                        </li>

                        <li
                            className={toggleState === 1 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(1), setToggleState(1) }}
                        >
                            Testimonios google
                        </li>

                        <li
                            className={toggleState === 2 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(2), setToggleState(2) }}
                        >
                            Testimonios Facebook
                        </li>

                        <li
                            className={toggleState === 35 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(35), setToggleState(35) }}
                        >
                            Indicaciones para la IA
                        </li>

                        <li
                            className={toggleState === 34 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(34), setToggleState(34) }}
                        >
                            Resumen por IA
                        </li>

                        <li
                            className={toggleState === 28 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(28), setToggleState(28) }}
                        >
                            Plano
                        </li>

                        <li
                            className={toggleState === 42 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(42), setToggleState(42) }}
                        >
                            Previsualizaciones
                        </li>

                        <li
                            className={toggleState === 43 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(43), setToggleState(43) }}
                        >
                            Embudo de reserva
                        </li>

                        <li
                            className={toggleState === 44 ? "tabs active-tabs" : "tabs"}
                            onClick={() => { toggleTab(44), setToggleState(44) }}
                        >
                            Estadísticas
                        </li>
                    </ul>
                </div>


                <div className="content-tabs">

                    {/* toggle 0 = Vacío */}

                    <div className={toggleState === 0 ? "content  active-content" : "content"}>

                    </div>







                    {/* Toggle 36 = Aclaraciones */}



                    {/* Toggle 1 = Testimonios */}

                    <div className={toggleState === 1 ? "content  active-content" : "content"}>

                        <div className="mes">

                            <FormTestimonios toggle="1" />

                        </div>



                    </div>

                    {/* Toggle 2 = Publicaciones embebidas */}

                    <div className={toggleState === 2 ? "content  active-content" : "content"}>

                        <div className="mes">

                            <FormPublicacionesEmbebidas toggle={1} />

                        </div>



                    </div>



                    {/* Toggle 28 = Links de imagenes */}
                    <div className={toggleState === 28 ? "content  active-content" : "content"}>

                        <div className="mes">

                            <FormImagenes toggle="28" />
                        </div>



                    </div>




                    {/* Toggle 32 = Plantilla de recibos */}
                    <div className={toggleState === 32 ? "content  active-content" : "content"}>

                        <div className="mes">

                            <FormPlantillaRecibo toggle="32" />
                        </div>



                    </div>

                    {/* Toggle 34 = Resumen por IA */}
                    <div className={toggleState === 34 ? "content  active-content" : "content"}>

                        <div className="mes">
                            <FormIA toggle="34" />
                        </div>



                    </div>

                    {/* Toggle 35 = Base de Conocimiento IA */}
                    <div className={toggleState === 35 ? "content  active-content" : "content"}>

                        <div className="mes">

                            <AdminKnowledgeBaseEditor />
                        </div>

                    </div>

                    {/* Toggle 36 = Redes y Video */}
                    <div className={toggleState === 36 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <InstagramAdminSettings />
                        </div>
                    </div>






                    {/* Toggle 40 = ThemeSettings (Colores) */}
                    <div className={toggleState === 40 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <ThemeSettings />
                        </div>
                    </div>

                    {/* Toggle 41 = Calendarios */}
                    <div className={toggleState === 41 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <CalendariosAdmin />
                        </div>
                    </div>

                    {/* Toggle 42 = Previsualizaciones */}
                    <div className={toggleState === 42 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <FormPrevisualizaciones />
                        </div>
                    </div>

                    {/* Toggle 43 = Embudo de Reserva */}
                    <div className={toggleState === 43 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <FormEmbudoReserva />
                        </div>
                    </div>

                    {/* Toggle 44 = Estadísticas */}
                    <div className={toggleState === 44 ? "content  active-content" : "content"}>
                        <div className="mes">
                            <FormEstadisticas />
                        </div>
                    </div>
                </div>

                {/* Fin de toggles */}

            </div>


        </Section >
    );
}


export default ToggleConfiguracion;

const Section = styled.section`
h1{
margin-top:0rem;

}
.mes{
padding-top:70px;

}
.container{
    .bloc-tabs{
    display: flex;
    position: fixed;
    
    left: 0; /* Align to the left */
    right: 0; /* Span full width */
   
    box-sizing: border-box; /* Include padding and border in the element's total width */

        .header{
        top:25px; /* Position 20px from the top */
        border-radius:5px;
         display: grid;
         grid-template-columns: repeat(12, 1fr);
        li{
        font-size:0.8rem;
        }
            li:hover{
            cursor: pointer;
            background-color: var(--app-primary-text-color, var(--primary-color));
            transition: var(--default-transition);

            }
        }
    }
}


  @media screen and (min-width: 280px) and (max-width: 1080px) {

.container{
    .bloc-tabs{
        .header{
        top: 25px; /* Position 20px from the top */
        grid-template-columns: repeat(4, 1fr);
        li{
        font-size:0.7rem;
        }
            li:hover{}
        }
    }
}
.mes{
    padding-top:90px;
}
}

`
