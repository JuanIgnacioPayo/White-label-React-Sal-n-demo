import { useLoading } from '../contexts/LoadingContext';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Square, ExternalLink, RotateCcw } from 'lucide-react';

// Datos de la guía actualizados para flujo de clonación
const initialGuideData = [
  {
    id: 's1',
    title: 'Paso 1: Preparación y Clonación del Proyecto Base',
    isOpen: true,
    tasks: [
      {
        id: 's1t1',
        text: 'Cerrar sesión de Firebase CLI (si aplica al contexto actual): Ejecutar `firebase logout` en la terminal.',
        isDone: false,
        details: 'Esto desconectará la Firebase CLI de cualquier cuenta de Firebase activa en esta sesión de terminal, evitando posibles conflictos con el nuevo proyecto.'
      },
      {
        id: 's1t2',
        text: 'Duplicar la carpeta completa del proyecto base (ej. "react-salon-base") a una nueva ubicación con un nombre descriptivo (ej. "react-salon-demo").',
        isDone: false,
        details: 'Copia y pega la carpeta completa de tu proyecto React existente que servirá como base para tu nuevo proyecto. Este será el punto de partida para el nuevo cliente.'
      },
      {
        id: 's1t3',
        text: 'Navegar al directorio del proyecto CLONADO: `cd ruta/al/react-salon-luz-de-luna`.',
        isDone: false,
        details: 'Asegúrate de estar trabajando dentro de la carpeta recién duplicada para evitar modificar el proyecto original.'
      },
      {
        id: 's1t4',
        text: 'Eliminar la carpeta `.git` del proyecto CLONADO para desvincular completamente el historial anterior.',
        isDone: false,
        details: 'Ejecutar `rm -rf .git` (en Mac/Linux) o `rd /s /q .git` (en Windows) en la raíz de tu proyecto CLONADO. ¡CUIDADO! Esto elimina todo el historial de Git local. Es el paso recomendado si quieres un historial limpio para el nuevo proyecto independiente.'
      },
      {
        id: 's1t5',
        text: 'Inicializar un nuevo repositorio Git en el proyecto CLONADO: `git init`.',
        isDone: false,
        details: 'Esto crea un nuevo repositorio Git vacío para tu proyecto clonado, listo para su propio historial de versiones.'
      },
      {
        id: 's1t6',
        text: 'Crear un nuevo repositorio en GitHub, GitLab, Bitbucket, etc., para el proyecto del nuevo cliente (ej. "salon-demo-app").',
        isDone: false,
        details: 'Este será el nuevo hogar remoto para tu proyecto clonado. No lo vincules aún, solo créalo.'
      },
      {
        id: 's1t7',
        text: 'Limpiar/Revisar dependencias: Ejecutar `npm install` o `yarn install`.',
        isDone: false,
        details: 'Es buena práctica reinstalar las dependencias en el nuevo clon para asegurar que todo esté correcto y para generar un `package-lock.json` o `yarn.lock` limpio si es necesario.'
      },
    ],
  },
  {
    id: 's2',
    title: 'Paso 2: Limpieza Profunda de Datos del Salón Anterior',
    isOpen: false,
    tasks: [
      {
        id: 's2t1',
        text: 'Reemplazar el logo y las imágenes de marca en `src/assets/`.',
        isDone: false,
        details: 'Sustituye `logo.png`, `gemini-icon.svg.png` y cualquier otra imagen que identifique al cliente anterior por los nuevos assets de "Salón Demo".'
      },
      {
        id: 's2t2',
        text: 'Actualizar el título y las meta descripciones en `index.html`.',
        isDone: false,
        details: 'Abre `index.html` en la raíz del proyecto y cambia el contenido de la etiqueta `<title>` y las meta etiquetas de descripción para reflejar "Salón Demo" y sus servicios.'
      },
      {
        id: 's2t3',
        text: 'Revisar y modificar textos hardcodeados en componentes React.',
        isDone: false,
        subTasks: [
          { id: 's2t3st1', text: 'Componentes principales: `src/components/Header.jsx`, `src/components/Footer.jsx`, `src/components/Home.jsx`, `src/components/QuienesSomos.jsx`.', isDone: false, details: 'Busca y reemplaza el nombre del salón anterior, direcciones, teléfonos, eslóganes y cualquier texto específico del cliente anterior.' },
          { id: 's2t3st2', text: 'Componentes de contenido: `src/components/Aclaraciones.jsx`, `src/components/Testimonial.jsx`, `src/components/Testimonial2.jsx`.', isDone: false, details: 'Asegúrate de que no haya referencias al cliente anterior en estos componentes.' },
          { id: 's2t3st3', text: 'Otros componentes: Revisa cualquier otro componente que pueda contener texto o datos específicos del cliente.', isDone: false, details: 'Utiliza la función de búsqueda de tu editor de código para buscar marcas o frases clave anteriores.' },
        ]
      },
      {
        id: 's2t4',
        text: 'Limpiar o adaptar archivos de datos en `src/data/` y `functions/`.',
        isDone: false,
        subTasks: [
          { id: 's2t4st1', text: 'Archivos de datos: `src/data/knowledge_base.json`, `src/data/serviciosOpcionales.js`.', isDone: false, details: 'Elimina o modifica los datos que sean específicos del cliente anterior. Por ejemplo, preguntas y respuestas del chatbot, o servicios que no apliquen.' },
          { id: 's2t4st2', text: 'Funciones de Firebase: `functions/bot_data.json`, `functions/knowledge_base.json`.', isDone: false, details: 'Si estas funciones contienen datos específicos, actualízalos o elimínalos. Es crucial para el chatbot.' },
        ]
      },
      {
        id: 's2t5',
        text: 'Revisar `package.json` y `vite.config.js` para nombres de proyecto o configuraciones específicas.',
        isDone: false,
        details: 'Cambia el campo `name` en `package.json` a algo como "salon-demo-app". Revisa `vite.config.js` por si hay alguna configuración de proxy o base URL específica.'
      },
      {
        id: 's2t6',
        text: 'Eliminar archivos de configuración de Firebase del proyecto anterior: `firebase.json`, `.firebaserc` (en la raíz del proyecto clonado).',
        isDone: false,
        details: 'Estos archivos se regenerarán o crearán al inicializar Firebase para el nuevo proyecto. Si los modificas manualmente, asegúrate de que apunten al nuevo ID de proyecto.'
      },
      {
        id: 's2t7',
        text: 'Revisar `src/databaserules.json` y `cors.json` para reglas o dominios específicos del cliente anterior.',
        isDone: false,
        details: 'Asegúrate de que las reglas de la base de datos y la configuración CORS no hagan referencia al dominio o IDs del cliente anterior. Deberás adaptarlas al nuevo proyecto Firebase.'
      },
    ],
  },
  {
    id: 's3',
    title: 'Paso 3: Configuración de Firebase para el Nuevo Cliente',
    isOpen: false,
    tasks: [
      {
        id: 's3t1',
        text: (
          <>
            Ir a la{' '}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline inline-flex items-center"
            >
              Consola de Firebase <ExternalLink size={14} className="ml-1" />
            </a>{' '}
            y crear un NUEVO proyecto Firebase (ej. "salon-luz-de-luna").
          </>
        ),
        isDone: false,
        details: 'Este será el backend dedicado para tu proyecto clonado. Asegúrate de elegir una ubicación de base de datos adecuada.'
      },
      {
        id: 's3t2',
        text: 'Registrar una nueva aplicación web dentro del NUEVO proyecto de Firebase.',
        isDone: false,
        details: 'En la vista general de tu nuevo proyecto en Firebase, haz clic en el icono de web (`</>`) para añadir una nueva app web. Sigue los pasos y copia el objeto `firebaseConfig`.'
      },
      {
        id: 's3t3',
        text: 'Actualizar el archivo de configuración de Firebase (`src/firebase/firebase.js`) en el proyecto CLONADO con el NUEVO objeto `firebaseConfig`.',
        isDone: false,
        details: "Reemplaza el objeto `firebaseConfig` existente con el que obtuviste del nuevo proyecto Firebase. Ejemplo: `const firebaseConfig = { /* ...NUEVA config... */ };`"
      },
      {
        id: 's3t4',
        text: 'Habilitar Autenticación en el NUEVO proyecto Firebase.',
        isDone: false,
        details: 'En la consola de Firebase -> Authentication -> Sign-in method -> Habilitar los proveedores deseados (ej. Email/Password, Google).'
      },
      {
        id: 's3t5',
        text: 'Habilitar Realtime Database (o Firestore) en el NUEVO proyecto Firebase y configurar reglas de seguridad.',
        isDone: false,
        details: 'En la consola de Firebase -> Realtime Database (o Firestore) -> Create Database. Configura las reglas de seguridad para el nuevo proyecto, adaptándolas a las necesidades de "Salón Luz de Luna". Puedes empezar en modo de prueba y luego endurecerlas.'
      },
      {
        id: 's3t6',
        text: 'Configurar Google Calendar API para el NUEVO proyecto.',
        isDone: false,
        subTasks: [
          { id: 's3t6st1', text: (
            <>
            Ir a{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline inline-flex items-center"
            >
              Google Cloud Console <ExternalLink size={14} className="ml-1" />
            </a>{' '}
            y seleccionar el NUEVO proyecto de Firebase (que también es un proyecto de Google Cloud).
          </>
          ), isDone: false},
          { id: 's3t6st2', text: "Ir a APIs y Servicios -> Biblioteca -> Buscar 'Google Calendar API' y habilitarla para el nuevo proyecto.", isDone: false},
          { id: 's3t6st3', text: "Ir a APIs y Servicios -> Credenciales -> Crear Credenciales (OAuth 2.0 Client ID) para el nuevo proyecto.", isDone: false},
          { id: 's3t6st4', text: "Asegurarse de configurar la pantalla de consentimiento OAuth para el nuevo proyecto, añadiendo los scopes necesarios (ej: `https://www.googleapis.com/auth/calendar`).", isDone: false},
          { id: 's3t6st5', text: "Añadir los URIs de redireccionamiento autorizados en las credenciales OAuth (ej: `http://localhost:5173` para desarrollo, y `https://salonluzdeluna.com.ar` para producción).", isDone: false},
          { id: 's3t6st6', text: "Actualizar el `clientId` de Google OAuth en tu código (ej. en `src/App.jsx` o donde se inicialice el cliente de Google) con el nuevo Client ID generado.", isDone: false},
        ]
      },
      {
        id: 's3t7',
        text: 'Instalar Firebase CLI globalmente (si no está): `npm install -g firebase-tools`.',
        isDone: false,
      },
      {
        id: 's3t8',
        text: 'Iniciar sesión en Firebase CLI: `firebase login`.',
        isDone: false,
        details: 'Asegúrate de estar conectado a la cuenta de Google que tiene acceso a tu NUEVO proyecto Firebase.'
      },
      {
        id: 's3t9',
        text: 'En el proyecto CLONADO, inicializar Firebase: `firebase init`.',
        isDone: false,
        details: 'Sigue los pasos: selecciona "Use an existing project", elige tu NUEVO proyecto Firebase. Para Hosting: especifica tu directorio público (generalmente `dist`), y configura como una Single-Page App (SPA). Esto creará/actualizará `firebase.json` y `.firebaserc` para el nuevo proyecto.'
      },
      {
        id: 's3t10',
        text: 'Desplegar las funciones de Firebase (si aplica): `firebase deploy --only functions`.',
        isDone: false,
        details: 'Si tienes funciones en `functions/`, asegúrate de que estén actualizadas y desplegadas en el nuevo proyecto Firebase.'
      },
    ],
  },
  {
    id: 's4',
    title: 'Paso 4: Optimización SEO para el Nuevo Dominio (`salonluzdeluna.com.ar`)',
    isOpen: false,
    tasks: [
      {
        id: 's4t1',
        text: 'Actualizar las meta etiquetas en `index.html` para SEO.',
        isDone: false,
        subTasks: [
          { id: 's4t1st1', text: 'Etiqueta `<title>`: Debe ser única y descriptiva (ej. "Salón Luz de Luna - Eventos y Celebraciones en [Ciudad]").', isDone: false },
          { id: 's4t1st2', text: 'Meta `description`: Resumen conciso de los servicios del salón (ej. "Organizamos eventos inolvidables en Salón Luz de Luna. Bodas, cumpleaños, reuniones empresariales. ¡Contáctanos!").', isDone: false },
          { id: 's4t1st3', text: 'Meta `keywords` (opcional, menos relevante hoy): Palabras clave relevantes (ej. "salón de eventos", "fiestas", "bodas", "cumpleaños", "Luz de Luna").', isDone: false },
          { id: 's4t1st4', text: 'Open Graph (OG) tags para redes sociales: `og:title`, `og:description`, `og:image`, `og:url` (apuntando a `https://salonluzdeluna.com.ar`).', isDone: false },
        ]
      },
      {
        id: 's4t2',
        text: 'Asegurar el uso de etiquetas HTML semánticas.',
        isDone: false,
        details: 'Utiliza `<h1>` para el título principal de cada página, `<h2>` para subtítulos, `<nav>` para la navegación, `<main>` para el contenido principal, `<footer>` para el pie de página, etc. Esto ayuda a los motores de búsqueda a entender la estructura de tu contenido.'
      },
      {
        id: 's4t3',
        text: 'Optimizar el contenido de texto con palabras clave relevantes.',
        isDone: false,
        details: 'Asegúrate de que el contenido de las páginas (Home, Quiénes Somos, Servicios, etc.) incluya de forma natural palabras clave relacionadas con "Salón Luz de Luna", eventos, celebraciones, ubicación, etc.'
      },
      {
        id: 's4t4',
        text: 'Optimizar imágenes para la web.',
        isDone: false,
        subTasks: [
          { id: 's4t4st1', text: 'Comprimir imágenes para reducir el tamaño de archivo sin perder calidad (herramientas como TinyPNG o Squoosh).', isDone: false },
          { id: 's4t4st2', text: 'Usar atributos `alt` descriptivos en todas las etiquetas `<img>` (ej. `<img src="salon-luz-de-luna-entrada.jpg" alt="Entrada principal del Salón Luz de Luna">`).', isDone: false },
          { id: 's4t4st3', text: 'Considerar formatos de imagen modernos como WebP.', isDone: false },
        ]
      },
      {
        id: 's4t5',
        text: 'Crear y configurar un archivo `robots.txt`.',
        isDone: false,
        details: 'Crea un archivo `robots.txt` en la carpeta `public/` (o `dist/`) para indicar a los motores de búsqueda qué páginas deben rastrear y cuáles no. Ejemplo: `User-agent: *Allow: /Sitemap: https://salonluzdeluna.com.ar/sitemap.xml`'
      },
      {
        id: 's4t6',
        text: 'Generar y enviar un `sitemap.xml`.',
        isDone: false,
        details: 'Utiliza una herramienta online o un paquete npm (ej. `react-router-sitemap`) para generar un `sitemap.xml` que liste todas las URLs de tu sitio. Luego, envíalo a Google Search Console.'
      },
      {
        id: 's4t7',
        text: 'Configurar Google Search Console y Google Analytics para `salonluzdeluna.com.ar`.',
        isDone: false,
        details: 'Verifica la propiedad del nuevo dominio en Google Search Console para monitorear el rendimiento SEO. Configura Google Analytics para rastrear el tráfico y el comportamiento de los usuarios.'
      },
      {
        id: 's4t8',
        text: 'Asegurar que el diseño sea "mobile-first" y la carga rápida.',
        isDone: false,
        details: 'La velocidad de carga y la adaptabilidad móvil son factores clave de SEO. Revisa el rendimiento con herramientas como Google PageSpeed Insights.'
      },
    ],
  },
  {
    id: 's5',
    title: 'Paso 5: Despliegue y Configuración Final',
    isOpen: false,
    tasks: [
      {
        id: 's5t1',
        text: 'Añadir todos los archivos al staging en el nuevo repositorio Git: `git add .`',
        isDone: false,
      },
      {
        id: 's5t2',
        text: "Realizar el primer commit: `git commit -m 'feat: Initial setup for Salon Luz de Luna'`.",
        isDone: false,
      },
      {
        id: 's5t3',
        text: 'Copiar la URL del nuevo repositorio remoto (creado en el Paso 1).',
        isDone: false,
      },
      {
        id: 's5t4',
        text: 'Añadir el nuevo repositorio remoto: `git remote add origin URL_DEL_NUEVO_REPOSITORIO_REMOTO`.',
        isDone: false,
      },
      {
        id: 's5t5',
        text: 'Verificar que el remoto se haya añadido correctamente: `git remote -v`.',
        isDone: false,
      },
      {
        id: 's5t6',
        text: 'Subir los cambios al repositorio remoto: `git push -u origin main` (o `master` o el nombre de tu rama principal).',
        isDone: false,
      },
      {
        id: 's5t7',
        text: 'Construir el proyecto React para producción: `npm run build` o `yarn build`.',
        isDone: false,
        details: 'Esto generará los archivos estáticos optimizados en tu carpeta `dist` (o `build`).'
      },
      {
        id: 's5t8',
        text: 'Desplegar a Firebase Hosting (al NUEVO proyecto): `firebase deploy --only hosting`.',
        isDone: false,
        details: 'Asegúrate que la Firebase CLI esté configurada para apuntar a tu NUEVO proyecto Firebase (verificado con `firebase use` o al hacer `firebase init`).'
      },
      {
        id: 's5t9',
        text: 'Conectar el dominio personalizado `salonluzdeluna.com.ar` en Firebase Hosting.',
        isDone: false,
        details: 'En la consola de Firebase, ve a Hosting y sigue los pasos para añadir y verificar tu dominio personalizado. Esto implicará configurar registros DNS en tu proveedor de dominio.'
      },
      {
        id: 's5t10',
        text: 'Configurar GitHub Actions para el nuevo repositorio y proyecto Firebase.',
        isDone: false,
        details: 'Adapta los archivos `.github/workflows/firebase-hosting-merge.yml` y `firebase-hosting-pull-request.yml` para que apunten al nuevo proyecto Firebase ID y al nuevo repositorio. Asegúrate de que las credenciales de Firebase estén configuradas como secretos en el nuevo repositorio de GitHub.'
      },
      {
        id: 's5t11',
        text: 'Verificar la URL de despliegue (`https://salonluzdeluna.com.ar`) y probar la aplicación en vivo.',
        isDone: false,
      },
    ],
  },
];

// Hook para guardar el estado en localStorage
const useStickyState = (defaultValue, key) => {
    

  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') { // Asegurarse que window está definido (para SSR/SSG)
      const stickyValue = window.localStorage.getItem(key);
      try {
        return stickyValue !== null
          ? JSON.parse(stickyValue)
          : defaultValue;
      } catch (error) {
        console.error("Error parsing localStorage item:", key, stickyValue, error);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
};


const ChecklistItem = ({ item, onToggle, parentId }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <li className="mb-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-start">
        <button
          onClick={() => onToggle(parentId, item.id)}
          aria-label={item.isDone ? "Marcar como no completado" : "Marcar como completado"}
          className="mr-3 mt-1 text-blue-600 dark:text-blue-400 focus:outline-none flex-shrink-0" // flex-shrink-0 para evitar que el botón se encoja
        >
          {item.isDone ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
        <div className="flex-1 min-w-0"> {/* min-w-0 para que el texto se ajuste correctamente */}
          <span className={`text-sm md:text-base ${item.isDone ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
            {item.text}
          </span>
          {item.details && (
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:underline focus:outline-none"
              aria-expanded={showDetails}
            >
              {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
            </button>
          )}
        </div>
      </div>
      {showDetails && item.details && (
        <p className="mt-1 ml-10 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded-md"> {/* Aumentado ml para alinear con texto */}
          {item.details}
        </p>
      )}
      {item.subTasks && (
        <ul className="mt-2 ml-6"> {/* ml-6 para subtareas */}
          {item.subTasks.map(subTask => (
            <ChecklistItem key={subTask.id} item={subTask} onToggle={onToggle} parentId={item.id} />
          ))}
        </ul>
      )}
    </li>
  );
};

const Section = ({ section, storageKey }) => { // onToggleTask y onToggleSection no son necesarios como props aquí
  const [tasks, setTasks] = useStickyState(section.tasks, `${storageKey}-tasks`); // Clave simplificada
  const [isOpen, setIsOpen] = useStickyState(section.isOpen !== undefined ? section.isOpen : true, `${storageKey}-isOpen`); // Clave simplificada y valor por defecto

  const handleToggleTask = (parentId, taskId) => {
    const toggle = (currentTasks) => currentTasks.map(task => {
      if (task.id === parentId && task.subTasks) { // Es una subtarea, parentId es el id de la tarea padre
        return {
          ...task,
          subTasks: task.subTasks.map(sub => sub.id === taskId ? { ...sub, isDone: !sub.isDone } : sub)
        };
      }
      if (task.id === taskId && parentId === section.id) { // Es una tarea principal, parentId es el id de la sección
        return { ...task, isDone: !task.isDone };
      }
      return task;
    });
    setTasks(prevTasks => toggle(prevTasks));
  };
  
  const handleToggleSection = () => {
    setIsOpen(!isOpen);
  };

  const countTasks = (taskList) => {
    let completed = 0;
    let total = 0;
    taskList.forEach(task => {
      total++;
      if (task.isDone) completed++;
      if (task.subTasks) {
        task.subTasks.forEach(subTask => {
          total++;
          if (subTask.isDone) completed++;
        });
      }
    });
    return { completed, total };
  };

  const { completed: completedTasks, total: totalTasks } = countTasks(tasks);


  return (
    <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 md:p-6 transition-all duration-300 ease-in-out">
      <button
        onClick={handleToggleSection}
        className="flex justify-between items-center w-full text-left text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isOpen}
      >
        <span className="mr-2">{section.title}</span> {/* mr-2 para espacio con contador */}
        <div className="flex items-center flex-shrink-0"> {/* flex-shrink-0 */}
          <span className="text-sm font-normal mr-2 text-gray-600 dark:text-gray-400 whitespace-nowrap"> {/* whitespace-nowrap */}
            {completedTasks}/{totalTasks} completadas
          </span>
          {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </div>
      </button>
      {isOpen && (
        <ul className="mt-2">
          {tasks.map(task => (
            <ChecklistItem key={task.id} item={task} onToggle={handleToggleTask} parentId={task.subTasks ? task.id : section.id} />
          ))}
        </ul>
      )}
    </div>
  );
};


// Componente Principal
const ProjectMigrationGuide = () => {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);
  const mainStorageKey = 'projectMigrationGuideState_vCloning_v2'; // Nueva clave para evitar conflictos con versiones anteriores
  // El estado de guideSections en sí no necesita ser persistido si initialGuideData es la fuente de verdad
  // y cada sección maneja su propio estado persistido.
  // Sin embargo, para el reset, necesitamos poder reconstruirlo.
  const [guideSectionsData, setGuideSectionsData] = useState(initialGuideData);


  const resetProgress = () => {
    if (typeof window !== 'undefined' && window.confirm("¿Estás seguro de que quieres reiniciar todo el progreso? Esta acción no se puede deshacer.")) {
      // Limpiar localStorage para cada sección
      initialGuideData.forEach(section => {
        localStorage.removeItem(`${mainStorageKey}-section-${section.id}-tasks`);
        localStorage.removeItem(`${mainStorageKey}-section-${section.id}-isOpen`);
      });
      
      // Para forzar la re-renderización de las secciones con estado reseteado,
      // actualizamos el estado que se pasa a las secciones, lo que hará que
      // useStickyState dentro de cada sección se reinicialice porque la key de localStorage no encontrará valor.
      const resetData = initialGuideData.map(s => ({
        ...s,
        isOpen: s.id === 's1', // O la lógica de apertura inicial
        tasks: s.tasks.map(t => ({
          ...t,
          isDone: false,
          ...(t.subTasks && { subTasks: t.subTasks.map(st => ({ ...st, isDone: false })) })
        }))
      }));
      setGuideSectionsData(resetData); // Esto refresca los props a Section
      // Forzar a que los useStickyState dentro de Section lean el defaultValue
      // al no encontrar su item en localStorage (ya que los borramos)
      // Esto es un poco indirecto. Una forma más directa sería que `useStickyState`
      // tuviera una función de reseteo, o que `Section` resetee su propio estado.
      // La forma más simple es recargar la página después de limpiar localStorage.
      window.location.reload(); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white text-center sm:text-left mb-4 sm:mb-0">
            Guía de Migración de Proyectos React (Clonado)
          </h1>
          <button
            onClick={resetProgress}
            className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500"
            title="Reiniciar todo el progreso"
          >
            <RotateCcw size={18} className="mr-2" />
            Reiniciar Progreso
          </button>
        </div>
        
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Esta guía te ayudará a configurar un proyecto React clonado con un nuevo backend de Firebase y un nuevo repositorio Git,
          asegurando la limpieza de datos del cliente anterior y la optimización SEO para el nuevo dominio (`salonluzdeluna.com.ar`).
          Marca cada tarea a medida que la completas. Tu progreso se guardará en el navegador.
        </p>

        {guideSectionsData.map(section => (
          <Section
            key={section.id}
            section={section}
            storageKey={`${mainStorageKey}-section-${section.id}`}
          />
        ))}
      </div>
      <footer className="text-center mt-12 pb-8">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Guía interactiva para facilitar la migración y despliegue de proyectos para nuevos clientes.
        </p>
      </footer>
    </div>
  );
};

export default ProjectMigrationGuide;