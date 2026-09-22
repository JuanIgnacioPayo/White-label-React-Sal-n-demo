import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../firebase/firebase";
import { Link } from 'react-router-dom';

const Container = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  @media (max-width: 600px) {
    padding: 0.5rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex: 1;
  min-width: 200px;
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
`;

const InvoiceGroupCard = styled.div`
  border: 1px solid #ddd;
  border-left: 4px solid #1976d2;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  background: #fafafa;
`;

const Detail = styled.div`
  p { margin: 0.2rem 0; font-size: 0.9rem; color: #555; }
  strong { color: #333; }
`;

const ActionBtn = styled(Link)`
  padding: 6px 12px;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  &:hover { background: #1565c0; }
`;

const LoadMoreBtn = styled.button`
  width: 100%;
  padding: 10px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #555;
  margin-top: 1rem;
  &:hover { background: #e0e0e0; }
`;

const UpcomingSection = styled.div`
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 600px) {
    padding: 0.5rem;
  }
`;

const UpcomingTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UpcomingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 0.9rem;
  &:last-child { border-bottom: none; }
`;

const SmallBtn = styled(Link)`
  padding: 4px 8px;
  background: #ff9800;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  &:hover { background: #f57c00; }
`;

export default function FacturasAdmin() {
    const [invoices, setInvoices] = useState([]);
    const [upcomingInvoices, setUpcomingInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [visibleCount, setVisibleCount] = useState(5);
    const [filterIssuer, setFilterIssuer] = useState('all');

    useEffect(() => {
        const fetchAllInvoices = async () => {
            const db = getDatabase(app);
            const presRef = ref(db, 'presupuestos');
            const configRef = ref(db, 'config/afip');
            
            try {
                const [snapshot, configSnap] = await Promise.all([
                    get(presRef),
                    get(configRef)
                ]);
                
                const afipConfig = configSnap.exists() ? configSnap.val() : {};
                let currentTurnoMaria = afipConfig.turnoMaria !== false; // por defecto true

                if (snapshot.exists()) {
                    let allFacturados = [];
                    let allUpcoming = [];
                    const data = snapshot.val();
                    const hoy = new Date();
                    hoy.setHours(0,0,0,0);
                    
                    // Recorremos Años > Meses > Dias > Presupuestos
                    Object.values(data).forEach(yearData => {
                        Object.values(yearData).forEach(monthData => {
                            Object.values(monthData).forEach(dayData => {
                                Object.entries(dayData).forEach(([id, presupuesto]) => {
                                    if (presupuesto.facturado && presupuesto.facturaAFIP) {
                                        allFacturados.push({
                                            presupuestoId: id,
                                            cliente: presupuesto.formData?.nombreCliente || 'Sin Nombre',
                                            razonSocial: presupuesto.formData?.razonSocial || '',
                                            telefono: presupuesto.formData?.whatsapp || presupuesto.formData?.telefono || '',
                                            fechaEvento: presupuesto.selectedDate,
                                            facturas: presupuesto.facturaAFIP,
                                            fechaFacturacion: presupuesto.fechaFacturacion,
                                            timestamp: presupuesto.fechaFacturacion 
                                                ? new Date(presupuesto.fechaFacturacion).getTime() 
                                                : (presupuesto.selectedDate ? new Date(presupuesto.selectedDate).getTime() : 0)
                                        });
                                    } else if (!presupuesto.facturado && presupuesto.selectedDate) {
                                        const eventDate = new Date(presupuesto.selectedDate);
                                        if (eventDate >= hoy) {
                                            const isEmpresa = !!presupuesto.formData?.cuit;
                                            allUpcoming.push({
                                                id: id,
                                                cliente: presupuesto.formData?.nombreCliente || 'Sin Nombre',
                                            razonSocial: presupuesto.formData?.razonSocial || '',
                                                fechaEvento: presupuesto.selectedDate,
                                                monto: presupuesto.totalFinal || 0,
                                                isEmpresa: isEmpresa,
                                                cuit: presupuesto.formData?.cuit || null,
                                                timestamp: eventDate.getTime()
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });

                    allUpcoming.sort((a, b) => a.timestamp - b.timestamp);
                    
                    let simTurnoMaria = currentTurnoMaria;
                    const topUpcoming = allUpcoming.slice(0, 5).map(evt => {
                        if (evt.isEmpresa) {
                            evt.facturador = "Juan Ignacio (Empresa)";
                        } else {
                            evt.facturador = simTurnoMaria ? "María Luisa (Intercalado)" : "Juan Ignacio (Intercalado)";
                            simTurnoMaria = !simTurnoMaria; // el turno cambia para el siguiente sin CUIT
                        }
                        return evt;
                    });

                    setUpcomingInvoices(topUpcoming);
                    setInvoices(allFacturados);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllInvoices();
    }, []);

    // Filtrar y Ordenar
    const filteredInvoices = invoices.filter(inv => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = inv.cliente.toLowerCase().includes(searchLower) || inv.telefono.includes(searchLower);
        
        if (filterIssuer === 'all') return matchesSearch;
        
        const ptoVenta = inv.facturas && inv.facturas[0] ? parseInt(inv.facturas[0].puntoVenta) : 0;
        if (filterIssuer === 'juan') return matchesSearch && ptoVenta === 5;
        if (filterIssuer === 'mary') return matchesSearch && ptoVenta === 4;
        
        return matchesSearch;
    }).sort((a, b) => {
        if (sortOrder === 'desc') return b.timestamp - a.timestamp;
        return a.timestamp - b.timestamp;
    });

    const visibleInvoices = filteredInvoices.slice(0, visibleCount);

    if (loading) return <p>Cargando facturas...</p>;

    return (
        <Container>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>Gestor de Facturas</h3>
                <a 
                    href="https://auth.afip.gob.ar/contribuyente_/login.xhtml" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Ir a ARCA / AFIP para ver todas las facturas en 'Mis Comprobantes'"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    ARCA: Mis Comprobantes
                </a>
            </div>
            
            <Controls>
                <SearchInput 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <SortSelect value={filterIssuer} onChange={(e) => setFilterIssuer(e.target.value)}>
                    <option value="all">Todos los Facturadores</option>
                    <option value="juan">Juan Ignacio (PV 5)</option>
                    <option value="mary">María Luisa (PV 4)</option>
                </SortSelect>

                <SortSelect value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="desc">Más recientes primero</option>
                    <option value="asc">Más antiguos primero</option>
                </SortSelect>
            </Controls>

            {visibleInvoices.length === 0 ? (
                <p style={{ color: '#666' }}>No se encontraron facturas.</p>
            ) : (
                <>
                    {visibleInvoices.map((inv, idx) => {
                        const isSplit = inv.facturas.length > 1;
                        const totalFacturado = inv.facturas.reduce((sum, fac) => sum + (fac.monto || 0), 0);
                        
                        const ptoVenta = inv.facturas && inv.facturas[0] ? parseInt(inv.facturas[0].puntoVenta) : 0;
                        let customBg = '#fafafa';
                        let customBorder = '#1976d2';
                        
                        if (ptoVenta === 5) { // Juan Ignacio
                            customBg = 'rgba(33, 150, 243, 0.05)';
                            customBorder = '#2196f3';
                        } else if (ptoVenta === 4) { // Maria Luisa
                            customBg = 'rgba(76, 175, 80, 0.05)';
                            customBorder = '#4caf50';
                        }

                        return (
                            <InvoiceGroupCard key={inv.presupuestoId} style={{ backgroundColor: customBg, borderLeftColor: customBorder, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                                <Detail style={{ width: '100%', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                        <p style={{ margin: 0, fontSize: '0.88rem' }}>
                                            <strong>{inv.cliente}</strong>
                                            {inv.razonSocial && <span style={{ marginLeft: '6px', color: '#2e7d32', fontSize: '0.8rem' }}>({inv.razonSocial})</span>}
                                            <strong style={{ marginLeft: '8px', color: '#555' }}>{inv.fechaEvento ? new Date(inv.fechaEvento).toLocaleDateString('es-AR') : 'N/A'}</strong>
                                        </p>
                                        {totalFacturado > 0 && (
                                            <strong style={{ color: '#2e7d32', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>${Math.round(totalFacturado).toLocaleString('es-AR')}</strong>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                        Emitida: {inv.fechaFacturacion ? new Date(inv.fechaFacturacion).toLocaleString('es-AR') : 'N/A'}
                                    </div>
                                </Detail>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                    {inv.facturas.map((fac, i) => (
                                        <div key={fac.cae || i} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            backgroundColor: isSplit ? 'rgba(255,255,255,0.7)' : 'transparent', 
                                            padding: isSplit ? '6px 10px' : '2px 0', 
                                            border: isSplit ? '1px dashed #ccc' : 'none', 
                                            borderRadius: '6px',
                                            flexWrap: 'wrap',
                                            gap: '10px'
                                        }}>
                                            <div style={{ fontSize: '0.78rem', color: '#555' }}>
                                                <strong>Comprobante:</strong> {fac.puntoVenta}-{fac.comprobante} 
                                                <span style={{ marginLeft: '8px' }}><strong>CAE:</strong> {fac.cae}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {fac.monto && <span style={{ color: '#333', fontWeight: 'bold', fontSize: '0.82rem' }}>${Math.round(fac.monto).toLocaleString('es-AR')}</span>}
                                                <ActionBtn to={`/presupuesto/editar/${inv.presupuestoId}`} target="_blank" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                                                    {isSplit ? `Ver Factura (Parte ${i+1})` : 'Ver Factura'}
                                                </ActionBtn>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InvoiceGroupCard>
                        );
                    })}
                    
                    {visibleCount < filteredInvoices.length && (
                        <LoadMoreBtn onClick={() => setVisibleCount(prev => prev + 5)}>
                            Cargar 5 más... ({filteredInvoices.length - visibleCount} restantes)
                        </LoadMoreBtn>
                    )}
                </>
            )}

            {upcomingInvoices.length > 0 && (
                <UpcomingSection style={{ marginTop: '2rem' }}>
                    <UpcomingTitle>⏳ Próximas Facturaciones Automáticas</UpcomingTitle>
                    {upcomingInvoices.map(evt => {
                        const isMaria = evt.facturador.includes("María");
                        const customBg = isMaria ? 'rgba(76, 175, 80, 0.05)' : 'rgba(33, 150, 243, 0.05)';
                        const customBorder = isMaria ? '#4caf50' : '#2196f3';

                        return (
                        <UpcomingRow key={evt.id} style={{ backgroundColor: customBg, borderLeft: `4px solid ${customBorder}`, padding: '8px 10px', borderRadius: '4px', marginBottom: '8px' }}>
                            <div style={{ flex: '1 1 200px', minWidth: 0, wordBreak: 'break-word' }}>
                                <strong>{new Date(evt.fechaEvento).toLocaleDateString('es-AR')}</strong>
                                <span style={{fontSize: '0.85rem', marginLeft: '6px', color: '#444'}}>
                                    - {evt.cliente} {evt.cuit ? `(CUIT: ${evt.cuit})` : '(Consumidor Final)'}
                                </span>
                            </div>
                            <div style={{ flex: '0 0 auto', color: customBorder, fontWeight: 'bold', fontSize: '0.85rem' }}>{evt.facturador}</div>
                            <div style={{ flex: '0 0 auto', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>$ {evt.monto.toLocaleString('es-AR')}</div>
                            <div style={{ flex: '0 0 auto' }}>
                                <SmallBtn to={`/presupuesto?id=${evt.id}&facturar=true&emisor=${evt.facturador.includes("María") ? 'maria' : 'juan'}`} target="_blank" rel="noopener noreferrer">
                                    Facturar
                                </SmallBtn>
                            </div>
                        </UpcomingRow>
                    )})}
                </UpcomingSection>
            )}
        </Container>
    );
}
