import React from 'react';
import styled from 'styled-components';
import DatePicker from '../DatePicker'; // Assuming relative path works

const CarritoWrapper = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 2rem;
  box-sizing: border-box;
  width: 100%;
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const DatePickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
    background-color: var(--card-grey);
    padding: 1rem;
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;

    h4 {
        margin: 0 0 1rem 0;
        color: #343a40;
        font-size: 1rem;
    }
`;

const CarritoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CarritoItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0;
  border-bottom: 1px solid #eee;

  .item-details {
    flex-grow: 1;
  }

  .item-nombre {
    font-weight: bold;
  }

  .item-controles {
    display: flex;
    align-items: center;
  }

  .cantidad-control {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 110px;
    margin-right: 1rem;
  }

  .item-cantidad {
    width: 45px;
    text-align: center;
    display: inline-block;
  }
`;

const CarritoTotal = styled.div`
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: bold;
  text-align: right;

  p {
    margin: 0.5rem 0;
  }

  .total-final {
    font-size: 1.2rem;
    color: var(--primary-text);
  }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: auto;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
    /* Se usa filter para oscurecer levemente el color de fondo en hover sin importar cuál sea el color base en style inline */
    filter: brightness(0.95);
  }

  &:active {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #ccc !important;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    filter: none;
  }
`;

const CarritoPresupuesto = ({
    carrito,
    currentBudgetId,
    selectedDate,
    handleDateChange,
    orangeHolidayDates,
    currentMonth,
    inputValue101,
    removePriceFromTitle,
    eliminarDelCarrito,
    agregarAlCarrito,
    serviciosUnicos,
    modificarHorasCamarera,
    formData,
    subtotal,
    montoDescuento,
    totalFinal,
    restante,
    isAdmin,
    showImportUI,
    setShowImportUI,
    urlToImport,
    setUrlToImport,
    handleImportFromUrl,
    generarResumenBtnRef,
    generarTextoPlano,
    generarYCopiarLinkCompartible,
    showLoadInput,
    setShowLoadInput,
    hasUnsavedChanges,
    handleResetOrDelete,
    handleGenerarRecibo,
    verListaDePrecios,
    canGeneratePDF,
    handleOpenPDFPreview,
    setShowTemplateEditor,
    onHacerFactura,
    facturaInfo,
    handlePrintTicket,
    handleDesmarcarFacturadoManual,
    handleGuardar,
    onOpenMoveModal,
    onAnularFactura,
}) => {
    return (
        <CarritoWrapper>
            <h2>Servicios agendados</h2>
            {carrito.length === 0 && !currentBudgetId ? (
                <DatePickerContainer>
                    <h4>Selecciona una fecha</h4>
                    <DatePicker
                        selected={selectedDate}
                        handleDateChange={handleDateChange}
                        orangeHolidays={orangeHolidayDates}
                        currentMonth={currentMonth}
                        currentYear={inputValue101 || new Date().getFullYear()}
                        allowOccupiedSelection={true}
                    />
                </DatePickerContainer>
            ) : (
                <>
                    <CarritoList>
                        {carrito.filter(item => item.id !== 5).map(item => (
                            <CarritoItem key={item.id}>
                                <div className="item-details">
                                    <span className="item-nombre">{removePriceFromTitle(item.nombre)}</span>
                                </div>
                                <div className="item-controles">
                                    <div className="cantidad-control">
                                        {![1, 3, 13, 14].includes(item.id) && <button className="btn-cantidad" onClick={() => eliminarDelCarrito(item.id)}>-</button>}
                                        {![1, 3, 13, 14].includes(item.id) && <span className="item-cantidad">{item.cantidad}</span>}
                                        {![1, 3, 13, 14].includes(item.id) && (
                                            !serviciosUnicos.includes(item.id) ? 
                                            <button className="btn-cantidad" onClick={() => agregarAlCarrito(item)}>+</button> :
                                            <button className="btn-cantidad" style={{ visibility: 'hidden' }}>+</button>
                                        )}
                                    </div>
                                    <span className="item-total">${parseInt(item.cantidad * item.precio) || 0}</span>
                                </div>
                            </CarritoItem>
                        ))}
                        {carrito.filter(item => item.id === 5).map(item => (
                            <CarritoItem key={item.uuid}>
                                <div className="item-details">
                                    <span className="item-nombre">{item.nombre}</span>
                                </div>
                                <div className="item-controles">
                                    <div className="cantidad-control">
                                        <button className="btn-cantidad" onClick={() => modificarHorasCamarera(item.uuid, -1)}>-</button>
                                        <span className="item-cantidad">{item.cantidad} hs</span>
                                        <button className="btn-cantidad" onClick={() => modificarHorasCamarera(item.uuid, 1)}>+</button>
                                    </div>
                                    <span className="item-total">${parseInt(item.cantidad * item.precio) || 0}</span>
                                </div>
                            </CarritoItem>
                        ))}
                    </CarritoList>

                    <CarritoTotal>
                        {montoDescuento > 0 && <p>Subtotal: ${subtotal.toFixed(0)}</p>}
                        {montoDescuento > 0 && <p>Descuento: ${montoDescuento.toFixed(0)}</p>}
                        <p className="total-final">Total: ${totalFinal.toFixed(0)}</p>
                        {formData.seña > 0 && <p>Seña: ${formData.seña}</p>}
                        {formData.seña > 0 && <p>Restante: ${restante.toFixed(0)}</p>}
                    </CarritoTotal>
                    {isAdmin && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '1rem', autoRows: '1fr' }}>
                                <Button onClick={verListaDePrecios} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }}>
                                    Ver precios
                                </Button>
                                
                                {canGeneratePDF() && (
                                    <Button onClick={handleOpenPDFPreview} style={{ backgroundColor: '#6f42c1', color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }}>
                                        📄 Presupuesto PDF
                                    </Button>
                                )}

                                {selectedDate && (
                                    <Button onClick={onOpenMoveModal} style={{ backgroundColor: '#0284c7', color: 'white', fontWeight: 'bold', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }} title="Mover este evento y presupuesto a otra fecha">
                                        🗓️ Mover Evento
                                    </Button>
                                )}
                                
                                <Button onClick={() => setShowImportUI(prev => !prev)} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }}>
                                    {showImportUI ? 'Cancelar Importación' : 'Importar Carrito'}
                                </Button>
                                
                                {isAdmin && (
                                    facturaInfo?.facturadoManualmente || (facturaInfo?.facturado && (!facturaInfo?.facturasAFIP || !facturaInfo.facturasAFIP.every(f => f.anulada))) ? (
                                        <div style={{ display: 'flex', width: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                            <Button 
                                                disabled={true}
                                                style={{ 
                                                    flex: 1,
                                                    backgroundColor: '#6c757d', 
                                                    color: 'white', 
                                                    margin: 0,
                                                    height: '100%',
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    textAlign: 'center', 
                                                    padding: '6px 4px', 
                                                    fontSize: '0.8rem', 
                                                    lineHeight: '1.2'
                                                }}
                                            >
                                                Ya Facturado
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            onClick={onHacerFactura} 
                                            style={{ 
                                                backgroundColor: '#fd7e14', 
                                                color: 'white',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                textAlign: 'center', 
                                                padding: '6px 4px', 
                                                fontSize: '0.8rem', 
                                                lineHeight: '1.2'
                                            }}
                                        >
                                            Hacer Factura
                                        </Button>
                                    )
                                )}

                                {showImportUI && (
                                    <div style={{ gridColumn: 'span 2', margin: '0.5rem 0', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                                        <label htmlFor="urlInput">Pegar URL del carrito a importar:</label>
                                        <input
                                            id="urlInput"
                                            type="text"
                                            value={urlToImport}
                                            onChange={(e) => setUrlToImport(e.target.value)}
                                            placeholder="https://..."
                                            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Button onClick={handleImportFromUrl} style={{ width: '100%' }}>Confirmar Importación</Button>
                                            <Button onClick={() => setShowImportUI(false)} style={{ width: '100%', backgroundColor: '#6c757d', color: 'white' }}>Cancelar</Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    <Button onClick={() => setShowTemplateEditor(true)} style={{ backgroundColor: '#e0a800', color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }}>
                                        ⚙️ Editar Plantilla
                                    </Button>
                                    <Button onClick={handleOpenPDFPreview} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px 4px', fontSize: '0.8rem', lineHeight: '1.2' }}>
                                        Ver Presupuesto PDF
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* === AFIP Status Box (Solo Admin, al final del panel si existe) === */}
            {isAdmin && currentBudgetId && facturaInfo?.facturado && (
                <div style={{
                    marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9',
                    borderRadius: '8px', border: '1px solid #c8e6c9', color: '#2e7d32'
                }}>
                    {facturaInfo.facturadoManualmente ? (
                         <>
                             <h4 style={{margin: '0 0 10px 0'}}>Facturado (Manual) ✅</h4>
                             <p style={{fontSize: '0.9rem', margin: 0}}>Este evento fue marcado como facturado de forma manual bajo otra razón social.</p>
                         </>
                    ) : (
                         <>
                             <h4 style={{margin: '0 0 10px 0'}}>Facturado en AFIP ✅</h4>
                             <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1b5e20' }}>
                                 <strong>{formData?.nombreCliente || 'Sin nombre'}</strong> - {selectedDate ? selectedDate.toLocaleDateString('es-AR') : 'Sin fecha'}
                             </p>
                             {facturaInfo.facturasAFIP && facturaInfo.facturasAFIP.map((fac, idx) => (
                                <div key={idx} style={{ marginTop: '10px', paddingTop: '10px', borderTop: idx > 0 ? '1px solid #c8e6c9' : 'none' }}>
                                    <p style={{ margin: '3px 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                         <span><strong>Emisor:</strong> {fac.puntoVenta === 5 || fac.puntoVenta === '5' ? 'Juan Payo' : 'María'}</span>
                                         <span><strong>Monto:</strong> ${fac.monto}</span>
                                     </p>
                                    <button
                                        onClick={() => handlePrintTicket(fac)}
                                        style={{ marginTop: '5px', padding: '6px 12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}
                                    >
                                        🖨️ Imprimir
                                    </button>
                                    {!fac.anulada ? (
                                        <button
                                            onClick={() => {
                                                if(window.confirm('¿Estás seguro de anular esta factura? Esto emitirá una Nota de Crédito en AFIP y no se puede deshacer.')) {
                                                    onAnularFactura && onAnularFactura(idx);
                                                }
                                            }}
                                            style={{ marginTop: '5px', padding: '6px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}
                                        >
                                            ❌ Anular (Nota de Crédito)
                                        </button>
                                    ) : (
                                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#d32f2f', textAlign: 'center', fontWeight: 'bold' }}>
                                            ⚠️ Anulada (NC: {fac.notaCredito?.comprobante || 'Generada'})
                                        </p>
                                    )}
                                </div>
                             ))}
                         </>
                    )}
                </div>
            )}
        </CarritoWrapper>
    );
};

export default CarritoPresupuesto;
