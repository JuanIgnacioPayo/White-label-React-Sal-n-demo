import React, { useState } from 'react';
import styled from 'styled-components';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../firebase/firebase';
import { toast } from 'react-toastify';

const AdminSection = styled.div`
  background-color: var(--card-grey);
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  width: 100%;
  box-sizing: border-box;
  
  h3 {
    margin-top: 0;
    margin-bottom: 0.8rem;
    border-bottom: 2px solid var(--primary-text);
    padding-bottom: 0.3rem;
    color: var(--primary-text);
    font-size: 1.2rem;
  }

  label {
    display: block;
    margin-bottom: 0.2rem;
    font-size: 0.85rem;
    font-weight: bold;
    color: #555;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    font-family: 'product_sansregular';
    background-color: white;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  width: 100%;
  
  > div {
    display: flex;
    flex-direction: column;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    > div {
      grid-column: span 1 !important;
    }
  }
  
  input, textarea, select {
    margin-bottom: 0; 
  }
  label {
    font-size: 0.85rem;
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
  transition: background-color 0.3s ease;
  width: 100%;
  margin-top: auto;
  margin-bottom: 10px;

  &:hover {
    background-color: var(--primary-color);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FetchCuitButton = styled.button`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
  transition: background-color 0.2s;
  height: 100%;

  &:hover {
    background-color: #e0e0e0;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const FormularioCliente = ({
    isAdmin,
    selectedDate,
    showLoadInput,
    presupuestoIdToLoad,
    setPresupuestoIdToLoad,
    cargarPresupuestoPorId,
    formData,
    handleFormChange,
    handleKeyDown,
    refs,
    formatDate
}) => {
    const [isFetchingCuit, setIsFetchingCuit] = useState(false);

    if (!isAdmin) return null;

    const {
        nombreClienteRef,
        telefonoRef,
        descripcionEventoRef,
        precioAlquilerPersonalizadoRef,
        descuentoRef,
        motivoDescuentoRef,
        señaRef,
        inicioEventoRef,
        finEventoRef,
        agregadoManualRef,
        precioAgregadoManualRef,
        generarResumenBtnRef
    } = refs;

    const handleFetchCuit = async (silent = false) => {
        const cuitClean = formData.cuit ? formData.cuit.replace(/[^0-9]/g, '') : '';
        if (cuitClean.length < 10) {
            if (!silent) toast.warning("Por favor ingrese un CUIT válido primero.");
            return;
        }

        setIsFetchingCuit(true);
        try {
            const functions = getFunctions(app);
            const consultarRazonSocialAFIP = httpsCallable(functions, 'consultarRazonSocialAFIP');
            
            // Asumimos que usa el emisor por defecto o el asignado en su URL. 
            const searchParams = new URLSearchParams(window.location.search);
            const emisorParam = searchParams.get('emisor') || 'maria';

            const result = await consultarRazonSocialAFIP({
                cuit: formData.cuit,
                emisor: emisorParam
            });

            if (result.data && result.data.success && result.data.razonSocial) {
                if (!silent) toast.success(`Razón Social encontrada: ${result.data.razonSocial}`);
                handleFormChange({ target: { name: 'razonSocial', value: result.data.razonSocial } });
                handleFormChange({ target: { name: 'razonSocialCuit', value: cuitClean } });
                
                if (result.data.domicilio) {
                    handleFormChange({ target: { name: 'domicilio', value: result.data.domicilio } });
                }
                
                if (result.data.condicionIva) {
                    handleFormChange({ target: { name: 'condicionIva', value: result.data.condicionIva } });
                }

                // We also auto-fill the client name if it's currently empty
                if (!formData.nombreCliente || formData.nombreCliente.trim() === '') {
                    handleFormChange({ target: { name: 'nombreCliente', value: result.data.razonSocial } });
                }
            } else {
                if (!silent) toast.warning(result.data.message || "No se encontró Razón Social para este CUIT.");
                handleFormChange({ target: { name: 'razonSocial', value: '' } });
            }
        } catch (error) {
            console.error("Error al consultar CUIT:", error);
            if (!silent) toast.error("Error al consultar AFIP: " + error.message);
        } finally {
            setIsFetchingCuit(false);
        }
    };

    React.useEffect(() => {
        const cuitClean = formData.cuit ? formData.cuit.replace(/[^0-9]/g, '') : '';
        if (cuitClean.length === 11) {
            if (formData.razonSocialCuit !== cuitClean) {
                handleFetchCuit(true);
            }
        }
    }, [formData.cuit, formData.razonSocialCuit]);

    return (
        <AdminSection>
            <h3>
                {selectedDate
                    ? formatDate(selectedDate)
                    : 'Datos del Presupuesto (Admin)'}
            </h3>
            {showLoadInput && (
                <>
                    <label htmlFor="loadPresupuestoId">ID del Presupuesto a Cargar</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                        <input
                            id="loadPresupuestoId"
                            name="loadPresupuestoId"
                            placeholder="ID del Presupuesto"
                            value={presupuestoIdToLoad}
                            onChange={(e) => setPresupuestoIdToLoad(e.target.value)}
                            style={{ flexGrow: 1 }}
                        />
                        <Button onClick={() => cargarPresupuestoPorId()} style={{ width: 'auto', marginTop: '0' }}>
                            Cargar
                        </Button>
                    </div>
                </>
            )}
            <FormGrid>
                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="nombreCliente">Nombre del Cliente / Razón Social</label>
                    <input 
                        id="nombreCliente" 
                        name="nombreCliente" 
                        placeholder="Nombre del Cliente" 
                        value={formData.nombreCliente} 
                        onChange={handleFormChange} 
                        ref={nombreClienteRef} 
                        onKeyDown={(e) => handleKeyDown(e, telefonoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input 
                        id="telefono" 
                        name="telefono" 
                        placeholder="Teléfono" 
                        value={formData.telefono} 
                        onChange={handleFormChange} 
                        ref={telefonoRef} 
                        onKeyDown={(e) => handleKeyDown(e, descripcionEventoRef)} 
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="descripcionEvento">Descripción del Evento</label>
                    <textarea 
                        id="descripcionEvento" 
                        name="descripcionEvento" 
                        placeholder="Descripción del Evento" 
                        value={formData.descripcionEvento} 
                        onChange={handleFormChange} 
                        ref={descripcionEventoRef} 
                        rows="1"
                        style={{ resize: 'vertical' }}
                        onKeyDown={(e) => handleKeyDown(e, inicioEventoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="inicioEvento">Hora Inicio</label>
                    <input 
                        id="inicioEvento" 
                        name="inicioEvento" 
                        type="text" 
                        value={formData.inicioEvento} 
                        onChange={handleFormChange} 
                        placeholder="HH:MM" 
                        ref={inicioEventoRef} 
                        onKeyDown={(e) => handleKeyDown(e, finEventoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="finEvento">Hora Fin</label>
                    <input 
                        id="finEvento" 
                        name="finEvento" 
                        type="text" 
                        value={formData.finEvento} 
                        onChange={handleFormChange} 
                        placeholder="HH:MM" 
                        ref={finEventoRef} 
                        onKeyDown={(e) => handleKeyDown(e, precioAlquilerPersonalizadoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="horasPrevias">Hs Previas</label>
                    <input 
                        id="horasPrevias" 
                        name="horasPrevias" 
                        type="text" 
                        value={formData.horasPrevias} 
                        onChange={handleFormChange} 
                        placeholder="Auto" 
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="precioAlquilerPersonalizado">Alquiler Personalizado</label>
                    <input 
                        id="precioAlquilerPersonalizado" 
                        name="precioAlquilerPersonalizado" 
                        type="text" 
                        placeholder="Ej: 600000" 
                        value={formData.precioAlquilerPersonalizado || ''} 
                        onChange={handleFormChange} 
                        ref={precioAlquilerPersonalizadoRef} 
                        onKeyDown={(e) => handleKeyDown(e, descuentoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="descuento">Descuento o Ajuste</label>
                    <input 
                        id="descuento" 
                        name="descuento" 
                        type="text" 
                        placeholder={
                            formData.tipoDescuento === 'porcentaje' ? 'Ej: 10 (%)' : 
                            formData.tipoDescuento === 'monto' ? 'Ej: 50000 ($)' : 
                            'Ej: 450000'
                        }
                        value={formData.descuento} 
                        onChange={handleFormChange} 
                        ref={descuentoRef} 
                        onKeyDown={(e) => handleKeyDown(e, motivoDescuentoRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                    <label>&nbsp;</label>
                    <select 
                        name="tipoDescuento" 
                        value={formData.tipoDescuento || 'porcentaje'} 
                        onChange={handleFormChange}
                    >
                        <option value="porcentaje">%</option>
                        <option value="monto">$</option>
                        <option value="final">Final</option>
                    </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="motivoDescuento">Motivo del Descuento</label>
                    <input 
                        id="motivoDescuento" 
                        name="motivoDescuento" 
                        type="text" 
                        placeholder="Motivo del descuento" 
                        value={formData.motivoDescuento} 
                        onChange={handleFormChange} 
                        ref={motivoDescuentoRef} 
                        onKeyDown={(e) => handleKeyDown(e, señaRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="seña">Seña</label>
                    <input 
                        id="seña" 
                        name="seña" 
                        type="text" 
                        placeholder="Seña" 
                        value={formData.seña} 
                        onChange={handleFormChange} 
                        ref={señaRef} 
                        onKeyDown={(e) => handleKeyDown(e, agregadoManualRef)} 
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="agregadoManual">Agregado Manual (Texto adicional)</label>
                    <textarea 
                        id="agregadoManual" 
                        name="agregadoManual" 
                        placeholder="Texto adicional para el resumen" 
                        value={formData.agregadoManual} 
                        onChange={handleFormChange} 
                        ref={agregadoManualRef} 
                        rows="1"
                        style={{ resize: 'vertical' }}
                        onKeyDown={(e) => handleKeyDown(e, precioAgregadoManualRef)} 
                    />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="precioAgregadoManual">Precio Agregado</label>
                    <input 
                        id="precioAgregadoManual" 
                        name="precioAgregadoManual" 
                        type="text" 
                        placeholder="Precio (opcional)" 
                        value={formData.precioAgregadoManual || ''} 
                        onChange={handleFormChange} 
                        ref={precioAgregadoManualRef} 
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (generarResumenBtnRef.current) generarResumenBtnRef.current.focus();
                            }
                        }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="cuit">CUIT</label>
                    <div style={{ display: 'flex', height: '36px' }}>
                        <input 
                            id="cuit" 
                            name="cuit" 
                            type="text" 
                            placeholder="CUIT (sin guiones)" 
                            value={formData.cuit || ''} 
                            onChange={handleFormChange} 
                            style={{ flexGrow: 1, margin: 0 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleFetchCuit();
                                }
                            }}
                        />
                        <FetchCuitButton 
                            type="button" 
                            onClick={() => handleFetchCuit(false)} 
                            disabled={isFetchingCuit}
                            title="Buscar Razón Social en AFIP"
                        >
                            {isFetchingCuit ? '⏳' : '🔍'}
                        </FetchCuitButton>
                    </div>
                    {formData.razonSocial && (
                        <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#2e7d32', fontWeight: 'bold' }}>
                            ✓ {formData.razonSocial}
                        </div>
                    )}
                </div>
            </FormGrid>
        </AdminSection>
    );
};

export default FormularioCliente;
