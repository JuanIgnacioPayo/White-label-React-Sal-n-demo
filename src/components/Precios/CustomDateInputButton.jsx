import React from 'react';
import styled from 'styled-components';

const CustomDateInputButton = ({ ref, value, onClick, className, id }) => {
    // Determinamos si el placeholder está activo (es decir, no hay 'value')
    const isPlaceholderVisible = !value;

    // Aquí puedes simplificar la construcción del className,
    // ya que styled-components maneja bien las props.
    // Aunque tu forma actual con .trim() también funciona.
    // Podrías pasar 'isPlaceholderVisible' directamente a los estilos si lo prefieres,
    // o mantener la clase como lo haces ahora.
    const buttonClassName = `${className || ''} ${isPlaceholderVisible ? 'placeholder-active' : ''}`;

    const placeholderText = 'Ingresá una fecha acá para ver los precios';

    return (
      // Elimina la etiqueta <Section id="DatePicker"> que envuelve al botón,
      // ya que esta Section ya envuelve al DatePicker completo en el componente padre.
      // El botón en sí mismo ya recibe los estilos a través de la clase 'date-picker'.
      <button
        type="button"
        className={buttonClassName} // Ya no hace falta .trim() si 'className' está bien definido.
        onClick={onClick}
        ref={ref}
        id={id}
      >
        {value || placeholderText} {/* Se muestra el valor o el placeholder */}
      </button>
    );
  };

CustomDateInputButton.displayName = 'CustomDateInputButton';

export default CustomDateInputButton;



const Section = styled.section`
  .date-picker {
    width: 13.85rem;
    height: 2rem;
    border-radius: 5px;
    font-size: 0.72rem;
    font-family: 'product_sansregular';
    text-align: center;
    font-weight: bold;
    border: 1px solid var(--app-primary-text-color, var(--primary-color));
    background-color: rgb(15, 255, 39);
    z-index: 10000;
    cursor: pointer;
    color: var(--primary-text); // Color del texto cuando hay una fecha seleccionada
    text-shadow: 1px 1px 1px var(--white-text);
    padding: 0;

    // Estilo para cuando el placeholder está activo
    &.placeholder-active {
      color: gray; // **MODIFICACIÓN AQUÍ**: Un color distinto para el placeholder
      font-weight: normal; // Opcional: el placeholder podría ser menos "bold"
      text-shadow: none; // Opcional: quita la sombra del texto para el placeholder
    }
  }
`;