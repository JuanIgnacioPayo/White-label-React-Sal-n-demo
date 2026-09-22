import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import styled, { createGlobalStyle } from "styled-components";
import { getDatabase, ref, set, get } from "firebase/database";
import { InputSwitch } from 'primereact/inputswitch';
import { toast } from 'react-toastify';

const GlobalStyle = createGlobalStyle`
  .form-precios {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 2rem;
  }

  .form-precios h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .precios-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .precios-card li {
    margin-bottom: 1rem;
  }

  textarea{
    font-family: 'product_sansregular';
    font-size: 1rem;
    vertical-align: middle;
    width: 100%;
    border-radius: 8px;
    padding-left: 0.5rem;
  }

  .precio {
      margin-top: 0.1rem;
  }

  .checkLabel{
    display: grid;
    grid-template-columns: 0fr 1fr;
    margin:auto;
    padding-bottom: 0rem;
  }

  .check{
      border-radius:8px;
      width:0.8rem;
      padding-right: 2rem;
  }

  .boton {
      padding: 12px 25px;
      background-color: var(--primaryColor, #b0aa6d);
      color: var(--whiteText, #ffffff);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: bold;
      transition: background-color 0.3s ease, transform 0.2s ease;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);

      &:hover {
        background-color: var(--primaryText, #111241);
        transform: translateY(-2px);
      }

      &.small {
        padding: 5px 10px;
        font-size: 0.9rem;
        margin-left: 10px;
    }

    &.secondary {
        background-color: #6c757d;
        &:hover {
            background-color: #5a6268;
        }
    }
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    .precio{
      padding:0.1rem;
      width:90%;
      margin-left: 0.8rem;
      margin-top: 0.5rem;
      border-radius: 8px;
      text-align: center;
    }
  }
`;

// This mapping is now temporary, only for the one-time migration.
const priceKeyMigrationMapping = {
  1: 'b_precio_3hs_',
  3: 'a_precio_4hs_',
  2: 'd_hora_extra_semana_',
  4: 'c_hora_extra_finde_',
  5: 'e_camarera_',
  6: 'f_metegol_',
  8: 'g_pingPong_',
  7: 'h_inflable_',
  10: 'i_proyector_',
  9: 'j_arcade_',
  11: 'k_hora_organizacion_',
  12: 'r_parrillero_',
  // IDs 13 and 14 for holidays share a priceKey with ID 3, so they don't need a separate price entry here.
};

// Define the keys for the boolean toggles
const toggleKeys = {
  mostrarMes: 'o_mostrar_mes',
  mostrarTextoAlternativo: 'q_mostrar_texto_alternativo_',
};

// Define the key for the alternative text input
const alternativeTextKey = 'p_texto_alternativo_';

// DEFINE textToggleMapping HERE
const textToggleMapping = {
  defaultTextLabel: 'Texto alternativo',
  toggleDescription: 'Este botón oculta todos los precios y muestra solamente el texto alternativo'
};

const PercentageBadge = ({ current, previous }) => {
  if (current === undefined || current === null || previous === undefined || previous === null) return null;
  
  // Remove dots (thousands separators in ES-AR) and commas (if any), then keep only numbers
  const cleanCurrent = String(current).replace(/\./g, '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  const cleanPrevious = String(previous).replace(/\./g, '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  
  const currNum = parseFloat(cleanCurrent);
  const prevNum = parseFloat(cleanPrevious);
  
  if (isNaN(currNum) || isNaN(prevNum)) return null;
  
  // If previous was 0 and current is not 0, it's a new price
  if (prevNum === 0) {
    if (currNum > 0) return <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: '#e74c3c', fontWeight: 'bold', background: '#fdf0ed', padding: '2px 6px', borderRadius: '4px' }}>Nuevo</span>;
    return null;
  }
  
  const diff = ((currNum - prevNum) / prevNum) * 100;
  
  if (diff === 0) {
    return (
      <span style={{ 
        fontSize: '0.75rem', 
        marginLeft: '8px', 
        color: '#7f8c8d', 
        fontWeight: 'bold',
        background: '#f2f4f4',
        padding: '2px 6px',
        borderRadius: '4px'
      }}>
        0%
      </span>
    );
  }
  
  const isPositive = diff > 0;
  return (
    <span style={{ 
      fontSize: '0.75rem', 
      marginLeft: '8px', 
      color: isPositive ? '#e74c3c' : '#2ecc71', 
      fontWeight: 'bold',
      background: isPositive ? '#fdf0ed' : '#eafaf1',
      padding: '2px 6px',
      borderRadius: '4px'
    }}>
      {isPositive ? '+' : ''}{diff.toFixed(1)}%
    </span>
  );
};


export default function Form(props) {
  const { toggle, monthString, title } = props;
  const [dynamicServices, setDynamicServices] = useState([]);
  const [priceValues, setPriceValues] = useState({});
  const [prevPriceValues, setPrevPriceValues] = useState({});
  const [toggleValues, setToggleValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activePriceVersion, setActivePriceVersion] = useState(null);
  const [percentage, setPercentage] = useState("");
  const [years, setYears] = useState({ year1: "", year2: "" });
  const [selectedSourceMonth, setSelectedSourceMonth] = useState("");

  // Fetch Years for Dropdown
  useEffect(() => {
    const fetchYears = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, "datosId/26"); // ID 26 holds the years configuration
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setYears({ year1: data.y_ano1, year2: data.z_ano2 });
        }
      } catch (error) {
        console.error("Error fetching years:", error);
      }
    };
    fetchYears();
  }, []);

  // Fetch Active Price Version
  useEffect(() => {
    const fetchActiveVersion = async () => {
      const db = getDatabase(app);
      const configRef = ref(db, 'config/activePriceVersion');
      try {
        const snapshot = await get(configRef);
        if (snapshot.exists()) {
          setActivePriceVersion(snapshot.val());
        } else {
          setActivePriceVersion(2); // Default
        }
      } catch (error) {
        console.error("Error fetching active price version:", error);
        setActivePriceVersion(2);
      }
    };
    fetchActiveVersion();
  }, []);

  const archiveCurrentPrices = async () => {
    const currentVersion = activePriceVersion || 2;
    if (!window.confirm(`¿Seguro que querés archivar los precios actuales como Versión ${currentVersion}? Esto creará 'precios_legacy_v${currentVersion}' y activará la v${currentVersion + 1}.`)) return;

    const db = getDatabase(app);
    const sourceRef = ref(db, 'datosId');
    const targetRef = ref(db, `precios_legacy_v${currentVersion}`);
    const configRef = ref(db, 'config/activePriceVersion');

    try {
      const snapshot = await get(sourceRef);
      if (snapshot.exists()) {
        await set(targetRef, snapshot.val());

        // Increment active version
        const nextVersion = currentVersion + 1;
        await set(configRef, nextVersion);
        setActivePriceVersion(nextVersion);

        alert(`¡Precios archivados en 'precios_legacy_v${currentVersion}'! Nueva versión activa: ${nextVersion}`);
      } else {
        alert("No se encontraron datos en datosId para archivar.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al archivar precios: " + e.message);
    }
  };

  useEffect(() => {
    const db = getDatabase(app);
    const servicesRef = ref(db, 'optionalServices');
    const valuesDbRef = ref(db, "datosId/" + props.toggle);

    const initialSetup = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch all services
        const servicesSnapshot = await get(servicesRef);
        let services = [];
        if (servicesSnapshot.exists()) {
          const servicesData = servicesSnapshot.val();
          services = Array.isArray(servicesData) ? servicesData.filter(s => s) : Object.values(servicesData);
        } else {
          throw new Error("No se encontraron servicios opcionales. Por favor, créelos desde la pestaña de administración de Servicios.");
        }

        // 2. Robust migration to add priceKey to any service that needs it.
        const migrationNeeded = services.some(s => !s.priceKey);
        if (migrationNeeded) {
          console.log("Running migration to add priceKey to services...");
          services.forEach(s => {
            if (!s.priceKey) { // If priceKey is missing
              // Use old mapping for existing services, create new key for new ones
              s.priceKey = priceKeyMigrationMapping[s.id] || `servicio_${s.id}_`;
            }
          });
          await set(servicesRef, services);
          console.log("Migration complete. Services now have priceKeys.");
        }
        setDynamicServices(services);

        // 3. Fetch the prices for the current month
        const valuesSnapshot = await get(valuesDbRef);
        if (valuesSnapshot.exists()) {
          const fetchedValues = valuesSnapshot.val();
          const initialPriceValues = {};
          const initialToggleValues = {};

          // Populate prices from services list
          services.forEach(service => {
            if (service.priceKey) {
              const genericKey = `servicio_${service.id}_`;
              if (fetchedValues[genericKey] !== undefined && fetchedValues[genericKey] !== "") {
                  initialPriceValues[service.priceKey] = fetchedValues[genericKey];
              } else {
                  initialPriceValues[service.priceKey] = fetchedValues[service.priceKey] || '';
              }
            }
          });
          // Also handle special keys not in the services list
          initialPriceValues[alternativeTextKey] = fetchedValues[alternativeTextKey] || '';
          initialPriceValues['m_ipc_'] = fetchedValues['m_ipc_'] || '';
          initialPriceValues['n_mes_'] = fetchedValues['n_mes_'] || '';
          initialPriceValues['l_seña_'] = fetchedValues['l_seña_'] || '';
          initialPriceValues['z_sueldo_hora_'] = fetchedValues['z_sueldo_hora_'] || '';
          initialPriceValues['z_sueldo_limpieza_'] = fetchedValues['z_sueldo_limpieza_'] || '';
          initialPriceValues['z_sueldo_visita_'] = fetchedValues['z_sueldo_visita_'] || '';

          Object.values(toggleKeys).forEach(key => {
            initialToggleValues[key] = fetchedValues[key] || false;
          });

          setPriceValues(initialPriceValues);
          setToggleValues(initialToggleValues);
        } else {
          console.log("No price data found for path:", "datosId/" + props.toggle);
        }

        // 4. Fetch the prices for the previous month (for % increment)
        if (props.monthString) {
            const [yStr, mStr] = props.monthString.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10);
            
            let prevY = y;
            let prevM = m - 1;
            if (prevM === 0) {
                prevM = 12;
                prevY--;
            }
            
            let prevBucket = (prevY * 12 + prevM) % 24;
            if (prevBucket === 0) prevBucket = 24;

            const prevValuesDbRef = ref(db, `datosId/${prevBucket}`);
            const prevSnapshot = await get(prevValuesDbRef);
            if (prevSnapshot.exists()) {
                const fetchedPrev = prevSnapshot.val();
                const initialPrevPriceValues = {};
                
                // Populate previous prices from services list just like handleCopyFromMonth
                services.forEach(service => {
                    let foundValue = undefined;
                    const genericKey = `servicio_${service.id}_`;
                    const legacyKey = priceKeyMigrationMapping[service.id];
                    const currentKey = service.priceKey;

                    if (fetchedPrev[currentKey] !== undefined && fetchedPrev[currentKey] !== "") {
                        foundValue = fetchedPrev[currentKey];
                    } else if (legacyKey && fetchedPrev[legacyKey] !== undefined && fetchedPrev[legacyKey] !== "") {
                        foundValue = fetchedPrev[legacyKey];
                    } else if (fetchedPrev[genericKey] !== undefined && fetchedPrev[genericKey] !== "") {
                        foundValue = fetchedPrev[genericKey];
                    } else {
                        const genericContenidoKey = `contenido${service.id}`;
                        if (fetchedPrev[genericContenidoKey] !== undefined && fetchedPrev[genericContenidoKey] !== "") {
                            foundValue = fetchedPrev[genericContenidoKey];
                        }
                    }

                    if (foundValue !== undefined && currentKey) {
                        initialPrevPriceValues[currentKey] = foundValue;
                    }
                });

                // Also populate special keys
                initialPrevPriceValues['l_seña_'] = fetchedPrev['l_seña_'] || '';
                initialPrevPriceValues['z_sueldo_hora_'] = fetchedPrev['z_sueldo_hora_'] || '';
                initialPrevPriceValues['z_sueldo_limpieza_'] = fetchedPrev['z_sueldo_limpieza_'] || '';
                initialPrevPriceValues['z_sueldo_visita_'] = fetchedPrev['z_sueldo_visita_'] || '';

                setPrevPriceValues(initialPrevPriceValues);
            }
        }

      } catch (err) {
        console.error("Error during initial setup:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initialSetup();

  }, [props.toggle]);

  const handleInputChange = (key, value) => {
    setPriceValues(prevValues => ({
      ...prevValues,
      [key]: value,
    }));
  };

  const handleToggleChange = (key, value) => {
    setToggleValues(prevValues => ({
      ...prevValues,
      [key]: value,
    }));
  };



  const handlePriceIncrease = () => {
    if (!percentage || isNaN(percentage)) {
      toast.warning("Ingrese un porcentaje válido.");
      return;
    }

    const factor = 1 + parseFloat(percentage) / 100;
    const newPriceValues = { ...priceValues };
    let changed = false;

    Object.keys(newPriceValues).forEach(key => {
      const value = newPriceValues[key];
      if (typeof value === 'string') {
        // Regex to find integers
        newPriceValues[key] = value.replace(/\b(\d+)\b/g, (match) => {
          const num = parseInt(match, 10);
          if (!isNaN(num)) {
            changed = true;
            return Math.round(num * factor).toString();
          }
          return match;
        });
      }
    });

    if (changed) {
      setPriceValues(newPriceValues);
      toast.success(`Precios aumentados un ${percentage}%`);
    } else {
      toast.info("No se encontraron números para actualizar.");
    }
  };

  const restoreBackup = async () => {
    if (!window.confirm("¿Estás seguro de que quieres restaurar la última versión guardada? Esto sobrescribirá los cambios actuales no guardados.")) {
      return;
    }

    const db = getDatabase(app);
    const backupURL = "backups/" + props.toggle;
    const backupRef = ref(db, backupURL);
    const currentURL = "datosId/" + props.toggle;
    const currentRef = ref(db, currentURL);

    try {
      const snapshot = await get(backupRef);
      if (snapshot.exists()) {
        const backupData = snapshot.val();

        // We need to separate priceValues and toggleValues from the backupData
        // backupData is a flat object mixing both (like dataToSave)

        const newPriceValues = {};
        const newToggleValues = {};

        Object.keys(backupData).forEach(key => {
          if (Object.values(toggleKeys).includes(key)) {
            newToggleValues[key] = backupData[key];
          } else {
            newPriceValues[key] = backupData[key];
          }
        });

        setPriceValues(newPriceValues);
        setToggleValues(newToggleValues);

        await set(currentRef, backupData);
        toast.success("Restaurado desde backup correctamente.");
      } else {
        toast.warning("No hay backup disponible para restaurar.");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Error al restaurar backup.");
    }
  };

  const handleCopyFromMonth = async () => {
    if (!selectedSourceMonth) {
      toast.warning("Seleccione un mes de origen.");
      return;
    }

    if (!window.confirm("¿Seguro que quiere copiar los precios del mes seleccionado? Esto reemplazará los valores actuales.")) {
      return;
    }

    const db = getDatabase(app);
    // 1. Always fetch from Current 'datosId'
    const sourcesToFetch = [get(ref(db, "datosId/" + selectedSourceMonth))];

    // 2. Fetch from Legacy versions 1 up to (CurrentVersion), e.g. if v3, fetch v1, v2, v3? 
    // Usually legacy is stored as 'precios_legacy_vX'. 
    // If Active is 2, it means we MIGHT have v1 archived.
    // If Active is 3, we might have v1 and v2.
    // The user said "copy from the last available version".
    // We should safely try to fetch v1...targetVersion.

    // We'll try fetching up to a reasonable number or just use activePriceVersion.
    // Let's assume we want to check up to the current active version (even if it's the one in datosId, looking in legacy_vX might find older snapshots).
    const maxVersionToCheck = activePriceVersion ? activePriceVersion : 5; // Fallback to 5 if unknown

    for (let v = 1; v <= maxVersionToCheck; v++) {
      sourcesToFetch.push(get(ref(db, `precios_legacy_v${v}/${selectedSourceMonth}`)));
    }

    try {
      // Use allSettled to prevent one permission error from failing the whole copy
      const results = await Promise.allSettled(sourcesToFetch);

      let sourcedData = {};

      // Iterate through results.
      // Index 0 is datosId (Current).
      // Index 1..N are legacy v1..vN.

      // We want to merge in order: v1 -> v2 -> ... -> Current.
      // So subsequent merges overwrite previous ones.

      // First, handle legacy versions (Index 1 to End)
      for (let i = 1; i < results.length; i++) {
        if (results[i].status === 'fulfilled' && results[i].value.exists()) {
          sourcedData = { ...sourcedData, ...results[i].value.val() };
        }
      }

      // Finally, handle datosId (Index 0) - it should have highest priority if exists?
      // Actually, if datosId is empty/partial, we might prefer legacy.
      if (results[0].status === 'fulfilled' && results[0].value.exists()) {
        sourcedData = { ...sourcedData, ...results[0].value.val() };
      }

      if (Object.keys(sourcedData).length > 0) {

        // --- REFINED COPY LOGIC ---
        // Instead of blind merging, we map strictly to what the current form expects.

        const newPriceValues = { ...priceValues };
        const newToggleValues = { ...toggleValues };

        // 1. Update prices for Dynamic Services
        // We iterate over the *current form's services* and look for their key in the source data.
        // We check: 1. Current PriceKey, 2. Legacy Key, 3. Generic Key
        let copiedCount = 0;
        dynamicServices.forEach(service => {
          const currentKey = service.priceKey;
          const legacyKey = priceKeyMigrationMapping[service.id];
          const genericKey = `servicio_${service.id}_`;

          // Try to find a value in order of preference
          let foundValue = undefined;
          let sourceUsed = "";

          if (currentKey && sourcedData[currentKey] !== undefined) {
            foundValue = sourcedData[currentKey];
            sourceUsed = "Current";
          } else if (legacyKey && sourcedData[legacyKey] !== undefined) {
            foundValue = sourcedData[legacyKey];
            sourceUsed = "Legacy";
          } else if (sourcedData[genericKey] !== undefined) {
            foundValue = sourcedData[genericKey];
            sourceUsed = "Generic";
          } else {
            // 4. Try Legacy 'contenidoX' generic key (Assuming Service ID matches Index)
            // This supports data from the very old FormListaDePrecios
            const genericContenidoKey = `contenido${service.id}`;
            if (sourcedData[genericContenidoKey] !== undefined) {
              foundValue = sourcedData[genericContenidoKey];
              sourceUsed = "ContentIndex";
            }
          }

          // 5. Try Alphabetical Prefix Mapping (a->1, b->2...)
          // Only if legacyKey exists and starts with a letter followed by underscore
          if (foundValue === undefined && legacyKey) {
            const prefix = legacyKey.split('_')[0];
            // Check if prefix is a single lowercase letter
            if (prefix && prefix.length === 1 && prefix >= 'a' && prefix <= 'z') {
              const index = prefix.charCodeAt(0) - 96; // 'a' code is 97. 97-96=1.
              const alphaContenidoKey = `contenido${index}`;
              if (sourcedData[alphaContenidoKey] !== undefined) {
                foundValue = sourcedData[alphaContenidoKey];
                sourceUsed = "AlphaMap";
              }
            }
          }



          if (foundValue !== undefined && currentKey) {
            newPriceValues[currentKey] = foundValue;
          }
        });

        // 2. Update Known Special Keys explicitly
        // Excluded: 'm_ipc_', 'n_mes_', 'alternativeTextKey' (User requested these remain fixed)
        const specialKeys = ['l_seña_', 'z_sueldo_hora_', 'z_sueldo_limpieza_', 'z_sueldo_visita_'];
        specialKeys.forEach(key => {
          if (sourcedData[key] !== undefined) {
            newPriceValues[key] = sourcedData[key];
          }
        });

        // 3. Update Toggles
        Object.values(toggleKeys).forEach(key => {
          if (sourcedData[key] !== undefined) {
            newToggleValues[key] = sourcedData[key];
          }
        });

        setPriceValues(newPriceValues);
        setToggleValues(newToggleValues);
        toast.success("Datos copiados correctamente.");
      } else {
        toast.error("El mes seleccionado no tiene datos guardados (ni en v1, v2 ni actual).");
      }
    } catch (error) {
      console.error("Error copying month data:", error);
      toast.error("Error al copiar datos: " + error.message);
    }
  };

  const handleUpdateAllMonths = async () => {
    if (!window.confirm("⚠️ ATENCIÓN: ¿Seguro que quiere actualizar TODOS los meses (Meses 1-24)?\n\nEsto copiará los precios y configuraciones actuales a los dos años completos.\nSe MANTENDRÁN los nombres de mes e IPC originales de cada mes.")) {
      return;
    }

    const db = getDatabase(app);
    const updates = {};
    const startId = 1;
    const endId = 24;

    setIsLoading(true);

    try {
      // 1. Fetch all existing data (1-24) to preserve Month Names and IPC
      const promises = [];
      for (let i = startId; i <= endId; i++) {
        promises.push(get(ref(db, `datosId/${i}`)));
      }

      const snapshots = await Promise.all(promises);
      let updatedCount = 0;

      snapshots.forEach((snapshot, index) => {
        const monthId = startId + index;
        const existingData = snapshot.exists() ? snapshot.val() : {};

        // 2. Prepare new data
        // Base: Current Screen Values (Prices + Toggles)
        const baseData = {
          ...priceValues,
          ...toggleValues,
        };

        // 3. Restore Preserved Fields from Existing Data
        if (existingData['n_mes_']) baseData['n_mes_'] = existingData['n_mes_'];
        if (existingData['m_ipc_']) baseData['m_ipc_'] = existingData['m_ipc_'];
        if (existingData[alternativeTextKey]) baseData[alternativeTextKey] = existingData[alternativeTextKey];
        if (existingData[toggleKeys.mostrarTextoAlternativo] !== undefined) baseData[toggleKeys.mostrarTextoAlternativo] = existingData[toggleKeys.mostrarTextoAlternativo];

        updates[`datosId/${monthId}`] = baseData;
        updatedCount++;
      });

      // 4. Perform Bulk Update
      await import('firebase/database').then(({ update }) => {
        return update(ref(db), updates);
      });

      toast.success(`¡Éxito! Se actualizaron ${updatedCount} meses correctamente.`);

    } catch (error) {
      console.error("Error bulk updating months:", error);
      toast.error("Error al actualizar meses: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const overwriteData = async () => {
    const dbURL = "datosId/" + props.toggle;
    const db = getDatabase(app);
    const newDocRef = ref(db, dbURL);

    // Backup refs
    const backupURL = "backups/" + props.toggle;
    const backupRef = ref(db, backupURL);

    const dataToSave = {
      ...priceValues,
      ...toggleValues,
    };

    // Ensure generic keys are also updated so usePresupuestoData.js doesn't read stale values
    dynamicServices.forEach(service => {
        if (service.priceKey && priceValues[service.priceKey] !== undefined) {
            dataToSave[`servicio_${service.id}_`] = priceValues[service.priceKey];
        }
    });

    try {
      // 1. Fetch current data and save to backup
      const currentSnapshot = await get(newDocRef);
      if (currentSnapshot.exists()) {
        await set(backupRef, currentSnapshot.val());
      }

      // 2. Save new data
      await set(newDocRef, dataToSave);
      toast.success("Información actualizada correctamente");
    } catch (error) {
      console.error("Error saving data to Firebase:", error);
      toast.error("Error al actualizar: " + error.message);
    }
  };

  if (isLoading) {
    return <div className="form-precios"><div>Cargando datos de la lista de precios...</div></div>;
  }

  if (error) {
    return <div className="form-precios"><div>Error: {error}</div></div>;
  }

  return (
    <>
      <GlobalStyle />
      <div className="form-precios">
        <h2>{title} {activePriceVersion && <span style={{ fontSize: '0.6em', color: 'gray', verticalAlign: 'middle' }}>(v{activePriceVersion})</span>}</h2>
        <BulkActionsContainer>
          <div className="input-group">
            <label>Aumento %:</label>
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ej. 10"
            />
            <button className="boton small" onClick={handlePriceIncrease}>Aplicar</button>
          </div>

          <div className="input-group" style={{ borderLeft: "1px solid #ccc", paddingLeft: "10px" }}>
            <label>Copiar de:</label>
            <select
              value={selectedSourceMonth}
              onChange={(e) => setSelectedSourceMonth(e.target.value)}
              style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">Seleccionar mes...</option>
              {Array.from({ length: 12 }, (_, i) => i + 7).map(m => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' })} {m > 12 ? props.years?.year2 : props.years?.year1}
                </option>
              ))}
            </select>
            <button className="boton small" onClick={handleCopyFromMonth}>Copiar</button>
          </div>

          <button className="boton secondary" onClick={restoreBackup}>Restaurar Backup</button>
        </BulkActionsContainer>
        <div className="precios-card">
          <ul>
            {/* Render dynamic price inputs from services */}
            {dynamicServices.filter(s => s.priceKey).map(service => (
              <li key={service.id}>
                <label>
                  {service.nombre}
                  <PercentageBadge current={priceValues[service.priceKey]} previous={prevPriceValues[service.priceKey]} />
                  <textarea
                    rows="1"
                    className="precio"
                    type='text'
                    name={service.priceKey}
                    value={priceValues[service.priceKey] || ''}
                    onChange={(e) => handleInputChange(service.priceKey, e.target.value)}
                  />
                </label>
              </li>
            ))}

            {/* Special inputs that are not services */}
            <li>
              <label>
                Seña
                <PercentageBadge current={priceValues['l_seña_']} previous={prevPriceValues['l_seña_']} />
                <textarea rows="1" className="precio" type='text' name='l_seña_' value={priceValues['l_seña_'] || ''} onChange={(e) => handleInputChange('l_seña_', e.target.value)} />
              </label>
            </li>
            <li>
              <label>
                IPC
                <textarea rows="1" className="precio" type='text' name='m_ipc_' value={priceValues['m_ipc_'] || ''} onChange={(e) => handleInputChange('m_ipc_', e.target.value)} />
              </label>
            </li>
            <li>
              <label>
                Mes
                <textarea rows="1" className="precio" type='text' name='n_mes_' value={priceValues['n_mes_'] || ''} onChange={(e) => handleInputChange('n_mes_', e.target.value)} />
              </label>
            </li>
            
            {/* Sueldos y Limpieza */}
            <li>
              <label>
                Sueldo por Hora ($/hr)
                <PercentageBadge current={priceValues['z_sueldo_hora_']} previous={prevPriceValues['z_sueldo_hora_']} />
                <textarea rows="1" className="precio" type='text' name='z_sueldo_hora_' value={priceValues['z_sueldo_hora_'] || ''} onChange={(e) => handleInputChange('z_sueldo_hora_', e.target.value)} />
              </label>
            </li>
            <li>
              <label>
                Valor Limpieza ($)
                <PercentageBadge current={priceValues['z_sueldo_limpieza_']} previous={prevPriceValues['z_sueldo_limpieza_']} />
                <textarea rows="1" className="precio" type='text' name='z_sueldo_limpieza_' value={priceValues['z_sueldo_limpieza_'] || ''} onChange={(e) => handleInputChange('z_sueldo_limpieza_', e.target.value)} />
              </label>
            </li>
            <li>
              <label>
                Valor Visita ($)
                <PercentageBadge current={priceValues['z_sueldo_visita_']} previous={prevPriceValues['z_sueldo_visita_']} />
                <textarea rows="1" className="precio" type='text' name='z_sueldo_visita_' value={priceValues['z_sueldo_visita_'] || ''} onChange={(e) => handleInputChange('z_sueldo_visita_', e.target.value)} />
              </label>
            </li>

            {/* Alternative Text and its toggle */}
            <li>
              <label>
                {textToggleMapping.defaultTextLabel}:
                <textarea
                  rows="1"
                  className="precio"
                  type='text'
                  name={alternativeTextKey}
                  value={priceValues[alternativeTextKey] || ''}
                  onChange={(e) => handleInputChange(alternativeTextKey, e.target.value)}
                />
              </label>
              <label className='checkLabel'>
                <InputSwitch
                  className="check"
                  checked={toggleValues[toggleKeys.mostrarTextoAlternativo] || false}
                  onChange={(e) => handleToggleChange(toggleKeys.mostrarTextoAlternativo, e.value)}
                />
                {textToggleMapping.toggleDescription}
              </label>
            </li>
          </ul>
        </div>
      </div>
      <FloatingButtonContainer>
        <button className="boton" onClick={handleUpdateAllMonths}>Actualizar Todo (Meses 1-24)</button>
        <button className='boton secondary' style={{ marginTop: '10px', fontSize: '0.9rem' }} onClick={overwriteData}>Actualizar solo este mes</button>
        <button
          className="boton"
          style={{ backgroundColor: '#6610f2', marginTop: '10px' }}
          onClick={archiveCurrentPrices}
        >
          Archivar Precios Actuales (Legacy V{activePriceVersion || '?'})
        </button>
      </FloatingButtonContainer>
    </>
  );
}

const LegacyBanner = styled.div`
  background-color: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
`;

// Keep your styled-components definition as is
const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BulkActionsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 10px;

    .input-group {
        display: flex;
        align-items: center;
        gap: 5px;
        
        label {
            font-weight: bold;
            color: var(--primary-text);
        }

        input {
            padding: 5px;
            border-radius: 4px;
            border: 1px solid #ccc;
            width: 80px;
        }
    }
`;


