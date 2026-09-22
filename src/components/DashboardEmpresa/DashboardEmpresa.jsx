import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLoading } from '../../contexts/LoadingContext';
import { getDatabase, ref, onValue, push, remove, set, update } from "firebase/database";
import { app } from "../../firebase/firebase";
import { ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal, { ModalButton, ModalButtonContainer } from '../Modal';
import PaymentEntitiesManager from '../GoogleDriveDropzone/PaymentEntitiesManager';

import { FaFileInvoiceDollar, FaMoneyCheckAlt, FaBuilding, FaPlus, FaTrash, FaGoogleDrive, FaSort, FaSortUp, FaSortDown, FaTimes } from 'react-icons/fa';

export default function DashboardEmpresa() {
    const [expensesData, setExpensesData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        vencimiento: '',
        tipo: 'FACTURA_SERVICIO',
        estado_pago: 'PENDIENTE'
    });

    const [filters, setFilters] = useState({
        fecha: '',
        tipo: '',
        concepto: '',
        vencimiento: '',
        monto: '',
        estado_pago: '',
        drive: ''
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'fecha',
        direction: 'desc'
    });

    const handleSort = (key, forcedDirection = null) => {
        setSortConfig(prev => {
            if (forcedDirection) {
                return { key, direction: forcedDirection };
            }
            if (prev.key === key) {
                return { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
            }
            const defaultDirection = (key === 'monto' || key === 'fecha' || key === 'vencimiento') ? 'desc' : 'asc';
            return { key, direction: defaultDirection };
        });
    };

    const clearFilters = () => {
        setFilters({
            fecha: '',
            tipo: '',
            concepto: '',
            vencimiento: '',
            monto: '',
            estado_pago: '',
            drive: ''
        });
    };

    const isAnyFilterActive = Object.values(filters).some(v => v !== '');

    const navigate = useNavigate();

    const changeMonth = (delta) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        
        // Prevent navigating to future months
        const today = new Date();
        if (newDate.getFullYear() > today.getFullYear() || 
           (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())) {
            return;
        }
        
        setCurrentDate(newDate);
    };

    const [activeScheduleStructure, setActiveScheduleStructure] = useState('dynamic');
    const [paymentEntities, setPaymentEntities] = useState({});
    const [categorizationRules, setCategorizationRules] = useState({});

    useEffect(() => {
        const db = getDatabase(app);
        const expensesRef = ref(db, 'gastos_mensuales');
        const sueldosRef = ref(db, 'sueldos_historial');
        const presupuestosRef = ref(db, 'presupuestos');
        const scheduleStructRef = ref(db, 'config/activeScheduleStructure');

        let gastosList = [];
        let sueldosList = [];

        const mergeAndSort = () => {
            const combined = [...gastosList, ...sueldosList];
            combined.sort((a, b) => {
                const dateA = new Date(a.fecha || 0).getTime();
                const dateB = new Date(b.fecha || 0).getTime();
                return dateB - dateA;
            });
            setExpensesData(combined);
            setLoading(false);
        };

        const unsubscribeSchedule = onValue(scheduleStructRef, (snapshot) => {
            if (snapshot.exists()) {
                setActiveScheduleStructure(snapshot.val());
            } else {
                setActiveScheduleStructure('dynamic');
            }
        });

        const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
            gastosList = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(monthKey => {
                    const monthData = data[monthKey];
                    Object.keys(monthData).forEach(id => {
                        const gasto = monthData[id];
                        gastosList.push({
                            id,
                            monthKey,
                            ...gasto
                        });
                    });
                });
            }
            mergeAndSort();
        });

        const unsubscribeSueldos = onValue(sueldosRef, (snapshot) => {
            sueldosList = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.keys(data).forEach(id => {
                    const sueldo = data[id];
                    sueldosList.push({
                        id,
                        tipo: 'SUELDO',
                        concepto: `Liquidación ${sueldo.empleado || ''}`,
                        monto: sueldo.total || 0,
                        fecha: sueldo.fecha_carga,
                        manual: true // So it doesn't show a drive link
                    });
                });
            }
            mergeAndSort();
        });

        const paymentEntitiesRef = ref(db, 'config/paymentEntities');
        const unsubscribePaymentEntities = onValue(paymentEntitiesRef, (snapshot) => {
            if (snapshot.exists()) {
                setPaymentEntities(snapshot.val());
            } else {
                setPaymentEntities({});
            }
        });

        const unsubscribePresupuestos = onValue(presupuestosRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let revenueList = [];
                Object.values(data).forEach(yearData => {
                    Object.values(yearData).forEach(monthData => {
                        Object.values(monthData).forEach(dayData => {
                            Object.entries(dayData).forEach(([id, presupuesto]) => {
                                // Consideramos "Facturación" a todo lo facturado O lo confirmado (ingreso asegurado por seña)
                                const isConfirmed = presupuesto.formData?.seña && parseFloat(presupuesto.formData.seña) > 0;
                                if (isConfirmed || presupuesto.facturado) {
                                    revenueList.push({
                                        id,
                                        monto: presupuesto.totalFinal || presupuesto.total || 0,
                                        fecha: presupuesto.selectedDate,
                                        isFeriado: presupuesto.isFeriado || false
                                    });
                                }
                            });
                        });
                    });
                });
                setRevenueData(revenueList);
            }
        });

        const rulesRef = ref(db, 'config/categorizationRules');
        const unsubscribeRules = onValue(rulesRef, (snapshot) => {
            if (snapshot.exists()) {
                setCategorizationRules(snapshot.val());
            } else {
                setCategorizationRules({});
            }
        });

        return () => {
            unsubscribeSchedule();
            unsubscribeExpenses();
            unsubscribeSueldos();
            unsubscribePresupuestos();
            unsubscribePaymentEntities();
            unsubscribeRules();
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        const db = getDatabase(app);
        const dateObj = new Date(formData.fecha);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        
        const expensesRef = ref(db, `gastos_mensuales/${monthKey}`);
        push(expensesRef, {
            tipo: formData.tipo,
            concepto: formData.concepto,
            monto: parseFloat(formData.monto),
            fecha: dateObj.getTime(),
            vencimiento: formData.vencimiento || null,
            estado_pago: formData.estado_pago || 'PENDIENTE',
            manual: true
        }).then(() => {
            setIsModalOpen(false);
            setFormData({
                concepto: '',
                monto: '',
                fecha: format(new Date(), 'yyyy-MM-dd'),
                vencimiento: '',
                tipo: 'FACTURA_SERVICIO',
                estado_pago: 'PENDIENTE'
            });
        }).catch(err => alert("Error al guardar: " + err.message));
    };

    const handleDelete = (monthKey, id) => {
        if (window.confirm('¿Estás seguro de eliminar este registro?')) {
            const db = getDatabase(app);
            const itemRef = ref(db, `gastos_mensuales/${monthKey}/${id}`);
            remove(itemRef);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    
    const handlePagarGrupo = (item) => {
        const groupId = item.grupo_id || item.driveFileId;
        const itemsToUpdate = [];
        
        if (groupId) {
            expensesData.forEach(g => {
                if ((g.grupo_id === groupId || g.driveFileId === groupId) && g.estado_pago !== 'PAGADO') {
                    if (g.monthKey && g.id) {
                        itemsToUpdate.push({ monthKey: g.monthKey, id: g.id });
                    }
                }
            });
        } else {
            itemsToUpdate.push({ monthKey: item.monthKey, id: item.id });
        }
        
        const db = getDatabase(app);
        
        if (item.barcode) {
            navigator.clipboard.writeText(item.barcode).catch(()=>{});
            alert("Código de barras copiado al portapapeles. Redirigiendo a Mercado Pago...");
        }

        let url = 'https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot';
        if (item.concepto) {
            const normalized = item.concepto.trim().toUpperCase();
            const entity = Object.values(paymentEntities).find(e => e.keywords && e.keywords.includes(normalized));
            if (entity && entity.endpoint) {
                url = entity.endpoint;
            }
        }
        
        window.open(url, '_blank');

        import('firebase/database').then(({ update, ref }) => {
            const updates = {};
            itemsToUpdate.forEach(target => {
                updates[`gastos_mensuales/${target.monthKey}/${target.id}/estado_pago`] = 'PAGADO';
            });
            update(ref(db), updates).catch(err => alert("Error al actualizar estado: " + err.message));
        });
    };

    const toggleEstadoPago = (item) => {
        if (!item.monthKey || !item.id) return; 
        const db = getDatabase(app);
        const itemRef = ref(db, `gastos_mensuales/${item.monthKey}/${item.id}`);
        
        let newEstado = 'PENDIENTE';
        if (item.estado_pago === 'PENDIENTE') newEstado = 'PAGADO';
        else if (item.estado_pago === 'PAGADO') newEstado = 'AUTODEBITO';
        else if (item.estado_pago === 'AUTODEBITO') newEstado = 'PENDIENTE';

        import('firebase/database').then(({ update, set, remove }) => {
            update(itemRef, { estado_pago: newEstado });
            
            // Si es un servicio recurrente, guardar/borrar la preferencia
            if (item.concepto && item.tipo === 'FACTURA_SERVICIO') {
                const normalizedConcepto = item.concepto.trim().toUpperCase();
                const autodebitoRef = ref(db, `config/autodebitos/${normalizedConcepto}`);
                
                if (newEstado === 'AUTODEBITO') {
                    set(autodebitoRef, true);
                } else if (item.estado_pago === 'AUTODEBITO') {
                    remove(autodebitoRef);
                }
            }
        });
    };

    const getEffectiveCategory = (item) => {
        if (item.tipo === 'SUELDO' || item.tipo === 'RECIBO_SUELDO' || item.tipo === 'CARGA_SOCIAL' || item.tipo === 'TARJETA_CREDITO') {
            return item.tipo;
        }
        const concepto = (item.concepto || item.empresa || '').toUpperCase();
        const safeConcepto = concepto.replace(/[.#$[\]]/g, '_');
        if (categorizationRules[safeConcepto]) {
            return categorizationRules[safeConcepto];
        }
        if (item.tipo === 'CONSUMO_TARJETA') {
            if (concepto.includes('IMPUESTO') || concepto.includes('AFIP') || concepto.includes('ARBA')) {
                return 'IMPUESTO';
            }
            return 'FACTURA_SERVICIO';
        }
        return item.tipo;
    };

    const handleCategoryChange = (item, newCategory) => {
        const db = getDatabase(app);
        const concepto = (item.concepto || item.empresa || '').toUpperCase();
        if (!concepto) return;

        const safeConcepto = concepto.replace(/[.#$[\]]/g, '_');
        const ruleRef = ref(db, `config/categorizationRules/${safeConcepto}`);
        
        if (newCategory === 'DEFAULT') {
            remove(ruleRef);
        } else {
            set(ruleRef, newCategory);
            // Also update the native field if it's not a credit card consumption
            if (item.tipo !== 'CONSUMO_TARJETA' && item.tipo !== 'TARJETA_CREDITO' && item.tipo !== 'RECIBO_SUELDO' && item.tipo !== 'SUELDO') {
                const itemRef = ref(db, `gastos_mensuales/${item.monthKey}/${item.id}`);
                update(itemRef, { tipo: newCategory });
            }
        }
    };

    const getIconForType = (tipo) => {
        if (tipo === 'SUELDO') return <FaMoneyCheckAlt color="#9c27b0" />;
        if (tipo === 'RECIBO_SUELDO') return <FaMoneyCheckAlt color="#607d8b" />; // Grey color for backup
        if (tipo === 'CARGA_SOCIAL') return <FaBuilding color="#1976d2" />;
        if (tipo === 'IMPUESTO') return <FaFileInvoiceDollar color="#009688" />;
        return <FaFileInvoiceDollar color="#ff9800" />;
    };

    const getLabelForType = (tipo) => {
        if (tipo === 'SUELDO') return 'Sueldos';
        if (tipo === 'RECIBO_SUELDO') return 'Respaldo Sueldo (Ignorado en total)';
        if (tipo === 'CARGA_SOCIAL') return 'Cargas Sociales';
        if (tipo === 'IMPUESTO') return 'Impuestos';
        if (tipo === 'FACTURA_SERVICIO') return 'Servicios';
        return tipo;
    };

    const getDeduplicatedExpenses = () => {
        const currentMonthItems = expensesData.filter(item => {
            const itemDate = new Date(item.fecha);
            return itemDate.getFullYear() === currentDate.getFullYear() && itemDate.getMonth() === currentDate.getMonth() && item.tipo !== 'RECIBO_SUELDO';
        });

        const manuales = [];
        const consumos = [];
        const tarjetas = [];
        let totalTarjetas = 0;

        currentMonthItems.forEach(item => {
            if (item.tipo === 'TARJETA_CREDITO') {
                totalTarjetas += parseFloat(item.monto) || 0;
                tarjetas.push(item);
            }
            else if (item.tipo === 'CONSUMO_TARJETA') consumos.push(item);
            else manuales.push(item);
        });

        const manualesUsados = new Set();
        let tarjetasRestante = totalTarjetas;
        const matchedConsumos = new Set();
        const deduplicatedServicios = [];
        const deduplicatedImpuestos = [];
        const deduplicatedOtros = [];

        manuales.forEach(m => {
            const concepto = (m.concepto || m.empresa || '').toUpperCase();
            const safeConcepto = concepto.replace(/[.#$[\]]/g, '_');
            const rule = categorizationRules[safeConcepto];
            const effectiveTipo = rule || m.tipo;

            if (effectiveTipo === 'FACTURA_SERVICIO') deduplicatedServicios.push(m);
            else if (effectiveTipo === 'IMPUESTO') deduplicatedImpuestos.push(m);
            else if (!['CARGA_SOCIAL', 'SUELDO'].includes(effectiveTipo)) deduplicatedOtros.push(m);
        });

        consumos.forEach(c => {
            const montoC = parseFloat(c.monto) || 0;
            const match = manuales.find(m => !manualesUsados.has(m.id) && Math.abs((parseFloat(m.monto) || 0) - montoC) < 2);
            
            tarjetasRestante -= montoC;
            
            if (match) {
                manualesUsados.add(match.id);
                matchedConsumos.add(c.id);
            } else {
                const concepto = (c.concepto || c.empresa || '').toUpperCase();
                const safeConcepto = concepto.replace(/[.#$[\]]/g, '_');
                const customCategory = categorizationRules[safeConcepto];
                
                if (customCategory === 'IMPUESTO') {
                    deduplicatedImpuestos.push(c);
                } else if (customCategory === 'OTRO') {
                    deduplicatedOtros.push(c);
                } else if (customCategory === 'FACTURA_SERVICIO') {
                    deduplicatedServicios.push(c);
                } else {
                    if (concepto.includes('IMPUESTO') || concepto.includes('AFIP') || concepto.includes('ARBA')) {
                        deduplicatedImpuestos.push(c);
                    } else {
                        deduplicatedServicios.push(c);
                    }
                }
            }
        });

        if (tarjetasRestante < 0) tarjetasRestante = 0;
        
        if (tarjetasRestante > 0) {
            deduplicatedOtros.push({
                concepto: 'Resto de Tarjetas de Crédito',
                monto: tarjetasRestante,
                tipo: 'TARJETA_CREDITO_RESTANTE'
            });
        }

        return {
            manuales,
            deduplicatedServicios,
            deduplicatedImpuestos,
            deduplicatedOtros,
            tarjetasRestante,
            matchedConsumos
        };
    };

    const getBarChartData = () => {
        let gastosCat = { 'Sueldos': 0, 'Servicios': 0, 'Impuestos': 0, 'Cargas Sociales': 0, 'Otros Gastos': 0 };
        const { manuales, deduplicatedServicios, deduplicatedImpuestos, deduplicatedOtros, tarjetasRestante } = getDeduplicatedExpenses();

        // Calculate Impuestos
        gastosCat['Impuestos'] = deduplicatedImpuestos.reduce((acc, item) => acc + (parseFloat(item.monto) || 0), 0);
        
        // Calculate Servicios
        gastosCat['Servicios'] = deduplicatedServicios.reduce((acc, item) => acc + (parseFloat(item.monto) || 0), 0);
        
        // Calculate Otros Gastos
        gastosCat['Otros Gastos'] = deduplicatedOtros.reduce((acc, item) => acc + (parseFloat(item.monto) || 0), 0);
        
        // Calculate the rest (Sueldos, Cargas Sociales) from manuales
        manuales.forEach(item => {
            if (item.tipo === 'SUELDO') gastosCat['Sueldos'] += parseFloat(item.monto) || 0;
            if (item.tipo === 'CARGA_SOCIAL') gastosCat['Cargas Sociales'] += parseFloat(item.monto) || 0;
        });

        let ingresosCat = { 'Eventos Día de Semana': 0, 'Eventos Fin de Semana/Feriado': 0 };
        revenueData.forEach(item => {
            const itemDate = new Date(item.fecha);
            
            if (itemDate.getFullYear() === currentDate.getFullYear() && itemDate.getMonth() === currentDate.getMonth()) {
                const dayOfWeek = itemDate.getDay();
                let isWeekend = item.isFeriado;
                
                if (activeScheduleStructure === 'fixed') {
                    if (dayOfWeek === 0 || dayOfWeek === 6) isWeekend = true;
                } else {
                    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) isWeekend = true;
                }
                
                if (isWeekend) {
                    ingresosCat['Eventos Fin de Semana/Feriado'] += parseFloat(item.monto) || 0;
                } else {
                    ingresosCat['Eventos Día de Semana'] += parseFloat(item.monto) || 0;
                }
            }
        });
            return [
            {
                name: 'Facturación',
                'Eventos Día de Semana': ingresosCat['Eventos Día de Semana'] || 0,
                'Eventos Fin de Semana/Feriado': ingresosCat['Eventos Fin de Semana/Feriado'] || 0,
                'Impuestos': 0,
                'Cargas Sociales': 0,
                'Otros Gastos': 0,
                'Servicios': 0,
                'Sueldos': 0
            },
            {
                name: 'Gastos',
                'Eventos Día de Semana': 0,
                'Eventos Fin de Semana/Feriado': 0,
                'Impuestos': gastosCat['Impuestos'] || 0,
                'Cargas Sociales': gastosCat['Cargas Sociales'] || 0,
                'Otros Gastos': gastosCat['Otros Gastos'] || 0,
                'Servicios': gastosCat['Servicios'] || 0,
                'Sueldos': gastosCat['Sueldos'] || 0
            }
        ];
    };

    const currentMonthExpenses = expensesData.filter(item => {
        const itemDate = new Date(item.fecha);
        return itemDate.getFullYear() === currentDate.getFullYear() && itemDate.getMonth() === currentDate.getMonth();
    });

    const filteredAndSortedExpenses = useMemo(() => {
        const filtered = currentMonthExpenses.filter(item => {
            // Filtro Fecha
            if (filters.fecha.trim() !== '') {
                const formattedDate = item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy') : '---';
                const term = filters.fecha.trim().toLowerCase();
                if (!formattedDate.toLowerCase().includes(term) && !(item.fecha && item.fecha.toLowerCase().includes(term))) {
                    return false;
                }
            }

            // Filtro Tipo
            if (filters.tipo !== '') {
                const effectiveTipo = getEffectiveCategory(item);
                if (filters.tipo === 'CONSUMO_TARJETA') {
                    if (item.tipo !== 'CONSUMO_TARJETA') return false;
                } else if (effectiveTipo !== filters.tipo && item.tipo !== filters.tipo) {
                    return false;
                }
            }

            // Filtro Concepto
            if (filters.concepto.trim() !== '') {
                const term = filters.concepto.trim().toLowerCase();
                const conceptoStr = `${item.concepto || ''} ${item.manual ? 'manual' : ''} ${item.tipo === 'CONSUMO_TARJETA' ? 'consumo tarjeta' : ''}`.toLowerCase();
                if (!conceptoStr.includes(term)) {
                    return false;
                }
            }

            // Filtro Vencimiento
            if (filters.vencimiento.trim() !== '') {
                const formattedVto = item.vencimiento ? format(new Date(item.vencimiento), 'dd/MM/yyyy') : '---';
                const term = filters.vencimiento.trim().toLowerCase();
                if (!formattedVto.toLowerCase().includes(term) && !(item.vencimiento && item.vencimiento.toLowerCase().includes(term))) {
                    return false;
                }
            }

            // Filtro Monto
            if (filters.monto.trim() !== '') {
                const cleanTerm = filters.monto.trim().replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
                const itemMonto = parseFloat(item.monto) || 0;
                if (cleanTerm.startsWith('>=')) {
                    const val = parseFloat(cleanTerm.replace('>=', '').trim());
                    if (!isNaN(val) && itemMonto < val) return false;
                } else if (cleanTerm.startsWith('>')) {
                    const val = parseFloat(cleanTerm.replace('>', '').trim());
                    if (!isNaN(val) && itemMonto <= val) return false;
                } else if (cleanTerm.startsWith('<=')) {
                    const val = parseFloat(cleanTerm.replace('<=', '').trim());
                    if (!isNaN(val) && itemMonto > val) return false;
                } else if (cleanTerm.startsWith('<')) {
                    const val = parseFloat(cleanTerm.replace('<', '').trim());
                    if (!isNaN(val) && itemMonto >= val) return false;
                } else {
                    const formattedMonto = formatCurrency(itemMonto).toLowerCase();
                    const rawMontoStr = itemMonto.toString();
                    if (!rawMontoStr.includes(cleanTerm) && !formattedMonto.includes(cleanTerm.toLowerCase())) {
                        return false;
                    }
                }
            }

            // Filtro Estado de Pago
            if (filters.estado_pago !== '') {
                const currentEstado = item.tipo === 'SUELDO' ? 'PAGADO' : (item.estado_pago || 'PENDIENTE');
                if (currentEstado !== filters.estado_pago) {
                    return false;
                }
            }

            // Filtro Drive
            if (filters.drive !== '') {
                const hasDrive = Boolean(item.driveFolderId || item.driveFileId);
                if (filters.drive === 'CON_DRIVE' && !hasDrive) return false;
                if (filters.drive === 'SIN_DRIVE' && hasDrive) return false;
            }

            return true;
        });

        return [...filtered].sort((a, b) => {
            let compare = 0;
            switch (sortConfig.key) {
                case 'monto': {
                    const montoA = parseFloat(a.monto) || 0;
                    const montoB = parseFloat(b.monto) || 0;
                    compare = montoA - montoB;
                    break;
                }
                case 'fecha': {
                    const dateA = new Date(a.fecha || 0).getTime();
                    const dateB = new Date(b.fecha || 0).getTime();
                    compare = dateA - dateB;
                    break;
                }
                case 'vencimiento': {
                    const vtoA = a.vencimiento ? new Date(a.vencimiento).getTime() : 0;
                    const vtoB = b.vencimiento ? new Date(b.vencimiento).getTime() : 0;
                    compare = vtoA - vtoB;
                    break;
                }
                case 'concepto': {
                    const concA = (a.concepto || '').toLowerCase();
                    const concB = (b.concepto || '').toLowerCase();
                    compare = concA.localeCompare(concB);
                    break;
                }
                case 'tipo': {
                    const labelA = (getLabelForType(getEffectiveCategory(a)) || a.tipo || '').toLowerCase();
                    const labelB = (getLabelForType(getEffectiveCategory(b)) || b.tipo || '').toLowerCase();
                    compare = labelA.localeCompare(labelB);
                    break;
                }
                case 'estado_pago': {
                    const estA = a.tipo === 'SUELDO' ? 'PAGADO' : (a.estado_pago || 'PENDIENTE');
                    const estB = b.tipo === 'SUELDO' ? 'PAGADO' : (b.estado_pago || 'PENDIENTE');
                    compare = estA.localeCompare(estB);
                    break;
                }
                case 'drive': {
                    const driveA = a.driveFolderId || a.driveFileId ? 1 : 0;
                    const driveB = b.driveFolderId || b.driveFileId ? 1 : 0;
                    compare = driveA - driveB;
                    break;
                }
                default:
                    compare = 0;
            }
            return sortConfig.direction === 'desc' ? -compare : compare;
        });
    }, [currentMonthExpenses, filters, sortConfig, categorizationRules]);

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort style={{ opacity: 0.35, marginLeft: '4px', verticalAlign: 'middle', fontSize: '0.75rem' }} />;
        }
        return sortConfig.direction === 'desc' 
            ? <FaSortDown style={{ color: 'var(--primary-color, #948924)', marginLeft: '4px', verticalAlign: 'middle', fontSize: '0.75rem' }} />
            : <FaSortUp style={{ color: 'var(--primary-color, #948924)', marginLeft: '4px', verticalAlign: 'middle', fontSize: '0.75rem' }} />;
    };

    const today = new Date();
    const isCurrentMonth = currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth();
    const chartData = getBarChartData();
    const facturacionData = chartData[0];
    const gastosData = chartData[1];
    
    // Calculate totals for the overlay label
    chartData[0].total = (facturacionData['Eventos Día de Semana'] || 0) + (facturacionData['Eventos Fin de Semana/Feriado'] || 0);
    chartData[1].total = (gastosData['Impuestos'] || 0) + (gastosData['Cargas Sociales'] || 0) + (gastosData['Otros Gastos'] || 0) + (gastosData['Servicios'] || 0) + (gastosData['Sueldos'] || 0);

    const { deduplicatedServicios, deduplicatedImpuestos, deduplicatedOtros, matchedConsumos } = getDeduplicatedExpenses();

    const filteredTotal = useMemo(() => {
        return filteredAndSortedExpenses
            .filter(i => i.tipo !== 'RECIBO_SUELDO' && !(matchedConsumos && matchedConsumos.has(i.id)))
            .reduce((acc, i) => acc + (parseFloat(i.monto) || 0), 0);
    }, [filteredAndSortedExpenses, matchedConsumos]);

    // Compute service detail breakdown for the current month
    const serviceDetails = deduplicatedServicios
        .reduce((acc, item) => {
            const concepto = item.concepto || item.empresa || 'Sin concepto';
            acc[concepto] = (acc[concepto] || 0) + (parseFloat(item.monto) || 0);
            return acc;
        }, {});

    // Compute impuestos detail breakdown for the current month
    const impuestosDetails = deduplicatedImpuestos
        .reduce((acc, item) => {
            const concepto = item.concepto || item.empresa || 'Sin concepto';
            acc[concepto] = (acc[concepto] || 0) + (parseFloat(item.monto) || 0);
            return acc;
        }, {});

    // Compute otros gastos detail breakdown for the current month
    const otrosGastosDetails = deduplicatedOtros
        .reduce((acc, item) => {
            const concepto = item.concepto || item.empresa || 'Sin concepto';
            acc[concepto] = (acc[concepto] || 0) + (parseFloat(item.monto) || 0);
            return acc;
        }, {});

    // Custom tooltip that hides the bar name ("1", "0") and zero-value items
    const CustomBarTooltip = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const barName = payload[0]?.payload?.name;
        const items = payload.filter(p => p.value > 0 && p.dataKey !== 'total');
        if (items.length === 0) return null;
        return (
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{barName}</p>
                {items.map((entry, i) => (
                    <p key={i} style={{ margin: '2px 0', fontSize: '13px', color: entry.color }}>
                        {entry.name} : {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <DashboardContainer>
            <HeaderControls>
                <BackButton onClick={() => navigate(-1)}>← Volver</BackButton>
                <MonthSelector>
                    <button onClick={() => changeMonth(-1)}>← Mes Anterior</button>
                    <h2>{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
                    <button 
                        onClick={() => changeMonth(1)} 
                        disabled={isCurrentMonth}
                        style={{ opacity: isCurrentMonth ? 0.5 : 1, cursor: isCurrentMonth ? 'not-allowed' : 'pointer' }}
                    >
                        Mes Siguiente →
                    </button>
                </MonthSelector>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <DriveButton onClick={() => window.open('https://drive.google.com/drive/search?q=type:folder%20Administraci%C3%B3n%20El%20Patio', '_blank')}>
                      <FaGoogleDrive /> Abrir Drive
                    </DriveButton>
                    <AddButton onClick={() => setIsModalOpen(true)}><FaPlus /> Gasto Manual</AddButton>
                </div>
            </HeaderControls>

            {loading ? <p style={{textAlign: 'center', padding: '2rem'}}>Analizando datos contables...</p> : (
                <>
                    <StatsGrid>
                        <ChartCard>
                            <h3>Resumen de Rentabilidad y Distribución</h3>
                            
                            {/* Leyenda Superior (Facturación) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                <h4 style={{ margin: 0, color: '#333', fontSize: '15px' }}>FACTURACIÓN</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#8bc34a', display: 'inline-block' }}></span> Eventos Día de Semana
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(facturacionData['Eventos Día de Semana'])}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#388e3c', display: 'inline-block' }}></span> Eventos Fin de Semana/Feriado
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(facturacionData['Eventos Fin de Semana/Feriado'])}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 15, left: -20, bottom: 0 }} barGap="-100%">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                    
                                    <YAxis yAxisId="left" dataKey="name" type="category" width={0} tick={false} axisLine={false} tickLine={false} />
                                    
                                    <RechartsTooltip content={<CustomBarTooltip />} />
                                    
                                    <Bar yAxisId="left" dataKey="Eventos Día de Semana" stackId="a" fill="#8bc34a" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Eventos Fin de Semana/Feriado" stackId="a" fill="#388e3c" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Cargas Sociales" stackId="a" fill="#1976d2" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Otros Gastos" stackId="a" fill="#e91e63" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Servicios" stackId="a" fill="#ff9800" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Sueldos" stackId="a" fill="#9c27b0" barSize={50} isAnimationActive={false} />
                                    <Bar yAxisId="left" dataKey="Impuestos" stackId="a" fill="#26a69a" barSize={50} isAnimationActive={false} />

                                    {/* Barra superpuesta transparente para mostrar el total centrado */}
                                    <Bar yAxisId="left" dataKey="total" fill="rgba(0,0,0,0)" barSize={50} isAnimationActive={false}>
                                        <LabelList dataKey="total" position="center" formatter={(v) => v > 0 ? formatCurrency(v) : ''} style={{ fontSize: '16px', fill: '#fff', fontWeight: 'bold', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Leyenda Inferior (Gastos) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                <h4 style={{ margin: 0, color: '#333', fontSize: '15px' }}>GASTOS</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#1976d2', display: 'inline-block' }}></span> Cargas Sociales
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(gastosData['Cargas Sociales'])}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#e91e63', display: 'inline-block' }}></span> Otros Gastos
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(gastosData['Otros Gastos'])}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#ff9800', display: 'inline-block' }}></span> Servicios
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(gastosData['Servicios'])}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#9c27b0', display: 'inline-block' }}></span> Sueldos
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(gastosData['Sueldos'])}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '12px', height: '12px', background: '#26a69a', display: 'inline-block' }}></span> Impuestos
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatCurrency(gastosData['Impuestos'])}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Detalle de Servicios */}
                            {Object.keys(serviceDetails).length > 0 && (
                                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255, 152, 0, 0.08)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                                    <h5 style={{ margin: '0 0 6px', fontSize: '13px', color: '#ff9800', fontWeight: 'bold' }}>Detalle de Servicios</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                                        {Object.entries(serviceDetails).sort((a, b) => b[1] - a[1]).map(([concepto, monto]) => (
                                            <div key={concepto} style={{ fontSize: '12px', color: '#555' }}>
                                                <span style={{ fontWeight: '600' }}>{concepto}:</span> {formatCurrency(monto)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Detalle de Impuestos */}
                            {Object.keys(impuestosDetails).length > 0 && (
                                <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(38, 166, 154, 0.08)', borderRadius: '8px', borderLeft: '3px solid #26a69a' }}>
                                    <h5 style={{ margin: '0 0 6px', fontSize: '13px', color: '#26a69a', fontWeight: 'bold' }}>Detalle de Impuestos</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                                        {Object.entries(impuestosDetails).sort((a, b) => b[1] - a[1]).map(([concepto, monto]) => (
                                            <div key={concepto} style={{ fontSize: '12px', color: '#555' }}>
                                                <span style={{ fontWeight: '600' }}>{concepto}:</span> {formatCurrency(monto)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detalle de Otros Gastos */}
                            {Object.keys(otrosGastosDetails).length > 0 && (
                                <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(233, 30, 99, 0.08)', borderRadius: '8px', borderLeft: '3px solid #e91e63' }}>
                                    <h5 style={{ margin: '0 0 6px', fontSize: '13px', color: '#e91e63', fontWeight: 'bold' }}>Detalle de Otros Gastos</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                                        {Object.entries(otrosGastosDetails).sort((a, b) => b[1] - a[1]).map(([concepto, monto]) => (
                                            <div key={concepto} style={{ fontSize: '12px', color: '#555' }}>
                                                <span style={{ fontWeight: '600' }}>{concepto}:</span> {formatCurrency(monto)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ChartCard>
                    </StatsGrid>

                    <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                        <PaymentEntitiesManager />
                    </div>

                    <TableContainer>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0 }}>Registro Automático y Manual de Gastos</h3>
                                <span style={{ fontSize: '0.82rem', color: '#555', background: '#f5f5f5', padding: '4px 10px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                                    <strong>{filteredAndSortedExpenses.length}</strong> de {currentMonthExpenses.length} gastos
                                    {filteredTotal > 0 && <span> | Total filtrado: <strong style={{ color: 'var(--primary-color, #948924)' }}>{formatCurrency(filteredTotal)}</strong></span>}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSort('monto', 'desc')}
                                    style={{
                                        backgroundColor: (sortConfig.key === 'monto' && sortConfig.direction === 'desc') ? 'var(--primary-color, #948924)' : '#fff',
                                        color: (sortConfig.key === 'monto' && sortConfig.direction === 'desc') ? '#fff' : '#444',
                                        border: '1px solid #ccc',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        fontWeight: (sortConfig.key === 'monto' && sortConfig.direction === 'desc') ? 'bold' : 'normal',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Ordenar montos de mayor a menor"
                                >
                                    💰 Monto: Mayor a menor 🔽 {sortConfig.key === 'monto' && sortConfig.direction === 'desc' && '✓'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSort('fecha', 'desc')}
                                    style={{
                                        backgroundColor: (sortConfig.key === 'fecha' && sortConfig.direction === 'desc') ? 'var(--primary-color, #948924)' : '#fff',
                                        color: (sortConfig.key === 'fecha' && sortConfig.direction === 'desc') ? '#fff' : '#444',
                                        border: '1px solid #ccc',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        fontWeight: (sortConfig.key === 'fecha' && sortConfig.direction === 'desc') ? 'bold' : 'normal',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Ordenar por fecha más reciente"
                                >
                                    📅 Fecha más reciente 🔽 {sortConfig.key === 'fecha' && sortConfig.direction === 'desc' && '✓'}
                                </button>
                                {isAnyFilterActive && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        style={{
                                            backgroundColor: '#ffebee',
                                            color: '#c62828',
                                            border: '1px solid #ffcdd2',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                        title="Limpiar todos los filtros"
                                    >
                                        <FaTimes /> Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <SortableTh $isSorted={sortConfig.key === 'fecha'} onClick={() => handleSort('fecha')} title="Clic para ordenar por fecha">
                                        Fecha {renderSortIcon('fecha')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'tipo'} onClick={() => handleSort('tipo')} title="Clic para ordenar por tipo">
                                        Tipo {renderSortIcon('tipo')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'concepto'} onClick={() => handleSort('concepto')} title="Clic para ordenar por concepto">
                                        Concepto {renderSortIcon('concepto')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'vencimiento'} onClick={() => handleSort('vencimiento')} title="Clic para ordenar por vencimiento">
                                        Vencimiento {renderSortIcon('vencimiento')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'monto'} onClick={() => handleSort('monto')} title="Clic para ordenar por monto (de mayor a menor)">
                                        Monto {renderSortIcon('monto')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'estado_pago'} onClick={() => handleSort('estado_pago')} title="Clic para ordenar por estado">
                                        Estado {renderSortIcon('estado_pago')}
                                    </SortableTh>
                                    <SortableTh $isSorted={sortConfig.key === 'drive'} onClick={() => handleSort('drive')} title="Clic para ordenar por respaldo Drive">
                                        Respaldo Drive {renderSortIcon('drive')}
                                    </SortableTh>
                                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                                </tr>
                                <tr style={{ backgroundColor: '#fcfbf7' }}>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterInput
                                            type="text"
                                            placeholder="Filtrar fecha..."
                                            value={filters.fecha}
                                            onChange={(e) => setFilters(prev => ({ ...prev, fecha: e.target.value }))}
                                            title="Filtrar por fecha (ej: 15, 15/09, 2026)"
                                        />
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterSelect
                                            value={filters.tipo}
                                            onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                                            title="Filtrar por tipo o categoría"
                                        >
                                            <option value="">Todos los tipos</option>
                                            <option value="FACTURA_SERVICIO">Servicios</option>
                                            <option value="IMPUESTO">Impuestos</option>
                                            <option value="OTRO">Otros Gastos</option>
                                            <option value="SUELDO">Sueldos</option>
                                            <option value="RECIBO_SUELDO">Respaldo Sueldo</option>
                                            <option value="CARGA_SOCIAL">Cargas Sociales</option>
                                            <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                                            <option value="CONSUMO_TARJETA">Consumo Tarjeta</option>
                                        </FilterSelect>
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterInput
                                            type="text"
                                            placeholder="Filtrar concepto..."
                                            value={filters.concepto}
                                            onChange={(e) => setFilters(prev => ({ ...prev, concepto: e.target.value }))}
                                            title="Buscar por concepto o proveedor"
                                        />
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterInput
                                            type="text"
                                            placeholder="Filtrar vto..."
                                            value={filters.vencimiento}
                                            onChange={(e) => setFilters(prev => ({ ...prev, vencimiento: e.target.value }))}
                                            title="Filtrar por fecha de vencimiento"
                                        />
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterInput
                                            type="text"
                                            placeholder="Monto (>5000)..."
                                            value={filters.monto}
                                            onChange={(e) => setFilters(prev => ({ ...prev, monto: e.target.value }))}
                                            title="Filtrar por monto (ej: >10000, <50000 o número)"
                                        />
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterSelect
                                            value={filters.estado_pago}
                                            onChange={(e) => setFilters(prev => ({ ...prev, estado_pago: e.target.value }))}
                                            title="Filtrar por estado de pago"
                                        >
                                            <option value="">Todos</option>
                                            <option value="PAGADO">PAGADO</option>
                                            <option value="PENDIENTE">PENDIENTE</option>
                                            <option value="AUTODEBITO">AUTODÉBITO</option>
                                        </FilterSelect>
                                    </td>
                                    <td style={{ padding: '6px 6px' }}>
                                        <FilterSelect
                                            value={filters.drive}
                                            onChange={(e) => setFilters(prev => ({ ...prev, drive: e.target.value }))}
                                            title="Filtrar por archivo Drive"
                                        >
                                            <option value="">Todos</option>
                                            <option value="CON_DRIVE">Con Drive</option>
                                            <option value="SIN_DRIVE">Sin archivo</option>
                                        </FilterSelect>
                                    </td>
                                    <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                                        {isAnyFilterActive && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                title="Limpiar todos los filtros"
                                                style={{
                                                    background: '#ffebee',
                                                    color: '#d32f2f',
                                                    border: '1px solid #ffcdd2',
                                                    borderRadius: '4px',
                                                    padding: '4px 7px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <FaTimes />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                                            {currentMonthExpenses.length === 0
                                                ? 'No hay gastos registrados en este mes.'
                                                : 'No se encontraron gastos con los filtros aplicados.'}
                                            {isAnyFilterActive && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={clearFilters}
                                                        style={{
                                                            background: 'var(--primary-color, #948924)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 14px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        Restablecer filtros
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ) : filteredAndSortedExpenses.map(item => {
                                    const isDuplicated = matchedConsumos && matchedConsumos.has(item.id);
                                    return (
                                    <tr key={item.id} style={{ opacity: isDuplicated ? 0.6 : 1 }}>
                                        <td>{item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy') : '---'}</td>
                                        <td>
                                            <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px'}}>
                                                {getIconForType(item.tipo)}
                                                {['SUELDO', 'RECIBO_SUELDO', 'CARGA_SOCIAL', 'TARJETA_CREDITO'].includes(item.tipo) ? (
                                                    getLabelForType(item.tipo)
                                                ) : (
                                                    <select
                                                        value={getEffectiveCategory(item)}
                                                        onChange={(e) => handleCategoryChange(item, e.target.value)}
                                                        style={{
                                                            padding: '4px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #ccc',
                                                            background: 'white',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <option value="FACTURA_SERVICIO">Servicio</option>
                                                        <option value="IMPUESTO">Impuesto</option>
                                                        <option value="OTRO">Otros Gastos</option>
                                                    </select>
                                                )}
                                                {item.tipo === 'CONSUMO_TARJETA' && (
                                                    <span style={{fontSize: '0.7rem', color: '#666', fontStyle: 'italic', display: 'block', width: '100%'}}>(Consumo Tarjeta)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{item.concepto} {item.manual && <span style={{fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px'}}>Manual</span>} {isDuplicated && <span style={{fontSize: '0.7rem', background: '#ff9800', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px'}}>Incluido en factura manual</span>}</td>
                                        <td>{item.vencimiento ? format(new Date(item.vencimiento), 'dd/MM/yyyy') : '---'}</td>
                                        <td className="total-cell" style={item.tipo === 'RECIBO_SUELDO' || isDuplicated ? { textDecoration: 'line-through', color: '#b0b0b0' } : {}}>
                                            {formatCurrency(item.monto)}
                                        </td>
                                        <td>
                                            {item.tipo !== 'SUELDO' ? (
                                                <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                                                    <button
                                                        onClick={() => toggleEstadoPago(item)}
                                                        style={{
                                                            backgroundColor: item.estado_pago === 'PAGADO' ? '#4caf50' : item.estado_pago === 'AUTODEBITO' ? '#9c27b0' : '#ff5252',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {item.estado_pago === 'PAGADO' ? 'PAGADO' : item.estado_pago === 'AUTODEBITO' ? 'AUTODÉBITO' : 'PENDIENTE'}
                                                    </button>
                                                    {(item.estado_pago !== 'PAGADO' && item.estado_pago !== 'AUTODEBITO') && (
                                                        <button
                                                            onClick={() => handlePagarGrupo(item)}
                                                            style={{
                                                                backgroundColor: '#009ee3', // MercadoPago Blue
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 'bold',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                            title="Pagar en MercadoPago (Agrupa todos los ítems de esta factura)"
                                                        >
                                                            PAGAR
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '0.8rem' }}>PAGADO</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.driveFolderId ? (
                                                <a href={`https://drive.google.com/drive/folders/${item.driveFolderId}`} target="_blank" rel="noopener noreferrer" style={{color: '#2196F3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                    <FaGoogleDrive /> Ver en Drive
                                                </a>
                                            ) : item.driveFileId ? (
                                                <a href={`https://drive.google.com/file/d/${item.driveFileId}/view`} target="_blank" rel="noopener noreferrer" style={{color: '#2196F3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                                    <FaGoogleDrive /> Ver en Drive
                                                </a>
                                            ) : <span style={{color: '#999'}}>Sin archivo</span>}
                                        </td>
                                        <td>
                                            {item.tipo !== 'SUELDO' && (
                                                <DeleteButton onClick={() => handleDelete(item.monthKey, item.id)} title="Eliminar registro">
                                                    <FaTrash />
                                                </DeleteButton>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                                {expensesData.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                                            Todavía no hay gastos registrados. Podés subir facturas y recibos arrastrándolos a la página, o cargar uno manual.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </TableContainer>
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h3>Nuevo Registro Manual</h3>
                <FormGrid>
                    <div className="full-width">
                        <label>Concepto / Empresa / Empleado</label>
                        <input type="text" name="concepto" value={formData.concepto} onChange={handleInputChange} placeholder="Ej. Edesur, Juan Perez, Sindicato..." />
                    </div>
                    <div>
                        <label>Monto</label>
                        <input type="number" name="monto" value={formData.monto} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Fecha de Pago</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Vencimiento (Opcional)</label>
                        <input type="date" name="vencimiento" value={formData.vencimiento} onChange={handleInputChange} />
                    </div>
                    <div className="full-width">
                        <label>Categoría</label>
                        <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                            <option value="FACTURA_SERVICIO">Factura de Servicio</option>
                            <option value="RECIBO_SUELDO">Recibo de Sueldo</option>
                            <option value="IMPUESTO">Impuesto</option>
                            <option value="CARGA_SOCIAL">Carga Social</option>
                            <option value="OTRO">Otro Gasto</option>
                        </select>
                    </div>
                </FormGrid>
                <ModalButtonContainer>
                    <ModalButton onClick={handleSubmit}>Guardar Manualmente</ModalButton>
                    <ModalButton onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#ccc' }}>Cancelar</ModalButton>
                </ModalButtonContainer>
            </Modal>
        </DashboardContainer>
    );
}

const DashboardContainer = styled.div`
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    font-family: 'product_sansregular';
    color: var(--primary-text);

    @media (max-width: 768px) {
        padding: 1rem 0.5rem;
    }
`;

const HeaderControls = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    
    @media (max-width: 768px) {
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    h2 {
        margin: 0;
        font-family: 'product_sansregular', sans-serif;
        color: var(--primary-text, #333);
        font-size: 1.6rem;
        font-weight: bold;
        text-transform: capitalize;
        min-width: 200px;
        text-align: center;

        @media (max-width: 768px) {
            min-width: 100%;
            order: -1;
            font-size: 1.4rem;
            margin-bottom: 0.5rem;
        }
    }

    button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'product_sansregular', sans-serif;
        font-weight: bold;
        transition: filter 0.2s;

        &:hover:not(:disabled) {
            filter: brightness(110%);
        }
    }
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const ChartCard = styled.div`
    background: var(--card-grey, #fff);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid var(--border-color, #eee);
    min-width: 0;

    h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #555;
        font-size: 1.1rem;
        border-bottom: 2px solid var(--border-color, #eee);
        padding-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
        padding: 1rem 0.75rem;
    }
`;

const TableContainer = styled.div`
    background: var(--card-grey, #fff);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid var(--border-color, #eee);
    overflow-x: auto;

    h3 {
        margin-top: 0;
        margin-bottom: 0;
        color: #555;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        
        th, td {
            padding: 0.85rem 0.65rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color, #eee);
        }

        th {
            background-color: rgba(0,0,0,0.02);
            font-weight: bold;
            color: #666;
            font-size: 0.85rem;
        }

        tr:hover {
            background-color: rgba(0,0,0,0.01);
        }

        .total-cell {
            font-weight: bold;
            color: var(--primary-color);
        }
    }
`;

const SortableTh = styled.th`
    background-color: ${props => props.$isSorted ? 'rgba(148, 137, 36, 0.08) !important' : 'rgba(0,0,0,0.02)'};
    font-weight: bold;
    color: ${props => props.$isSorted ? 'var(--primary-color, #948924) !important' : '#555'};
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background-color: rgba(148, 137, 36, 0.14) !important;
        color: var(--primary-color, #948924);
    }
`;

const FilterInput = styled.input`
    width: 100%;
    min-width: 80px;
    box-sizing: border-box;
    padding: 5px 7px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    font-size: 0.78rem;
    background: #fff;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
        border-color: var(--primary-color, #948924);
        box-shadow: 0 0 0 2px rgba(148, 137, 36, 0.2);
    }
`;

const FilterSelect = styled.select`
    width: 100%;
    min-width: 95px;
    box-sizing: border-box;
    padding: 5px 4px;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    font-size: 0.78rem;
    background: #fff;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
        border-color: var(--primary-color, #948924);
        box-shadow: 0 0 0 2px rgba(148, 137, 36, 0.2);
    }
`;

const BackButton = styled.button`
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'product_sansregular', sans-serif;
    font-weight: bold;
    transition: filter 0.2s;

    &:hover {
        filter: brightness(110%);
    }
`;

const AddButton = styled.button`
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
        filter: brightness(110%);
    }
`;

const DriveButton = styled.button`
    background-color: #fbbc04;
    color: #333;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
        filter: brightness(110%);
    }
`;

const DeleteButton = styled.button`
    background-color: transparent;
    color: #ff4d4d;
    border: 1px solid #ff4d4d;
    padding: 0.4rem 0.6rem;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background-color: #ff4d4d;
        color: white;
    }
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
    text-align: left;

    .full-width {
        grid-column: 1 / -1;
    }

    div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-weight: bold;
        color: #555;
        font-size: 0.9rem;
    }

    input, select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 1rem;
    }
`;
