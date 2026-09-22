import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLoading } from '../../contexts/LoadingContext';
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../firebase/firebase";
import { ComposedChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal, { ModalButton, ModalButtonContainer } from '../Modal';

import GestionVacaciones from './GestionVacaciones';
import ExpensesCard from './ExpensesCard';

export default function DashboardSueldos() {
    const [historyData, setHistoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [salariesData, setSalariesData] = useState([]);
    const [filteredSalariesData, setFilteredSalariesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState('Todos');

    const [employees, setEmployees] = useState([]);
    const [employeesMap, setEmployeesMap] = useState({}); // Map of employee name -> employee object
    const [activeTab, setActiveTab] = useState('sueldos');
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [timelineViewMode, setTimelineViewMode] = useState('daily');

    // Otros Modal State
    const [isOtrosModalOpen, setIsOtrosModalOpen] = useState(false);
    const [otrosDetails, setOtrosDetails] = useState([]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        empleado: '',
        horas_cantidad: '',
        horas_valor: '',
        visitas_cantidad: '',
        visitas_valor: '',
        limpieza_cantidad: '',
        limpieza_valor: '',
        otros_gastos: ''
    });

    useEffect(() => {
        const db = getDatabase(app);
        const historyRef = ref(db, 'sueldos_historial');

        const unsubscribe = onValue(historyRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const dataArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));

                // Sort by date descending
                dataArray.sort((a, b) => new Date(b.fecha_carga) - new Date(a.fecha_carga));

                setHistoryData(dataArray);
                setFilteredData(dataArray);

                // Extract unique employee names
                const uniqueEmployees = ['Todos', ...new Set(dataArray.map(item => item.empleado).filter(Boolean))];
                setEmployees(uniqueEmployees);
            } else {
                setHistoryData([]);
                setFilteredData([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Load employees with IDs for expenses tracking
    useEffect(() => {
        const db = getDatabase(app);
        const empleadosRef = ref(db, 'empleados');

        const unsubscribe = onValue(empleadosRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const employeesArray = Object.entries(data).map(([id, emp]) => ({
                    id,
                    nombreCompleto: emp.nombreCompleto,
                    nombreCorto: emp.nombreCorto
                }));

                // Build map of nombreCorto -> employee object
                const empMap = {};
                employeesArray.forEach(emp => {
                    empMap[emp.nombreCorto] = emp;
                });
                setEmployeesMap(empMap);

                // Update employees dropdown
                const uniqueEmployees = ['Todos', ...new Set(historyData.map(item => item.empleado).filter(Boolean))];
                setEmployees(uniqueEmployees);
            }
        });

        return () => unsubscribe();
    }, [historyData]);

    // Load salaries
    useEffect(() => {
        const db = getDatabase(app);
        const salariesRef = ref(db, 'employeeSalaries');
        const unsubscribe = onValue(salariesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let allSalaries = [];
                Object.keys(data).forEach(empId => {
                    const stubs = data[empId];
                    Object.keys(stubs).forEach(stubId => {
                        allSalaries.push({
                            employeeId: empId,
                            ...stubs[stubId]
                        });
                    });
                });
                allSalaries.sort((a, b) => b.createdAt - a.createdAt);
                setSalariesData(allSalaries);
            } else {
                setSalariesData([]);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedEmployee === 'Todos') {
            setFilteredData(historyData);
            setFilteredSalariesData(salariesData);
        } else {
            setFilteredData(historyData.filter(item => item.empleado === selectedEmployee));
            
            const empObj = employeesMap[selectedEmployee];
            if (empObj) {
                setFilteredSalariesData(salariesData.filter(item => item.employeeId === empObj.id));
            } else {
                setFilteredSalariesData([]);
            }
        }
    }, [selectedEmployee, historyData, salariesData, employeesMap]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const getPieData = () => {
        let totalHoras = 0;
        let totalVisitas = 0;
        let totalLimpieza = 0;
        let totalOtros = 0;

        filteredData.forEach(item => {
            if (item.detalles) {
                totalHoras += (parseFloat(item.detalles.horas_cantidad) || 0) * (parseFloat(item.detalles.horas_valor) || 0);
                totalVisitas += (parseFloat(item.detalles.visitas_cantidad) || 0) * (parseFloat(item.detalles.visitas_valor) || 0);
                totalLimpieza += (parseFloat(item.detalles.limpieza_cantidad) || 0) * (parseFloat(item.detalles.limpieza_valor) || 0);
                totalOtros += (parseFloat(item.detalles.otros_gastos) || 0);
            }
        });

        return [
            { name: 'Horas', value: totalHoras },
            { name: 'Visitas', value: totalVisitas },
            { name: 'Limpieza', value: totalLimpieza },
            { name: 'Otros', value: totalOtros },
        ].filter(item => item.value > 0);
    };

    
    // Extract unique available months from historyData
    const availableMonths = React.useMemo(() => {
        const set = new Set();
        try {
            set.add(format(new Date(), 'yyyy-MM'));
        } catch (e) {}

        historyData.forEach(item => {
            if (item.fecha_carga) {
                try {
                    const ym = format(new Date(item.fecha_carga), 'yyyy-MM');
                    set.add(ym);
                } catch (e) {}
            }
        });

        return Array.from(set).sort().reverse();
    }, [historyData]);

    const formatMonthOption = (monthStr) => {
        try {
            const [y, m] = monthStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, 1);
            const label = format(dateObj, 'MMMM yyyy', { locale: es });
            return label.charAt(0).toUpperCase() + label.slice(1);
        } catch (e) {
            return monthStr;
        }
    };

    // Calculate detailed timeline and cumulative salary for selectedMonth
    const timelineData = React.useMemo(() => {
        const targetRecords = filteredData.filter(item => {
            if (!item.fecha_carga) return false;
            try {
                return format(new Date(item.fecha_carga), 'yyyy-MM') === selectedMonth;
            } catch (e) {
                return false;
            }
        });

        if (targetRecords.length === 0) {
            return [];
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const now = new Date();
        const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;

        // Group records by day
        const dayMap = {};
        targetRecords.forEach(item => {
            try {
                const dateObj = new Date(item.fecha_carga);
                const dayNum = dateObj.getDate();
                if (!dayMap[dayNum]) {
                    dayMap[dayNum] = {
                        totalDia: 0,
                        detalles: []
                    };
                }
                const monto = parseFloat(item.total) || 0;
                dayMap[dayNum].totalDia += monto;
                dayMap[dayNum].detalles.push({
                    empleado: item.empleado || 'No especificado',
                    monto: monto,
                    fecha: item.fecha_carga,
                    detalles: item.detalles
                });
            } catch (e) {
                console.error("Error procesando fecha:", e);
            }
        });

        const recordedDays = Object.keys(dayMap).map(Number).sort((a, b) => a - b);
        const maxDayWithData = recordedDays.length > 0 ? Math.max(...recordedDays) : 1;
        const endDay = isCurrentMonth ? Math.min(daysInMonth, Math.max(now.getDate(), maxDayWithData)) : daysInMonth;

        const result = [];
        let runningAccumulated = 0;

        if (timelineViewMode === 'events') {
            recordedDays.forEach(dayNum => {
                const dayData = dayMap[dayNum];
                runningAccumulated += dayData.totalDia;
                const dateObj = new Date(year, month - 1, dayNum);
                result.push({
                    day: dayNum,
                    dateKey: format(dateObj, 'yyyy-MM-dd'),
                    displayDate: format(dateObj, 'dd/MM'),
                    labelFull: format(dateObj, "EEEE d 'de' MMMM", { locale: es }),
                    pagoDia: dayData.totalDia,
                    acumulado: runningAccumulated,
                    pagos: dayData.detalles
                });
            });
        } else {
            for (let d = 1; d <= endDay; d++) {
                const dayData = dayMap[d] || { totalDia: 0, detalles: [] };
                runningAccumulated += dayData.totalDia;
                const dateObj = new Date(year, month - 1, d);
                result.push({
                    day: d,
                    dateKey: format(dateObj, 'yyyy-MM-dd'),
                    displayDate: format(dateObj, 'dd/MM'),
                    labelFull: format(dateObj, "EEEE d 'de' MMMM", { locale: es }),
                    pagoDia: dayData.totalDia,
                    acumulado: runningAccumulated,
                    pagos: dayData.detalles
                });
            }
        }

        return result;
    }, [filteredData, selectedMonth, timelineViewMode]);

    // KPI stats for selected month
    const monthStats = React.useMemo(() => {
        const targetRecords = filteredData.filter(item => {
            if (!item.fecha_carga) return false;
            try {
                return format(new Date(item.fecha_carga), 'yyyy-MM') === selectedMonth;
            } catch (e) {
                return false;
            }
        });
        const total = targetRecords.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
        const count = targetRecords.length;
        const uniqueEmployees = new Set(targetRecords.map(r => r.empleado).filter(Boolean)).size;
        return { total, count, uniqueEmployees };
    }, [filteredData, selectedMonth]);

    const getEmployeeMonthlyData = () => {
        const employeeTotals = {};

        historyData.forEach(item => {
            if (!item.fecha_carga) return;
            try {
                if (format(new Date(item.fecha_carga), 'yyyy-MM') === selectedMonth) {
                    const empName = item.empleado || 'Desconocido';
                    if (!employeeTotals[empName]) {
                        employeeTotals[empName] = 0;
                    }
                    employeeTotals[empName] += parseFloat(item.total) || 0;
                }
            } catch (e) {}
        });

        return Object.keys(employeeTotals).map(emp => ({
            name: emp,
            total: employeeTotals[emp]
        })).sort((a, b) => b.total - a.total);
    };

    const getMonthlyData = () => {
        const monthlyTotals = {};
        [...filteredData].reverse().forEach(item => {
            if (!item.fecha_carga) return;
            const dateObj = new Date(item.fecha_carga);
            const monthKey = format(dateObj, 'MMM yy', { locale: es }); 
            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = 0;
            }
            monthlyTotals[monthKey] += parseFloat(item.total) || 0;
        });

        return Object.keys(monthlyTotals).map(key => ({
            month: key.charAt(0).toUpperCase() + key.slice(1),
            total: monthlyTotals[key]
        }));
    };

    // Format YAxis ticks compactly so long numbers never get cut off
    const formatYAxisTick = (value) => {
        if (value === 0) return '$0';
        const absVal = Math.abs(value);
        if (absVal >= 1000000) {
            const millions = value / 1000000;
            return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
        }
        if (absVal >= 1000) {
            return `$${Math.round(value / 1000)}k`;
        }
        return `$${value}`;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch (e) {
            return dateString;
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) {
            const db = getDatabase(app);
            const itemRef = ref(db, `sueldos_historial/${id}`);
            remove(itemRef)
                .then(() => {
                    // Success handling is automatic via onValue listener
                })
                .catch((error) => {
                    console.error("Error al eliminar el registro:", error);
                    alert("Error al eliminar el registro.");
                });
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditFormData({
            empleado: item.empleado || '',
            horas_cantidad: item.detalles?.horas_cantidad || 0,
            horas_valor: item.detalles?.horas_valor || 0,
            visitas_cantidad: item.detalles?.visitas_cantidad || 0,
            visitas_valor: item.detalles?.visitas_valor || 0,
            limpieza_cantidad: item.detalles?.limpieza_cantidad || 0,
            limpieza_valor: item.detalles?.limpieza_valor || 0,
            otros_gastos: item.detalles?.otros_gastos || 0
        });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = () => {
        const {
            empleado,
            horas_cantidad, horas_valor,
            visitas_cantidad, visitas_valor,
            limpieza_cantidad, limpieza_valor,
            otros_gastos
        } = editFormData;

        const total =
            (parseFloat(horas_cantidad) || 0) * (parseFloat(horas_valor) || 0) +
            (parseFloat(visitas_cantidad) || 0) * (parseFloat(visitas_valor) || 0) +
            (parseFloat(limpieza_cantidad) || 0) * (parseFloat(limpieza_valor) || 0) +
            (parseFloat(otros_gastos) || 0);

        const updates = {
            empleado: empleado,
            total: total,
            detalles: {
                horas_cantidad, horas_valor,
                visitas_cantidad, visitas_valor,
                limpieza_cantidad, limpieza_valor,
                otros_gastos
            }
        };

        const db = getDatabase(app);
        const itemRef = ref(db, `sueldos_historial/${editingId}`);

        update(itemRef, updates)
            .then(() => {
                setIsEditModalOpen(false);
                setEditingId(null);
            })
            .catch((error) => {
                console.error("Error al actualizar el registro:", error);
                alert("Error al actualizar el registro.");
            });
    };

    const getPaymentSubItems = (detalles) => {
        if (!detalles) return [];
        const items = [];

        const horasCant = parseFloat(detalles.horas_cantidad) || 0;
        const horasVal = parseFloat(detalles.horas_valor) || 0;
        if (horasCant > 0) {
            items.push({
                label: 'Horas',
                detail: `${horasCant} hs × ${formatCurrency(horasVal)}`,
                subtotal: horasCant * horasVal
            });
        }

        const visCant = parseFloat(detalles.visitas_cantidad) || 0;
        const visVal = parseFloat(detalles.visitas_valor) || 0;
        if (visCant > 0) {
            items.push({
                label: 'Visitas',
                detail: `${visCant} × ${formatCurrency(visVal)}`,
                subtotal: visCant * visVal
            });
        }

        const limpCant = parseFloat(detalles.limpieza_cantidad) || 0;
        const limpVal = parseFloat(detalles.limpieza_valor) || 0;
        if (limpCant > 0) {
            items.push({
                label: 'Limpiezas',
                detail: `${limpCant} × ${formatCurrency(limpVal)}`,
                subtotal: limpCant * limpVal
            });
        }

        const otros = parseFloat(detalles.otros_gastos) || 0;
        if (otros > 0) {
            if (detalles.otros_gastos_desc) {
                const monto1 = parseFloat(detalles.otros_gastos_monto) || otros;
                items.push({
                    label: 'Otros',
                    detail: detalles.otros_gastos_desc,
                    subtotal: monto1
                });
            }
            if (detalles.otros_gastos2_desc) {
                const monto2 = parseFloat(detalles.otros_gastos2_monto) || 0;
                items.push({
                    label: 'Otros',
                    detail: detalles.otros_gastos2_desc,
                    subtotal: monto2
                });
            }
            if (!detalles.otros_gastos_desc && !detalles.otros_gastos2_desc) {
                items.push({
                    label: 'Otros',
                    detail: 'Gastos varios',
                    subtotal: otros
                });
            }
        }

        return items;
    };

    const CustomTimelineTooltip = ({ active, payload }) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0].payload;
        return (
            <TimelineTooltipWrapper>
                <div className="tooltip-header">
                    <span className="tooltip-date">📅 {data.labelFull || data.displayDate}</span>
                </div>
                <div className="tooltip-body">
                    <div className="tooltip-row highlight">
                        <span>Acumulado del mes:</span>
                        <strong>{formatCurrency(data.acumulado)}</strong>
                    </div>
                    {data.pagoDia > 0 ? (
                        <>
                            <div className="tooltip-row payment-highlight">
                                <span>Pagado en esta fecha:</span>
                                <strong>+{formatCurrency(data.pagoDia)}</strong>
                            </div>
                            <div className="tooltip-details">
                                <div className="details-title">Desglose de pagos ({data.pagos?.length || 0}):</div>
                                {data.pagos?.map((p, idx) => {
                                    const subItems = getPaymentSubItems(p.detalles);
                                    return (
                                        <div key={idx} className="payment-card">
                                            <div className="payment-card-header">
                                                <span className="emp-tag">👤 {p.empleado}</span>
                                                <span className="emp-amount">{formatCurrency(p.monto)}</span>
                                            </div>
                                            {subItems.length > 0 ? (
                                                <div className="payment-subitems">
                                                    {subItems.map((item, i) => (
                                                        <div key={i} className="subitem-row">
                                                            <span className="subitem-name">• {item.label} <small>({item.detail})</small>:</span>
                                                            <span className="subitem-subtotal">{formatCurrency(item.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-subitems-note">Sin desglose cargado</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="tooltip-no-payment">Sin pagos registrados en esta fecha</div>
                    )}
                </div>
            </TimelineTooltipWrapper>
        );
    };

    const navigate = useNavigate();

    return (
        <DashboardContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <BackButton onClick={() => navigate(-1)}>← Volver</BackButton>
                <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Dashboard de Sueldos</h2>
                <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
            </div>

            <TabContainer>
                <TabButton
                    active={activeTab === 'sueldos'}
                    onClick={() => setActiveTab('sueldos')}
                >
                    Historial Sueldos
                </TabButton>
                <TabButton
                    active={activeTab === 'recibos'}
                    onClick={() => setActiveTab('recibos')}
                >
                    Recibos Oficiales
                </TabButton>
                <TabButton
                    active={activeTab === 'vacaciones'}
                    onClick={() => setActiveTab('vacaciones')}
                >
                    Gestión Vacaciones (CCT 130/75)
                </TabButton>
            </TabContainer>

            {activeTab === 'vacaciones' ? (
                <GestionVacaciones />
            ) : activeTab === 'recibos' ? (
                <>
                    <FilterSection>
                        <label>Filtrar por Empleado:</label>
                        <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                            {employees.map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </FilterSection>

                    {filteredSalariesData.length === 0 ? (
                        <p>No hay recibos registrados aún.</p>
                    ) : (
                        <TableContainer>
                            <h3>Recibos de Sueldo Oficiales</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha de Carga</th>
                                        <th>Empleado</th>
                                        <th>Período</th>
                                        <th>Sueldo Neto</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSalariesData.map((item) => {
                                        let empName = 'Desconocido';
                                        Object.values(employeesMap).forEach(emp => {
                                            if (emp.id === item.employeeId) empName = emp.nombreCompleto || emp.nombreCorto;
                                        });

                                        return (
                                            <tr key={item.id}>
                                                <td>{formatDate(item.createdAt)}</td>
                                                <td>{empName}</td>
                                                <td>{item.period || 'N/A'}</td>
                                                <td className="total-cell">{formatCurrency(item.netSalary)}</td>
                                                <td>
                                                    {item.driveFileLink && (
                                                        <a href={item.driveFileLink} target="_blank" rel="noopener noreferrer">
                                                            <EditButton style={{ backgroundColor: '#2196F3' }}>
                                                                Ver PDF
                                                            </EditButton>
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </TableContainer>
                    )}
                </>
            ) : (
                <>
                    {loading ? (
                        <p>Cargando datos...</p>
                    ) : filteredData.length === 0 ? (
                        <p>No hay datos registrados aún.</p>
                    ) : (
                        <>
                            <ChartsContainer>
                                <FeaturedChartCard>
                                    <FeaturedHeader>
                                        <div className="title-group">
                                            <h3>Evolución y Acumulado de Sueldos</h3>
                                            <span className="subtitle">
                                                Línea de tiempo diaria del período seleccionado {selectedEmployee !== 'Todos' ? `• Empleado: ${selectedEmployee}` : '• Todos los empleados'}
                                            </span>
                                        </div>
                                        <div className="controls-group">
                                            <div className="selector-item">
                                                <label>Empleado:</label>
                                                <select
                                                    value={selectedEmployee}
                                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                                >
                                                    {employees.map(emp => (
                                                        <option key={emp} value={emp}>{emp}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="selector-item">
                                                <label>Período:</label>
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                >
                                                    {availableMonths.map(m => (
                                                        <option key={m} value={m}>
                                                            {formatMonthOption(m)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="view-mode-toggle">
                                                <button
                                                    type="button"
                                                    className={timelineViewMode === 'daily' ? 'active' : ''}
                                                    onClick={() => setTimelineViewMode('daily')}
                                                >
                                                    Día a Día
                                                </button>
                                                <button
                                                    type="button"
                                                    className={timelineViewMode === 'events' ? 'active' : ''}
                                                    onClick={() => setTimelineViewMode('events')}
                                                >
                                                    Solo Pagos
                                                </button>
                                            </div>
                                        </div>
                                    </FeaturedHeader>

                                    <KpiGrid>
                                        <KpiCard>
                                            <span className="kpi-label">Total Acumulado del Mes</span>
                                            <span className="kpi-value">{formatCurrency(monthStats.total)}</span>
                                        </KpiCard>
                                        <KpiCard>
                                            <span className="kpi-label">Pagos Registrados</span>
                                            <span className="kpi-value">{monthStats.count} {monthStats.count === 1 ? 'pago' : 'pagos'}</span>
                                        </KpiCard>
                                        <KpiCard>
                                            <span className="kpi-label">Empleados Abonados</span>
                                            <span className="kpi-value">{monthStats.uniqueEmployees}</span>
                                        </KpiCard>
                                    </KpiGrid>

                                    {timelineData.length === 0 ? (
                                        <NoDataNotice>
                                            <p>No hay registros de sueldos para el período {formatMonthOption(selectedMonth)}.</p>
                                        </NoDataNotice>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={360}>
                                            <ComposedChart
                                                data={timelineData}
                                                margin={{ top: 20, right: 30, left: 25, bottom: 20 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                <XAxis
                                                    dataKey="displayDate"
                                                    tick={{ fontSize: 12, fill: '#666' }}
                                                    tickMargin={10}
                                                    interval={timelineViewMode === 'daily' && timelineData.length > 18 ? 2 : 0}
                                                />
                                                <YAxis
                                                    width={85}
                                                    tickFormatter={formatYAxisTick}
                                                    tick={{ fontSize: 12, fill: '#666' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <RechartsTooltip content={<CustomTimelineTooltip />} />
                                                <Legend verticalAlign="top" height={36} />
                                                <Bar
                                                    dataKey="pagoDia"
                                                    name="Pago del Día ($)"
                                                    fill="#34d399"
                                                    barSize={16}
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="acumulado"
                                                    name="Acumulado del Mes ($)"
                                                    stroke="#6366f1"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorAcumulado)"
                                                    dot={{ r: 3, fill: '#6366f1' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </FeaturedChartCard>

                                {selectedEmployee === 'Todos' ? (
                                    <ChartCard>
                                        <h3>Gastos por Empleado ({formatMonthOption(selectedMonth)})</h3>
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart
                                                data={getEmployeeMonthlyData()}
                                                margin={{ top: 20, right: 30, left: 25, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} />
                                                <YAxis
                                                    width={85}
                                                    tickFormatter={formatYAxisTick}
                                                    tick={{ fontSize: 12, fill: '#666' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                                <Legend />
                                                <Bar dataKey="total" fill="#8884d8" name="Total ($)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                ) : (
                                    <ChartCard>
                                        <h3>Total Abonado por Fecha</h3>
                                        <ResponsiveContainer width="100%" height={320}>
                                            <BarChart
                                                data={[...filteredData].reverse()}
                                                margin={{ top: 20, right: 30, left: 25, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                <XAxis
                                                    dataKey="fecha_carga"
                                                    tickFormatter={(tick) => {
                                                        try {
                                                            return format(new Date(tick), 'dd/MM');
                                                        } catch (e) {
                                                            return tick;
                                                        }
                                                    }}
                                                    tick={{ fontSize: 12, fill: '#666' }}
                                                />
                                                <YAxis
                                                    width={85}
                                                    tickFormatter={formatYAxisTick}
                                                    tick={{ fontSize: 12, fill: '#666' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <RechartsTooltip
                                                    formatter={(value) => formatCurrency(value)}
                                                    labelFormatter={(label) => formatDate(label)}
                                                />
                                                <Legend />
                                                <Bar dataKey="total" fill="#8884d8" name="Total ($)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                )}

                                <ChartCard>
                                    <h3>Estimado Mensual (Histórico)</h3>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={getMonthlyData()}
                                            margin={{ top: 20, right: 30, left: 25, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                                            <YAxis
                                                width={85}
                                                tickFormatter={formatYAxisTick}
                                                tick={{ fontSize: 12, fill: '#666' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend />
                                            <Bar dataKey="total" fill="#34d399" name="Total Mensual ($)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                <ChartCard style={{ gridColumn: '1 / -1' }}>
                                    <h3>Distribución de Costos</h3>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={getPieData()}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={true}
                                                label={({ name, percent, value }) => `${name}: ${(percent * 100).toFixed(0)}% (${formatCurrency(value)})`}
                                                outerRadius={105}
                                                innerRadius={55}
                                                paddingAngle={4}
                                                dataKey="value"
                                                onClick={(data) => {
                                                    if (data.name === 'Otros') {
                                                        const otrosList = [];
                                                        filteredData.forEach(item => {
                                                            if (item.detalles?.otros_gastos > 0) {
                                                                if (item.detalles.otros_gastos_desc) {
                                                                    otrosList.push({ fecha: item.fecha_carga, empleado: item.empleado, desc: item.detalles.otros_gastos_desc, monto: item.detalles.otros_gastos_monto || item.detalles.otros_gastos });
                                                                }
                                                                if (item.detalles.otros_gastos2_desc) {
                                                                    otrosList.push({ fecha: item.fecha_carga, empleado: item.empleado, desc: item.detalles.otros_gastos2_desc, monto: item.detalles.otros_gastos2_monto });
                                                                }
                                                                if (!item.detalles.otros_gastos_desc && !item.detalles.otros_gastos2_desc) {
                                                                    otrosList.push({ fecha: item.fecha_carga, empleado: item.empleado, desc: 'Gasto sin descripción', monto: item.detalles.otros_gastos });
                                                                }
                                                            }
                                                        });
                                                        setOtrosDetails(otrosList);
                                                        setIsOtrosModalOpen(true);
                                                    }
                                                }}
                                            >
                                                {getPieData().map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        style={{ cursor: entry.name === 'Otros' ? 'pointer' : 'default' }}
                                                    />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </ChartsContainer>

                            <TableContainer>
                                <h3>Historial Detallado</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Empleado</th>
                                            <th>Detalle</th>
                                            <th>Total</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((item) => (
                                            <tr key={item.id}>
                                                <td>{formatDate(item.fecha_carga)}</td>
                                                <td>{item.empleado || 'No especificado'}</td>
                                                <td>
                                                    <DetailList>
                                                        {item.detalles?.horas_cantidad > 0 && <li>Horas: {item.detalles.horas_cantidad} x ${item.detalles.horas_valor}</li>}
                                                        {item.detalles?.visitas_cantidad > 0 && <li>Visitas: {item.detalles.visitas_cantidad} x ${item.detalles.visitas_valor}</li>}
                                                        {item.detalles?.limpieza_cantidad > 0 && <li>Limpiezas: {item.detalles.limpieza_cantidad} x ${item.detalles.limpieza_valor}</li>}
                                                        {item.detalles?.otros_gastos > 0 && <li>Otros: ${item.detalles.otros_gastos}</li>}
                                                    </DetailList>
                                                </td>
                                                <td className="total-cell">{formatCurrency(item.total)}</td>
                                                <td>
                                                    <EditButton onClick={() => handleEdit(item)}>
                                                        Editar
                                                    </EditButton>
                                                    <DeleteButton onClick={() => handleDelete(item.id)}>
                                                        Eliminar
                                                    </DeleteButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TableContainer>

                            {/* Expenses Card - Only show for specific employee */}
                            {selectedEmployee !== 'Todos' && employeesMap[selectedEmployee] && (
                                <div style={{ marginTop: '2rem' }}>
                                    <ExpensesCard
                                        employeeId={employeesMap[selectedEmployee].id}
                                        employeeName={employeesMap[selectedEmployee].nombreCompleto}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <h3>Editar Registro</h3>
                <FormGrid>
                    <div className="full-width">
                        <label>Empleado</label>
                        <select
                            name="empleado"
                            value={editFormData.empleado}
                            onChange={handleEditFormChange}
                        >
                            <option value="">Seleccionar Empleado</option>
                            {employees.filter(e => e !== 'Todos').map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Horas Cant.</label>
                        <input
                            type="number"
                            name="horas_cantidad"
                            value={editFormData.horas_cantidad}
                            onChange={handleEditFormChange}
                        />
                    </div>
                    <div>
                        <label>Horas Valor</label>
                        <input
                            type="number"
                            name="horas_valor"
                            value={editFormData.horas_valor}
                            onChange={handleEditFormChange}
                        />
                    </div>

                    <div>
                        <label>Visitas Cant.</label>
                        <input
                            type="number"
                            name="visitas_cantidad"
                            value={editFormData.visitas_cantidad}
                            onChange={handleEditFormChange}
                        />
                    </div>
                    <div>
                        <label>Visitas Valor</label>
                        <input
                            type="number"
                            name="visitas_valor"
                            value={editFormData.visitas_valor}
                            onChange={handleEditFormChange}
                        />
                    </div>

                    <div>
                        <label>Limpieza Cant.</label>
                        <input
                            type="number"
                            name="limpieza_cantidad"
                            value={editFormData.limpieza_cantidad}
                            onChange={handleEditFormChange}
                        />
                    </div>
                    <div>
                        <label>Limpieza Valor</label>
                        <input
                            type="number"
                            name="limpieza_valor"
                            value={editFormData.limpieza_valor}
                            onChange={handleEditFormChange}
                        />
                    </div>

                    <div className="full-width">
                        <label>Otros Gastos ($)</label>
                        <input
                            type="number"
                            name="otros_gastos"
                            value={editFormData.otros_gastos}
                            onChange={handleEditFormChange}
                        />
                    </div>
                </FormGrid>
                <ModalButtonContainer>
                    <ModalButton onClick={handleSaveEdit}>Guardar Cambios</ModalButton>
                    <ModalButton onClick={() => setIsEditModalOpen(false)} style={{ backgroundColor: '#ccc' }}>Cancelar</ModalButton>
                </ModalButtonContainer>
            </Modal>

            {/* Otros Details Modal */}
            <Modal isOpen={isOtrosModalOpen} onClose={() => setIsOtrosModalOpen(false)}>
                <h3>Detalle de Otros Gastos</h3>
                {otrosDetails.length === 0 ? (
                    <p>No hay gastos registrados en "Otros".</p>
                ) : (
                    <TableContainer style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Empleado</th>
                                    <th>Descripción</th>
                                    <th>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otrosDetails.map((gasto, idx) => (
                                    <tr key={idx}>
                                        <td>{formatDate(gasto.fecha)}</td>
                                        <td>{gasto.empleado || 'No especificado'}</td>
                                        <td>{gasto.desc}</td>
                                        <td className="total-cell">{formatCurrency(gasto.monto)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableContainer>
                )}
                <ModalButtonContainer>
                    <ModalButton onClick={() => setIsOtrosModalOpen(false)} style={{ backgroundColor: '#ccc', width: '100%' }}>Cerrar</ModalButton>
                </ModalButtonContainer>
            </Modal>
        </DashboardContainer>
    );
}

const DashboardContainer = styled.div`
    padding: 2rem 1.5rem;
    max-width: 1550px;
    width: 96%;
    margin: 0 auto;
    font-family: 'product_sansregular';
    color: var(--primary-text);

    h2 {
        text-align: center;
        margin-bottom: 2rem;
        color: var(--primary-color);
    }
`;

const TabContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 1rem;
`;

const TabButton = styled.button`
    padding: 0.8rem 2rem;
    border: none;
    background: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
    color: ${props => props.active ? 'white' : '#666'};
    font-weight: bold;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;

    &:hover {
        background: ${props => props.active ? 'var(--primary-color)' : '#f0f0f0'};
    }
`;

const FilterSection = styled.div`
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;

    select {
        padding: 0.6rem 1rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        font-size: 1rem;
        min-width: 220px;
        background: white;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        &:focus {
            outline: none;
            border-color: var(--primary-color);
        }
    }
`;

const ChartsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
    margin-bottom: 3rem;

    @media (max-width: 992px) {
        grid-template-columns: 1fr;
    }
`;

const FeaturedChartCard = styled.div`
    grid-column: 1 / -1;
    background: white;
    padding: 1.8rem;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef0f3;
`;

const FeaturedHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f2f5;

    .title-group {
        h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1.25rem;
            color: #2d3748;
            font-weight: 700;
        }
        .subtitle {
            font-size: 0.88rem;
            color: #718096;
        }
    }

    .controls-group {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .selector-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #4a5568;
        }

        select {
            padding: 0.45rem 0.8rem;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: white;
            font-size: 0.92rem;
            color: #334155;
            cursor: pointer;
            outline: none;
            transition: border-color 0.2s;

            &:focus {
                border-color: var(--primary-color);
            }
        }
    }

    .view-mode-toggle {
        display: flex;
        background: #f1f5f9;
        padding: 3px;
        border-radius: 8px;

        button {
            border: none;
            background: transparent;
            padding: 0.4rem 0.85rem;
            font-size: 0.82rem;
            border-radius: 6px;
            cursor: pointer;
            color: #64748b;
            font-weight: 600;
            transition: all 0.2s;

            &.active {
                background: white;
                color: var(--primary-color);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
        }
    }
`;

const KpiGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
`;

const KpiCard = styled.div`
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.85rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .kpi-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        font-weight: 600;
    }

    .kpi-value {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1e293b;
    }
`;

const NoDataNotice = styled.div`
    padding: 3.5rem 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 1rem;
    font-style: italic;
`;

const TimelineTooltipWrapper = styled.div`
    background: white;
    border-radius: 12px;
    padding: 1.1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
    border: 1px solid #e2e8f0;
    min-width: 290px;
    max-width: 380px;
    font-size: 0.9rem;
    pointer-events: none;

    .tooltip-header {
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 0.5rem;
        margin-bottom: 0.6rem;

        .tooltip-date {
            font-weight: 700;
            color: #1e293b;
            text-transform: capitalize;
            font-size: 0.95rem;
        }
    }

    .tooltip-body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .tooltip-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            &.highlight {
                color: #4f46e5;
                font-size: 0.95rem;
                strong {
                    font-size: 1.08rem;
                }
            }

            &.payment-highlight {
                color: #059669;
                font-weight: 600;
            }
        }

        .tooltip-details {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px dashed #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .details-title {
                font-size: 0.8rem;
                color: #64748b;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .payment-card {
                background: #f8fafc;
                border-radius: 8px;
                padding: 0.55rem 0.75rem;
                border: 1px solid #e2e8f0;

                .payment-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.3rem;

                    .emp-tag {
                        color: #1e293b;
                        font-weight: 600;
                        font-size: 0.88rem;
                    }
                    .emp-amount {
                        font-weight: 700;
                        color: #059669;
                        font-size: 0.9rem;
                    }
                }

                .payment-subitems {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                    padding-top: 0.35rem;
                    border-top: 1px dashed #e2e8f0;

                    .subitem-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.8rem;
                        color: #475569;

                        .subitem-name {
                            color: #475569;
                            small {
                                color: #64748b;
                                font-size: 0.75rem;
                            }
                        }

                        .subitem-subtotal {
                            font-weight: 600;
                            color: #1e293b;
                            margin-left: 0.5rem;
                        }
                    }
                }

                .no-subitems-note {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-style: italic;
                    margin-top: 0.2rem;
                }
            }
        }

        .tooltip-no-payment {
            color: #94a3b8;
            font-style: italic;
            font-size: 0.82rem;
            padding: 0.2rem 0;
        }
    }
`;

const ChartCard = styled.div`
    background: white;
    padding: 1.5rem;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #eef0f3;

    h3 {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.15rem;
        color: #333;
        font-weight: 600;
    }
`;

const TableContainer = styled.div`
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    overflow-x: auto;

    h3 {
        margin-bottom: 1rem;
        color: #555;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        min-width: 600px;

        th, td {
            text-align: left;
            padding: 1rem;
            border-bottom: 1px solid #eee;
        }

        th {
            background-color: var(--primary-color);
            color: white;
            font-weight: normal;
        }

        tr:hover {
            background-color: #f9f9f9;
        }

        .total-cell {
            font-weight: bold;
            color: var(--primary-color);
        }
    }
`;
const BackButton = styled.button`
    background: transparent;
    border: 1px solid #ccc;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;

    &:hover {
        background: #f0f0f0;
        color: #333;
    }
`;

const DetailList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.9rem;
    color: #666;

    li {
        margin-bottom: 0.2rem;
    }
`;

const DeleteButton = styled.button`
    background-color: #ff4d4d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;

    &:hover {
        background-color: #ff0000;
    }
`;

const EditButton = styled.button`
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-right: 0.5rem;
    transition: filter 0.2s;

    &:hover {
        filter: brightness(110%);
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
