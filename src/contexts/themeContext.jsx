// src/contexts/themeContext.js
import React, { createContext, use, useState, useEffect } from 'react';
// Importar funciones necesarias de Firebase Database
import { getDatabase, ref, onValue, set, off } from "firebase/database"; // Asegúrate de importar 'off'
import { app } from "../firebase/firebase"; // <-- ASEGÚRATE de que esta ruta a tu configuración de Firebase (donde inicializas 'app') sea CORRECTA para tu proyecto.
import { useFestiveTheme } from './FestiveThemeContext';

// Definir TODOS los colores de la paleta por defecto.
// ESTE OBJETO defaultTheme DEBE CONTENER TODAS las propiedades que esperas guardar y cargar (ej: primaryColor, appBackgroundColor, etc.)
const defaultTheme = {
  primaryColor: '#948924', // Mapea a --primary-color
  appBackgroundColor: '#ffffec', // Mapea a --app-background-color
  cardGrey: '#fdfbf5', // Mapea a --card-grey (usamos 6 dígitos para input type="color")
  primaryText: '#160529', // Mapea a --primary-text
  secondaryText: '#a79997', // Mapea a --secondary-text
  spanColor: '#c61d1d', // Mapea a --span-color
  whiteText: '#ffffff', // Mapea a --white-text
  borderColor: '#dee2e6', // Mapea a --border-color
  inputBg: '#ffffff', // Mapea a --input-bg
  hoverBg: '#eae6c6', // Mapea a --hover-bg
  shadowColor: '#e5e5e5', // Mapea a --shadow-color
};

// Crear el Contexto (sin cambios aquí)
const ThemeContext = createContext();

// Hook personalizado (sin cambios aquí)
export const useTheme = () => {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Proveedor del Contexto - Carga desde Firebase y guarda en Firebase
export const ThemeProvider = ({ children }) => {
  // Usamos el estado para mantener el tema base actual. Inicializamos con los valores por defecto.
  const [baseTheme, setBaseTheme] = useState(defaultTheme);
  const { activeFestiveTheme } = useFestiveTheme();

  // Tema final computado considerando el tema festivo
  const theme = activeFestiveTheme && activeFestiveTheme.themeOverrides
    ? { ...baseTheme, ...activeFestiveTheme.themeOverrides }
    : baseTheme;

  // Efecto para configurar el listener de Firebase al montar el componente
  useEffect(() => {
    const db = getDatabase(app);
    // Define la referencia a la ubicación en tu base de datos donde guardarás el tema
    // **RUTA:** Puedes cambiar 'appSettings/theme' si prefieres otra ruta en tu base de datos.
    const themeRef = ref(db, 'appSettings/theme');

    // Configura un listener que se dispare:
    // 1. Inmediatamente al iniciar (para cargar el estado actual)
    // 2. Cada vez que los datos cambien en esa ubicación en Firebase
    const unsubscribe = onValue(themeRef, (snapshot) => {
      const firebaseTheme = snapshot.val();
      if (firebaseTheme) {
        // Si hay datos en Firebase, actualiza el estado local del tema.
        // Fusionar con defaultTheme asegura que si añades *nuevas* propiedades al defaultTheme
        // en el código, no desaparezcan si el tema guardado en Firebase es viejo.
        setBaseTheme({ ...defaultTheme, ...firebaseTheme });
        

        // **Opcional:** Si quieres guardar también en localStorage para una carga ultra-rápida
        // antes de que llegue la respuesta de Firebase (solo visual, Firebase es la verdad):
        // localStorage.setItem('appTheme', JSON.stringify(firebaseTheme));

      } else {
        // Si no hay datos en Firebase en esa ubicación (primera vez que se carga el tema),
        // puedes iniciar con el tema por defecto.
         console.log("No theme data found in Firebase. Using default.");
         setBaseTheme(defaultTheme);
         // Opcional: Si quieres que el tema por defecto se cree en Firebase la primera vez:
         // set(themeRef, defaultTheme);
      }
    }, (error) => {
        // Manejar errores de lectura de la base de datos (ej: problemas de conexión, reglas)
        console.error("Error reading theme from Firebase:", error);
        // Si hay un error, podrías cargar desde localStorage como ÚLTIMO fallback si lo implementaste
        // const savedTheme = localStorage.getItem('appTheme');
        // if (savedTheme) setBaseTheme({ ...defaultTheme, ...JSON.parse(savedTheme) });
    });

    // Función de limpieza: Desconecta el listener cuando el componente se desmonta
    return () => {
      
      off(themeRef);
    };

  }, []); // El array de dependencias vacío [] asegura que este efecto se ejecute solo una vez al montar

  // Función para actualizar el tema
  // Se llama desde el componente de configuración (ThemeSettings)
  const updateTheme = (newTheme) => {
    // Actualiza el estado local inmediatamente para que la UI reaccione rápido
    // (Este cambio será sobreescrito en breve por la respuesta del listener de Firebase,
    // pero la percepción de respuesta es mejor).
    setBaseTheme(prevTheme => {
        const updatedState = { ...prevTheme, ...newTheme };

        // **Guarda el estado completo y actualizado en Firebase Database**
        const db = getDatabase(app);
        const themeRef = ref(db, 'appSettings/theme'); // Misma ruta que arriba
        set(themeRef, updatedState)
           .then(() => { console.log("Theme saved to Firebase successfully!"); })
           .catch((error) => { console.error("Error saving theme to Firebase:", error); });

        // Ya NO necesitamos guardar en localStorage aquí. El listener de Firebase
        // se encargará de actualizar el estado en todos los clientes (incluido este)
        // una vez que el guardado en Firebase se complete.

        return updatedState; // Retorna el nuevo estado para que React lo use temporalmente
    });
  };

  return (
    <ThemeContext value={{ theme, updateTheme }}>
      {children}
    </ThemeContext>
  );
};