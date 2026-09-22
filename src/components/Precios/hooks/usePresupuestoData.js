import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, get, onValue } from 'firebase/database';
import { app } from '../../../firebase/firebase';
import axios from 'axios';
import Clave from '../../Calendar/Clave';

const GOOGLE_API_KEY = Clave();

export const initialPrices = {
    alquiler3hs: 0,
    horaExtraPromo: 0,
    alquiler4hs: 0,
    horaExtraFinde: 0,
    camarera: 0,
    metegol: 0,
    inflable: 0,
    pingPong: 0,
    arcade: 0,
    proyector: 0,
    horaOrganizacion: 0,
    parrillero: 0,
    seña: 0,
    usanParrilla: 0, // New service
};

export const initialTexts = {};
for (let i = 1; i <= 80; i++) {
    initialTexts[`contenido${i}`] = '';
}

export default function usePresupuestoData(selectedDate, searchParams, setSearchParams) {
    const [prices, setPrices] = useState(initialPrices);
    const [texts, setTexts] = useState(initialTexts);
    const [nombresServicios, setNombresServicios] = useState({});

    const [isPageLoading, setIsPageLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState({
        texts: false,
        prices: false,
        holidays: false,
        name: false,
        whatsapp: false,
        logo: false,
    });

    const [holidayDates, setHolidayDates] = useState([]);
    const [orangeHolidayDates, setOrangeHolidayDates] = useState([]);

    const [currentMonth, setCurrentMonth] = useState(null);
    const [inputValue101, setInputValue101] = useState(null);
    const [inputValue102, setInputValue102] = useState(null);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [siteName, setSiteName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    
    const [activePriceVersion, setActivePriceVersion] = useState(null);
    const [activeScheduleStructure, setActiveScheduleStructure] = useState('dynamic');
    
    const [serviciosOpcionales, setServiciosOpcionales] = useState([]);
    const [allFetchedPrices, setAllFetchedPrices] = useState({});
    const [versionPrices, setVersionPrices] = useState({});

    const fetchData = useCallback(async (path, setter, loadedKey) => {
        const db = getDatabase(app);
        const dbRef = ref(db, path);
        try {
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                setter(snapshot.val());
            } else {
                console.error(`No data found at ${path}`);
            }
        } catch (error) {
            console.error(`Error fetching from ${path}:`, error);
        } finally {
            setDataLoaded(prev => ({ ...prev, [loadedKey]: true }));
        }
    }, []);

    // 1. Fetch Texts and Configs
    useEffect(() => {
        fetchData('datosId/33', (data) => {
            const newTexts = {};
            for (let i = 1; i <= 80; i++) {
                newTexts[`contenido${i}`] = String(data[`contenido${i}`] || '');
            }
            setTexts(newTexts);
            setNombresServicios({
                1: String(data.contenido20 || '').replace(/lunes a jueves/gi, 'lunes a viernes'),
                2: String(data.contenido31 || ''),
                3: String(data.contenido21 || '').replace(/lunes a jueves/gi, 'lunes a viernes'),
                4: String(data.contenido67 || ''),
                5: String(data.contenido22 || ''),
                6: String(data.contenido24 || ''),
                7: String(data.contenido25 || ''),
                8: String(data.contenido26 || ''),
                9: String(data.contenido27 || ''),
                10: String(data.contenido28 || ''),
                11: String(data.contenido29 || ''),
                12: String(data.contenido30 || ''),
                13: String(data.contenido19 || ''),
                14: String(data.contenido19 || ''),
                15: String(data.contenido23 || ''),
            });
        }, 'texts');

        fetchData('datosId/29', (data) => {
            setSiteName(data.contenido1 || '');
        }, 'name');

        fetchData('datosId/28', (data) => {
            setLogoUrl(data.foto31 || '');
        }, 'logo');

        fetchData('datosId/25', (data) => {
            const whatsappText = data.whatsapp_text || '';
            const numberMatch = whatsappText.match(/(\d{2}-\d{4}-\d{4})/);
            if (numberMatch) {
                let number = numberMatch[0].replace(/-/g, '');
                if (!number.startsWith('549')) {
                    number = '549' + number;
                }
                setWhatsappNumber(number);
            }
        }, 'whatsapp');
    }, [fetchData]);

    // 2. Fetch Year Configuration
    useEffect(() => {
        fetchData('datosId/26', (data) => {
            let y1 = data.y_ano1;
            let y2 = data.z_ano2;
            if (data.activeMonthsList && data.activeMonthsList.length > 0) {
                const firstYear = parseInt(data.activeMonthsList[0].split('-')[0], 10);
                const lastYear = parseInt(data.activeMonthsList[data.activeMonthsList.length - 1].split('-')[0], 10);
                if (lastYear > firstYear) y2 = lastYear.toString();
                if (firstYear > parseInt(y1 || 0)) y1 = firstYear.toString();
            }
            setInputValue101(y1);
            setInputValue102(y2);
        }, 'years'); 
    }, [fetchData]);

    // 3. Calculate Current Month with Year Offset
    useEffect(() => {
        if (inputValue101 && inputValue102) {
            const targetDate = selectedDate || new Date();
            const targetYear = targetDate.getFullYear();
            let month = targetDate.getMonth() + 1;

            if (targetYear === parseInt(inputValue101)) {
                // Year 1 match: Keep base month (1-12)
            } else if (targetYear === parseInt(inputValue102)) {
                if (parseInt(inputValue101) !== parseInt(inputValue102)) {
                    month += 12;
                }
            }

            if (month === 19) {
                console.warn("Month 19 detected (Unused). Remapping to Month 7 per business rules.");
                month = 7;
            }
            setCurrentMonth(month);
        }
    }, [inputValue101, inputValue102, selectedDate]);

    // 4. Fetch Active Price Version
    useEffect(() => {
        const fetchActiveVersion = async () => {
            const db = getDatabase(app);
            const configRef = ref(db, 'config/activePriceVersion');
            try {
                const snapshot = await get(configRef);
                if (snapshot.exists()) {
                    setActivePriceVersion(snapshot.val());
                } else {
                    setActivePriceVersion(2);
                }
            } catch (error) {
                console.error("Error fetching active price version:", error);
                setActivePriceVersion(2);
            }
        };
        fetchActiveVersion();
    }, []);

    // 5. Fetch Active Schedule Structure
    useEffect(() => {
        const db = getDatabase(app);
        const structRef = ref(db, 'config/activeScheduleStructure');
        const unsubscribe = onValue(structRef, (snapshot) => {
            if (snapshot.exists()) {
                setActiveScheduleStructure(snapshot.val());
            }
        });
        return () => unsubscribe();
    }, []);

    // 6. Fetch Prices for current month and version
    useEffect(() => {
        if (currentMonth && activePriceVersion !== null) {
            const vParam = searchParams.get('v');
            const versionToLoad = vParam ? parseInt(vParam) : null;

            let collectionPath = 'datosId';
            let isLegacy = false;

            if (!vParam) {
                collectionPath = 'datosId';
            } else if (versionToLoad && versionToLoad < activePriceVersion) {
                collectionPath = `precios_legacy_v${versionToLoad}`;
                isLegacy = true;
            } else {
                collectionPath = 'datosId';
            }

            if (isLegacy) {
                console.log("Loading Legacy Prices from:", collectionPath);
            }

            fetchData(`${collectionPath}/${currentMonth}`, (data) => {
                setAllFetchedPrices(data); 

                const getPriceLocal = (id, defaultKey) => {
                    const dynamicKey = `servicio_${id}_`;
                    if (data[dynamicKey] !== undefined) {
                        return parseFloat(data[dynamicKey]) || 0;
                    }
                    return parseFloat(data[defaultKey]) || 0;
                };

                setPrices({
                    alquiler4hs: getPriceLocal(3, 'a_precio_4hs_'),
                    alquiler3hs: getPriceLocal(1, 'b_precio_3hs_'),
                    horaExtraFinde: getPriceLocal(4, 'c_hora_extra_finde_'),
                    horaExtraPromo: getPriceLocal(2, 'd_hora_extra_semana_'),
                    camarera: getPriceLocal(5, 'e_camarera_'),
                    metegol: getPriceLocal(6, 'f_metegol_'),
                    pingPong: getPriceLocal(7, 'g_pingPong_'),
                    inflable: getPriceLocal(8, 'h_inflable_'),
                    proyector: getPriceLocal(9, 'i_proyector_'),
                    arcade: getPriceLocal(10, 'j_arcade_'),
                    horaOrganizacion: getPriceLocal(11, 'k_hora_organizacion_'),
                    seña: getPriceLocal(null, 'l_seña_'),
                    parrillero: getPriceLocal(12, 'r_parrillero_'),
                    usanParrilla: getPriceLocal(16, 's_usan_parrilla_'),
                });
            }, 'prices');
        }
    }, [currentMonth, fetchData, activePriceVersion, searchParams]); 

    // 7. Fetch prices for all versions to display in selector
    useEffect(() => {
        if (!currentMonth || !activePriceVersion) return;

        const fetchVersionPrices = async () => {
            const db = getDatabase(app);
            const pricesObj = {};
            const maxVersion = activePriceVersion || 2;

            const promises = Array.from({ length: maxVersion }, (_, i) => i + 1).map(async (v) => {
                let path = 'datosId';
                if (v < maxVersion) {
                    path = `precios_legacy_v${v}`;
                }
                const monthPath = `${path}/${currentMonth}`;

                try {
                    const snapshot = await get(ref(db, monthPath));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
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

    // 8. Fetch Optional Services
    useEffect(() => {
        const fetchOptionalServices = async () => {
            const db = getDatabase(app);
            const servicesRef = ref(db, 'optionalServices');
            try {
                const snapshot = await get(servicesRef);
                if (snapshot.exists()) {
                    const servicesData = snapshot.val();
                    const servicesArray = Array.isArray(servicesData)
                        ? servicesData.filter(s => s)
                        : Object.values(servicesData);

                    const servicesWithPrices = servicesArray.map(service => {
                        let price = 0;
                        const dynamicKey = `servicio_${service.id}_`;

                        if (allFetchedPrices && allFetchedPrices[dynamicKey] !== undefined) {
                            price = parseFloat(allFetchedPrices[dynamicKey]) || 0;
                        } else if (allFetchedPrices && service.priceKey && allFetchedPrices[service.priceKey]) {
                            price = parseFloat(allFetchedPrices[service.priceKey]) || 0;
                        }

                        return {
                            ...service,
                            precio: price
                        }
                    });

                    const filteredServices = servicesWithPrices.filter(service => ![1, 2, 3, 4, 13, 14].includes(service.id));
                    const hasParrilla = filteredServices.some(s => s.id === 15 || s.id === 16);
                    if (!hasParrilla) {
                        filteredServices.push({
                            id: 15,
                            nombre: nombresServicios[15] || "Usan la parrilla",
                            precio: prices.usanParrilla || 0
                        });
                    }
                    setServiciosOpcionales(filteredServices);
                }
            } catch (error) {
                console.error("Error fetching optional services:", error);
            }
        };

        if (dataLoaded.prices) {
            fetchOptionalServices();
        }
    }, [dataLoaded.prices, allFetchedPrices]);

    // 9. Fetch Holiday Dates
    const fetchHolidayDates = useCallback(async () => {
        const apiKey = GOOGLE_API_KEY;
        try {
            let googleHolidays = [];
            try {
                const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/es.ar.official%23holiday@group.v.calendar.google.com/events', {
                    params: {
                        key: apiKey,
                        timeMin: new Date(new Date().getFullYear(), 0, 1).toISOString(),
                        timeMax: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
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

            const db = getDatabase(app);
            const modifiedHolidaysRef = ref(db, 'feriados_modificados');
            const modifiedHolidaysSnapshot = await get(modifiedHolidaysRef);
            const modifiedHolidays = modifiedHolidaysSnapshot.exists() ? modifiedHolidaysSnapshot.val() : { added: {}, removed: {} };

            const recurringHolidaysRef = ref(db, 'feriados_recurrentes');
            const recurringHolidaysSnapshot = await get(recurringHolidaysRef);
            const recurringHolidaysData = recurringHolidaysSnapshot.exists() ? recurringHolidaysSnapshot.val() : {};

            let finalHolidays = googleHolidays
                .filter(h => !modifiedHolidays.removed || !modifiedHolidays.removed[h.date.replace(/-/g, '')])
                .concat(Object.values(modifiedHolidays.added || {}));

            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;
            for (let year of [currentYear, nextYear]) {
                for (const key in recurringHolidaysData) {
                    const holiday = recurringHolidaysData[key];
                    const [month, day] = holiday.monthDay.split('-');
                    const holidayDate = `${year}-${month}-${day}`;
                    finalHolidays.push({ date: holidayDate, name: holiday.name });
                }
                finalHolidays.push({ date: `${year}-12-24`, name: "Víspera de Navidad" });
                finalHolidays.push({ date: `${year}-12-31`, name: "Víspera de Año Nuevo" });
            }

            const holidays = new Set();
            const orangeHolidays = new Set();

            finalHolidays.forEach(event => {
                if (event && event.date) {
                    holidays.add(event.date);
                    orangeHolidays.add(event.date);
                }
            });

            setHolidayDates(Array.from(holidays));
            setOrangeHolidayDates(Array.from(orangeHolidays));

        } catch (error) {
            console.error('Error fetching holidays:', error);
        } finally {
            setDataLoaded(prev => ({ ...prev, holidays: true }));
        }
    }, []);

    useEffect(() => {
        fetchHolidayDates();
    }, [fetchHolidayDates]);

    // 10. Check if all data is loaded to remove the loading screen
    useEffect(() => {
        const allLoaded = Object.values(dataLoaded).every(status => status === true);
        if (allLoaded) {
            const timer = setTimeout(() => setIsPageLoading(false), 300);
            return () => clearTimeout(timer);
        }
    }, [dataLoaded]);

    return {
        prices, setPrices,
        texts, setTexts,
        nombresServicios, setNombresServicios,
        isPageLoading, setIsPageLoading,
        dataLoaded, setDataLoaded,
        holidayDates, setHolidayDates,
        orangeHolidayDates, setOrangeHolidayDates,
        currentMonth, setCurrentMonth,
        whatsappNumber, setWhatsappNumber,
        siteName, setSiteName,
        logoUrl, setLogoUrl,
        activePriceVersion, setActivePriceVersion,
        activeScheduleStructure, setActiveScheduleStructure,
        serviciosOpcionales, setServiciosOpcionales,
        allFetchedPrices, setAllFetchedPrices,
        versionPrices, setVersionPrices,
        inputValue101, setInputValue101,
        inputValue102, setInputValue102
    };
}
