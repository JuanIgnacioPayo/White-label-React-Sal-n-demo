import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import { app } from "../../firebase/firebase";
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const generarUltimos6Meses = () => {
    const meses = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const yStr = String(d.getFullYear());
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        meses.push({
            key: `${yStr}-${mStr}`,
            year: d.getFullYear(),
            month: mStr,
            label: `${NOMBRES_MESES[d.getMonth()]} ${yStr.slice(-2)}`,
            maria: 0,
            juan: 0
        });
    }
    return meses;
};

const esUltimos12Meses = (snapYear, snapMonth) => {
    const hoy = new Date();
    const snapDate = new Date(parseInt(snapYear), parseInt(snapMonth) - 1, 1);
    const limite12m = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    return snapDate >= limite12m && snapDate <= hoy;
};

export default function DashboardMonotributo() {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        limiteAnualMonotributo: 0,
        puntoVenta: 1,
        limiteAnualMonotributoJuan: 0,
        puntoVentaJuan: 5,
        automatizacionActivada: false,
        automatizacionActivadaJuan: false,
        limiteConsumidorFinal: 191000
    });
    
    const [facturadoMaria, setFacturadoMaria] = useState(0);
    const [facturadoJuan, setFacturadoJuan] = useState(0);
    
    const [unbilledMaria, setUnbilledMaria] = useState([]);
    const [unbilledJuan, setUnbilledJuan] = useState([]);
    
    const [billedMaria, setBilledMaria] = useState([]);
    const [billedJuan, setBilledJuan] = useState([]);
    
    const [historyData, setHistoryData] = useState([]);
    const [totalMaria12m, setTotalMaria12m] = useState(0);
    const [totalJuan12m, setTotalJuan12m] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showInfoMaria, setShowInfoMaria] = useState(false);
    const [showInfoJuan, setShowInfoJuan] = useState(false);

    useEffect(() => {
        const db = getDatabase(app);
        
        // 1. Cargar Configuración
        const configRef = ref(db, 'config/afip');
        const unsubConfig = onValue(configRef, (snapshot) => {
            if (snapshot.exists()) {
                setConfig({
                    limiteAnualMonotributo: snapshot.val().limiteAnualMonotributo || 0,
                    puntoVenta: snapshot.val().puntoVenta || 1,
                    limiteAnualMonotributoJuan: snapshot.val().limiteAnualMonotributoJuan || 0,
                    puntoVentaJuan: snapshot.val().puntoVentaJuan || 5,
                    automatizacionActivada: snapshot.val().automatizacionActivada || false,
                    automatizacionActivadaJuan: snapshot.val().automatizacionActivadaJuan || false,
                    limiteConsumidorFinal: snapshot.val().limiteConsumidorFinal || 191000
                });
            }
        });

        // 2. Calcular Facturado del Mes Actual y buscar no facturados
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        
        let prevMonthDate = new Date(hoy);
        prevMonthDate.setMonth(hoy.getMonth() - 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

        const presRef = ref(db, `presupuestos/${year}`);
        const prevPresRef = ref(db, `presupuestos/${prevYear}`);

        const processSnapshots = (snap1, snap2) => {
            let totalMaria = 0;
            let totalJuan = 0;
            let unbMaria = [];
            let unbJuan = [];
            let bMaria = [];
            let bJuan = [];
            const ultimosMeses = generarUltimos6Meses();
            let totalMaria12mAccum = 0;
            let totalJuan12mAccum = 0;
            
            const extractData = (snapshot) => {
                if (snapshot.exists()) {
                    const meses = snapshot.val();
                    const snapYear = snapshot.ref.key;
                    Object.entries(meses).forEach(([snapMonth, dias]) => {
                        Object.entries(dias).forEach(([day, dia]) => {
                            Object.entries(dia).forEach(([presupuestoId, presupuesto]) => {
                                if (presupuesto.facturado && presupuesto.facturaAFIP) {
                                    let totalMonto = 0;
                                    let isJuan = false;
                                    
                                    presupuesto.facturaAFIP.forEach(fact => {
                                        totalMonto += (fact.monto || 0);
                                    });

                                    if (String(presupuesto.cuitEmisor) === '20325938081' || String(presupuesto.cuitEmisor) === '20-32593808-1') {
                                        isJuan = true;
                                    }

                                    // Sumar al total del mes SÓLO si es del mes actual
                                    if (snapYear == year && snapMonth === month) {
                                        if (isJuan) {
                                            totalJuan += totalMonto;
                                        } else {
                                            totalMaria += totalMonto;
                                        }
                                    }

                                    // Sumar al historial de los últimos 6 meses
                                    const key = `${snapYear}-${snapMonth}`;
                                    const mesEncontrado = ultimosMeses.find(m => m.key === key);
                                    if (mesEncontrado) {
                                        if (isJuan) {
                                            mesEncontrado.juan += totalMonto;
                                        } else {
                                            mesEncontrado.maria += totalMonto;
                                        }
                                    }

                                    // Sumar al total de los últimos 12 meses móviles
                                    if (esUltimos12Meses(snapYear, snapMonth)) {
                                        if (isJuan) {
                                            totalJuan12mAccum += totalMonto;
                                        } else {
                                            totalMaria12mAccum += totalMonto;
                                        }
                                    }
                                    
                                    const evt = {
                                        id: presupuestoId,
                                        fecha: presupuesto.selectedDate,
                                        fechaFacturacion: presupuesto.fechaFacturacion,
                                        cliente: presupuesto.formData?.nombreCliente || 'Sin Nombre',
                                        razonSocial: presupuesto.formData?.razonSocial || (presupuesto.facturaAFIP && presupuesto.facturaAFIP.length > 0 ? presupuesto.facturaAFIP[0].razonSocialArca : '') || '',
                                        cuit: presupuesto.formData?.cuit || '',
                                        total: totalMonto,
                                        facturas: presupuesto.facturaAFIP,
                                        timestamp: presupuesto.fechaFacturacion 
                                                 ? new Date(presupuesto.fechaFacturacion).getTime() 
                                                 : (presupuesto.selectedDate ? new Date(presupuesto.selectedDate).getTime() : 0)
                                    };

                                    if (isJuan) bJuan.push(evt);
                                    else bMaria.push(evt);

                                } else if (!presupuesto.facturado && presupuesto.selectedDate) {
                                    // Evento no facturado
                                    const eventDate = new Date(presupuesto.selectedDate);
                                    const isEmpresa = !!presupuesto.formData?.cuit;
                                    // Si ya pasó o es hoy, o si es empresa (mostrar a futuro)
                                    if (eventDate <= hoy || isEmpresa) {
                                        const evt = {
                                            id: presupuestoId,
                                            fecha: presupuesto.selectedDate,
                                            cliente: presupuesto.formData?.nombreCliente || 'Sin Nombre',
                                        razonSocial: presupuesto.formData?.razonSocial || '',
                                        cuit: presupuesto.formData?.cuit || '',
                                            total: presupuesto.totalFinal || 0,
                                            isEmpresa: isEmpresa,
                                            dbPath: `presupuestos/${snapYear}/${snapMonth}/${day}/${presupuestoId}`
                                        };
                                        
                                        if (evt.isEmpresa) {
                                            unbJuan.push(evt);
                                        } else {
                                            unbMaria.push(evt);
                                        }
                                    }
                                }
                            });
                        });
                    });
                }
            };

            extractData(snap1);
            if (snap1.ref.key !== snap2.ref.key) {
                extractData(snap2);
            }

            const sorter = (a, b) => new Date(b.fecha) - new Date(a.fecha);
            unbMaria.sort(sorter);
            unbJuan.sort(sorter);

            const sorterTime = (a, b) => b.timestamp - a.timestamp;
            bMaria.sort(sorterTime);
            bJuan.sort(sorterTime);
            
            setFacturadoMaria(totalMaria);
            setFacturadoJuan(totalJuan);
            setUnbilledMaria(unbMaria);
            setUnbilledJuan(unbJuan);
            setBilledMaria(bMaria.slice(0, 5));
            setBilledJuan(bJuan.slice(0, 5));
            setHistoryData(ultimosMeses);
            setTotalMaria12m(totalMaria12mAccum);
            setTotalJuan12m(totalJuan12mAccum);
            setLoading(false);
        };

        let snap1 = null;
        let snap2 = null;

        const unsubPres = onValue(presRef, (snapshot) => {
            snap1 = snapshot;
            if (snap2 !== null) processSnapshots(snap1, snap2);
        });

        const unsubPrevPres = onValue(prevPresRef, (snapshot) => {
            snap2 = snapshot;
            if (snap1 !== null) processSnapshots(snap1, snap2);
        });

        return () => {
            unsubConfig();
            unsubPres();
            unsubPrevPres();
        };
    }, []);

    const handleSaveConfig = () => {
        const db = getDatabase(app);
        const configRef = ref(db, 'config/afip');
        update(configRef, {
            limiteAnualMonotributo: parseFloat(config.limiteAnualMonotributo || 0),
            puntoVenta: parseInt(config.puntoVenta || 1, 10),
            limiteAnualMonotributoJuan: parseFloat(config.limiteAnualMonotributoJuan || 0),
            puntoVentaJuan: parseInt(config.puntoVentaJuan || 5, 10),
            automatizacionActivada: config.automatizacionActivada,
            automatizacionActivadaJuan: config.automatizacionActivadaJuan,
            limiteConsumidorFinal: parseFloat(config.limiteConsumidorFinal || 191000)
        }).then(() => {
            setIsEditing(false);
            alert("Configuración de AFIP guardada.");
        }).catch(err => alert("Error: " + err.message));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const renderCard = (title, subtitle, facturado, limiteAnual, unbilled, billed, colorPrimary) => {
        const limiteMensual = (limiteAnual || 0) / 12;
        const porcentaje = limiteMensual > 0 ? (facturado / limiteMensual) * 100 : 0;
        
        let barColor = colorPrimary || '#4caf50';
        if (porcentaje > 75) barColor = '#ff9800'; 
        if (porcentaje > 90) barColor = '#f44336'; 

        return (
            <EntityCard>
                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{title}</h4>
                <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#7f8c8d' }}>{subtitle}</p>

                <ThermometerSection>
                    <Stats>
                        <div>
                            <small>Facturado ({format(new Date(), 'MMMM yyyy')})</small>
                            <h4 style={{ color: barColor }}>{formatCurrency(facturado)}</h4>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <small>Límite Mensual Sugerido</small>
                            <h4>{formatCurrency(limiteMensual)}</h4>
                        </div>
                    </Stats>
                    <ProgressBarContainer>
                        <ProgressBarFill width={`${Math.min(porcentaje, 100)}%`} color={barColor} />
                    </ProgressBarContainer>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.85rem'}}>
                        <span>0%</span>
                        <span>{porcentaje.toFixed(1)}% consumido</span>
                        <span>100%</span>
                    </div>
                </ThermometerSection>

                {porcentaje > 95 && config.automatizacionActivada && (
                    <AlertBox>
                        ⚠️ Límite crítico alcanzado (95%+). Revisa tu categoría inmediatamente.
                    </AlertBox>
                )}

                <BilledSection>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colorPrimary}33`, paddingBottom: '5px', marginBottom: '10px', gap: '8px' }}>
                        <h5 style={{ color: colorPrimary, margin: 0, fontSize: '0.95rem' }}>
                            Últimas 5 facturaciones
                        </h5>
                        <Link to="/admin?panel=listado_facturas" style={{ textDecoration: 'none', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.8rem', color: colorPrimary, border: `1px solid ${colorPrimary}`, borderRadius: '4px', padding: '2px 8px', fontWeight: 'bold', display: 'inline-block' }}>
                                Ver más
                            </span>
                        </Link>
                    </div>
                    {billed.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>No hay facturaciones recientes.</p>
                    ) : (
                        <UnbilledList>
                            {billed.map(ev => (
                                <UnbilledItem 
                                    key={ev.id} 
                                    style={{borderLeftColor: colorPrimary, alignItems: 'flex-start', cursor: 'pointer'}}
                                    onClick={() => navigate(`/presupuesto/editar/${ev.id}`)}
                                >
                                    <div style={{flex: '1 1 130px', minWidth: 0, wordBreak: 'break-word'}}>
                                        <strong>{ev.cliente} {(ev.razonSocial || ev.cuit) && <span style={{color: '#2e7d32', fontSize: '0.85em'}}>({ev.razonSocial || ev.cuit})</span>} - {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR') : ''}</strong>
                                        <br/>
                                        <span style={{color: '#555', fontWeight: '500'}}>{formatCurrency(ev.total)}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flex: '0 0 auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {ev.facturas.map((fac, i) => (
                                                <button 
                                                    key={i} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/presupuesto/editar/${ev.id}?imprimirFactura=${i}`);
                                                    }}
                                                    style={{ background: 'none', border: 'none', padding: 0 }}
                                                >
                                                    <FacturarBtnSmall title={`Factura ${fac.puntoVenta}-${fac.comprobante}`}>
                                                        {ev.facturas.length > 1 ? `Factura ${i+1}` : 'Ver Factura'}
                                                    </FacturarBtnSmall>
                                                </button>
                                            ))}
                                        </div>
                                        {ev.fechaFacturacion && (
                                            <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                                Emitido: {new Date(ev.fechaFacturacion).toLocaleDateString('es-AR')}
                                            </span>
                                        )}
                                    </div>
                                </UnbilledItem>
                            ))}
                        </UnbilledList>
                    )}
                </BilledSection>

                <UnbilledSection>
                    <h5 style={{ color: colorPrimary, borderBottom: `1px solid ${colorPrimary}33`, paddingBottom: '5px', margin: '0 0 10px 0' }}>
                        Eventos Pendientes ({unbilled.length})
                    </h5>
                    {unbilled.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                            <strong style={{color: '#4caf50'}}>¡Todo al día!</strong> No hay eventos pendientes de facturar este mes.
                        </p>
                    ) : (
                        <UnbilledList>
                            {unbilled.map(ev => (
                                <UnbilledItem 
                                    key={ev.id} 
                                    style={{borderLeftColor: colorPrimary, cursor: 'pointer'}}
                                    onClick={() => navigate(`/presupuesto/editar/${ev.id}`)}
                                >
                                    <div style={{flex: '1 1 130px', minWidth: 0, wordBreak: 'break-word'}}>
                                        <strong>{ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-AR') : ''} - {ev.cliente} {(ev.razonSocial || ev.cuit) && <span style={{color: '#2e7d32', fontSize: '0.85em'}}>({ev.razonSocial || ev.cuit})</span>}</strong>
                                        <br/>
                                        <span style={{color: '#555', fontWeight: '500'}}>{formatCurrency(ev.total)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '0 0 auto' }}>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/presupuesto/editar/${ev.id}?facturar=true`);
                                            }}
                                            style={{ background: 'none', border: 'none', padding: 0 }}
                                        >
                                            <FacturarBtnSmall>Ver / Facturar</FacturarBtnSmall>
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarcarFacturado(ev.dbPath, ev.cliente);
                                            }}
                                            style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
                                            title="Marcar como facturado manualmente"
                                        >✓</button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePresupuesto(ev.dbPath, ev.cliente);
                                            }}
                                            style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
                                            title="Eliminar presupuesto"
                                        >✕</button>
                                    </div>
                                </UnbilledItem>
                            ))}
                        </UnbilledList>
                    )}
                </UnbilledSection>
            </EntityCard>
        );
    };

    const handleMarcarFacturado = async (dbPath, clienteName) => {
        if (!window.confirm(`¿Estás seguro de que deseas ocultar el presupuesto de "${clienteName}" marcándolo como facturado manualmente?\nDesaparecerá de esta lista pero seguirá guardado en el sistema.`)) return;
        const db = getDatabase(app);
        const presRef = ref(db, dbPath);
        try {
            await update(presRef, { facturado: true, manualOverride: true });
        } catch (error) {
            alert("Error al actualizar: " + error.message);
        }
    };

    const handleDeletePresupuesto = async (dbPath, clienteName) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el presupuesto de "${clienteName}"?\nEsta acción no se puede deshacer.`)) return;
        const db = getDatabase(app);
        const presRef = ref(db, dbPath);
        try {
            await remove(presRef);
        } catch (error) {
            alert("Error al eliminar: " + error.message);
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const limiteMaria = (config.limiteAnualMonotributo || 0) / 12;
            const limiteJuan = (config.limiteAnualMonotributoJuan || 0) / 12;
            
            const pctMaria = limiteMaria > 0 ? (data.maria / limiteMaria) * 100 : 0;
            const pctJuan = limiteJuan > 0 ? (data.juan / limiteJuan) * 100 : 0;

            return (
                <TooltipContainer>
                    <TooltipLabel>{data.label}</TooltipLabel>
                    <TooltipItem color="#4caf50">
                        <strong>María Luisa:</strong> {formatCurrency(data.maria)}
                        <br/>
                        <small>Límite: {formatCurrency(limiteMaria)} ({pctMaria.toFixed(1)}%)</small>
                    </TooltipItem>
                    <TooltipItem color="#2196f3">
                        <strong>Juan Ignacio:</strong> {formatCurrency(data.juan)}
                        <br/>
                        <small>Límite: {formatCurrency(limiteJuan)} ({pctJuan.toFixed(1)}%)</small>
                    </TooltipItem>
                </TooltipContainer>
            );
        }
        return null;
    };

    if (loading) return <p>Cargando AFIP...</p>;

    return (
        <Container>
            <Header>
                <h3>Métricas de Facturación AFIP</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/admin?panel=listado_facturas" style={{ textDecoration: 'none' }}>
                        <EditBtn as="div" style={{ background: '#4caf50', borderColor: '#4caf50', color: '#fff' }}>
                            Ver Historial de Facturas
                        </EditBtn>
                    </Link>
                    <EditBtn onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? "Cancelar" : "Configurar Límites y Puntos de Venta"}
                    </EditBtn>
                </div>
            </Header>

            {isEditing ? (
                <ConfigForm>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <FormCol>
                            <h4 style={{margin: '0 0 10px 0', color: '#1976d2'}}>María Luisa (Consumidor Final)</h4>
                            <FormRow>
                                <label>Límite Anual Monotributo (ARS):</label>
                                <input 
                                    type="number" 
                                    value={config.limiteAnualMonotributo}
                                    onChange={e => setConfig({...config, limiteAnualMonotributo: e.target.value})}
                                />
                            </FormRow>
                            <FormRow>
                                <label>Punto de Venta WSFE:</label>
                                <input 
                                    type="number" 
                                    value={config.puntoVenta}
                                    onChange={e => setConfig({...config, puntoVenta: e.target.value})}
                                />
                            </FormRow>
                        </FormCol>

                        <FormCol>
                            <h4 style={{margin: '0 0 10px 0', color: '#1976d2'}}>Juan Ignacio (Empresas)</h4>
                            <FormRow>
                                <label>Límite Anual Monotributo (ARS):</label>
                                <input 
                                    type="number" 
                                    value={config.limiteAnualMonotributoJuan}
                                    onChange={e => setConfig({...config, limiteAnualMonotributoJuan: e.target.value})}
                                />
                            </FormRow>
                            <FormRow>
                                <label>Punto de Venta WSFE:</label>
                                <input 
                                    type="number" 
                                    value={config.puntoVentaJuan}
                                    onChange={e => setConfig({...config, puntoVentaJuan: e.target.value})}
                                />
                            </FormRow>
                        </FormCol>
                    </div>

                    <hr style={{width: '100%', border: 'none', borderTop: '1px solid #ddd', margin: '15px 0'}} />

                    <div style={{ marginBottom: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <a href="https://www.afip.gob.ar/monotributo/categorias.asp" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
                            🔗 Ver valores actualizados
                        </a>
                        <a href="https://www.afip.gob.ar/monotributo/" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>
                            🔗 Consultar mi categoría actual
                        </a>
                    </div>

                    <FormRow>
                        <label>Límite Factura Consumidor Final s/Identificar (ARS):</label>
                        <input 
                            type="number" 
                            style={{maxWidth: '300px'}}
                            value={config.limiteConsumidorFinal}
                            onChange={e => setConfig({...config, limiteConsumidorFinal: e.target.value})}
                        />
                    </FormRow>
                    
                    <FormRow style={{ flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="checkbox" 
                                checked={config.automatizacionActivada}
                                onChange={e => setConfig({...config, automatizacionActivada: e.target.checked})}
                            />
                            <label style={{margin: 0, flex: 1}}>Facturación automática María Luisa (Consumidor Final)</label>
                            <button 
                                type="button"
                                onClick={() => setShowInfoMaria(prev => !prev)}
                                style={{ 
                                    background: showInfoMaria ? '#1976d2' : '#e3f2fd', 
                                    color: showInfoMaria ? 'white' : '#1976d2',
                                    border: '1px solid #1976d2', 
                                    borderRadius: '50%', 
                                    width: '26px', height: '26px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                title="Más información"
                            >ℹ</button>
                        </div>
                        {showInfoMaria && (
                            <div style={{ 
                                background: '#e3f2fd', 
                                borderRadius: '8px', 
                                padding: '12px 16px', 
                                fontSize: '0.85rem', 
                                color: '#1565c0',
                                lineHeight: '1.5',
                                borderLeft: '4px solid #1976d2'
                            }}>
                                <strong>⏰ Se ejecuta todos los días a las 10:00 AM (hora Argentina)</strong><br/>
                                📅 Factura automáticamente los eventos <strong>del día</strong> que <strong>no tengan CUIT cargado</strong><br/>
                                💰 Si el monto supera el tope de Consumidor Final sin identificar, se fracciona en varias facturas<br/>
                                🛑 Si facturar excedería tu límite mensual de monotributo, se pausa y te avisa con una alerta<br/>
                                📝 Usa el Punto de Venta {config.puntoVenta} y el CUIT de María Luisa (23-05695195-4)
                            </div>
                        )}
                    </FormRow>
                    <FormRow style={{ flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="checkbox" 
                                checked={config.automatizacionActivadaJuan}
                                onChange={e => setConfig({...config, automatizacionActivadaJuan: e.target.checked})}
                            />
                            <label style={{margin: 0, flex: 1}}>Facturación automática Juan Ignacio (Empresas)</label>
                            <button 
                                type="button"
                                onClick={() => setShowInfoJuan(prev => !prev)}
                                style={{ 
                                    background: showInfoJuan ? '#1976d2' : '#e3f2fd', 
                                    color: showInfoJuan ? 'white' : '#1976d2',
                                    border: '1px solid #1976d2', 
                                    borderRadius: '50%', 
                                    width: '26px', height: '26px', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold', 
                                    fontSize: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                title="Más información"
                            >ℹ</button>
                        </div>
                        {showInfoJuan && (
                            <div style={{ 
                                background: '#fff3e0', 
                                borderRadius: '8px', 
                                padding: '12px 16px', 
                                fontSize: '0.85rem', 
                                color: '#e65100',
                                lineHeight: '1.5',
                                borderLeft: '4px solid #ff9800'
                            }}>
                                <strong>⏰ Se ejecuta todos los días a las 10:00 AM (hora Argentina)</strong><br/>
                                📅 Factura automáticamente los eventos <strong>del día</strong> que <strong>tengan CUIT cargado</strong> (empresas) y se reparten equitativamente los eventos sin CUIT.<br/>
                                🏢 Genera Factura B dirigida al CUIT del cliente registrado en el presupuesto<br/>
                                🛑 Si facturar excedería tu límite mensual de monotributo, se pausa y te avisa con una alerta<br/>
                                📝 Usa el Punto de Venta {config.puntoVentaJuan} y el CUIT de Juan Ignacio (20-32593808-1)
                            </div>
                        )}
                    </FormRow>

                    <SaveBtn onClick={handleSaveConfig} style={{maxWidth: '250px'}}>Guardar Configuración</SaveBtn>
                </ConfigForm>
            ) : (
                <CardsContainer>
                    {renderCard(
                        "María Luisa (23-05695195-4)", 
                        "Facturas a Consumidores Finales (Punto de Venta " + config.puntoVenta + ")",
                        facturadoMaria, 
                        config.limiteAnualMonotributo, 
                        unbilledMaria,
                        billedMaria,
                        '#4caf50'
                    )}
                    {renderCard(
                        "Juan Ignacio (20-32593808-1)", 
                        "Facturas a Empresas con CUIT (Punto de Venta " + config.puntoVentaJuan + ")",
                        facturadoJuan, 
                        config.limiteAnualMonotributoJuan, 
                        unbilledJuan,
                        billedJuan,
                        '#2196f3'
                    )}
                </CardsContainer>
            )}

            {!isEditing && historyData.length > 0 && (
                <>
                    <ChartSection>
                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.1rem' }}>
                            Historial de Facturación Mensual (Últimos 6 Meses)
                        </h4>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fill: '#7f8c8d', fontSize: 12 }} />
                                    <YAxis 
                                        domain={[0, dataMax => Math.max(dataMax, (config.limiteAnualMonotributo || 0) / 12, (config.limiteAnualMonotributoJuan || 0) / 12) * 1.15]}
                                        tickFormatter={(val) => `$${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
                                        tick={{ fill: '#7f8c8d', fontSize: 12 }} 
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar dataKey="maria" name="María Luisa (CF)" fill="#4caf50" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="juan" name="Juan Ignacio (Empresas)" fill="#2196f3" radius={[4, 4, 0, 0]} />
                                    
                                    {config.limiteAnualMonotributo > 0 && (
                                        <ReferenceLine 
                                            y={config.limiteAnualMonotributo / 12} 
                                            stroke="#4caf50" 
                                            strokeDasharray="4 4" 
                                            label={{ value: `Límite María: $${Math.round(config.limiteAnualMonotributo / 12).toLocaleString('es-AR')}`, fill: '#388e3c', position: 'top', fontSize: 10, fontWeight: 'bold' }} 
                                        />
                                    )}
                                    {config.limiteAnualMonotributoJuan > 0 && (
                                        <ReferenceLine 
                                            y={config.limiteAnualMonotributoJuan / 12} 
                                            stroke="#2196f3" 
                                            strokeDasharray="4 4" 
                                            label={{ value: `Límite Juan: $${Math.round(config.limiteAnualMonotributoJuan / 12).toLocaleString('es-AR')}`, fill: '#1976d2', position: 'top', fontSize: 10, fontWeight: 'bold' }} 
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartSection>

                    <ParametersSection>
                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1rem' }}>
                            Parámetros de Control y Límites
                        </h4>
                        <ParametersGrid>
                            <ParameterCard borderColor="#4caf50">
                                <h5 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>María Luisa</h5>
                                <div className="param-row">
                                    <span>Límite Anual:</span>
                                    <strong>{formatCurrency(config.limiteAnualMonotributo)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Límite Mensual Sugerido:</span>
                                    <strong>{formatCurrency(config.limiteAnualMonotributo / 12)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Facturado este Mes:</span>
                                    <strong style={{ color: '#4caf50' }}>{formatCurrency(facturadoMaria)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Consumo Mes Actual:</span>
                                    <strong style={{ color: (facturadoMaria / (config.limiteAnualMonotributo / 12 || 1) * 100) > 85 ? '#f44336' : '#2e7d32' }}>
                                        {((facturadoMaria / (config.limiteAnualMonotributo / 12 || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                                <div className="param-row" style={{ borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '8px' }}>
                                    <span>Facturado Total (6 Meses):</span>
                                    <strong>{formatCurrency(historyData.reduce((acc, curr) => acc + curr.maria, 0))}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Promedio 6 Meses:</span>
                                    <strong>{formatCurrency(historyData.reduce((acc, curr) => acc + curr.maria, 0) / 6)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>% Consumo Promedio:</span>
                                    <strong>
                                        {((historyData.reduce((acc, curr) => acc + curr.maria, 0) / 6 / (config.limiteAnualMonotributo / 12 || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                                <div className="param-row" style={{ borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '8px' }}>
                                    <span>Facturado Móvil (12 Meses):</span>
                                    <strong style={{ color: (totalMaria12m / (config.limiteAnualMonotributo || 1) * 100) > 85 ? '#f44336' : '#2e7d32' }}>
                                        {formatCurrency(totalMaria12m)}
                                    </strong>
                                </div>
                                <div className="param-row">
                                    <span>% Consumo Anual (12M):</span>
                                    <strong style={{ color: (totalMaria12m / (config.limiteAnualMonotributo || 1) * 100) > 85 ? '#f44336' : '#2e7d32' }}>
                                        {((totalMaria12m / (config.limiteAnualMonotributo || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                            </ParameterCard>

                            <ParameterCard borderColor="#2196f3">
                                <h5 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Juan Ignacio</h5>
                                <div className="param-row">
                                    <span>Límite Anual:</span>
                                    <strong>{formatCurrency(config.limiteAnualMonotributoJuan)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Límite Mensual Sugerido:</span>
                                    <strong>{formatCurrency(config.limiteAnualMonotributoJuan / 12)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Facturado este Mes:</span>
                                    <strong style={{ color: '#2196f3' }}>{formatCurrency(facturadoJuan)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Consumo Mes Actual:</span>
                                    <strong style={{ color: (facturadoJuan / (config.limiteAnualMonotributoJuan / 12 || 1) * 100) > 85 ? '#f44336' : '#1565c0' }}>
                                        {((facturadoJuan / (config.limiteAnualMonotributoJuan / 12 || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                                <div className="param-row" style={{ borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '8px' }}>
                                    <span>Facturado Total (6 Meses):</span>
                                    <strong>{formatCurrency(historyData.reduce((acc, curr) => acc + curr.juan, 0))}</strong>
                                </div>
                                <div className="param-row">
                                    <span>Promedio 6 Meses:</span>
                                    <strong>{formatCurrency(historyData.reduce((acc, curr) => acc + curr.juan, 0) / 6)}</strong>
                                </div>
                                <div className="param-row">
                                    <span>% Consumo Promedio:</span>
                                    <strong>
                                        {((historyData.reduce((acc, curr) => acc + curr.juan, 0) / 6 / (config.limiteAnualMonotributoJuan / 12 || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                                <div className="param-row" style={{ borderTop: '1px dashed #eee', paddingTop: '8px', marginTop: '8px' }}>
                                    <span>Facturado Móvil (12 Meses):</span>
                                    <strong style={{ color: (totalJuan12m / (config.limiteAnualMonotributoJuan || 1) * 100) > 85 ? '#f44336' : '#1565c0' }}>
                                        {formatCurrency(totalJuan12m)}
                                    </strong>
                                </div>
                                <div className="param-row">
                                    <span>% Consumo Anual (12M):</span>
                                    <strong style={{ color: (totalJuan12m / (config.limiteAnualMonotributoJuan || 1) * 100) > 85 ? '#f44336' : '#1565c0' }}>
                                        {((totalJuan12m / (config.limiteAnualMonotributoJuan || 1)) * 100).toFixed(1)}%
                                    </strong>
                                </div>
                            </ParameterCard>
                        </ParametersGrid>
                    </ParametersSection>
                </>
            )}
        </Container>
    );
}

// Styled Components
const Container = styled.div`
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    margin-bottom: 20px;
    @media (max-width: 600px) {
        padding: 10px;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 15px;

    h3 { margin: 0; color: #2c3e50; font-size: 1.1rem; }
`;

const EditBtn = styled.button`
    background: transparent;
    border: 1px solid #3498db;
    color: #3498db;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
    &:hover { background: #3498db; color: white; }
`;

const ConfigForm = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const FormCol = styled.div`
    flex: 1;
    min-width: 300px;
    background: #f9f9f9;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const FormRow = styled.div`
    display: flex;
    flex-direction: column;
    label { font-weight: 500; font-size: 0.9rem; color: #555; margin-bottom: 5px; }
    input[type="number"] { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
`;

const SaveBtn = styled.button`
    background: #4caf50;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
    &:hover { background: #45a049; }
`;

const CardsContainer = styled.div`
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const EntityCard = styled.div`
    flex: 1;
    min-width: 280px;
    background: #fdfdfd;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    @media (max-width: 768px) {
        min-width: 100%;
        width: 100%;
        box-sizing: border-box;
        padding: 15px 12px;
    }
`;

const ThermometerSection = styled.div`
    margin-top: 10px;
`;

const Stats = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
    h4 { margin: 3px 0 0 0; font-size: 1.05rem; }
    small { color: #7f8c8d; font-size: 0.8rem; }
`;

const ProgressBarContainer = styled.div`
    width: 100%;
    height: 16px;
    background: #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
`;

const ProgressBarFill = styled.div`
    height: 100%;
    background: ${props => props.color};
    width: ${props => props.width};
    transition: width 0.5s ease, background 0.5s ease;
`;

const AlertBox = styled.div`
    background: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 6px;
    margin-top: 15px;
    border: 1px solid #ef9a9a;
    font-weight: 500;
    font-size: 0.9rem;
`;

const UnbilledSection = styled.div`
    margin-top: 25px;
    background: #fafafa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #eeeeee;
`;

const BilledSection = styled.div`
    margin-top: 15px;
    background: #fafafa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #eeeeee;
    flex-grow: 1;
`;

const UnbilledList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 250px;
    overflow-y: auto;
    padding-right: 5px;
    
    /* Custom Scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-track {
        background: #f1f1f1; 
    }
    &::-webkit-scrollbar-thumb {
        background: #ccc; 
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: #999; 
    }
`;

const UnbilledItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 10px;
    background: white;
    padding: 10px;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    border-left: 3px solid #f44336;
`;

const FacturarBtnSmall = styled.button`
    background: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    &:hover { background: #bbdefb; }
`;

const ChartSection = styled.div`
    margin-top: 30px;
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
`;

const ParametersSection = styled.div`
    margin-top: 25px;
    width: 100%;
    box-sizing: border-box;
`;

const ParametersGrid = styled.div`
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const ParameterCard = styled.div`
    flex: 1;
    min-width: 280px;
    background: white;
    border: 1px solid #e0e0e0;
    border-left: 5px solid ${props => props.borderColor || '#ccc'};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    display: flex;
    flex-direction: column;
    gap: 6px;

    .param-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        color: #555;
        span {
            color: #7f8c8d;
        }
    }
`;

const TooltipContainer = styled.div`
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e0e0e0;
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    font-size: 0.85rem;
`;

const TooltipLabel = styled.div`
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 6px;
    border-bottom: 1px solid #eee;
    padding-bottom: 4px;
`;

const TooltipItem = styled.div`
    color: ${props => props.color};
    margin: 4px 0;
    small {
        color: #7f8c8d;
    }
`;
