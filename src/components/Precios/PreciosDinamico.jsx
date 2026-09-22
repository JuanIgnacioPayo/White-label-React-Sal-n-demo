import styled, { keyframes } from "styled-components";
import { useState, useEffect, useRef, useCallback, use, useMemo } from "react";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get, update, set as firebaseSet, onValue, remove, push } from "firebase/database";
import { WhatsappShareButton } from "react-share";
import ScrollToTop from "../ScrollToTop";
import DatePicker from './DatePicker';
import Animacion from "./Animacion";
import moment from 'moment';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import ErrorBoundary from './ErrorBoundary';
import Toast from './Toast';
import Modal from '../Modal';
import axios from "axios";
import { addDays, set, format } from 'date-fns';
import Clave from "../Calendar/Clave";
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext/index.jsx';
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import ServiciosOpcionales from './ServiciosOpcionales';
import EditableText from '../EditableText';
import { serviciosOpcionalesTemplate } from '../../data/serviciosOpcionales.js';
import React from 'react';
import FloatingActionButton from "../FloatingActionButton";
import AclaracionesDinamicas from '../AclaracionesDinamicas/AclaracionesDinamicas';
import DynamicSymbolsList from '../DynamicSymbolsList/DynamicSymbolsList'; // New import
import SymbolToggle, { types as symbolTypesList } from '../SymbolToggle/SymbolToggle';
import HorarioSlider from './HorarioSlider';
import ScrollIndicator from '../ScrollIndicator';
import { safeStorage } from '../../utils/safeStorage';
import SEO from '../SEO';
import { FaTrash, FaPlus } from "react-icons/fa";
import { useLoading } from '../../contexts/LoadingContext';
import ImageGalleryModal from '../Admin/ImageGalleryModal';
import { formatTitleWithDate, formatDescWithDate } from '../../utils/dateUtils';

const NavbarButton = styled.button`
  border: none;
  color: white;
  padding: 4px 7px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 0.72rem;
  margin: 0 5px;
  cursor: pointer;
  border-radius: 5px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s;
  
  &:hover {
    filter: brightness(110%);
  }

  @media screen and (max-width: 768px) {
    font-size: 0.7rem;
    padding: 4px 8px;
  }
`;

const NavbarWeekendButton = styled(NavbarButton)`
  background-color: #008CBA;
`;

const NavbarWeekdayButton = styled(NavbarButton)`
  background-color: #008CBA;
`;

const AdminToggleButton = styled.button`
  background-color: ${props => props.$active ? '#f44336' : '#4CAF50'}; /* Red if active (to disable), Green if inactive (to enable) */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s;

  &:hover {
    filter: brightness(110%);
  }
`;

const AdminControlsContainer = styled.div`
  position: fixed;
  bottom: 7rem; /* Moved 50px up from 2rem */
  right: 20px; /* Aligned with other floating buttons */
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media screen and (max-width: 1080px) {
    bottom: 40px; 
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
`;

const GOOGLE_API_KEY = Clave();

const servicioIdToContenidoMapping = {
  1: 'contenido20',
  2: 'contenido31',
  3: 'contenido21',
  4: 'contenido67',
  5: 'contenido22',
  6: 'contenido24',
  7: 'contenido25',
  8: 'contenido26',
  9: 'contenido27',
  10: 'contenido28',
  11: 'contenido29',
  12: 'contenido30',
  13: 'contenido19',
  14: 'contenido19',
  15: 'contenido23',
  'aclaracion_6': 'contenido81',
  'aclaracion_7': 'contenido82',
  'aclaracion_8': 'contenido83',
  'aclaracion_9': 'contenido84',
  'descripcion_1': 'contenido85',
  'descripcion_2': 'contenido86',
  'descripcion_3': 'contenido87',
  'descripcion_4': 'contenido88',
  'descripcion_5': 'contenido89',
  'descripcion_9': 'contenido90',
  'descripcion_10': 'contenido91',
  'descripcion_11': 'contenido92',
  'descripcion_12': 'contenido93',
  'descripcion_13': 'contenido94',
  'descripcion_14': 'contenido95',
  'descripcion2_5': 'contenido96',
  'aclaracion_1': 'contenido97',
  'aclaracion_2': 'contenido98',
  'aclaracion_3': 'contenido99',
  'aclaracion_4': 'contenido100',
  'aclaracion_5': 'contenido101',
  'aclaracion_10': 'contenido102',
  'aclaracion_11': 'contenido103',
  'aclaracion_12': 'contenido104',
  'aclaracion_13': 'contenido105',
  'aclaracion_14': 'contenido106',
};


export default function PreciosDinamico({ initialParams = null, hideLayout = false } = {}) {
  const [activePriceVersion, setActivePriceVersion] = useState(null); // Versioning state - Moved to top
  const { currentUser } = useAuth();
  const [whatsappReservaTemplate, setWhatsappReservaTemplate] = useState('Hola Juan!\n\nQuiero reservar el día *{FECHA}*\n\n*Servicios seleccionados:*\n{CARRITO}\n*Total: ${TOTAL}*\n\nSeña necesaria para reservar: ${SENA}\n\n{LINK}');
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [reservaModalTitle, setReservaModalTitle] = useState('¡Excelente! Tu reserva está casi lista 🚀');
  const [reservaModalText, setReservaModalText] = useState('Recuerda que para confirmarla necesitamos que realices la seña mediante transferencia bancaria. Aquí tienes los datos:');
  const [reservaModalCbu, setReservaModalCbu] = useState('0000000000000000000000');
  const [reservaModalBankDetails, setReservaModalBankDetails] = useState('Alias: ALIAS.BANCO\nTitular: Juan Perez\nBanco: Banco Nación');
  const [adminEditMode, setAdminEditMode] = useState(() => {
    const savedMode = safeStorage.getItem('adminEditMode');
    return savedMode === 'true';
  });

  useEffect(() => {
    safeStorage.setItem('adminEditMode', adminEditMode);
  }, [adminEditMode]);
  const fileInputRef = useRef(null); // Inserted here

  const [floatingButtons, setFloatingButtons] = useState([]);

  useEffect(() => {
    const db = getDatabase(app);
    const buttonsRef = ref(db, 'floatingButtons');
    onValue(buttonsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const buttonsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setFloatingButtons(buttonsArray);
      } else {
        setFloatingButtons([]);
      }
    });
  }, []);

  const [serviciosOpcionalesFromDB, setServiciosOpcionalesFromDB] = useState([]);

  useEffect(() => {
    const db = getDatabase(app);
    const serviciosRef = ref(db, 'optionalServices');

    const migrateAndFetch = async () => {
      try {
        const snapshot = await get(serviciosRef);
        if (snapshot.exists()) {
          const services = snapshot.val();
          const servicesArray = Array.isArray(services) ? services.filter(s => s) : Object.values(services);
          setServiciosOpcionalesFromDB(servicesArray);
        } else {
          console.log("No optional services found in DB at 'optionalServices', migrating from local file...");
          await firebaseSet(serviciosRef, serviciosOpcionalesTemplate);
          setServiciosOpcionalesFromDB(serviciosOpcionalesTemplate);
          console.log("Migration of optional services to Firebase complete.");
        }
      } catch (error) {
        console.error("Error migrating/fetching optional services:", error);
      }
    };

    migrateAndFetch();
  }, []); // Empty dependency array ensures this runs only once on component mount

  useEffect(() => {
    const fetchWhatsappTemplate = async () => {
      const db = getDatabase(app);
      const textRef = ref(db, "datosId/29");
      try {
        const snapshot = await get(textRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.whatsapp_reserva_template) {
            setWhatsappReservaTemplate(data.whatsapp_reserva_template);
          }
          if (data.reserva_modal_title) setReservaModalTitle(data.reserva_modal_title);
          if (data.reserva_modal_text) setReservaModalText(data.reserva_modal_text);
          if (data.reserva_modal_cbu) setReservaModalCbu(data.reserva_modal_cbu);
          if (data.reserva_modal_bank_details) setReservaModalBankDetails(data.reserva_modal_bank_details);
        }
      } catch (error) {
        console.error("Error fetching whatsapp template:", error);
      }
    };
    fetchWhatsappTemplate();
  }, []);

  const [headerConfig, setHeaderConfig] = useState({
    logoUrl: '',
    siteName: '',
    pricesHeaderText: 'Precios para el día',
    shareTitle: 'Lista de precios',
    datepickerBgColor: '#FFFFFF'
  });
  const [loadingHeaderConfig, setLoadingHeaderConfig] = useState(true);
  const [errorHeaderConfig, setErrorHeaderConfig] = useState(null);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [tempDatepickerBgColor, setTempDatepickerBgColor] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const [editingImageServiceId, setEditingImageServiceId] = useState(null);
  const serviceImageInputRef = useRef(null);

  const handleSaveHeaderConfig = async (field, newValue) => {
    if (currentUser && adminEditMode) {
      try {
        const db = getDatabase(app);
        const configRef = ref(db, 'config/preciosDinamicoHeader');
        await update(configRef, {
          [field]: newValue
        });
        setHeaderConfig(prev => ({ ...prev, [field]: newValue }));
        console.log(`Header config ${field} actualizado a: ${newValue}`);
      } catch (err) {
        console.error(`Error al actualizar header config ${field}:`, err);
        setErrorHeaderConfig(`Error al guardar ${field}.`);
      }
    }
  };

  const handleSaveDatosId = async (id, field, value, stateUpdater) => {
    if (currentUser) {
      try {
        const db = getDatabase(app);
        const dataRef = ref(db, `datosId/${id}`);
        await update(dataRef, {
          [field]: value
        });
        stateUpdater(value);
        console.log(`datosId/${id}/${field} actualizado a: ${value}`);
      } catch (err) {
        console.error(`Error al actualizar datosId/${id}:`, err);
      }
    }
  };

  const urlLocation = useLocation();
  let routeKey = urlLocation.pathname.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\//g, '_');
  if (routeKey === '') routeKey = 'home';

  useEffect(() => {
    const fetchHeaderConfig = async () => {
      setLoadingHeaderConfig(true);
      try {
        const db = getDatabase(app);
        const configRef = ref(db, 'config/preciosDinamicoHeader');
        const specificConfigRef = routeKey ? ref(db, `config/preciosDinamicoHeader_${routeKey}`) : null;

        const snapshot = await get(configRef);
        let mergedConfig = {};
        if (snapshot.exists()) {
          mergedConfig = { ...snapshot.val() };
        }

        if (specificConfigRef) {
          const specificSnapshot = await get(specificConfigRef);
          if (specificSnapshot.exists()) {
            const specificVal = specificSnapshot.val();
            if (specificVal.shareTitle) mergedConfig.shareTitle = specificVal.shareTitle;
            if (specificVal.shareDescription) mergedConfig.shareDescription = specificVal.shareDescription;
            if (specificVal.shareImageUrl !== undefined) mergedConfig.shareImageUrl = specificVal.shareImageUrl;
          }
        }

        const queryFecha = new URLSearchParams(urlLocation.search).get('fecha');
        if (queryFecha) {
          try {
            const fechaConfigRef = ref(db, 'config/preciosDinamicoHeader_precios_fecha');
            const fechaSnapshot = await get(fechaConfigRef);
            if (fechaSnapshot.exists()) {
              const fechaVal = fechaSnapshot.val();
              if (fechaVal.shareTitle) mergedConfig.shareTitle = fechaVal.shareTitle;
              if (fechaVal.shareDescription) mergedConfig.shareDescription = fechaVal.shareDescription;
              if (fechaVal.shareImageUrl !== undefined && fechaVal.shareImageUrl !== '') {
                mergedConfig.shareImageUrl = fechaVal.shareImageUrl;
              }
            }
          } catch (err) {
            console.error("Error al cargar config precios_fecha:", err);
          }
        }

        setHeaderConfig(prevState => ({ ...prevState, ...mergedConfig }));
      } catch (err) {
        console.error("Error al cargar header config:", err);
        setErrorHeaderConfig("Error al cargar la configuración del encabezado.");
      } finally {
        setLoadingHeaderConfig(false);
      }
    };

    fetchHeaderConfig();
  }, [routeKey, urlLocation.search]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const downloadURL = await uploadToFirebaseStorage(file);
      handleSaveHeaderConfig('logoUrl', downloadURL); // Update Firestore and state with new URL
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (currentUser && adminEditMode) {
      setGalleryTarget({ type: 'logo' });
      setShowGalleryModal(true);
    } else {
      navigate('/');
    }
  };

  const handleDatePickerClick = () => {
    if (currentUser && adminEditMode) {
      setTempDatepickerBgColor(headerConfig.datepickerBgColor);
      setIsEditingColor(true);
    }
  };

  const handleAcceptColorChange = (e) => {
    e.stopPropagation();
    handleSaveHeaderConfig('datepickerBgColor', tempDatepickerBgColor);
    setIsEditingColor(false);
  };

  const handleCancelColorChange = (e) => {
    e.stopPropagation();
    setIsEditingColor(false);
  };

  const handleImageClick = (serviceId) => {
    if (currentUser && adminEditMode) {
      setGalleryTarget({ type: 'service', id: serviceId });
      setShowGalleryModal(true);
    }
  };

  const handleGallerySelect = async (url) => {
    setShowGalleryModal(false);
    if (!galleryTarget) return;

    if (galleryTarget.type === 'service') {
      const serviceId = galleryTarget.id;
      
      // 1. Maintain legacy support for IDs 6-9 in datos_id 28 (if needed elsewhere)
      const serviceIdToFotoMapping = {
        6: 'foto21',
        7: 'foto19',
        8: 'foto23',
        9: 'foto24',
      };
      const fotoKey = serviceIdToFotoMapping[serviceId];

      const serviceIdToStateSetter = {
        6: setInputValue301,
        7: setInputValue302,
        8: setInputValue303,
        9: setInputValue304,
      };
      const stateSetter = serviceIdToStateSetter[serviceId];

      if (fotoKey && stateSetter) {
        await handleSaveDatosId(28, fotoKey, url, stateSetter);
      }

      // 2. Update optionalServices collection in Firebase (which covers ALL services)
      try {
        const db = getDatabase(app);
        const servicesRef = ref(db, 'optionalServices');
        const snapshot = await get(servicesRef);
        if (snapshot.exists()) {
          const services = snapshot.val();
          let servicesArray = Array.isArray(services) ? services : Object.values(services);
          
          // Filter out null/undefined in case of sparse arrays
          servicesArray = servicesArray.filter(s => s);
          
          const serviceIndex = servicesArray.findIndex(s => s.id === serviceId);
          if (serviceIndex > -1) {
            servicesArray[serviceIndex].imageUrl = url;
            await firebaseSet(servicesRef, servicesArray);
            
            // 3. Update local state to reflect instantly without refresh
            setServiciosOpcionalesFromDB(servicesArray);
            showToast('Imagen del servicio actualizada', 'success');
          }
        }
      } catch (error) {
        console.error("Error updating optionalServices image:", error);
      }

    } else if (galleryTarget.type === 'logo') {
      handleSaveHeaderConfig('logoUrl', url);
    }
    setGalleryTarget(null);
  };

  const updateNombreServicio = (id, newValue) => {
    setNombresServicios(prev => ({ ...prev, [id]: newValue }));
  };



  registerLocale('es', es);
  const [carritoFromChild, setCarritoFromChild] = useState([]);

  let [carrito, setCarrito] = useState([])
  const handleCartChange = (newCart) => {
    setCarritoFromChild(newCart);
  };


  let [selectedDate, setSelectedDate] = useState(null);
  let [allFetchedPrices, setAllFetchedPrices] = useState({});
  let [inputValue, setInputValue] = useState("");
  let [inputValue1, setInputValue1] = useState("");
  let [inputValue2, setInputValue2] = useState("");
  let [inputValue3, setInputValue3] = useState("");
  let [inputValue4, setInputValue4] = useState("");
  let [inputValue5, setInputValue5] = useState("");
  let [inputValue6, setInputValue6] = useState("");
  let [inputValue7, setInputValue7] = useState("");
  let [inputValue8, setInputValue8] = useState("");
  let [inputValue9, setInputValue9] = useState("");
  let [inputValue10, setInputValue10] = useState("");
  let [inputValue11, setInputValue11] = useState("");
  let [inputValue12, setInputValue12] = useState("");
  let [inputValue13, setInputValue13] = useState("");
  let [inputValue14, setInputValue14] = useState("");
  let [inputValue15, setInputValue15] = useState("");
  let [inputValue16, setInputValue16] = useState("");
  let [inputValue17, setInputValue17] = useState("");
  let [inputValue101, setInputValue101] = useState("");
  let [inputValue102, setInputValue102] = useState("");
  let [inputValue201, setInputValue201] = useState("");
  let [inputValue202, setInputValue202] = useState("");
  let [inputValue203, setInputValue203] = useState("");
  let [inputValue204, setInputValue204] = useState("");
  let [inputValue205, setInputValue205] = useState("");
  let [inputValue206, setInputValue206] = useState("");
  let [inputValue207, setInputValue207] = useState("");
  let [inputValue208, setInputValue208] = useState("");
  let [inputValue209, setInputValue209] = useState("");
  let [inputValue210, setInputValue210] = useState("");

  let [inputValue301, setInputValue301] = useState("");
  let [inputValue302, setInputValue302] = useState("");
  let [inputValue303, setInputValue303] = useState("");
  let [inputValue304, setInputValue304] = useState("");



  let [inputValue500, setInputValue500] = useState("");
  let [defaultInputValue500, setDefaultInputValue500] = useState("");
  let [inputValue501, setInputValue501] = useState("");
  let [inputValue502, setInputValue502] = useState("");
  let [inputValue503, setInputValue503] = useState("");
  let [inputValue504, setInputValue504] = useState("");
  let [inputValue505, setInputValue505] = useState("");
  let [inputValue506, setInputValue506] = useState("");
  let [inputValue507, setInputValue507] = useState("");
  let [inputValue508, setInputValue508] = useState("");
  let [inputValue509, setInputValue509] = useState("");
  let [inputValue510, setInputValue510] = useState("");
  let [inputValue511, setInputValue511] = useState("");
  let [inputValue512, setInputValue512] = useState("");
  let [inputValue513, setInputValue513] = useState("");
  let [inputValue514, setInputValue514] = useState("");
  let [inputValue515, setInputValue515] = useState("");
  let [inputValue516, setInputValue516] = useState("");
  let [inputValue517, setInputValue517] = useState("");
  let [inputValue518, setInputValue518] = useState("");
  let [inputValue519, setInputValue519] = useState("");
  let [inputValue520, setInputValue520] = useState("");
  let [inputValue521, setInputValue521] = useState("");
  let [inputValue522, setInputValue522] = useState("");
  let [inputValue523, setInputValue523] = useState("");
  let [inputValue524, setInputValue524] = useState("");
  let [inputValue525, setInputValue525] = useState("");
  let [inputValue526, setInputValue526] = useState("");
  let [inputValue527, setInputValue527] = useState("");
  let [inputValue528, setInputValue528] = useState("");
  let [inputValue529, setInputValue529] = useState("");
  let [inputValue530, setInputValue530] = useState("");
  let [inputValue531, setInputValue531] = useState("");
  let [inputValue546, setInputValue546] = useState("");
  let [inputValue547, setInputValue547] = useState("");
  let [inputValue548, setInputValue548] = useState("");
  let [inputValue549, setInputValue549] = useState("");
  let [inputValue550, setInputValue550] = useState("");
  let [inputValue551, setInputValue551] = useState("");
  let [inputValue552, setInputValue552] = useState("");
  let [inputValue553, setInputValue553] = useState("");
  let [inputValue554, setInputValue554] = useState("");
  let [inputValue555, setInputValue555] = useState("");
  let [inputValue556, setInputValue556] = useState("");
  let [inputValue557, setInputValue557] = useState("");
  let [inputValue558, setInputValue558] = useState("");
  let [inputValue559, setInputValue559] = useState("");
  let [inputValue560, setInputValue560] = useState("");
  let [inputValue561, setInputValue561] = useState("");
  let [inputValue562, setInputValue562] = useState("");
  let [inputValue563, setInputValue563] = useState("");
  let [inputValue564, setInputValue564] = useState("");
  let [inputValue564Fixed, setInputValue564Fixed] = useState("Alquiler de instalaciones Sábados, Domingos y Feriados");
  let [inputValue565, setInputValue565] = useState("");
  let [inputValue566, setInputValue566] = useState("");
  let [inputValue567, setInputValue567] = useState("");
  let [inputValue567Fixed, setInputValue567Fixed] = useState("Alquiler de instalaciones Vísperas de Feriado");
  let [inputValue568, setInputValue568] = useState("");
  let [inputValue569, setInputValue569] = useState("");
  let [inputValue570, setInputValue570] = useState("");
  let [inputValue571, setInputValue571] = useState("");
  let [inputValue572, setInputValue572] = useState("");
  let [inputValue572Fixed, setInputValue572Fixed] = useState("Alquiler de instalaciones de Lunes a Viernes");
  let [inputValue573, setInputValue573] = useState("");
  let [inputValue574, setInputValue574] = useState("");
  let [inputValue575, setInputValue575] = useState("");
  let [inputValue575Fixed, setInputValue575Fixed] = useState("Alquiler de instalaciones Domingos");
  let [inputValue576, setInputValue576] = useState("");
  let [inputValue577, setInputValue577] = useState("");
  let [inputValue578, setInputValue578] = useState("");
  let [inputValue579, setInputValue579] = useState("");
  let [inputValue580, setInputValue580] = useState("");
  let [inputValue581, setInputValue581] = useState("");
  let [inputValue582, setInputValue582] = useState("");
  let [inputValue583, setInputValue583] = useState("");
  let [inputValue584, setInputValue584] = useState("");
  let [inputValue585, setInputValue585] = useState("");
  let [inputValue586, setInputValue586] = useState("");
  let [inputValue587, setInputValue587] = useState("");
  let [inputValue588, setInputValue588] = useState("");
  let [inputValue589, setInputValue589] = useState("");
  let [inputValue590, setInputValue590] = useState("");
  let [inputValue591, setInputValue591] = useState("");
  let [inputValue592, setInputValue592] = useState("");
  let [inputValue593, setInputValue593] = useState("");
  let [inputValue594, setInputValue594] = useState("");
  let [inputValue595, setInputValue595] = useState("");
  let [inputValue596, setInputValue596] = useState("");
  let [inputValue597, setInputValue597] = useState("");
  let [inputValue598, setInputValue598] = useState("");
  let [inputValue599, setInputValue599] = useState("");
  let [inputValue600, setInputValue600] = useState("");
  let [inputValue601, setInputValue601] = useState("");
  let [inputValue602, setInputValue602] = useState("");
  let [inputValue603, setInputValue603] = useState("");
  let [inputValue604, setInputValue604] = useState("");
  let [inputValue605, setInputValue605] = useState("");
  let [inputValue606, setInputValue606] = useState("");
  let [horarioNavidad, setHorarioNavidad] = useState("¡Vísperas de navidad y año nuevo alquilamos hasta las 3 de la mañana como excepción!");
  let [horarioFinde, setHorarioFinde] = useState("Alquilamos hasta las 12 de la noche como máximo.");
  let [horarioSemana, setHorarioSemana] = useState("Alquilamos hasta las 21hs como máximo.");

  let [horarioNavidadFixed, setHorarioNavidadFixed] = useState("Alquilamos hasta las 21hs como máximo.");
  let [horarioFindeFixed, setHorarioFindeFixed] = useState("Alquilamos hasta las 21hs como máximo.");
  let [horarioSemanaFixed, setHorarioSemanaFixed] = useState("Alquilamos hasta las 21hs como máximo.");

  const [textoNavidad24, setTextoNavidad24] = useState("¡Víspera de Navidad!");
  const [horarioNavidad24, setHorarioNavidad24] = useState("Alquilamos hasta las 3 am");
  const [textoNavidad25, setTextoNavidad25] = useState("¡Navidad!");
  const [horarioNavidad25, setHorarioNavidad25] = useState("Horario especial");
  const [textoAnoNuevo31, setTextoAnoNuevo31] = useState("¡Víspera de Año Nuevo!");
  const [horarioAnoNuevo31, setHorarioAnoNuevo31] = useState("Alquilamos hasta las 3 am");
  const [textoAnoNuevo1, setTextoAnoNuevo1] = useState("¡Año Nuevo!");
  const [horarioAnoNuevo1, setHorarioAnoNuevo1] = useState("Horario especial");
  const [horarioNavidad24Fixed, setHorarioNavidad24Fixed] = useState("Alquilamos hasta las 21hs como máximo.");
  const [horarioNavidad25Fixed, setHorarioNavidad25Fixed] = useState("Alquilamos hasta las 21hs como máximo.");
  const [horarioAnoNuevo31Fixed, setHorarioAnoNuevo31Fixed] = useState("Alquilamos hasta las 21hs como máximo.");
  const [horarioAnoNuevo1Fixed, setHorarioAnoNuevo1Fixed] = useState("Alquilamos hasta las 21hs como máximo.");

  const [bookedDates, setBookedDates] = useState([]);
  const [bookedDatesLoaded, setBookedDatesLoaded] = useState(false);
  const handleBookedDatesLoaded = useCallback((dates) => {
    setBookedDates(dates);
    setBookedDatesLoaded(true);
  }, []);



  const [calendarEndDate, setCalendarEndDate] = useState(null);
  const [nombresServicios, setNombresServicios] = useState({});

  let [mensajeEditable, setMensajeEditable] = useState("");
  let [mensajeFecha, setMensajeFecha] = useState("");
  let [carritoTitulo, setCarritoTitulo] = useState("Tu carrito"); // Nuevo estado para el título del carrito
  let [bannerServiciosOpcionalesText, setBannerServiciosOpcionalesText] = useState("Agrega servicios a tu carrito"); // Nuevo estado para el banner de servicios opcionales
  let [aclaracionesBannerTitle, setAclaracionesBannerTitle] = useState("Aclaraciones es"); // Nuevo estado para el título del banner de aclaraciones
  let [serviciosExternosBannerTitle, setServiciosExternosBannerTitle] = useState("Servicios externos recomendados"); // Nuevo estado para el título del banner de servicios externos
  const [externalServices, setExternalServices] = useState([]); // Nuevo estado para los servicios externos
  let [mensajeAMostrar, setmensajeAMostrar] = useState("");
  const [symbolTypes, setSymbolTypes] = useState({}); // State for symbol types
  let [precioAMostrar, setPrecioAMostrar] = useState("");
  // const [activePriceVersion, setActivePriceVersion] = useState(null); // Versioning state - Moved up
  const [rentalNameKey, setRentalNameKey] = useState('');
  const [currentRentalService, setCurrentRentalService] = useState(null); // New state variable
  const isDateFromLocalStorage = useRef(false);
  const lastProcessedFecha = useRef(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const navigate = useNavigate();
  const [urlSearchParams, setSearchParams] = useSearchParams();
  const searchParams = useMemo(() => {
    const params = new URLSearchParams(initialParams || urlSearchParams);
    // Only set default if not present, to respect URL navigation
    if (!params.has('v') && activePriceVersion) {
      params.set('v', activePriceVersion.toString());
    }
    return params;
  }, [initialParams, urlSearchParams, activePriceVersion]);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const hasProcessedURL = useRef(false);
  const [holidayDates, setHolidayDates] = useState([]);
  const [orangeHolidayDates, setOrangeHolidayDates] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', key: 0 });
  const toastTimerRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  // const [activePriceVersion, setActivePriceVersion] = useState(null); // Moved up
  const [year, setYear] = useState(null); // Restored year state
  const [urlParams, setUrlParams] = useState(null);
  const localStorageProcessed = useRef(false);
  const [aclaracionAMostrar, setaclaracionAMostrar] = useState("");
  const { mes: mesFromParams } = useParams();
  const match = urlLocation.pathname.match(/precios(\d+)/);
  const mesFromPath = match ? parseInt(match[1], 10) : null;
  const mesDigit = mesFromParams ? parseInt(mesFromParams, 10) : mesFromPath;
  // Con el mapeo circular de 24 meses, respetamos el mes directo del URL (1-24)
  const mes = mesDigit;
  const [priceDisplayMode, setPriceDisplayMode] = useState('none');
  const [activeScheduleStructure, setActiveScheduleStructure] = useState('dynamic');
  const [scheduleStructureLoaded, setScheduleStructureLoaded] = useState(false);
  const [showAclaraciones, setShowAclaraciones] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [descuentoAdmin, setDescuentoAdmin] = useState(0);
  const [tipoDescuentoAdmin, setTipoDescuentoAdmin] = useState('porcentaje');

  useEffect(() => {
    if (searchParams.has('descuento')) {
      const desc = parseInt(searchParams.get('descuento'), 10);
      if (!isNaN(desc)) {
        setDescuentoAdmin(desc);
      }
    }
    if (searchParams.has('tipoDescuento')) {
      setTipoDescuentoAdmin(searchParams.get('tipoDescuento'));
    }
  }, [searchParams]);

  const getPrice = (id, defaultKey) => {
    if (!serviciosOpcionalesFromDB) return parseFloat(allFetchedPrices[defaultKey]) || 0;
    const service = serviciosOpcionalesFromDB.find(s => s.id === id);
    const key = service && service.priceKey ? service.priceKey : defaultKey;
    return parseFloat(allFetchedPrices[key]) || 0;
  };

  const removePriceFromTitle = (title) => {
    // Regex to match price patterns like $123, $123.45, $ 123, etc.
    // It looks for a dollar sign, optional space, and then numbers (with optional decimal part).
    if (typeof title !== 'string') {
      return '';
    }
    return title.replace(/\$\s*\d+(\.\d{1,2})?/g, '').trim();
  };

  const defaultServiceNames = {
    1: "Alquiler de las instalaciones por 3hs",
    2: "Hora extra promo",
    3: "Alquiler de las instalaciones por 4hs",
    4: "Hora extra",
    5: "Camarera para 20 personas ",
    6: "Metegol",
    7: "Inflable 3 x 3 mts",
    8: "Ping pong",
    9: "Arcade multijuego",
    10: "Proyector de video con pantalla",
    11: "Hora extra previa de organización",
    12: "Servicio de parrillero",
    13: "Alquiler de las instalaciones en víspera de navidad",
    14: "Alquiler de las instalaciones en víspera de año nuevo",
    15: "Camarera para 20 personas x hora", // This is for the name of the extra hour for camarera
  };

  const [isPageLoading, setIsPageLoading] = useState(true);
  const { startLoading, completeTask } = useLoading();

  useEffect(() => {
    startLoading(['precios_dinamico']);
  }, [startLoading]);

  useEffect(() => {
    if (!isPageLoading) {
      completeTask('precios_dinamico');
    }
  }, [isPageLoading, completeTask]);
  const [textsDataLoaded, setTextsDataLoaded] = useState(false);
  const [holidaysDataLoaded, setHolidaysDataLoaded] = useState(false);
  const [nameDataLoaded, setNameDataLoaded] = useState(false);
  const [whatsappNumberLoaded, setWhatsappNumberLoaded] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth >= 280 && window.innerWidth <= 1080);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [rentalServiceNameNavidad, setRentalServiceNameNavidad] = useState("Alquiler de las instalaciones en víspera de Navidad");
  const [rentalServiceNameAnoNuevo, setRentalServiceNameAnoNuevo] = useState("Alquiler de las instalaciones en víspera de Año Nuevo");
  const [rentalServiceNameFeriado, setRentalServiceNameFeriado] = useState("Alquiler de las instalaciones por 4hs");
  const [rentalServiceNameSemana, setRentalServiceNameSemana] = useState("Alquiler de las instalaciones por 3hs");
  const [rentalServiceNameFinde, setRentalServiceNameFinde] = useState("Alquiler de las instalaciones por 4hs");

  const [versionPrices, setVersionPrices] = useState({});

  // Fetch prices for all versions to display in selector
  useEffect(() => {
    if (!currentMonth || !activePriceVersion) return;

    const fetchVersionPrices = async () => {
      const db = getDatabase(app);
      const pricesObj = {};
      const maxVersion = activePriceVersion || 2;

      // Use existing "year" calculation from PreciosDinamico if available or deduce it
      // In PreciosDinamico, currentMonth is already adjusted (1-24) to handle years.
      // However, the database path logic in fetchPrices uses: rootPath + "/" + currentMonth
      // We should replicate that.

      const promises = Array.from({ length: maxVersion }, (_, i) => i + 1).map(async (v) => {
        let path = 'datosId';
        if (v < maxVersion) {
          path = `precios_legacy_v${v}`;
        }
        // Note: PreciosDinamico uses 'currentMonth' which is 1-indexed, potentially > 12 for next year.
        const monthPath = `${path}/${currentMonth}`;

        try {
          const snapshot = await get(ref(db, monthPath));
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Try dynamic key 3 (4hs) or fallback to a_precio_4hs_
            const price = data['servicio_3_'] || data['a_precio_4hs_'] || 0;
            pricesObj[v] = parseFloat(price);
          }
        } catch (e) {
          console.error(`Error fetching prices for version ${v}:`, e);
        }
      });

      await Promise.all(promises);
      setVersionPrices(pricesObj);
    };

    fetchVersionPrices();
  }, [currentMonth, activePriceVersion]);

  useEffect(() => {
    const fetchRentalServiceNames = async () => {
      const db = getDatabase(app);
      const rentalNamesRef = ref(db, 'serviceNames/rental');
      try {
        const snapshot = await get(rentalNamesRef);
        if (snapshot.exists()) {
          const names = snapshot.val();
          setRentalServiceNameNavidad(names.navidad || "Alquiler de las instalaciones en víspera de Navidad");
          setRentalServiceNameAnoNuevo(names.anoNuevo || "Alquiler de las instalaciones en víspera de Año Nuevo");
          setRentalServiceNameFeriado(names.feriado || "Alquiler de las instalaciones por 4hs");
          setRentalServiceNameSemana(names.semana || "Alquiler de las instalaciones por 3hs");
          setRentalServiceNameFinde(names.finde || "Alquiler de las instalaciones por 4hs");
        }
      } catch (error) {
        console.error("Error fetching rental service names:", error);
      }
    };
    fetchRentalServiceNames();
  }, []);

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const db = getDatabase(app);
      const dbRef = ref(db, 'datosId/25'); // Correct path

      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const whatsappText = snapshot.val().whatsapp_text || ''; // Get the text
          // Extract number from "<p>Whatsapp: 11-5996-1188</p>"
          const numberMatch = whatsappText.match(/(\d{2}-\d{4}-\d{4})/);
          if (numberMatch) {
            let number = numberMatch[0].replace(/-/g, ''); // remove dashes
            if (!number.startsWith('549')) {
              number = '549' + number;
            }
            setWhatsappNumber(number);
          } else {
            setWhatsappNumber('');
          }
        } else {
          console.log("No se encontró el número de WhatsApp en Firebase en la ruta 'datosId/25'.");
          setWhatsappNumber('');
        }
      } catch (error) {
        console.error("Error al obtener el número de WhatsApp de Firebase:", error);
        setWhatsappNumber('');
      } finally {
        setWhatsappNumberLoaded(true);
      }
    };

    fetchWhatsappNumber();
    fetchWhatsappNumber();
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

  useEffect(() => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/33');

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const targetObject = snapshot.val();

        // Migration Logic
        if ((!targetObject.incluye && targetObject.contenido6) || (!targetObject.no_incluye && targetObject.contenido14)) {
          const doMigration = async () => {
            const updates = {};
            let hasUpdates = false;

            if (!targetObject.incluye && targetObject.contenido6) {
              const incluyeItems = [
                { key: 'contenido6', typeKey: 'contenido6_type' },
                { key: 'contenido7', typeKey: 'contenido7_type' },
                { key: 'contenido8', typeKey: 'contenido8_type' },
                { key: 'contenido9', typeKey: 'contenido9_type' },
                { key: 'contenido10', typeKey: 'contenido10_type' },
                { key: 'contenido11', typeKey: 'contenido11_type' },
                { key: 'contenido12', typeKey: 'contenido12_type' },
              ];
              incluyeItems.forEach(item => {
                const text = targetObject[item.key];
                if (text) {
                  const newRef = push(ref(db, 'datosId/33/incluye'));
                  updates[`datosId/33/incluye/${newRef.key}`] = {
                    text: text,
                    type: targetObject[item.typeKey] || 'check'
                  };
                  hasUpdates = true;
                }
              });
            }

            if (!targetObject.no_incluye && targetObject.contenido14) {
              const noIncluyeItems = [
                { key: 'contenido14', typeKey: 'contenido14_type', defaultType: 'cross_red' },
                { key: 'contenido15', typeKey: 'contenido15_type', defaultType: 'cross_red' },
                { key: 'contenido16', typeKey: 'contenido16_type', defaultType: 'cross_red' },
                { key: 'contenido17', typeKey: 'contenido17_type', defaultType: 'cross_red' },
              ];
              noIncluyeItems.forEach(item => {
                const text = targetObject[item.key];
                if (text) {
                  const newRef = push(ref(db, 'datosId/33/no_incluye'));
                  updates[`datosId/33/no_incluye/${newRef.key}`] = {
                    text: text,
                    type: targetObject[item.typeKey] || item.defaultType
                  };
                  hasUpdates = true;
                }
              });
            }

            if (hasUpdates) {
              try {
                await update(ref(db), updates);
                console.log("Migración de listas completada.");
              } catch (error) {
                console.error("Error en migración:", error);
              }
            }
          };
          doMigration();
        }

        // Load symbol types
        setSymbolTypes({
          contenido6: targetObject.contenido6_type || 'check',
          contenido7: targetObject.contenido7_type || 'check',
          contenido8: targetObject.contenido8_type || 'check',
          contenido9: targetObject.contenido9_type || 'check',
          contenido10: targetObject.contenido10_type || 'check',
          contenido11: targetObject.contenido11_type || 'check',
          contenido12: targetObject.contenido12_type || 'check',
          contenido14: targetObject.contenido14_type || 'cross_red',
          contenido15: targetObject.contenido15_type || 'cross_red',
          contenido16: targetObject.contenido16_type || 'cross_red',
          contenido17: targetObject.contenido17_type || 'cross_red',
        });

        setInputValue500(targetObject.contenido1);
        setInputValue501(targetObject.contenido2);
        setInputValue502(targetObject.contenido3);
        setInputValue503(targetObject.contenido4);
        setInputValue504(targetObject.contenido5);
        setInputValue505(targetObject.contenido6);
        setInputValue506(targetObject.contenido7);
        setInputValue507(targetObject.contenido8);
        setInputValue508(targetObject.contenido9);
        setInputValue509(targetObject.contenido10);
        setInputValue510(targetObject.contenido11);
        setInputValue511(targetObject.contenido12);
        setInputValue512(targetObject.contenido13);
        setInputValue513(targetObject.contenido14);
        setInputValue514(targetObject.contenido15);
        setInputValue515(targetObject.contenido16);
        setInputValue516(targetObject.contenido17);
        setInputValue517(targetObject.contenido18);
        setInputValue518(targetObject.contenido19);
        setInputValue519(String(targetObject.contenido20 || '').replace(/lunes a jueves/gi, 'lunes a viernes'));
        setInputValue520(targetObject.contenido21);
        setInputValue521(targetObject.contenido22);
        setInputValue522(targetObject.contenido23);
        setInputValue523(targetObject.contenido24);
        setInputValue524(targetObject.contenido25);
        setInputValue525(targetObject.contenido26);
        setInputValue526(targetObject.contenido27);
        setInputValue527(targetObject.contenido28);
        setInputValue528(targetObject.contenido29);
        setInputValue529(targetObject.contenido30);
        setInputValue531(targetObject.contenido32);
        setInputValue547(targetObject.contenido48 || "Concretar Reserva por Whatsapp");
        setInputValue549(targetObject.contenido50);
        setInputValue550(targetObject.contenido51);
        setInputValue551(targetObject.contenido52);
        setInputValue552(targetObject.contenido53);
        setInputValue553(targetObject.contenido54);
        setInputValue554(targetObject.contenido55);
        setInputValue555(targetObject.contenido56);
        setInputValue556(targetObject.contenido57);
        setInputValue557(targetObject.contenido58);
        setInputValue558(targetObject.contenido59);
        setInputValue559(targetObject.contenido60);
        setInputValue560(targetObject.contenido61);
        setInputValue561(targetObject.contenido62);
        setInputValue562(targetObject.contenido63);
        setInputValue563(targetObject.contenido64);

        setInputValue564(targetObject.contenido65 || "Alquiler de instalaciones viernes, sábados, domingos y feriados");
        setInputValue564Fixed(targetObject.contenido65_fixed || "Alquiler de instalaciones Sábados, Domingos y Feriados");

        setInputValue565(targetObject.contenido66);
        setInputValue566(targetObject.contenido67);

        setInputValue567(String(targetObject.contenido68 || "Víspera de feriado con precios de semana").replace(/lunes a jueves/gi, 'lunes a viernes'));
        setInputValue567Fixed(targetObject.contenido68_fixed || "Alquiler de instalaciones Vísperas de Feriado");

        setInputValue568(targetObject.contenido69);
        setInputValue569(targetObject.contenido70);
        setInputValue570(targetObject.contenido71 || "4 horas de fiesta:");
        setInputValue571(targetObject.contenido72 || "Hora extra:");

        setInputValue572(String(targetObject.contenido73 || "Alquiler de instalaciones de lunes a viernes").replace(/lunes a jueves/gi, 'lunes a viernes'));
        setInputValue572Fixed(targetObject.contenido73_fixed || "Alquiler de instalaciones de Lunes a Viernes");

        setInputValue573(targetObject.contenido74);
        setInputValue574(targetObject.contenido75);

        setInputValue575(targetObject.contenido76 || "Domingo con precios de fin de semana y horario de semana");
        setInputValue575Fixed(targetObject.contenido76_fixed || "Alquiler de instalaciones Domingos");
        setInputValue576(targetObject.contenido77);
        setInputValue577(targetObject.contenido78);
        setInputValue578(targetObject.contenido79);
        setInputValue579(targetObject.contenido80);
        setInputValue580(targetObject.contenido81 || defaultServiceNames[6]);
        setInputValue581(targetObject.contenido82 || defaultServiceNames[7]);
        setInputValue582(targetObject.contenido83 || defaultServiceNames[8]);
        setInputValue583(targetObject.contenido84 || defaultServiceNames[9]);
        setInputValue584(targetObject.contenido85 || "de LUNES A VIERNES");
        setInputValue585(targetObject.contenido86 || "de LUNES A VIERNES");
        setInputValue586(targetObject.contenido87 || "de VIERNES A DOMINGOS Y FERIADOS");
        setInputValue587(targetObject.contenido88 || "de VIERNES A DOMINGOS Y FERIADOS");
        setInputValue588(targetObject.contenido89 || "POR HORA");
        setInputValue589(targetObject.contenido90 || "Fichin/Videojuego");
        setInputValue590(targetObject.contenido91 || defaultServiceNames[10]);
        setInputValue591(targetObject.contenido92 || defaultServiceNames[11]);
        setInputValue592(targetObject.contenido93 || defaultServiceNames[12]);
        setInputValue593(targetObject.contenido94 || "de 19 a 03am");
        setInputValue594(targetObject.contenido95 || "de 19 a 03am");
        setInputValue595(targetObject.contenido96 || "Las camareras se contratan como mínimo por 3hs");
        setInputValue596(targetObject.contenido97 || "");
        setInputValue597(targetObject.contenido98 || "");
        setInputValue598(targetObject.contenido99 || "Aclaración");
        setInputValue599(targetObject.contenido100 || "Aclaración");
        setInputValue601(targetObject.contenido101 || "Las camareras ayudan a servir la comida y la bebida, calientan comidas pre-hechas, no elaboran comidas. El tiempo mínimo de contratación es por 3 horas. Una camarera puede llegar a atender a 25 personas como máximo, el ideal son 20 personas atendidas por camarera");
        setInputValue602(targetObject.contenido102 || "Proyección de videos en pantalla de 80 pulgadas. Este servicio solo se alquila por la noche ya que de día entra mucha luz al salón y no se ve de forma óptima.");
        setInputValue603(targetObject.contenido103 || "La hora extra previa se contrata cuando necesitás más tiempo del que ya damos sin cargo, para organizar el salón antes del evento, dejar bebidas, preparar fuego, decorar. No es una hora extra de fiesta con invitados, aunque pueden venir a ayudar algunos parientes y amigos si es necesario o personal de servicios contratados.");
        setInputValue604(targetObject.contenido104 || "Se trata de un cocinero a cargo de la parrilla para realizar carne asada. El parrillero coordina previamente con vos para pedirte la cantidad de carbón que va a necesitar y los horarios de salida de la comida según lo que le pidas. La vajilla para servir la carne en las mesas no está incluida dentro de este servicio. Tampoco está incluido el servicio de camareras o bandejeo.");
        setInputValue605(targetObject.contenido105 || "");
        setInputValue606(targetObject.contenido106 || "");
        setHorarioNavidad(targetObject.horario_navidad || "¡Vísperas de navidad y año nuevo alquilamos hasta las 3 de la mañana como excepción!");
        setHorarioFinde(targetObject.horario_finde || "Alquilamos hasta las 12 de la noche como máximo.");
        setHorarioSemana(targetObject.horario_semana || "Alquilamos hasta las 21hs como máximo.");

        // Fetch Fixed Versions with Fallbacks
        setHorarioNavidadFixed(targetObject.horario_navidad_fixed || "Alquilamos hasta las 21hs como máximo.");
        setHorarioFindeFixed(targetObject.horario_finde_fixed || "Alquilamos hasta las 21hs como máximo.");
        setHorarioSemanaFixed(targetObject.horario_semana_fixed || "Alquilamos hasta las 21hs como máximo.");

        setTextoNavidad24(targetObject.texto_navidad_24 || "¡Víspera de Navidad!");
        setHorarioNavidad24(targetObject.horario_navidad_24 || "Alquilamos hasta las 3 am");
        setHorarioNavidad24Fixed(targetObject.horario_navidad_24_fixed || "Alquilamos hasta las 21hs como máximo.");

        setTextoNavidad25(targetObject.texto_navidad_25 || "¡Navidad!");
        setHorarioNavidad25(targetObject.horario_navidad_25 || "Horario especial");
        setHorarioNavidad25Fixed(targetObject.horario_navidad_25_fixed || "Alquilamos hasta las 21hs como máximo.");

        setTextoAnoNuevo31(targetObject.texto_ano_nuevo_31 || "¡Víspera de Año Nuevo!");
        setHorarioAnoNuevo31(targetObject.horario_ano_nuevo_31 || "Alquilamos hasta las 3 am");
        setHorarioAnoNuevo31Fixed(targetObject.horario_ano_nuevo_31_fixed || "Alquilamos hasta las 21hs como máximo.");

        setTextoAnoNuevo1(targetObject.texto_ano_nuevo_1 || "¡Año Nuevo!");
        setHorarioAnoNuevo1(targetObject.horario_ano_nuevo_1 || "Horario especial");
        setHorarioAnoNuevo1Fixed(targetObject.horario_ano_nuevo_1_fixed || "Alquilamos hasta las 21hs como máximo.");
        setCarritoTitulo(targetObject.contenido_carrito_titulo || "Tu carrito"); // Cargar el título del carrito
        setBannerServiciosOpcionalesText(targetObject.contenido_banner_servicios_opcionales || "Agrega servicios a tu carrito"); // Cargar el texto del banner de servicios opcionales
        setAclaracionesBannerTitle(targetObject.contenido_aclaraciones_banner || "Aclaraciones"); // Cargar el título del banner de aclaraciones
        setServiciosExternosBannerTitle(targetObject.contenido_servicios_externos_banner || "Servicios externos recomendados"); // Cargar el título del banner de servicios externos
        setTextsDataLoaded(true);
      } else {
        console.error("No se encontraron datos en la base de datos de Firebase.");
        setTextsDataLoaded(true);
      }
    }, (error) => {
      console.error("Error al conectar con Firebase para obtener textos:", error);
      setTextsDataLoaded(true);
    });

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSaveBannerServiciosOpcionalesText = async (newValue) => {
    if (currentUser) {
      try {
        const db = getDatabase(app);
        const dataRef = ref(db, `datosId/33`);
        await update(dataRef, { contenido_banner_servicios_opcionales: newValue });
        setBannerServiciosOpcionalesText(newValue);
        showToast("Texto del banner de servicios opcionales actualizado", "success");
      } catch (error) {
        console.error("Error updating banner servicios opcionales text:", error);
        showToast("Error al actualizar el texto del banner de servicios opcionales", "error");
      }
    }
  };

  const handleSaveAclaracionesBannerTitle = async (newValue) => {
    if (currentUser && adminEditMode) {
      try {
        const db = getDatabase(app);
        const dataRef = ref(db, `datosId/33`);
        await update(dataRef, { contenido_aclaraciones_banner: newValue });
        setAclaracionesBannerTitle(newValue);
        showToast("Título del banner de aclaraciones actualizado", "success");
      } catch (error) {
        console.error("Error updating aclaraciones banner title:", error);
        showToast("Error al actualizar el título del banner de aclaraciones", "error");
      }
    }
  };

  const handleSaveServiciosExternosBannerTitle = async (newValue) => {
    if (currentUser && adminEditMode) {
      try {
        const db = getDatabase(app);
        const dataRef = ref(db, `datosId/33`);
        await update(dataRef, { contenido_servicios_externos_banner: newValue });
        setServiciosExternosBannerTitle(newValue);
        showToast("Título del banner de servicios externos actualizado", "success");
      } catch (error) {
        console.error("Error updating servicios externos banner title:", error);
        showToast("Error al actualizar el título del banner de servicios externos", "error");
      }
    }
  };

  const handleToggleSymbol = async (contenidoKey, currentType) => {
    if (!currentUser || !adminEditMode) return;

    const currentIndex = symbolTypesList.indexOf(currentType);
    const validIndex = currentIndex !== -1 ? currentIndex : 0;
    const nextIndex = (validIndex + 1) % symbolTypesList.length;
    const newType = symbolTypesList[nextIndex];

    try {
      const db = getDatabase(app);
      const dataRef = ref(db, `datosId/33`);
      await update(dataRef, { [`${contenidoKey}_type`]: newType });
      setSymbolTypes(prev => ({ ...prev, [contenidoKey]: newType }));
    } catch (error) {
      console.error(`Error updating symbol type for ${contenidoKey}:`, error);
      showToast("Error al actualizar el símbolo", "error");
    }
  };

  // Firebase logic for external services
  useEffect(() => {
    const db = getDatabase(app);
    const externalServicesRef = ref(db, 'datosId/33/externalRecommendedServices');

    const unsubscribe = onValue(externalServicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedServices = Object.keys(data).map(key => ({
          id: key,
          text: data[key].text || '',
          buttonText: data[key].buttonText || '',
          url: data[key].url || '',
          socialUrl: data[key].socialUrl || '',
          socialButtonText: data[key].socialButtonText || '',
          imageUrl: data[key].imageUrl || '',
        }));
        setExternalServices(loadedServices);
      } else {
        setExternalServices([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddExternalService = async () => {
    if (!currentUser || !adminEditMode) return;
    try {
      const db = getDatabase(app);
      const externalServicesRef = ref(db, 'datosId/33/externalRecommendedServices');
      const newServiceRef = push(externalServicesRef);
      await firebaseSet(newServiceRef, {
        text: 'Nuevo servicio recomendado',
        buttonText: 'Ver más',
        url: 'https://example.com',
        socialUrl: 'https://instagram.com',
        socialButtonText: 'Red Social'
      });
      showToast('Nuevo servicio externo agregado', 'success');
    } catch (error) {
      console.error('Error al agregar servicio externo:', error);
      showToast('Error al agregar servicio externo', 'error');
    }
  };

  const handleRemoveExternalService = async (id) => {
    if (!currentUser || !adminEditMode) return;
    try {
      const db = getDatabase(app);
      await remove(ref(db, `datosId/33/externalRecommendedServices/${id}`));
      showToast('Servicio externo eliminado', 'success');
    } catch (error) {
      console.error('Error al eliminar servicio externo:', error);
      showToast('Error al eliminar servicio externo', 'error');
    }
  };

  const handleSaveExternalService = async (id, field, newValue) => {
    if (!currentUser || !adminEditMode) return;
    try {
      const db = getDatabase(app);
      await update(ref(db, `datosId/33/externalRecommendedServices/${id}`), { [field]: newValue });
      showToast('Servicio externo actualizado', 'success');
    } catch (error) {
      console.error('Error al actualizar servicio externo:', error);
      showToast('Error al actualizar servicio externo', 'error');
    }
  };

  const servicioIdToAclaracionContenidoMapping = {
    1: 'contenido97',
    2: 'contenido98',
    3: 'contenido99',
    4: 'contenido100',
    5: 'contenido101',
    6: 'contenido81',
    7: 'contenido82',
    8: 'contenido83',
    9: 'contenido84',
    10: 'contenido102',
    11: 'contenido103',
    12: 'contenido104',
    13: 'contenido105',
    14: 'contenido106',
  };

  const servicioIdToStateUpdaterMapping = {
    1: setInputValue596,
    2: setInputValue597,
    3: setInputValue598,
    4: setInputValue599,
    5: setInputValue601,
    6: setInputValue580,
    7: setInputValue581,
    8: setInputValue582,
    9: setInputValue583,
    10: setInputValue602,
    11: setInputValue603,
    12: setInputValue604,
    13: setInputValue605,
    14: setInputValue606,
  };

  const handleSaveAclaracion = async (servicioId, newValue) => {
    if (currentUser && adminEditMode) {
      const contenidoKey = servicioIdToAclaracionContenidoMapping[servicioId];
      const stateUpdater = servicioIdToStateUpdaterMapping[servicioId];
      if (contenidoKey && stateUpdater) {
        await handleSaveDatosId(33, contenidoKey, newValue, stateUpdater);
      }
    }
  };

  useEffect(() => {
    const fetchName = async () => {

      const db = getDatabase(app);
      let dbURL = "datosId/" + 29;
      const dbRef = ref(db, dbURL);
      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const targetObject = snapshot.val();
          setInputValue600(targetObject.contenido1);
          setNameDataLoaded(true);
        } else {
          console.error("No se encontraron datos en la base de datos de Firebase.");
          setNameDataLoaded(true);
        }
      } catch (error) {
        console.error("Error al conectar con Firebase para obtener nombre:", error);
        setNameDataLoaded(true);

      }
    };

    fetchName();

  }, []);

  useEffect(() => {
    const db = getDatabase(app);
    const structRef = ref(db, 'config/activeScheduleStructure');
    const unsubscribe = onValue(structRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveScheduleStructure(snapshot.val());
      }
      setScheduleStructureLoaded(true);
    });
    return () => unsubscribe();
  }, []);


  const isferiado = useCallback((date) => {

    const formattedDate = moment(date).format('YYYY-MM-DD');
    for (let i = 0; i < holidayDates.length; i++) {
      if (holidayDates[i] == formattedDate) {
        return true;
      }
    }
    return false;
  }, [holidayDates]);


  const isNextDayWeekendOrHoliday = useCallback((date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayOfWeek = nextDay.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const isNextDayFeriado = isferiado(nextDay);
    // Next day is a weekend (Fri/Sat/Sun) or a holiday
    return isNextDayFeriado || nextDayOfWeek === 0 || nextDayOfWeek === 5 || nextDayOfWeek === 6;
  }, [isferiado]); // Depends on isferiado







  const showToast = (message, type = 'success') => {
    // Limpia cualquier temporizador anterior para evitar toasts fantasmas
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    // Muestra el nuevo toast
    setToast({ show: true, message: message, type: type, key: Date.now() });

    // Programa el nuevo temporizador para ocultarlo
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 4000); // 4000ms = 4 segundos
  };



  const esVisperaDeFeriado = (date) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isferiado(tomorrow);
  };

  const updateDisplayForDate = (date) => {
    if (!date || !holidaysDataLoaded) return;

    const day = date.getDate();
    const month = date.getMonth();
    const diaDeLaSemana = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const esFeriado = isferiado(date);
    const esVispera = esVisperaDeFeriado(date);

    // --- MODO ESTRUCTURA FIJA ---
    if (activeScheduleStructure === 'fixed') {
      // Excepciones de horarios extendidos incluso en modo fijo
      if (day === 24 && month === 11) { // 24 de Diciembre
        setPriceDisplayMode('navidad24');
        return;
      }
      if (day === 31 && month === 11) { // 31 de Diciembre
        setPriceDisplayMode('anoNuevo31');
        return;
      }

      // Sábados, Domingos y Feriados -> weekend
      if (diaDeLaSemana === 6 || diaDeLaSemana === 0 || esFeriado) {
        setPriceDisplayMode('weekend');
      } else {
        // Lunes a Viernes -> weekday
        setPriceDisplayMode('weekday');
      }
      return;
    }

    // --- MODO SISTEMA DINÁMICO (Original) ---

    // Check for specific fixed dates first (e.g., Christmas Eve, New Year's Eve and Day)
    if (day === 24 && month === 11) { // December 24th
      setPriceDisplayMode('navidad24');
      return;
    }
    if (day === 25 && month === 11) { // December 25th
      setPriceDisplayMode('navidad25');
      return;
    }
    if (day === 31 && month === 11) { // December 31st
      setPriceDisplayMode('anoNuevo31');
      return;
    }
    if (day === 1 && month === 0) { // January 1st
      setPriceDisplayMode('anoNuevo1');
      return;
    }

    // NEW: Handle Sunday that is a holiday eve
    if (esVispera && diaDeLaSemana === 0 && !esFeriado) {
      setPriceDisplayMode('sunday_holiday_eve');
      return;
    }

    // Handle holiday eves that are not the fixed Christmas/New Year eves.
    // This condition applies to weekdays (Mon-Thu) that are an eve of *any* holiday, but not a holiday itself.
    if (esVispera && diaDeLaSemana >= 1 && diaDeLaSemana <= 4 && !esFeriado) {
      setPriceDisplayMode('weekday_holiday_eve');
      return;
    }

    // Handle Weekday Holiday (Mon-Thu) with special maxTime logic
    if (esFeriado && diaDeLaSemana >= 1 && diaDeLaSemana <= 4) { // Holiday that falls on a weekday (Mon-Thu)
      if (isNextDayWeekendOrHoliday(date)) {
        // If the next day is a weekend or another holiday, it extends like a weekend
        setPriceDisplayMode('weekend'); // Max time 24 (like regular weekend)
      } else {
        // If next day is a regular weekday, max time 21 (new type)
        setPriceDisplayMode('weekday_holiday_short'); // New priceDisplayMode
      }
      return; // IMPORTANT: return after setting mode
    }

    // Then handle Sunday
    if (diaDeLaSemana === 0) { // Sunday
      setPriceDisplayMode('sunday');
      return;
    }

    // Then handle regular Fridays, Saturdays, and any remaining general holidays (e.g., holidays that fall on Fri/Sat)
    // The `esFeriado` here should now *only* catch holidays that fall on Friday/Saturday, as weekday holidays are handled above.
    if (diaDeLaSemana === 5 || diaDeLaSemana === 6 || esFeriado) {
      setPriceDisplayMode('weekend');
      return;
    }

    // Finally, if none of the above, it's a regular weekday
    setPriceDisplayMode('weekday');
  };
  useEffect(() => {
    // Set initial date only when we have all necessary data (including booked dates & schedule config)
    if (!selectedDate && holidaysDataLoaded && bookedDatesLoaded && scheduleStructureLoaded) {
      const fechaParam = searchParams.get('fecha');
      const storedDateString = safeStorage.getItem('selectedDate');

      // 1. Try URL parameter first
      if (fechaParam) {
        try {
          const date = new Date(fechaParam);
          const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
          if (!isNaN(adjustedDate.getTime())) {
            setSelectedDate(adjustedDate);
            return;
          }
        } catch (e) { console.error(e); }
      }

      // 2. Try localStorage second
      if (storedDateString) {
        try {
          const date = new Date(storedDateString);
          const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
          if (!isNaN(adjustedDate.getTime())) {
            setSelectedDate(adjustedDate);
            safeStorage.removeItem('selectedDate');
            return;
          }
        } catch (e) { console.error(e); }
      }

      // 3. Smart Search algorithm
      if (mes) {
        let initialMonth = parseInt(mes, 10);
        let initialYear;

        if (initialMonth > 6 && initialMonth <= 12) {
          if (!inputValue101) return; // Wait for year 1 to be loaded
          initialYear = parseInt(inputValue101);
        } else if (initialMonth > 12 || (initialMonth >= 1 && initialMonth <= 6)) {
          if (!inputValue102) return; // Wait for year 2 to be loaded
          // If it was 1-6, the month for Date() is just the month itself.
          // If it was > 12 (e.g. 13), it's month 1.
          if (initialMonth > 12) initialMonth -= 12;
          initialYear = parseInt(inputValue102);
        } else {
          // Fallback
          if (!inputValue101) return;
          initialYear = parseInt(inputValue101);
        }

        // Ensure month is within 1-12 range
        if (initialMonth >= 1 && initialMonth <= 12) {
          // Smart Search Algorithm
          let targetDate = null;
          const daysInMonth = new Date(initialYear, initialMonth, 0).getDate();

          // 1. Try to find first available Weekend or Holiday
          for (let d = 1; d <= daysInMonth; d++) {
            const current = new Date(initialYear, initialMonth - 1, d);
            const formattedDate = format(current, 'yyyy-MM-dd');
            const isOccupied = bookedDates.includes(formattedDate);
            const dayOfWeek = current.getDay();
            const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || isferiado(current) || (dayOfWeek === 5 && activeScheduleStructure !== 'fixed');

            if (isWeekendOrHoliday && !isOccupied) {
              targetDate = current;
              break;
            }
          }

          // 2. If no weekend available, find first available Weekday
          if (!targetDate) {
            for (let d = 1; d <= daysInMonth; d++) {
              const current = new Date(initialYear, initialMonth - 1, d);
              const formattedDate = format(current, 'yyyy-MM-dd');
              const isOccupied = bookedDates.includes(formattedDate);
              // dayOfWeek 1-4 is Mon-Thu
              const dayOfWeek = current.getDay();
              // Ensure it's not a holiday (holidays are handled in step 1)
              const isWeekday = ((dayOfWeek >= 1 && dayOfWeek <= 4) || (dayOfWeek === 5 && activeScheduleStructure === 'fixed')) && !isferiado(current);

              if (isWeekday && !isOccupied) {
                targetDate = current;
                break;
              }
            }
          }

          // 3. Fallback to 1st of month if completely full (or just to show something)
          if (!targetDate) {
            targetDate = new Date(initialYear, initialMonth - 1, 1);
          }

          setSelectedDate(targetDate);
        } else {
          // Fallback to today if month is invalid
          const today = new Date();
          setSelectedDate(today);
        }

      } else {
        const today = new Date();
        setSelectedDate(today);
      }
    }
  }, [mes, inputValue101, inputValue102, holidaysDataLoaded, bookedDatesLoaded, bookedDates, scheduleStructureLoaded, activeScheduleStructure]);

  // REACTIVE STATE DERIVATION: Calculates Month/Year whenever Date or Config changes
  useEffect(() => {
    if (selectedDate) {
      const selectedYear = selectedDate.getFullYear();
      let month = selectedDate.getMonth() + 1;

      // Adjust month if it's for the next year based on inputValue101/inputValue102
      // FIX: Only do this if we are NOT already on the correct month relative to URL params.
      // If mes is 7, and we are viewing July 2025 (Year 2), month calculation might be tricky.
      // But if 'mes' param is present, we should trust it.

      if (inputValue102 && selectedYear === parseInt(inputValue102)) {
        // Only shift if Year 2 is DIFFERENT from Year 1.
        // If both are 2026, we stay in Year 1 (Month 7).
        if (inputValue101 && parseInt(inputValue101) === parseInt(inputValue102)) {
          // Do nothing, stay in Year 1
        } else {
          // If the selected date is in Year 2, the month MUST be shifted by +12 to match the bucket system (13-24),
          // regardless of what the 'mes' URL parameter says, because the Date object itself dictates the bucket.
          month += 12;
        }
      }

      // BUSINESS RULE: Only months 7-18 are active. Months 1-6 and 19-24 are unused.
      if (month === 19) {
        console.warn("Month 19 detected in DateChange (Unused). Remapping to Month 7.");
        month = 7;
      }

      // Only update if changed to prevent loops
      setCurrentMonth(prev => prev !== month ? month : prev);
      setYear(prev => prev !== selectedYear ? selectedYear : prev);

      // Update display mode
      if (holidaysDataLoaded) {
        updateDisplayForDate(selectedDate);
      }
    }
  }, [selectedDate, inputValue102, holidaysDataLoaded, holidayDates]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    showToast(`Fecha actualizada por el día ${formattedDate}`, 'success');
  };

  const handleLoadWeekendPrices = () => {
    const today = new Date();
    let baseDate;
    let initialViewDate = selectedDate || today;

    if (selectedDate) {
      if (selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear()) {
        baseDate = new Date(today);
      } else {
        baseDate = new Date(selectedDate);
        baseDate.setDate(1);
      }
    } else {
      baseDate = new Date(today);
    }

    let date = new Date(baseDate);
    const day = date.getDay();

    const weekendStartDay = activeScheduleStructure === 'fixed' ? 6 : 5;
    if (day > 0 && day < weekendStartDay) {
      const diff = weekendStartDay - day;
      date.setDate(baseDate.getDate() + diff);
    }
    // Check if occupied or holiday
    let safetyCounter = 0;
    while (safetyCounter < 50) { // Safety break
      const formattedDate = format(date, 'yyyy-MM-dd');
      const isOccupied = bookedDates.includes(formattedDate);
      const dayOfWeek = date.getDay();

      // Weekend definition:
      const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || isferiado(date) || (dayOfWeek === 5 && activeScheduleStructure !== 'fixed');

      if (isWeekendOrHoliday && !isOccupied) {
        break; // Found a valid date
      }

      // Advance to next day
      date.setDate(date.getDate() + 1);
      safetyCounter++;
    }

    setSelectedDate(date);

    if (date.getMonth() !== initialViewDate.getMonth()) {
      const initialMonthName = initialViewDate.toLocaleString('es-AR', { month: 'long' });
      showToast(`No hay días de fin de semana disponibles en ${initialMonthName}, mostrando la fecha más cercana`, 'info');
    } else {
      showToast('Cargando fecha de fin de semana...', 'info');
    }
  };

  const handleLoadWeekdayPrices = () => {
    const today = new Date();
    let baseDate;
    let initialViewDate = selectedDate || today;

    if (selectedDate) {
      if (selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear()) {
        baseDate = new Date(today);
      } else {
        baseDate = new Date(selectedDate);
        baseDate.setDate(1);
      }
    } else {
      baseDate = new Date(today);
    }

    let date = new Date(baseDate);

    // If current date is not a weekday or is a holiday, start searching from it (or next day)
    // We want to find the *nearest* valid weekday. 
    // If baseDate is already a valid weekday, we keep it.

    let iterations = 0;
    while (iterations < 30) { // Safety break
      const day = date.getDay();
      const formattedDate = format(date, 'yyyy-MM-dd');
      const isOccupied = bookedDates.includes(formattedDate);

      // Check for weekday AND not holiday AND not occupied
      const isWeekday = ((day >= 1 && day <= 4) || (day === 5 && activeScheduleStructure === 'fixed')) && !isferiado(date);
      if (isWeekday && !isOccupied) {
        // It's a non-holiday weekday and FREE
        break;
      }
      date.setDate(date.getDate() + 1);
      iterations++;
    }

    setSelectedDate(date);

    if (date.getMonth() !== initialViewDate.getMonth()) {
      const initialMonthName = initialViewDate.toLocaleString('es-AR', { month: 'long' });
      showToast(`No hay días de semana disponibles en ${initialMonthName}, mostrando la fecha más cercana`, 'info');
    } else {
      showToast('Cargando fecha de día de semana...', 'info');
    }
  };

  const isToday = (someDate) => {
    if (!someDate) return false;
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  useEffect(() => {
    if (location.pathname === '/preciosfinde') {
      handleLoadWeekendPrices();
    } else if (location.pathname === '/preciospromo') {
      handleLoadWeekdayPrices();
    }
  }, [location.pathname]);

  const handleSaveRentalName = async (newValue) => {
    if (currentUser && adminEditMode) {
      const db = getDatabase(app);
      if (!rentalNameKey) return;

      const stateSetters = {
        navidad: setRentalServiceNameNavidad,
        anoNuevo: setRentalServiceNameAnoNuevo,
        feriado: setRentalServiceNameFeriado,
        semana: setRentalServiceNameSemana,
        finde: setRentalServiceNameFinde,
      };
      const stateSetter = stateSetters[rentalNameKey];

      const rentalNamesRef = ref(db, `serviceNames/rental/${rentalNameKey}`);
      try {
        await firebaseSet(rentalNamesRef, newValue);
        if (stateSetter) {
          stateSetter(newValue);
        }
        showToast("Texto del servicio actualizado", "success");
      } catch (error) {
        console.error("Error updating rental service name:", error);
        showToast("Error al actualizar el texto", "error");
      }
    }
  };
  const updateServicioAlquiler = (date) => {
    const selectedYear = date.getFullYear();
    let month = date.getMonth() + 1;
    if (selectedYear == inputValue102) {
      month = month + 12;
    }
    const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const esNavidad = adjustedDate.getDate() === 24 && adjustedDate.getMonth() === 11;
    const esAnoNuevo = adjustedDate.getDate() === 31 && adjustedDate.getMonth() === 11;

    let newCarrito = carritoFromChild.filter(item => item.id !== 1 && item.id !== 3 && item.id !== 13 && item.id !== 14);

    const diaDeLaSemana = adjustedDate.getDay();
    const fechaFormateadaLarga = adjustedDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    let precio = 0;
    let servicioAlquiler = null;
    const esferiadoSeleccionado = isferiado(adjustedDate);

    let editablePart = "";
    let datePart = "";
    let keyToUpdate = "";

    if (esNavidad) {
      keyToUpdate = 'navidad';
      precio = getPrice(13, 'a_precio_4hs_'); // Fallback to 4hs price if specific not found
      editablePart = rentalServiceNameNavidad;
      datePart = ` (${fechaFormateadaLarga})`;
      // For Nav and Ano Nuevo, we stick to ID 13/14 logic. 
      // If we want them to use the SAME price as ID 3, we should map them to ID 3's key or keep using getPrice(3) if intended.
      // But presumably they might have their own prices now? 
      // The original code used a_precio_4hs_. 
      // If the user expects them to match the "Alquiler 4hs", we should use ID 3. 
      // If the user edits "Vispera Navidad" separately, use ID 13.
      // Based on user report for JULY, we are likely dealing with Finde/Semana.

      // Let's stick to the pattern: try to find the specific service price, fallback to the generic one.
      // Actually, for consistency with 'PreciosDinamico' using 'a_precio_4hs_' as base:
      // We will look up ID 3 for now if that's what was intended, OR check if ID 13 exists with a price.
      // Since 13/14 are often just "event types" reusing the base price, let's use ID 3 for safety unless 13 is explicitly configured.
      // But wait, the user said "FormPrecios saved in v3 at $510k". That is likely ID 3.

      precio = getPrice(3, 'a_precio_4hs_');

      servicioAlquiler = { id: 13, nombre: removePriceFromTitle(rentalServiceNameNavidad), precio: precio, cantidad: 1, descripcion: `${editablePart}${datePart}` };
    } else if (esAnoNuevo) {
      keyToUpdate = 'anoNuevo';
      precio = getPrice(3, 'a_precio_4hs_');
      editablePart = rentalServiceNameAnoNuevo;
      datePart = ` (${fechaFormateadaLarga})`;
      servicioAlquiler = { id: 14, nombre: removePriceFromTitle(rentalServiceNameAnoNuevo), precio: precio, cantidad: 1, descripcion: `${editablePart}${datePart}` };
    } else if (esferiadoSeleccionado) { // Feriado
      keyToUpdate = 'feriado';
      precio = getPrice(3, 'a_precio_4hs_');
      editablePart = rentalServiceNameFeriado;
      datePart = ` (Feriado ${fechaFormateadaLarga})`;
      servicioAlquiler = { id: 3, nombre: removePriceFromTitle(rentalServiceNameFeriado), precio: precio, cantidad: 1, descripcion: `${editablePart}${datePart}` };
    } else if ((diaDeLaSemana >= 1 && diaDeLaSemana <= 4 && !esferiadoSeleccionado) || (activeScheduleStructure === 'fixed' && diaDeLaSemana === 5 && !esferiadoSeleccionado)) { // Lunes a jueves no feriado (o viernes en estructura fija)
      keyToUpdate = 'semana';
      precio = getPrice(1, 'b_precio_3hs_');
      editablePart = rentalServiceNameSemana;
      datePart = ` para el día ${fechaFormateadaLarga}`;
      servicioAlquiler = { id: 1, nombre: removePriceFromTitle(rentalServiceNameSemana), precio: precio, cantidad: 1, descripcion: `${editablePart}${datePart}` };
    } else if (diaDeLaSemana === 0 || diaDeLaSemana === 6 || (diaDeLaSemana === 5 && activeScheduleStructure !== 'fixed')) { // Sábado, Domingo, o Viernes si no es estructura fija
      keyToUpdate = 'finde';
      precio = getPrice(3, 'a_precio_4hs_');
      editablePart = rentalServiceNameFinde;
      datePart = ` para el día ${fechaFormateadaLarga}`;
      servicioAlquiler = { id: 3, nombre: removePriceFromTitle(rentalServiceNameFinde), precio: precio, cantidad: 1, descripcion: `${editablePart}${datePart}` };
    }

    if (servicioAlquiler) {
      newCarrito = [...newCarrito, servicioAlquiler];
      setCurrentRentalService(servicioAlquiler); // Update the new state variable
    }

    setRentalNameKey(keyToUpdate);
    setCarritoFromChild(newCarrito);
    setMensajeEditable(editablePart);
    setMensajeFecha(datePart);
    setPrecioAMostrar(precio);
    return newCarrito;
  };

  const handleDateSelection = (event) => {
    setSelectedDate(event);
  };

  const handleReservaPorWhatsapp = () => {
    console.log("handleReservaPorWhatsapp called");
    console.log("carritoFromChild.length:", carritoFromChild.length);
    console.log("whatsappNumber:", whatsappNumber);
    console.log("selectedDate:", selectedDate);

    if (carritoFromChild.length === 0) {
      alert("Debes agregar servicios a tu carrito para realizar una reserva por Whatsapp");
      return;
    }

    if (!whatsappNumber) {
      alert("Esta funcionalidad está en reparación por favor chequee nuestro whatsapp al pie de la página principal.");
      return;
    }

    if (!selectedDate) {
      alert("Por favor, selecciona una fecha antes de concretar la reserva.");
      return;
    }

    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const diaNombre = diasSemana[selectedDate.getDay()];
    const dia = selectedDate.getDate();
    const mes = selectedDate.getMonth() + 1;
    const anio = selectedDate.getFullYear().toString().slice(-2);
    const fechaFormateada = `${diaNombre} ${dia}/${mes}/${anio}`;

    const linkPresupuesto = generarLinkDePresupuesto(selectedDate, carritoFromChild);


    const senaNecesaria = parseFloat(allFetchedPrices.l_seña_) || 0;

    let carritoTexto = "";
    carritoFromChild.forEach(item => {
      carritoTexto += `- ${item.nombre}  ( ${parseFloat(item.precio) || 0} ) x ${parseFloat(item.cantidad) || 0} u. = ${(parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 0)}\n`;
    });

    let mensajeWhatsapp = whatsappReservaTemplate
      .replace(/{FECHA}/g, fechaFormateada)
      .replace(/{CARRITO}/g, carritoTexto.trim())
      .replace(/{TOTAL}/g, precioTotal)
      .replace(/{SENA}/g, senaNecesaria)
      .replace(/{LINK}/g, linkPresupuesto);

    const encodedMessage = encodeURIComponent(mensajeWhatsapp);
    console.log("encodedMessage:", encodedMessage);

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    console.log("whatsappUrl:", whatsappUrl);

    window.open(whatsappUrl, '_blank', 'noopener noreferrer');
    setShowBankTransferModal(true);
  };


  const precioTotal = useMemo(() => {
    const subtotal = carritoFromChild.reduce((total, item) => total + (parseFloat(item.precio) || 0) * (parseFloat(item.cantidad) || 0), 0);
    if (descuentoAdmin > 0) {
      if (tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto') {
        return Math.max(0, subtotal - descuentoAdmin);
      }
      return subtotal * (1 - (descuentoAdmin / 100));
    }
    return subtotal;
  }, [carritoFromChild, descuentoAdmin, tipoDescuentoAdmin]);

  const [linkCopiado, setLinkCopiado] = useState(false);
  const [presupuestoLink, setPresupuestoLink] = useState("");
  const generarLinkDePresupuesto = (dateForLink, cartForLink) => {
    const baseURL = `${window.location.protocol}//${window.location.host}/precios`;
    const params = new URLSearchParams();

    if (dateForLink) {
      const formattedDate = format(dateForLink, 'yyyy-MM-dd');
      params.set('fecha', formattedDate);
    }

    cartForLink.forEach(item => {
      if (item.id === 5) { // Es una camarera
        params.set(`item_${item.uuid}_id`, item.id);
        params.set(`item_${item.uuid}_cantidad`, item.cantidad);
      } else { // Otros servicios
        params.set(`item_${item.id}_id`, item.id);
        params.set(`item_${item.id}_cantidad`, item.cantidad);
      }
    });

    if (descuentoAdmin > 0) {
      params.set('descuento', descuentoAdmin);
      if (tipoDescuentoAdmin) {
        params.set('tipoDescuento', tipoDescuentoAdmin);
      }
    }

    const currentV = searchParams.get('v') || activePriceVersion || 2;
    const finalLink = `${baseURL}?${params.toString()}&v=${currentV}`;
    return finalLink;
  };
  const generarYCopiarLink = (dateForLink, cartForLink, showToastOnCopy = false, isManual = false) => {
    // 1. Obtenemos el link llamando a nuestra nueva función
    const finalLink = generarLinkDePresupuesto(dateForLink, cartForLink);

    // 2. El resto de la función se dedica a copiar y mostrar notificaciones
    setPresupuestoLink(finalLink);

    if (isManual || !!currentUser) {
      navigator.clipboard.writeText(finalLink)
        .then(() => {
          if (showToastOnCopy) {
            showToast("Link copiado");
          }
        })
        .catch((err) => {
          console.error("Error al copiar el link:", err);
        });
    }
  };



  // ... (inside your Precios component) ...

  useEffect(() => {
    console.log(`Loading states: texts=${textsDataLoaded}, prices=${pricesLoaded}, holidays=${holidaysDataLoaded}, name=${nameDataLoaded}, whatsapp=${whatsappNumberLoaded}, booked=${bookedDatesLoaded}, schedule=${scheduleStructureLoaded}, selectedDate=${!!selectedDate}`);
    if (textsDataLoaded && pricesLoaded && holidaysDataLoaded && nameDataLoaded && whatsappNumberLoaded) {
      // All essential data is loaded
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 300); // Optional small delay for smoother transition (e.g., 300-500ms)
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [textsDataLoaded, pricesLoaded, holidaysDataLoaded, nameDataLoaded, whatsappNumberLoaded]);

  useEffect(() => {
    const fechaParam = searchParams.get('fecha');
    let initialMonth;
    let initialYear;

    if (mes) { // Prioritize the 'mes' parameter from the URL
      initialMonth = parseInt(mes, 10);
      // If mes is > 12, it already implies a future year, so initialYear should be inputValue102
      if (initialMonth > 12) {
        initialYear = parseInt(inputValue102);
      } else {
        initialYear = parseInt(inputValue101);
      }
    } else if (fechaParam) {
      const date = new Date(fechaParam);
      initialMonth = date.getMonth() + 1; // getMonth() is 0-indexed
      initialYear = date.getFullYear();

      // Adjust initialMonth if it's for the next year based on inputValue101/inputValue102
      // Only jump to year 2 if it's NOT the same as year 1 (to handle config where both are 2026)
      if (inputValue101 && inputValue102 && initialYear === parseInt(inputValue102) && initialYear !== parseInt(inputValue101)) {
        initialMonth += 12;
      }
    } else {
      initialMonth = new Date().getMonth() + 1;
      initialYear = new Date().getFullYear();
    }

    // BUSINESS RULE: Only months 7-18 are active. Months 1-6 and 19-24 are unused.
    // If logic calculates Month 19 (July Year 2), it implies it should be Month 7 (July Year 1) 
    // because we don't use the Year 2 slots for these months.
    if (initialMonth >= 19 && initialMonth <= 24) {
      console.warn(`Month ${initialMonth} detected (Unused). Remapping to Month ${initialMonth - 12} per business rules.`);
      initialMonth -= 12;
    } else if (initialMonth >= 1 && initialMonth <= 6) {
      console.warn(`Month ${initialMonth} detected (Unused). Remapping to Month ${initialMonth + 12} per business rules.`);
      initialMonth += 12;
    }

    setCurrentMonth(initialMonth || 1); // Ensure it's at least 1
    if (initialYear) {
      setYear(initialYear);
    }
  }, [searchParams, mes, inputValue101, inputValue102]); // Add inputValue101, inputValue102 to dependencies

  //1. Obtener los feriados de Google Calendar
  // Ensure GOOGLE_API_KEY is defined, e.g., const GOOGLE_API_KEY = Clave(); at the top.

  const fetchHolidayDates = useCallback(async () => {
    const apiKey = GOOGLE_API_KEY;
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    try {
      let googleHolidays = [];
      try {
        // 1. Obtener feriados de Google para el año actual y el próximo año
        const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/es.ar.official%23holiday@group.v.calendar.google.com/events', {
          params: {
            key: apiKey,
            // Fetch from the beginning of the current year to the end of the next year
            timeMin: new Date(currentYear, 0, 1).toISOString(),
            timeMax: new Date(nextYear, 11, 31, 23, 59, 59).toISOString(), // End of next year
            singleEvents: true,
            orderBy: 'startTime'
          }
        });
        googleHolidays = response.data.items.map(event => ({
          date: event.start.date,
          name: event.summary
        }));
      } catch (apiError) {
        console.warn('Error fetching Google Calendar holidays, falling back to manual/fixed holidays:', apiError);
      }

      // 2. Obtener feriados modificados de Firebase
      const db = getDatabase(app);
      const dbRef = ref(db, 'feriados_modificados');
      const snapshot = await get(dbRef);
      const modifiedHolidays = snapshot.exists() ? snapshot.val() : { added: {}, removed: {} };

      // 3. Aplicar modificaciones
      const finalHolidays = googleHolidays
        .filter(h => !modifiedHolidays.removed || !modifiedHolidays.removed[h.date.replace(/-/g, '')])
        .concat(Object.values(modifiedHolidays.added || {}));

      // 4. Formatear y actualizar el estado
      const holidays = new Set();
      const orangeHolidays = new Set();

      // Add fixed holidays for both current and next year
      finalHolidays.push({ date: `${currentYear}-12-24`, name: "Alquilamos hasta las 3 am" });
      finalHolidays.push({ date: `${currentYear}-12-25`, name: "Navidad" });
      finalHolidays.push({ date: `${currentYear}-12-31`, name: "Alquilamos hasta las 3 am" });
      finalHolidays.push({ date: `${nextYear}-01-01`, name: "Año Nuevo" }); // This was already nextYear, ensure it's explicit
      finalHolidays.push({ date: `${nextYear}-12-24`, name: "Alquilamos hasta las 3 am" });
      finalHolidays.push({ date: `${nextYear}-12-25`, name: "Navidad" });
      finalHolidays.push({ date: `${nextYear}-12-31`, name: "Alquilamos hasta las 3 am" });


      finalHolidays.forEach(event => {
        // Usamos la fecha original del evento (YYYY-MM-DD) para evitar desplazamientos por zona horaria.
        // Al usar new Date() y luego toISOString() o format puede haber shifts indeseados.
        // Como event.date ya viene en string YYYY-MM-DD, lo guardamos directo.
        orangeHolidays.add(event.date);
        holidays.add(event.date);
      });

      setOrangeHolidayDates(Array.from(orangeHolidays));
      setHolidayDates(Array.from(holidays));

    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  }, []);

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        await fetchHolidayDates();
        setHolidaysDataLoaded(true); // <--- Mark holidays as loaded
      } catch (error) {
        // Error is already logged by fetchHolidayDates
        setHolidaysDataLoaded(true); // Unblock on error
      }
    };
    loadHolidays();
  }, [fetchHolidayDates]); // fetchHolidayDates is now a dependency

  useEffect(() => {
    // Esta función se ejecutará después de que el componente se haya montado
    window.scrollTo(0, 0); // Establece la posición del scroll en la parte superior (x=0, y=0)
  }, [location]); // La dependencia 'location' asegura que se ejecute también al cambiar la ruta a Preciosx

  useEffect(() => {
    fetchHolidayDates();

  }, []);

  //Traer años de base de datos
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 26;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        let y1 = targetObject.y_ano1;
        let y2 = targetObject.z_ano2;

        // Auto-detect y_ano2 from activeMonthsList if it's lagging behind
        if (targetObject.activeMonthsList && targetObject.activeMonthsList.length > 0) {
            const firstYear = parseInt(targetObject.activeMonthsList[0].split('-')[0], 10);
            const lastYear = parseInt(targetObject.activeMonthsList[targetObject.activeMonthsList.length - 1].split('-')[0], 10);
            if (lastYear > firstYear) {
                y2 = lastYear.toString();
            }
            if (firstYear > parseInt(y1 || 0)) {
                y1 = firstYear.toString();
            }
        }

        setInputValue101(y1);
        setInputValue102(y2);
      }
      let endDate = `${new Date().getFullYear()}-12-31`;

      if (snapshot.exists() && snapshot.val().fechaFinalCalendario) {
        endDate = snapshot.val().fechaFinalCalendario;
      }
      setCalendarEndDate(endDate);
    }
    fetchData();
  }, [26])





  const formattedCurrentMonth = useCallback((currentMonth) => {
    const monthAsInt = parseInt(currentMonth, 10);

    if (isNaN(monthAsInt)) {
      return new Date().getMonth() + 1; // Default to current month if invalid
    }

    if (monthAsInt > 12) {
      return monthAsInt - 12;
    } else {
      return monthAsInt;
    }
  }, [currentMonth]);

  const getCurrentYearFromRoute = () => {
    if (currentMonth > 12) {
      return inputValue102
    } else {
      return inputValue101
    }
  }

  const currentYear = year || getCurrentYearFromRoute();


  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = calendarEndDate;

  const serviciosOpcionales = useMemo(() => {
    if (!serviciosOpcionalesFromDB || serviciosOpcionalesFromDB.length === 0) {
      return [];
    }
    return serviciosOpcionalesFromDB.map(servicio => {
      const rawPrice = allFetchedPrices[servicio.priceKey];
      const price = typeof rawPrice === 'string' ? (parseFloat(rawPrice) || 0) : (rawPrice || 0);

      switch (servicio.id) {
        case 1:
          return { ...servicio, aclaracion: inputValue596, precio: price, descripcion: inputValue584 };
        case 2:
          return { ...servicio, aclaracion: inputValue597, precio: price, descripcion: inputValue585 };
        case 3:
          return { ...servicio, aclaracion: inputValue598, precio: price, descripcion: inputValue586 };
        case 4:
          return { ...servicio, aclaracion: inputValue599, precio: price, descripcion: inputValue587 };
        case 5:
          return { ...servicio, aclaracion: inputValue601, precio: price, descripcion: inputValue588, descripcion2: inputValue595 };
        case 6:
          return { ...servicio, aclaracion: inputValue580, imageUrl: servicio.imageUrl || inputValue301, precio: price };
        case 7:
          return { ...servicio, aclaracion: inputValue581, imageUrl: servicio.imageUrl || inputValue302, precio: price };
        case 8:
          return { ...servicio, aclaracion: inputValue582, imageUrl: servicio.imageUrl || inputValue303, precio: price };
        case 9:
          return { ...servicio, aclaracion: inputValue583, imageUrl: servicio.imageUrl || inputValue304, precio: price, descripcion: inputValue589 };
        case 10:
          return { ...servicio, aclaracion: inputValue602, precio: price, descripcion: inputValue590 };
        case 11:
          return { ...servicio, aclaracion: inputValue603, precio: price, descripcion: inputValue591 };
        case 12:
          return { ...servicio, aclaracion: inputValue604, precio: price, descripcion: inputValue592 };
        case 13:
          return { ...servicio, aclaracion: inputValue605, precio: price, descripcion: inputValue593 };
        case 14:
          return { ...servicio, aclaracion: inputValue606, precio: price, descripcion: inputValue594 };
        default:
          return { ...servicio, precio: price };
      }
    });
  }, [serviciosOpcionalesFromDB, allFetchedPrices, inputValue596, inputValue584, inputValue597, inputValue585, inputValue598, inputValue586, inputValue599, inputValue587, inputValue601, inputValue588, inputValue595, inputValue580, inputValue301, inputValue581, inputValue302, inputValue582, inputValue303, inputValue583, inputValue304, inputValue589, inputValue602, inputValue590, inputValue603, inputValue591, inputValue604, inputValue592, inputValue605, inputValue593, inputValue606, inputValue594]);




  useEffect(() => {
    if (pricesLoaded && selectedDate && currentMonth && Object.keys(allFetchedPrices).length > 0) {

      const newCarrito = updateServicioAlquiler(selectedDate);
      if (newCarrito) {
        generarYCopiarLink(selectedDate, newCarrito, true);
      }

    }

  }, [pricesLoaded, selectedDate, currentMonth, isferiado, allFetchedPrices]);

  const vParam = searchParams.get('v');
  const versionToLoad = vParam ? parseInt(vParam) : null;

  useEffect(() => {
    let isMounted = true;
    const fetchPrices = async () => {
      setPricesLoaded(false);
      const db = getDatabase(app);

      // --- VERSIONING LOGIC ---
      const currentActive = activePriceVersion || 2;

      let rootPath = 'datosId';
      let isLegacy = false;

      const fechaParam = searchParams.get('fecha');

      if (!vParam) {
        // Default to current prices if no version parameter is specified.
        // Removed backward compatibility hack that forced V1 on all specific month routes.
        rootPath = 'datosId';
      } else if (versionToLoad && versionToLoad < currentActive) {
        // Explicit legacy version
        rootPath = `precios_legacy_v${versionToLoad}`;
        isLegacy = true;
      } else {
        // Current (v is active or greater)
        rootPath = 'datosId';
      }

      if (isLegacy) {
        console.log("PreciosDinamico: Loading LEGACY prices from", rootPath);
      }

      let dbURL = rootPath + "/" + currentMonth;
      // --------------------

      const dbRef = ref(db, dbURL);
      let targetObject = null;
      try {
        const snapshot = await get(dbRef);
        if (!isMounted) return; // Prevent state update if unmounted or active changed (though logic needs ref cleanup for strictness, this helps unmount)

        if (snapshot.exists()) {
          targetObject = snapshot.val();
          setAllFetchedPrices(targetObject);
          setPricesLoaded(true);
        } else {
          console.error("Error: No se encontraron datos de precios para el mes:", currentMonth, "dbURL:", dbURL);
          setPricesLoaded(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al conectar con Firebase para obtener precios:", error, "dbURL:", dbURL);
        setPricesLoaded(true);
      }

    };

    if (currentMonth) {
      setPricesLoaded(false);
      fetchPrices();
    }

    return () => {
      isMounted = false;
    };
  }, [currentMonth, vParam, versionToLoad, activePriceVersion]); // Added activePriceVersion dependency

  useEffect(() => {
    // Process URL parameters whenever prices and holidays are loaded
    if (pricesLoaded && holidaysDataLoaded && holidayDates.length > 0 && serviciosOpcionales.length > 0) {
      const fechaParam = searchParams.get('fecha');

      // 1. Process date from URL whenever fechaParam changes
      if (fechaParam && fechaParam !== lastProcessedFecha.current) {
        try {
          const date = new Date(fechaParam);
          const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
          if (!isNaN(adjustedDate.getTime())) {
            handleDateChange(adjustedDate);
            lastProcessedFecha.current = fechaParam;
          } else {
            console.warn("URL Load: Invalid date format in URL:", fechaParam);
          }
        } catch (e) {
          console.error("URL Load: Error parsing date from URL:", e);
        }
      }

      // 2. Process cart items from URL (only once on initial load)
      if (!hasProcessedURL.current && searchParams.toString()) {
        const itemsToAdd = [];

        searchParams.forEach((value, key) => {
          if (key.startsWith('item_') && key.endsWith('_id')) {
            const keyParts = key.split('_');
            const itemIdentifier = keyParts[1];
            const itemId = parseInt(value);
            const cantidadKey = `item_${itemIdentifier}_cantidad`;
            const cantidad = parseInt(searchParams.get(cantidadKey) || '0');

            if (itemId && cantidad > 0) {
              const servicioBase = serviciosOpcionales.find(s => s.id === itemId);

              if (servicioBase) {
                let precioActual = parseFloat(allFetchedPrices[servicioBase.priceKey]) || 0;

                if (typeof precioActual !== 'number' || isNaN(precioActual)) {
                  console.warn(`     Invalid price detected for item ${itemId}. Using 0.`);
                  precioActual = 0;
                }

                const itemToAdd = {
                  id: servicioBase.id,
                  nombre: removePriceFromTitle(servicioBase.nombre),
                  aclaracion: servicioBase.aclaracion,
                  precio: precioActual,
                  descripcion: servicioBase.descripcion,
                  descripcion2: servicioBase.descripcion2,
                  cantidad: cantidad,
                };

                if (itemIdentifier.startsWith('camarera-')) {
                  itemToAdd.uuid = itemIdentifier;
                  itemToAdd.nombre = 'Contratación de camarera';
                }

                itemsToAdd.push(itemToAdd);
              } else {
                console.warn(`URL Load: No definition found for service with ID ${itemId}`);
              }
            }
          }
        });

        if (itemsToAdd.length > 0) {
          setCarritoFromChild(prevCart => {
            const existingRental = prevCart.find(item => [1, 3, 13, 14].includes(item.id));
            const newCart = [...itemsToAdd];
            if (existingRental && !newCart.some(item => [1, 3, 13, 14].includes(item.id))) {
              newCart.unshift(existingRental);
            }
            return newCart;
          });
        }
        hasProcessedURL.current = true;
      }
    }
  }, [pricesLoaded, holidaysDataLoaded, holidayDates, searchParams, setSelectedDate, allFetchedPrices, serviciosOpcionales]);

  //Traer links de la base de datos
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setInputValue201(targetObject.link_facebook
        );
        setInputValue202(targetObject.link_instagram);
        setInputValue203(targetObject.link_whatsapp);
        setInputValue204(targetObject.direccion_mail);
        setInputValue205(targetObject.link_google_maps);
        setInputValue206(targetObject.numero_whatsapp);
        setInputValue207(targetObject.direccion_web);
        setInputValue208(targetObject.link_imagen_compartir);
        setInputValue209(targetObject.link_imagen_volver);
        setInputValue210(targetObject.link_imagen_calendar);


      }
    }
    fetchData();
  }, [25])
  //Traer logo de base de datos
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 28;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        // setInputValue300(targetObject.foto30); // Removed this line
        setInputValue301(targetObject.foto21);
        setInputValue302(targetObject.foto19);
        setInputValue303(targetObject.foto23);
        setInputValue304(targetObject.foto24);

      } else {
        alert("error UseEffect de form de otros datos");
      }
    }
    fetchData();
  }, [28])




  const handleGeneralWhatsappClick = () => {
    const generalMessage = "Hola! Tengo algunas consultas sobre el salón.";
    const encodedMessage = encodeURIComponent(generalMessage);
    const thankYouPageUrl = `/cotizacion-exitosa?message=${encodedMessage}`;
    window.open(thankYouPageUrl, '_blank', 'noopener noreferrer');
  };

  const openWhatsappLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener noreferrer');
    }
  };


  const handleSaveServicioNombre = async (id, newName) => {
    if (currentUser && adminEditMode) {
      const db = getDatabase(app);
      const servicesRef = ref(db, 'optionalServices');
      try {
        const snapshot = await get(servicesRef);
        if (snapshot.exists()) {
          const services = snapshot.val();
          const serviceIndex = services.findIndex(s => s && s.id === id);
          if (serviceIndex !== -1) {
            services[serviceIndex].nombre = newName;
            await firebaseSet(servicesRef, services);
            setServiciosOpcionalesFromDB(services);
            showToast("Nombre del servicio actualizado", "success");
          }
        }
      } catch (error) {
        console.error("Error updating service name:", error);
      }
    }
  };

  const handleSaveCarritoTitulo = async (newValue) => {
    if (currentUser && adminEditMode) {
      try {
        const db = getDatabase(app);
        const dataRef = ref(db, `datosId/33`);
        await update(dataRef, { contenido_carrito_titulo: newValue });
        setCarritoTitulo(newValue);
        showToast("Título del carrito actualizado", "success");
      } catch (error) {
        console.error("Error updating carrito title:", error);
        showToast("Error al actualizar el título del carrito", "error");
      }
    }
  };

  const handleSaveCamareraTitle = async (type, newValue) => {
    if (currentUser && adminEditMode) {
      if (type === 'initial') {
        await handleSaveDatosId(33, 'contenido22', newValue, setInputValue521);
      } else if (type === 'hourly') {
        await handleSaveDatosId(33, 'contenido23', newValue, setInputValue522);
      }
    }
  };


  const [selectedTime, setSelectedTime] = useState(null);

  const handleTimeChange = (time) => {
    console.log("Time updated from slider:", time);
    setSelectedTime(time);
  };

  const scheduleRules = useMemo(() => {
    // minHour is always 8 AM based on the user's description.
    const commonMinHour = 8;
    let rules = { minDuration: 3, maxTime: 21, minHour: commonMinHour };

    switch (priceDisplayMode) {
      case 'weekday':
        rules = { minDuration: 3, maxTime: 21, minHour: commonMinHour }; // 3hs min, hasta 9 PM
        break;
      case 'weekend':
        rules = { minDuration: 4, maxTime: 24, minHour: commonMinHour }; // 4hs min, hasta 12 AM
        break;
      case 'weekday_holiday_eve': // vispera de feriado
        rules = { minDuration: 3, maxTime: 24, minHour: commonMinHour }; // 3hs min, hasta 12 AM
        break;
      case 'weekday_holiday_short': // New case for weekday holiday with short max time
        rules = { minDuration: 4, maxTime: 21, minHour: commonMinHour }; // 4hs min, hasta 9 PM
        break;
      case 'sunday_holiday_eve': // New case for Sunday that is a holiday eve
        rules = { minDuration: 4, maxTime: 24, minHour: commonMinHour }; // 4hs min, hasta 12 AM
        break;
      case 'sunday':
        rules = { minDuration: 4, maxTime: 21, minHour: commonMinHour }; // 4hs min, hasta 9 PM
        break;
      case 'navidad24':
      case 'anoNuevo31':
        rules = { minDuration: 4, maxTime: 27, minHour: commonMinHour }; // 4hs min, hasta 3 AM (24 + 3)
        break;
      default:
        rules = { minDuration: 3, maxTime: 21, minHour: commonMinHour }; // Fallback a día de semana
        break;
    }

    // SI LA ESTRUCTURA ES FIJA, EL HORARIO SIEMPRE ES HASTA LAS 21HS
    if (activeScheduleStructure === 'fixed') {
      if (priceDisplayMode === 'navidad24' || priceDisplayMode === 'anoNuevo31') {
        rules.maxTime = 26; // 2 AM (excepción incluso en fijo)
      } else {
        rules.maxTime = 21;
      }
    }

    return rules;
  }, [priceDisplayMode, activeScheduleStructure]);

  // Calculate total extra hours from the cart
  const totalExtraHours = useMemo(() => {
    let extraHours = 0;
    carritoFromChild.forEach(item => {
      // Assuming servicio.id 2 and 4 represent extra hours
      if (item.id === 2 || item.id === 4) {
        extraHours += item.cantidad; // Each quantity unit is 1 hour
      }
    });
    return extraHours;
  }, [carritoFromChild]);

  // Calculate the total duration for the slider based on base duration and extra hours
  const sliderInitialDuration = useMemo(() => {
    return scheduleRules.minDuration + totalExtraHours;
  }, [scheduleRules.minDuration, totalExtraHours]);

  // Calculate the initial start time for the slider (defaulting to end at maxTime)
  const sliderInitialStartTime = useMemo(() => {
    // Ensure startTime is not less than MIN_HOUR constant in HorarioSlider.jsx
    // For now, let's assume it should always end at maxTime.
    const calculatedStartTime = scheduleRules.maxTime - sliderInitialDuration;
    return Math.max(8, calculatedStartTime); // MIN_HOUR is 8 in HorarioSlider.jsx
  }, [scheduleRules.maxTime, sliderInitialDuration]);

  if (isPageLoading) {
    return null;
  }



  let dynamicTitle = headerConfig.shareTitle || "Lista de precios";
  let dynamicDescription = headerConfig.shareDescription || "Vení a conocer nuestro salón de eventos en Parque Patricios. Precios actualizados y reservas online.";
  const fechaParamForTitle = searchParams.get('fecha');
  if (fechaParamForTitle) {
    dynamicTitle = formatTitleWithDate(headerConfig.shareTitle, fechaParamForTitle);
    dynamicDescription = formatDescWithDate(headerConfig.shareDescription, fechaParamForTitle);
  }

  return (
    <>
      <ImageGalleryModal
        isOpen={showGalleryModal}
        onClose={() => {
          setShowGalleryModal(false);
          setGalleryTarget(null);
        }}
        onSelect={handleGallerySelect}
      />
      <Section >
        {currentUser && adminEditMode && (
        <>
          <Watermark>Página en edición</Watermark>
          <Watermark2>Página en edición</Watermark2>
          <WatermarkInstruction>Hacé doble click sobre los textos para editarlos y clickeá sobre los símbolos para cambiarlos</WatermarkInstruction>
          <WatermarkInstruction2>Hacé doble click sobre los textos para editarlos y clickeá sobre los símbolos para cambiarlos</WatermarkInstruction2>
        </>
      )
      }
      {/* ... rest of the component */}
      <CustomToastWrapper>
        {toast.show && (
          <Toast
            key={toast.key}
            message={toast.message}
            type={toast.type}
          />
        )}
      </CustomToastWrapper>

      <Modal 
        isOpen={showBankTransferModal} 
        onClose={() => setShowBankTransferModal(false)}
        title={reservaModalTitle}
      >
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{reservaModalText}</p>
        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>CBU / CVU</span>
              <strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{reservaModalCbu}</strong>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(reservaModalCbu);
                showToast('¡CBU copiado al portapapeles!', 'success');
              }}
              style={{
                background: 'var(--primary-color, #ff6b6b)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              Copiar
            </button>
          </div>

          <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold', marginTop: '5px' }}>
            {reservaModalBankDetails}
          </div>
        </div>
      </Modal>

      <SEO
        title={dynamicTitle}
        description={dynamicDescription}
        imageUrl={headerConfig.shareImageUrl || null}
        url={urlLocation.pathname + (urlLocation.search || '')}
        noindex={false}
      />
      <ScrollIndicator />
      {floatingButtons.map(button => {
        if (button.isVisible === false) return null;
        if (button.id !== 'chatAiButton' && button.id !== 'scrollToTopButton') return null;
        return (
          <React.Suspense key={button.id} fallback={<div></div>}>
            <FloatingActionButton
              id={button.id}
              link={button.link}
              tooltip={button.tooltip}
              icon={button.icon}
              $buttonColor={button.buttonColor}
              $imageSize={button.imageSize}
              $imageTop={button.styles?.imageTop}
              $imageRight={button.styles?.imageRight}
              $bottom={button.styles?.bottom}
              $right={button.styles?.right}
              isEditableContext={false}
              isChatbotButton={button.id === 'chatAiButton'}
              isCalendarActive={false}
            />
          </React.Suspense>
        );
      })}






      {
        !hideLayout && <div className="navbar" id="navbar">
          {/* Left section: Logo + Site Name + Version selector */}
          <div className="navbar-left-section" style={{ flex: isMobile ? '0 0 auto' : '1 1 0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', minWidth: 0 }}>
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(headerConfig.logoUrl || (currentUser && adminEditMode)) && (
                <img
                  src={headerConfig.logoUrl || 'https://via.placeholder.com/150?text=Subir+Logo'}
                  className="logo"
                  alt="Logo"
                  onClick={handleLogoClick}
                  style={{ cursor: (currentUser && adminEditMode) ? 'pointer' : 'default', width: '2.1rem', height: '2.1rem' }}
                />
              )}
              <div
                className="name"
                onClick={() => !adminEditMode && navigate('/')}
                style={{ cursor: !adminEditMode ? 'pointer' : 'default' }}
              >
                {!isMobile && (
                  <EditableText
                    fieldKey="header_siteName"
                    value={headerConfig.siteName || inputValue600}
                    onSave={(newValue) => handleSaveHeaderConfig('siteName', newValue)}
                    isEditable={!!currentUser && adminEditMode}
                  />
                )}
              </div>
            </div>

            {currentUser && (
              <div style={{ margin: '0 2px' }}>
                <select
                  value={(() => {
                    const vParam = searchParams.get('v');
                    if (vParam) return vParam;
                    if (searchParams.has('fecha')) return '1';
                    return activePriceVersion || '';
                  })()}
                  onChange={(e) => {
                    const newVersion = e.target.value;
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('v', newVersion);
                      return newParams;
                    });
                    showToast(`Cambiando a lista de precios v${newVersion}...`, 'info');
                  }}
                  style={{
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {Array.from({ length: Math.max(activePriceVersion || 2, 2) }, (_, i) => i + 1).map(v => (
                    <option key={v} value={v}>
                      v{v} {versionPrices[v] ? `($${versionPrices[v]})` : ''} {v === (activePriceVersion || 2) ? '(Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Center section: Title + DatePicker (Centered) */}
          <div className="navbar-center-section" style={{ flex: isMobile ? '1 1 auto' : '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {(currentUser && adminEditMode) ? (
              <EditableText
                fieldKey="header_pricesHeaderText"
                value={headerConfig.pricesHeaderText}
                onSave={(newValue) => handleSaveHeaderConfig('pricesHeaderText', newValue)}
                isEditable={!!currentUser && adminEditMode}
              />
            ) : (
              <h4 style={{ margin: '0 0 2px 0', fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'var(--white-text)' }}>
                {headerConfig.pricesHeaderText}
              </h4>
            )}

            <div onClick={handleDatePickerClick} style={{ cursor: (currentUser && adminEditMode) ? 'pointer' : 'default' }}>
              {isEditingColor && (currentUser && adminEditMode) ? (
                <div>
                  <input
                    type="color"
                    value={tempDatepickerBgColor}
                    onChange={(e) => setTempDatepickerBgColor(e.target.value)}
                    autoFocus
                  />
                  <button onClick={(e) => handleAcceptColorChange(e)}>Aceptar</button>
                  <button onClick={(e) => handleCancelColorChange(e)}>Cancelar</button>
                </div>
              ) : (
                <ErrorBoundary fallback={<div>Ocurrió un error con el DatePicker</div>}>
                  <DatePicker
                    currentYear={currentYear}
                    currentMonth={formattedCurrentMonth(currentMonth)}
                    minDate={minDate}
                    maxDate={calendarEndDate}
                    year1={inputValue101}
                    year2={inputValue102}
                    handleDateChange={handleDateChange}
                    orangeHolidays={orangeHolidayDates}
                    onSelect={(date) => {
                      if (!isEditingColor) {
                        setSelectedDate(date);
                      }
                    }}
                    selected={selectedDate}
                    bgColor={headerConfig.datepickerBgColor}
                    inputProps={{
                      readOnly: true,
                      inputMode: 'none'
                    }}
                    onBookedDatesLoaded={handleBookedDatesLoaded}
                  />
                </ErrorBoundary>
              )}
            </div>
          </div>

          {/* Right section: Load Price Buttons (Row 2 on mobile) */}
          <div className="navbar-right-section" style={{ flex: isMobile ? '1 0 100%' : '1 1 0', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 0, marginTop: isMobile ? '3px' : 0 }}>
            {!hideLayout && selectedDate && (
              <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', flexWrap: 'nowrap' }}>
                <NavbarWeekendButton onClick={handleLoadWeekendPrices}>
                  Cargar precios de fin de semana
                </NavbarWeekendButton>
                <NavbarWeekdayButton onClick={handleLoadWeekdayPrices}>
                  {activeScheduleStructure === 'fixed' ? 'Cargar precios de lunes a viernes' : 'Cargar precios de lunes a jueves'}
                </NavbarWeekdayButton>
              </div>
            )}
          </div>
        </div>
      }
      <div style={{ height: isMobile ? '95px' : '48px', transition: 'height 0.3s ease' }} className="navbar-spacer"></div>
      <div className="content" id="precios">

        <div className="paragraph"  >


          <h2 style={{ textAlign: 'center', color: 'var(--primary-text)', fontSize: '1rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
            Seña: ${Number(allFetchedPrices.l_seña_ || 0).toLocaleString('es-AR')} para reservar la fecha. El restante se puede ir pagando hasta el día del evento.
          </h2>
        </div>


        {/* Inicio de div de Precios segun día */}
        <div>

          <ul className="precios2">
            {priceDisplayMode === 'weekend' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        fieldKey="precio_dinamico_contenido65"
                        value={activeScheduleStructure === 'fixed' ? inputValue564Fixed : inputValue564}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido65_fixed' : 'contenido65', newValue, activeScheduleStructure === 'fixed' ? setInputValue564Fixed : setInputValue564)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      fieldKey="precio_dinamico_horario_finde"
                      value={activeScheduleStructure === 'fixed' ? horarioFindeFixed : horarioFinde}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_finde_fixed' : 'horario_finde', newValue, activeScheduleStructure === 'fixed' ? setHorarioFindeFixed : setHorarioFinde)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido66"
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>
                    {/* aca abajo dice hasta que hora maximo se alquila el salon */}
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'weekday' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={activeScheduleStructure === 'fixed' ? inputValue572Fixed : inputValue572}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido73_fixed' : 'contenido73', newValue, activeScheduleStructure === 'fixed' ? setInputValue572Fixed : setInputValue572)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioSemanaFixed : horarioSemana}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_semana_fixed' : 'horario_semana', newValue, activeScheduleStructure === 'fixed' ? setHorarioSemanaFixed : setHorarioSemana)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>

                    <p className="space"></p>
                    <p className="bold inline-editable-text"><EditableText
                      value={inputValue573}
                      onSave={(newValue) => handleSaveDatosId(33, 'contenido74', newValue, setInputValue573)}
                      isEditable={!!currentUser && adminEditMode}
                    />${getPrice(1, 'b_precio_3hs_')}</p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue574}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido75', newValue, setInputValue574)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${getPrice(2, 'd_hora_extra_semana_')}
                    </p>
                    {/* aca abajo dice hasta que hora maximo se alquila el salon */}
                    <p className="bold">{inputValue}</p>

                    <h3 className="inline-editable-text">
                      <EditableText
                        value={inputValue576}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido77', newValue, setInputValue576)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        value={inputValue577}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido78', newValue, setInputValue577)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        value={inputValue578}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido79', newValue, setInputValue578)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'sunday_holiday_eve' && (
              <li>
                <div>
                  <div className="banner2">
                    <h2>
                      {/* Titulo: Alquiler de instalaciones... */}
                      <EditableText
                        fieldKey="precio_dinamico_contenido65"
                        value={activeScheduleStructure === 'fixed' ? inputValue564Fixed : inputValue564}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido65_fixed' : 'contenido65', newValue, activeScheduleStructure === 'fixed' ? setInputValue564Fixed : setInputValue564)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    {/* Horario: Ponemos horario de fin de semana (hasta las 12) porque es víspera */}
                    <EditableText
                      fieldKey="precio_dinamico_horario_finde"
                      value={activeScheduleStructure === 'fixed' ? horarioFindeFixed : horarioFinde}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_finde_fixed' : 'horario_finde', newValue, activeScheduleStructure === 'fixed' ? setHorarioFindeFixed : setHorarioFinde)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    {/* Precio Base */}
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido66"
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${getPrice(3, 'a_precio_4hs_')}
                    </p>

                    {/* Hora Extra */}
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${getPrice(4, 'c_hora_extra_finde_')}
                    </p>

                    {/* Texto del limite horario dinámico */}
                    <p className="bold">{inputValue}</p>

                    {/* Promociones / Descripciones adicionales (standard layout) */}
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    {/* Seña */}
                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}
            {priceDisplayMode === 'sunday' && (
              <li>
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={activeScheduleStructure === 'fixed' ? inputValue575Fixed : inputValue575}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido76_fixed' : 'contenido76', newValue, activeScheduleStructure === 'fixed' ? setInputValue575Fixed : setInputValue575)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioSemanaFixed : horarioSemana}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_semana_fixed' : 'horario_semana', newValue, activeScheduleStructure === 'fixed' ? setHorarioSemanaFixed : setHorarioSemana)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${getPrice(3, 'a_precio_4hs_')}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${getPrice(4, 'c_hora_extra_finde_')}
                    </p>
                    {/* aca abajo dice hasta que hora maximo se alquila el salon */}
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'weekday_holiday_eve' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={activeScheduleStructure === 'fixed' ? inputValue567Fixed : inputValue567}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido68_fixed' : 'contenido68', newValue, activeScheduleStructure === 'fixed' ? setInputValue567Fixed : setInputValue567)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      fieldKey="precio_dinamico_horario_finde"
                      value={activeScheduleStructure === 'fixed' ? horarioFindeFixed : horarioFinde}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_finde_fixed' : 'horario_finde', newValue, activeScheduleStructure === 'fixed' ? setHorarioFindeFixed : setHorarioFinde)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue573}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido74', newValue, setInputValue573)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.b_precio_3hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue574}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido75', newValue, setInputValue574)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.d_hora_extra_semana_}
                    </p>
                    {/* aca abajo dice hasta que hora maximo se alquila el salon */}
                    <p className="bold">{inputValue}</p>

                    <h3 className="inline-editable-text">
                      <EditableText
                        value={inputValue576}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido77', newValue, setInputValue576)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        value={inputValue577}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido78', newValue, setInputValue577)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        value={inputValue578}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido79', newValue, setInputValue578)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'weekday_holiday_short' && (
              <li>
                <div>
                  <div className="banner2">
                    <h2>
                      {/* Título: Alquiler instalaciones... feriados... */}
                      <EditableText
                        value={activeScheduleStructure === 'fixed' ? inputValue564Fixed : inputValue564}
                        onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'contenido65_fixed' : 'contenido65', newValue, activeScheduleStructure === 'fixed' ? setInputValue564Fixed : setInputValue564)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    {/* Horario: Probablemente quieras usar horarioSemana (21hs) o un texto específico */}
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioSemanaFixed : horarioSemana}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_semana_fixed' : 'horario_semana', newValue, activeScheduleStructure === 'fixed' ? setHorarioSemanaFixed : setHorarioSemana)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    {/* Precios: Usamos a_precio_4hs (precio de feriado/finde) */}
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    {/* Hora extra: Precio finde */}
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>

                    <p className="bold">{inputValue}</p>

                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'navidad24' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={textoNavidad24}
                        onSave={(newValue) => handleSaveDatosId(33, 'texto_navidad_24', newValue, setTextoNavidad24)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioNavidad24Fixed : horarioNavidad24}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_navidad_24_fixed' : 'horario_navidad_24', newValue, activeScheduleStructure === 'fixed' ? setHorarioNavidad24Fixed : setHorarioNavidad24)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'navidad25' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={textoNavidad25}
                        onSave={(newValue) => handleSaveDatosId(33, 'texto_navidad_25', newValue, setTextoNavidad25)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioNavidad25Fixed : horarioNavidad25}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_navidad_25_fixed' : 'horario_navidad_25', newValue, activeScheduleStructure === 'fixed' ? setHorarioNavidad25Fixed : setHorarioNavidad25)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'anoNuevo31' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={textoAnoNuevo31}
                        onSave={(newValue) => handleSaveDatosId(33, 'texto_ano_nuevo_31', newValue, setTextoAnoNuevo31)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioAnoNuevo31Fixed : horarioAnoNuevo31}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_ano_nuevo_31_fixed' : 'horario_ano_nuevo_31', newValue, activeScheduleStructure === 'fixed' ? setHorarioAnoNuevo31Fixed : setHorarioAnoNuevo31)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}

            {priceDisplayMode === 'anoNuevo1' && (
              <li >
                <div>
                  <div className="banner2" >
                    <h2>
                      <EditableText
                        value={textoAnoNuevo1}
                        onSave={(newValue) => handleSaveDatosId(33, 'texto_ano_nuevo_1', newValue, setTextoAnoNuevo1)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h2>
                    <EditableText
                      value={activeScheduleStructure === 'fixed' ? horarioAnoNuevo1Fixed : horarioAnoNuevo1}
                      onSave={(newValue) => handleSaveDatosId(33, activeScheduleStructure === 'fixed' ? 'horario_ano_nuevo_1_fixed' : 'horario_ano_nuevo_1', newValue, activeScheduleStructure === 'fixed' ? setHorarioAnoNuevo1Fixed : setHorarioAnoNuevo1)}
                      isEditable={!!currentUser && adminEditMode}
                    />
                  </div>
                  <div>
                    <p className="space"></p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        value={inputValue565}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido66', newValue, setInputValue565)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.a_precio_4hs_}
                    </p>
                    <p className="bold inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido67"
                        value={inputValue566}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido67', newValue, setInputValue566)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.c_hora_extra_finde_}
                    </p>
                    <p className="bold">{inputValue}</p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido69"
                        value={inputValue568}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido69', newValue, setInputValue568)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>
                    <p className="space"></p>
                    <p className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido70"
                        value={inputValue569}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido70', newValue, setInputValue569)}
                        isEditable={!!currentUser && adminEditMode}
                        isTextArea={true}
                      />
                    </p>
                    <h3 className="inline-editable-text">
                      <EditableText
                        fieldKey="precio_dinamico_contenido71"
                        value={inputValue570}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido71', newValue, setInputValue570)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                    </h3>

                    <p className="space"></p>

                    <p className=" inline-editable-text">
                      <EditableText
                        value={inputValue500}
                        onSave={(newValue) => handleSaveDatosId(33, 'contenido1', newValue, setInputValue500)}
                        isEditable={!!currentUser && adminEditMode}
                      />
                      ${allFetchedPrices.l_seña_}
                    </p>
                  </div>
                </div>
              </li>
            )}
          </ul>



        </div>

        {/* Fin del div de Precios segun día y recomendaciones */}

        {/* Inicio del div de ¿qué incluye el alquiler? */}

        <div>
          <ul >
            <li >
              <div >

                <h2 className="banner">
                  <EditableText
                    value={inputValue502}
                    onSave={(newValue) => handleSaveDatosId(33, 'contenido3', newValue, setInputValue502)}
                    isEditable={!!currentUser && adminEditMode}
                  />
                </h2>

              </div>
            </li>
          </ul>
        </div>
        <div >
          <p className="space"></p>
          <p className="">
            <EditableText
              value={inputValue503}
              onSave={(newValue) => handleSaveDatosId(33, 'contenido4', newValue, setInputValue503)}
              isEditable={!!currentUser && adminEditMode}
            />
          </p>
          <p className="space"></p>



          <ul className="precios">

            <li className="incluye">
              <h2 className="banner">
                <EditableText
                  value={inputValue504}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido5', newValue, setInputValue504)}
                  isEditable={!!currentUser && adminEditMode}
                />
              </h2>

              <p className="space"></p>

              <DynamicSymbolsList
                path="datosId/33/incluye"
                currentUser={adminEditMode ? currentUser : null}
                isEditable={!!currentUser && adminEditMode}
                showToast={showToast}
                placeholder="Nuevo punto a incluir"
                defaultSymbol="check"
              />



            </li>


            <li className="bold">

              <h2 className="banner">
                <EditableText
                  value={inputValue512}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido13', newValue, setInputValue512)}
                  isEditable={!!currentUser && adminEditMode}
                />
              </h2>

              <p className="space"></p>

              <DynamicSymbolsList
                path="datosId/33/no_incluye"
                currentUser={adminEditMode ? currentUser : null}
                isEditable={!!currentUser && adminEditMode}
                showToast={showToast}
                placeholder="Nuevo punto no incluido"
                defaultSymbol="cross_red"
              />


            </li>


          </ul>



        </div>

        {/* Fin del div de ¿qué incluye el alquiler? */}



        <p className="space"></p>

        {!isPageLoading && (
          <AclaracionesDinamicas
            currentUser={adminEditMode ? currentUser : null}
            showToast={showToast}
            bannerTitle={aclaracionesBannerTitle}
            onSaveBannerTitle={handleSaveAclaracionesBannerTitle}
          />
        )}

        <p className="space"></p>
        {!isPageLoading && (
          <ServiciosOpcionales
            serviciosOpcionales={serviciosOpcionales}
            carrito={carritoFromChild}
            onCarritoUpdate={handleCartChange}
            showToast={showToast}
            selectedDate={selectedDate}
            allFetchedPrices={allFetchedPrices}
            isferiado={isferiado}
            compartirPorWhatsapp={handleReservaPorWhatsapp}
            generarYCopiarLink={generarYCopiarLink}
            setDescuentoAdmin={setDescuentoAdmin}
            descuentoAdmin={descuentoAdmin}
            tipoDescuentoAdmin={tipoDescuentoAdmin}
            inputValue546={inputValue546}
            inputValue547={inputValue547}
            inputValue548={inputValue548}
            handleReservaPorWhatsapp={handleReservaPorWhatsapp}
            handleImageClick={handleImageClick}
            linkCopiado={linkCopiado}
            mensajeEditable={mensajeEditable}
            mensajeFecha={mensajeFecha}
            precioAMostrar={precioAMostrar}
            precioTotal={precioTotal}
            currentUser={adminEditMode ? currentUser : null}
            isAdmin={!!currentUser}
            handleGoToPresupuesto={() => {
              if (selectedDate) {
                const params = new URLSearchParams();
                const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                params.set('fecha', formattedDate);
                
                carritoFromChild.forEach(item => {
                  if (item.id === 5) {
                    params.set(`item_${item.uuid}_id`, item.id);
                    params.set(`item_${item.uuid}_cantidad`, item.cantidad);
                  } else {
                    params.set(`item_${item.id}_id`, item.id);
                    params.set(`item_${item.id}_cantidad`, item.cantidad);
                  }
                });

                const currentV = searchParams.get('v') || activePriceVersion || 2;
                params.set('v', currentV);
                
                if (descuentoAdmin > 0) {
                  params.set('descuento', descuentoAdmin);
                  if (tipoDescuentoAdmin) {
                    params.set('tipoDescuento', tipoDescuentoAdmin);
                  }
                }

                navigate(`/presupuesto?${params.toString()}`);
              }
            }}
            handleSaveRentalName={handleSaveRentalName}
            handleSaveServicioNombre={handleSaveServicioNombre}
            carritoTitulo={carritoTitulo}
            handleSaveCarritoTitulo={handleSaveCarritoTitulo}
            handleSaveCamareraTitle={handleSaveCamareraTitle}
            camareraInitialTitle={inputValue521}
            bannerServiciosOpcionalesText={bannerServiciosOpcionalesText}
            handleSaveBannerServiciosOpcionalesText={handleSaveBannerServiciosOpcionalesText}
            bannerTitle={serviciosExternosBannerTitle}
            onSaveBannerTitle={handleSaveServiciosExternosBannerTitle}
            externalServices={externalServices}
            onAddService={handleAddExternalService}
            onRemoveService={handleRemoveExternalService}
            onSaveService={handleSaveExternalService}
            handleSaveAclaracion={handleSaveAclaracion}
            openWhatsappLink={openWhatsappLink}
            currentRentalService={currentRentalService} /* New prop */
            scheduleRules={scheduleRules} /* New prop for HorarioSlider */
            onTimeChange={handleTimeChange} /* New prop for HorarioSlider */
            initialDuration={sliderInitialDuration} /* New prop for HorarioSlider */
            initialStartTime={sliderInitialStartTime} /* New prop for HorarioSlider */
            minHour={scheduleRules.minHour} /* New prop for HorarioSlider */
            isWeekendPricing={priceDisplayMode !== 'weekday' && priceDisplayMode !== 'weekday_holiday_short' && priceDisplayMode !== 'none'}
          />

        )}
        <p className="space"></p>



        <div className="paragraph">
          <ul className="list">
            <li >

              <EditableText
                value={inputValue549}
                onSave={(newValue) => handleSaveDatosId(33, 'contenido50', newValue, setInputValue549)}
                isEditable={!!currentUser && adminEditMode}
                as="h3"
              />
              <EditableText
                value={inputValue550}
                onSave={(newValue) => handleSaveDatosId(33, 'contenido51', newValue, setInputValue550)}
                isEditable={!!currentUser && adminEditMode}
                as="h3"
              />
              <div>
                <p><a href={inputValue205} target="blank"><i className="fa fa-map-marker icono"></i>Dirección</a></p>

                <EditableText
                  value={inputValue551}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido52', newValue, setInputValue551)}
                  isEditable={!!currentUser && adminEditMode}
                  as="p"
                />
                <p className="space"></p>

                <p>
                  <a onClick={handleGeneralWhatsappClick}>
                    <i className="fa fa-whatsapp icono"></i> Whatsapp
                  </a>
                </p>



                <EditableText
                  value={inputValue552}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido53', newValue, setInputValue552)}
                  isEditable={!!currentUser && adminEditMode}
                  as="p"
                />
                <p className="space"></p>
                <EditableText
                  value={inputValue553}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido54', newValue, setInputValue553)}
                  isEditable={!!currentUser && adminEditMode}
                  as="p"
                />
              </div>
              <p>
                <a href={inputValue555} target="_blank" rel="noreferrer"><i className="fa fa-facebook-official"></i>                  <EditableText
                  value={inputValue554}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido55', newValue, setInputValue554)}
                  isEditable={!!currentUser && adminEditMode}
                  as="span"
                /></a>
              </p>
              <p>

                <a href={inputValue557} target="_blank" rel="noopener noreferrer"><i className="fa fa-instagram icono"></i>                  <EditableText
                  value={inputValue556}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido57', newValue, setInputValue556)}
                  isEditable={!!currentUser && adminEditMode}
                  as="span"
                /></a>
              </p>
              <p>
                <a href={inputValue559} target="_blank" rel="noreferrer"><i className="fas fa-pizza-slice\t"></i>                  <EditableText
                  value={inputValue558}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido59', newValue, setInputValue558)}
                  isEditable={!!currentUser && adminEditMode}
                  as="span"
                /></a>
              </p>
              <p>
                <a href={inputValue561} target="_blank" rel="noreferrer"><i className="fas fa-gamepad"></i>                  <EditableText
                  value={inputValue560}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido61', newValue, setInputValue560)}
                  isEditable={!!currentUser && adminEditMode}
                  as="span"
                /></a>
              </p>
              <p>
                <a href={inputValue563} target="_blank" rel="noreferrer"><i className="fas fa-hotel"></i>                  <EditableText
                  value={inputValue562}
                  onSave={(newValue) => handleSaveDatosId(33, 'contenido63', newValue, setInputValue562)}
                  isEditable={!!currentUser && adminEditMode}
                  as="span"
                /></a>
              </p>

            </li>
          </ul>
        </div>

      </div>


      {
        currentUser && (
          <AdminControlsContainer>
            {/* Adjust bottom position if other buttons are present, or just stack them. 
               Actually, let's just put it at a fixed place above the others or alongside. 
               The FloatingButtonContainer is at bottom: 7rem. 
               Let's put this one at 2rem or 12rem. 
               The user didn't specify position, just existence. 
               Let's put it at bottom: 2rem (left check above) but I set styles in styled div.
               Let's just use the style prop to adjust if needed or simply let it be.
               Wait, FloatingButtonContainer is 7rem. AdminControlsContainer I defined as 2rem.
               They won't overlap verticall if I set AdminControlsContainer to 2rem.
               But FloatingButtonContainer is 7rem. 
               Let's put AdminControlsContainer at 2rem.
           */}
            <AdminToggleButton $active={adminEditMode} onClick={() => setAdminEditMode(!adminEditMode)}>
              {adminEditMode ? 'Desactivar Edición' : 'Activar Edición'}
            </AdminToggleButton>
          </AdminControlsContainer>
        )
      }
      <div style={{ height: '150px' }}></div>
    </Section>
  </>
  );


};






const Watermark = styled.div` position: fixed;
top: 65%;
left: 50%;
transform: translate(-49%, -51%);
z-index: 10000;
font-size: 5rem;
font-weight: bold;
color: rgba(255, 255, 255, 0.6);
pointer-events: none;
white-space: nowrap;
user-select: none;

@media screen and (min-width: 280px) and (max-width: 1080px) {
	font-size: 3rem;
}

@media screen and (min-width: 720px) {
	.grid .Opcionales {
		grid-template-columns: repeat(5, 1fr);
	}
}

`;

const Watermark2 = styled.div` position: fixed;
top: 65%;
left: 50%;
transform: translate(-50%, -50%);
z-index: 9998;
font-size: 5rem;
font-weight: bold;
color: rgba(0, 0, 0, 0.25);
pointer-events: none;
white-space: nowrap;
user-select: none;

@media screen and (min-width: 280px) and (max-width: 1080px) {
	font-size: 3rem;
}

`;

const WatermarkInstruction = styled.div` position: fixed;
top: 75%;
left: 50%;
transform: translate(-50%, -50%);
margin-left: -3px;
margin-top: -3px;
z-index: 10000;
font-size: 1.5rem;
font-weight: bold;
color: rgba(255, 255, 255, 0.6);
pointer-events: none;
white-space: nowrap;
user-select: none;

@media screen and (min-width: 280px) and (max-width: 1080px) {
	font-size: 1rem;
    white-space: normal;
    width: 90%;
    text-align: center;
}
`;

const WatermarkInstruction2 = styled.div` position: fixed;
top: 75%;
left: 50%;
transform: translate(-50%, -50%);
z-index: 9998;
font-size: 1.5rem;
font-weight: bold;
color: rgba(0, 0, 0, 0.25);
pointer-events: none;
white-space: nowrap;
user-select: none;

@media screen and (min-width: 280px) and (max-width: 1080px) {
	font-size: 1rem;
    white-space: normal;
    width: 90%;
    text-align: center;
}
`;

const ServiceIdDisplay = styled.div` background-color: grey;
color: white;
font-size: 0.8em; // Smaller font size
padding: 0.2em 0.5em;
margin-bottom: 0.5em;
border-radius: 3px;
text-align: center;
`;

const CustomToastWrapper = styled.div` // Renamed
position: fixed;
top: 2rem;
right: 2rem;
z-index: 10001;
display: flex;
flex-direction: column;
gap: 1rem;
`;

const Section = styled.section` display: flex;
flex-direction: column;
margin: auto;
padding-bottom: 2rem;
padding-top: 1rem;


.space {
	padding: 0.5rem;
}

.bold {
	font-weight: bold;
}

.left-padding {
	display: inline-block;
	padding-left: 2rem;


}

.border {
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
	width: 50%;
	margin: auto;
	padding: 2rem;
}

.menosymas {
	font-size: 2rem;
	width: 2rem;
	height: 2.5rem;
	margin-left: 0.5rem;
	margin-right: 0.5rem;
	color: var(--primary-text);
	text-shadow: 0.5px 0.5px 2px var(--primary-text);
	box-shadow: 0px 0.5px 2px rgba(0, 0, 0, 0.6);
}

.menosymas:hover {
	filter: brightness(110%);
	text-shadow: 0.2px 0.5px 1px var(--primary-text);
	box-shadow: 0px 0.25px 1px rgba(0, 0, 0, 0.3);
	border-radius: 10px;
}


h1 {
	font-size: 1.5rem;
	color: var(--white-text);
	padding-top: 0.5rem;
}

h2 {
	font-size: 1rem;
	padding: 1rem;
	text-align: center;
	text-shadow: 2px 2px 5px var(--primary-text);
}

h3 {
	list-style: none;
	font-size: 1rem;
	padding: 1rem;
	color: var(--primary-text);
	text-align: center;

}

h4 {
	font-size: 0.9rem;
	text-align: center;
	text-shadow: 2px 2px 5px var(--primary-text);
	color: var(--white-text);
}

h5 {
	font-size: 0.7rem;
	text-align: center;

}

h6 {
	font-size: 0.5rem;
	color: var(--primary-text);
	padding: 0rem;
}


p {
	font-size: 1rem;
	color: var(--primary-text);
	text-align: center;
}

a {
	font-size: 1rem;
	text-decoration: underline;
	color: var(--primary-text);
	cursor: pointer;
	transition: var(--default-transition);

	&:hover {
		color: var(--app-primary-text-color, var(--primary-color));
	}
}

.hidden {
	display: none;
}

.inline {
	display: inline-block;
}

.mensajeAMostrar {
	padding-top: 1rem;
}

.span {

	padding: 0.5rem;
	background-color: var(--span-color);
	color: var(--white-text);
	font-weight: normal;
	text-align: center;
}

li {
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
	line-height: 1.5rem;
	list-style: none;
}

.inline-editable-text .editable-text-container {
	display: inline;
}

.bold-text .editable-text-display {
	font-weight: bold;
  display: inline;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}


.divInput {
	margin-bottom: 0rem;
	margin-top: auto;
}

.headerPrecios {
	font-size: 0.4;
}

  .servicioCantidad {
    color: var(--primary-text);
    position: absolute;
    margin-top: -5px;
    margin-right: -5px;
    background-color: var(--white-text);
    width: 1rem;
    height: 1rem;
    font-family: 'product_sansregular';
    font-weight: bold;
    border-radius: 50%;
    font-size: 0.8rem;
    text-align: center;
    item-align: center;
    justify-content: center;
    box-shadow: 2px 2px 5px rgba(1, 1, 0, 3);
    text-shadow: 1px 1px 3px var(--app-primary-text-color, var(--primary-color));

    &.in-cart-quantity {
      background-color: green; /* Green background when in cart */
      color: white; /* White text for better contrast */
    }
  }
.disabled-service {
	cursor: not-allowed;
	pointer-events: none;
}

.navbar {
	color: var(--primary-text);
	position: fixed;
	top: 0;
	left: 5rem;
	right: 5rem;
	width: auto;
	border-radius: 0 0 10px 10px;
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
	padding: 4px 15px;
	margin-bottom: 0rem;
	background-color: var(--app-primary-text-color, var(--primary-color));
	z-index: 10000;
	display: flex;
	align-items: center;
	justify-content: space-between;
	text-align: center;
	text-shadow: 2px 2px 10px var(--primary-text);
	box-sizing: border-box;

	@media screen and (max-width: 1080px) {
		left: 0;
		right: 0;
		border-radius: 0;
		flex-wrap: wrap;
		padding: 5px 6px;
		row-gap: 3px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		position: relative;
		z-index: 10001;

		.logo {
			width: 2.3rem;
			height: 2.3rem;
			position: static;
			cursor: pointer;
		}

		.logo:hover {
			filter: brightness(110%);
			transform: scale(0.9);
			transition: 0.2s ease-in-out;
		}

		.name {
			color: var(--white-text);
			position: static;
			font-family: 'playlistscript';
			font-size: 1.5rem;
			white-space: nowrap;
			text-shadow: 0.5px 0.5px 2px var(--primary-text);
		}

		.name:hover {
			filter: brightness(110%);
			text-shadow: 0.2px 0.5px 1px var(--primary-text);
			transition: 0.2s ease-in-out;
		}
	}

	.monthNameAndArrows {
		margin: auto; /* Center the DatePicker */
	}
}

.content {
	.paragraph {
		h2 {
			text-shadow: 2px 2px 10px var(--secondary-text);
			border-radius: 5px;
		}
	}

	.bold {
		font-size: 1rem;
		font-weight: bold;
	}

  .incluye p:not(.space),
  .bold p:not(.space) {
    background-color: var(--app-background-color, #ffffec);
    padding: 10px 15px;
    border-radius: 12px;
    margin-bottom: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .incluye p:not(.space):hover,
  .bold p:not(.space):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

	.banner {
		background-color: var(--app-primary-text-color, var(--primary-color));
		color: var(--white-text);
		text-align: center;
		text-shadow: 2px 2px 10px var(--primary-text);
		border-radius: 5px;
	}

	.banner2 {
		background-color: var(--app-primary-text-color, var(--primary-color));
		color: var(--white-text);
		text-align: center;
		border-radius: 5px;

		&:hover {}

		h2 {
			border-radius: 5px;
			color: var(--white-text);
      }
	}

	.grid {


		li {

			padding: 0.5rem;
			text-align: center;
      item-align: center;
			border: 1px solid #ccc;
			padding: 1rem;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			margin: auto;


		}
	}
}

.precios {
	display: grid;
	grid-template-columns: repeat(2, 1fr);

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
	gap: 0.5rem;
	right: 1rem;
	left: 1rem;


	h2 {
		left: 0rem;
		right: 0rem;
		font-size: 1rem;
		background-color: var(--app-primary-text-color, var(--primary-color));
		text-shadow: 2px 2px 5px var(--primary-text);
		color: var(--white-text);
	}

	h3 {
		font-size: 1rem;
		margin-right: 1rem;
		text-align: left;
		color: var(--primary-text);
	}

	h4 {
		margin-left: 1rem;
		margin-right: 1rem;
		text-align: left;
		color: var(--primary-text);

	}

	p {
		margin-left: 1rem;
		margin-right: 1rem;
		text-align: left;
		color: var(--primary-text);
	}

}

.precios2 {
	display: grid;
	grid-template-columns: repeat(1, 1fr);
	right: 1rem;
	left: 1rem;

	h2 {
		left: 0rem;
		right: 0rem;
		font-size: 1rem;
		background-color: var(--app-primary-text-color, var(--primary-color));
		text-shadow: 2px 2px 5px var(--primary-text);
	}

	h3 {
		font-size: 1rem;
		margin-right: 1rem;
		text-align: left;
	}

	h4 {
		margin-left: 1rem;
		margin-right: 1rem;
		text-align: left;

	}

	p {
		margin-left: 1rem;
		margin-right: 1rem;
		text-align: left;
	}

}
}



.botonReturn {

	position: fixed;
	top: 100px;
	right: 25px;
	text-align: center;
	transition: all 300ms ease;
	text-shadow: 2px 2px 5px var(--primary-text);


	.imagen_volver {

		width: 53px;
		height: 53px;
		border-radius: 20px;
		color: var(--white-text);
		font-size: 1.6rem;
		line-height: 53px;
		align-items: center;
		background-color: var(--primary-color);
		text-shadow: 2px 2px 5px var(--primary-text);
		box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.3);
		transition: 0.2s ease-in-out;
	}

	.imagen_volver:hover {
		border-radius: 23px;
		filter: brightness(110%);
		transform: scale(0.95);
	}
}



.tooltip .tooltiptext {
	text-shadow: 0px 0px 0px var(--primary-text);
	padding: 1rem;
	visibility: hidden;
	bottom: 5px;
	right: 60px;
	color: var(--primary-text);
	height: auto;
	width: 175px;
	text-align: center;
	align-items: center;
	font-family: 'product_sansregular';
	font-size: 1rem;
	background-color: var(--card-grey);
	border-radius: 6px;

	/* Position the tooltip */
	position: absolute;

	img {
		display: flex;
		width: 150px;
		height: 150px;
	}
}

.tooltip {
	position: relative;

}

.tooltip:hover .tooltiptext {
	visibility: visible;
  z-index: 10000;
  opacity: 0.85; 
}

.tooltip2 .tooltiptext2 {
	text-shadow: 0px 0px 0px var(--primary-text);
	padding: 1rem;
	visibility: hidden;
	top: 200px;
	left: 50%;
	color: var(--primary-text);
	height: auto;
	width: 200px;
	text-align: center;
	align-items: center;
	font-family: 'product_sansregular';
	font-size: 1rem;
	background-color: var(--secondary-text);
	border-radius: 6px;
	/* Position the tooltip */
	position: absolute;
  
}

.tooltip2 {
	position: relative;

}


.carrito {
	border: 1px solid #ccc;
	padding: 20px;

}

.carrito-titulo {
	font-size: 1.5em;
	font-weight: bold;
	margin-bottom: 15px;
	text-align: center;
}

.carrito-lista {
	list-style-type: none;
	padding: 0;
}

.carrito-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid #eee;
	padding: 10px 0;
}

.item-info {
	flex: 1;
	margin-right: 20px;
}

.item-nombre {
	font-weight: 600;
}

.item-controles {
	display: flex;
	align-items: center;
	min-width: 200px;
	/* Ajusta este valor según sea necesario */
	justify-content: flex-end;
	color: var(-primary-text);
}

.cantidad-control {
	display: flex;
	align-items: center;
	margin-right: 15px;
	justify-content: space-between;
	width: 150px;
}

.btn-cantidad-placeholder {
	width: 45px;
	height: 35px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.btn-cantidad {
	width: 35px;
	height: 35px;
	background-color: var(--app-primary-text-color, var(--primary-color));
	border: 1px solid #ccc;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	margin: 0 5px;
	color: var(--white-text);
	text-shadow: 0.5px 0.5px 2px var(--primary-text);
	box-shadow: 0px 0.5px 2px rgba(0, 0, 0, 0.6);
}

.btn-cantidad:hover {
	filter: brightness(110%);
	text-shadow: 0.2px 0.5px 1px var(--primary-text);
	box-shadow: 0px 0.25px 1px rgba(0, 0, 0, 0.3);
}

.item-cantidad {
	margin: 0 10px;
	min-width: 30px;
	/* Asegura un ancho mínimo para la cantidad */
	text-align: center;
}

.item-total {
	min-width: 70px;
	/* Ajusta este valor según sea necesario */
	text-align: right;
	font-weight: 600;
}

.carrito-total {
	margin-top: 25px;
	margin-bottom: 10px;
	text-align: center;
	font-weight: 800;
	font-size: 2em;
	color: var(--primary-color);
	background: linear-gradient(135deg, rgba(148, 137, 36, 0.1) 0%, rgba(148, 137, 36, 0.05) 100%);
	padding: 15px 30px;
	border-radius: 16px;
	border-left: 4px solid var(--primary-color);
	border-right: 4px solid var(--primary-color);
	display: block;
	width: fit-content;
	margin-left: auto;
	margin-right: auto;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.carrito-total-coments {
	margin-top: 15px;
	text-align: center;
	font-weight: normal;
	font-size: 0.95rem;
	color: #64748b;
	clear: both;
}

.lowButtons {


	.contenedorVaciarCarrito {

		.vaciarCarrito {

			background-color: white;
			color: var(--primary-text);
			text-align: center;
			text-decoration: none;
			border: 1px solid var(--app-primary-text-color, var(--primary-color));
			cursor: pointer;
			width: 20%;
			font-weight: bold;
			height: 2rem;
			border-radius: 5px;
			box-shadow: 1px 1px 5px var(--primary-text);
		}

		.vaciarCarrito:hover {
			transform: scale(0.99);
			box-shadow: 0.5px 0.5px 2px var(--primary-text);
		}
	}

	.contenedorAwhatsapp {


		display: flex;
		position: relative;
		margin-right: 0rem;
		justify-content: center;

		.aWhatsapp {
			background-color: var(--app-primary-text-color, var(--primary-color));
			color: var(--white-text);
			text-align: center;
			text-decoration: none;
			display: inline-block;
			cursor: pointer;
			width: auto;
			height: auto;
			border-radius: 5px;
			padding: 0.5rem;
			border: none;
			margin: 1rem;
			text-shadow: 0.5px 0.5px 2px var(--primary-text);
			box-shadow: 0px 0.5px 2px rgba(0, 0, 0, 0.6);
		}

		.aWhatsapp:hover {
			filter: brightness(110%);
			text-shadow: 0.2px 0.5px 1px var(--primary-text);
			box-shadow: 0px 0.25px 1px rgba(0, 0, 0, 0.3);
			border-radius: 10px;
		}

		.aWhatsapp2 {
			background-color: var(--app-primary-text-color, var(--primary-color));
			color: var(--white-text);
			text-align: center;
			text-decoration: none;
			display: inline-block;
			cursor: pointer;
			width: auto;
			height: auto;
			border-radius: 5px;
			padding: 0.5rem;
			border: none;
			margin: auto;
		}
	}
}

.aclaraciones {

	flex: 1;
	display: flex;
	flex-direction: column;
	width: 80%;
	justify-content: center;
	align-items: center;
	margin: auto;
	gap: 1rem;


	h2 {

		text-align: center;
		align-items: center;

		span {
			color: var(--primary-text);
			font-size: 1.5rem;
		}

		text-shadow:none;

	}

	h3 {
		font-size: 1.15rem;
		text-align: center;

		span {
			color: var(--primary-text);

		}
	}

	p {

		font-size: 1rem;
		text-align: center;
		color: var(--primary-text);
		justify-content: center;
	}
}

@media screen and (min-width: 280px) and (max-width: 1080px) {
    

  .navbar .brand .name {
    display: none;
  }
  .content .paragraph {
    h2 {
      margin-top: 1rem;   
    }
  }
    
  .navbar .brand .logo {
    left: 1.375rem; /* 22px */
  }

  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;

    

	h6 {
		font-size: 0.4rem;
		color: var(--primary-text);
		padding: 0rem;
	}

	h7 {
		font-size: 0.6rem;
	}


	.lowButtons {


		.contenedorVaciarCarrito {

			.vaciarCarrito {

				background-color: var(--white-text);
				color: var(--primary-text);
				text-align: center;
				text-decoration: none;
				border: 1px solid var(--app-primary-text-color, var(--primary-color));
				cursor: pointer;
				width: 40%;
				font-weight: bold;
				height: 2rem;
				border-radius: 5px;
				margin: 1rem;

			}
		}

		.contenedorAwhatsapp {


			display: flex;
			position: relative;
			margin-top: 1rem;
			justify-content: flex-end;

			.aWhatsapp {
				font-size: 0.85rem;
				background-color: var(--app-primary-text-color, var(--primary-color));
				color: var(--white-text);
				align-items: center;
				text-align: center;
				text-decoration: none;
				display: inline-flex;
				justify-content: center;
				cursor: pointer;
				width: 85%;
				max-width: 300px;
				min-width: 200px;
				height: auto;
				min-height: 44px;
				border-radius: 8px;
				padding: 0.6rem 1rem;
				border: none;
				margin: auto;
				box-sizing: border-box;
			}
		}
	}
	
	.space {
		padding: 0.5rem;
	}

	.bold {
		font-weight: bold;
	}


	h1 {
		font-size: 1.5rem;
		color: var(--white-text);
	}

	h2 {
		font-size: 1rem;
		color: var(--primary-text);
		padding: 1rem;
		text-align: center;
    margin-top: 1rem;
	}

	h3 {
		list-style: none;
		font-size: 1rem;
		padding: 1rem;
		color: var(--primary-text);
		text-align: center;
	}

	h4 {
		font-size: 0.9rem;
		text-align: center;
	}

	p {
		font-size: 1rem;
		color: var(--primary-text);
		text-align: center;
	}

	a {
		font-size: 1rem;
		text-decoration: underline;
		color: var(--primary-text);
		cursor: pointer;
		transition: var(--default-transition);

		&:hover {
			color: var(--app-primary-text-color, var(--primary-color));
		}
	}

	.span {
		padding: 0.5rem;
		background-color: var(--span-color);
		color: var(--white-text);
		font-weight: normal;
		text-align: center;
	}

	li {
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
		line-height: 1.5rem;
		list-style: none;
	}


  .botonReturn {

		position: fixed;

		right: 5px;
		text-align: center;
		z-index: 100;
		transition: all 300ms ease;
		text-shadow: 2px 2px 5px var(--primary-text);

		i {

			width: 53px;
			height: 53px;
			border-radius: 20px;
			color: var(--white-text);
			font-size: 1.6rem;
			line-height: 53px;
			align-items: center;
			background-image: linear-gradient(#e02870 20%, #4C57A2 80%);
			text-shadow: 2px 2px 5px var(--primary-text);
			box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.3);
		}

	}

	.botonReturn:hover {
		filter: brightness(130%);

		i {
			border-radius: 23px;
		}
	}


	.tooltip {
		position: relative;
	}

	.tooltip .tooltiptext {
		text-shadow: 0px 0px 0px var(--primary-text);
		padding: 1rem;
		visibility: hidden;
		bottom: 0px;
		right: 15px;
		color: var(--primary-text);
		height: auto;
		width: auto;
		text-align: center;
		align-items: center;
		font-family: 'product_sansregular';
		font-size: 1rem;
		background-color: var(--secondary-text);
		border-radius: 6px;
		/* Position the tooltip */
		position: absolute;
		z-index: 1;
	}

	.tooltip:hover .tooltiptext {
		visibility: visible;
		z-index: 1;
    opacity: 0.85; 
	}

	.tooltip2 .tooltiptext2 {
		text-shadow: 0px 0px 0px var(--primary-text);
		padding: 1rem;
		visibility: hidden;
		bottom: 340px;
		left: 0%;
		color: var(--primary-text);
		height: auto;
		width: 200px;
		text-align: center;
		align-items: center;
		font-family: 'product_sansregular';
		font-size: 1rem;
		background-color: var(--secondary-text);
		border-radius: 6px;
		/* Position the tooltip */
		position: absolute;
		z-index: 1;
	}

	.tooltip2:hover .tooltiptext2 {
		visibility: visible;
		z-index: 1;
	}

}
	
	`
