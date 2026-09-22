// src/components/FormsYToggles/ThemeSettings.jsx
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { useTheme } from '../../contexts/themeContext'; // Asegúrate de que la ruta sea correcta

const GlobalStyle = createGlobalStyle`
  .form-theme-settings {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 0rem;
  }

  .form-theme-settings h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: var(--primary-text, #333);
  }

  .theme-settings-card {
    border: 1px solid var(--border-color, #ccc);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: var(--input-bg, #fff);
    box-shadow: 0 0 10px var(--shadow-color, rgba(0, 0, 0, 0.1));
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color, #eee);

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    label {
      margin-right: 10px;
      font-weight: bold;
      color: var(--primary-text, #000); // Usar la variable CSS real
      flex: 1;
      line-height: 1.3;
    }

    .color-picker-group {
      display: flex;
      align-items: center;
    }

    input[type="color"] {
      padding: 0;
      border: none;
      width: 40px;
      height: 40px;
      cursor: pointer;
      background: none;
      flex-shrink: 0;
      &::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      &::-webkit-color-swatch {
        border: 1px solid #ccc;
        border-radius: 6px;
      }
       &::-moz-color-swatch-wrapper {
        padding: 0;
      }
      &::-moz-color-swatch {
        border: 1px solid #ccc;
        border-radius: 6px;
      }
    }
     span {
        margin-left: 10px;
        font-family: monospace;
        color: var(--primary-text, #000); // Usar la variable CSS real
        width: 70px; /* Fixed width to align hex codes nicely */
     }
  }

  @media screen and (max-width: 480px) {
    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .setting-item label {
      margin-right: 0;
      width: 100%;
    }
  }
`;

// Función para convertir camelCase a un texto más legible para las etiquetas (sin cambios)
const camelCaseToLabel = (text) => {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// Mapeo manual para etiquetas más amigables (añade la nueva etiqueta)
const customLabels = {
  primaryColor: 'Color Principal / Acento',
  appBackgroundColor: 'Color de Fondo de la App',
  primaryText: 'Color de Texto General',
  secondaryText: 'Color de Texto Secundario',
  spanColor: 'Color para Span / Destacado',
  whiteText: 'Color blanco',
  cardGrey: 'Color crema',
  borderColor: 'Color de Bordes',
  inputBg: 'Fondo de Entradas/Inputs',
  hoverBg: 'Fondo al Pasar Cursor (Hover)',
  shadowColor: 'Color de Sombra',
};


const ThemeSettings = () => {
  const { theme, updateTheme } = useTheme();

  // Función genérica para manejar el cambio de cualquier color en el tema (sin cambios)
  const handleColorChange = (key) => (event) => {
    updateTheme({ [key]: event.target.value });
  };

  // Define la lista de claves del tema que QUIERES mostrar en la interfaz (añade la nueva clave)
  const keysToShow = [
    'primaryColor',
    'appBackgroundColor',
    'primaryText',
    'secondaryText',
    'spanColor',
    'whiteText',
    'cardGrey', // <-- Añade esta clave a la lista para que se muestre el selector
    'borderColor',
    'inputBg',
    'hoverBg',
    'shadowColor',
  ];

  // ... el resto del componente (el return con el .map) permanece sin cambios ...
  // (El map ya itera sobre keysToShow y usa customLabels)

  return (
    <>
      <GlobalStyle />
      <div className="form-theme-settings">
        <h2>Colores de la app</h2>
        <div className="theme-settings-card">
          {keysToShow.map(key => {
            if (Object.hasOwn(theme, key)) {
              return (
                <div className="setting-item" key={key}>
                  <label htmlFor={key}>{customLabels[key] || camelCaseToLabel(key)}:</label>
                  <div className="color-picker-group">
                    <input
                      type="color"
                      id={key}
                      value={theme[key]}
                      onChange={handleColorChange(key)}
                    />
                    <span>{theme[key]}</span>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
};

export default ThemeSettings;

