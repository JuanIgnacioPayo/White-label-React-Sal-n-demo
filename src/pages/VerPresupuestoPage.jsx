import React, { useState, useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import { useParams, Link } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/firebase';
import styled, { createGlobalStyle } from "styled-components";
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import Animacion from '../components/Precios/Animacion'; // Reutilizamos la animación de carga
import PreciosDinamico from '../components/Precios/PreciosDinamico';
import Modal, { ModalButton, ModalButtonContainer } from '../components/Modal';
import logoSalon from '../assets/logo.png';

// Global Styles (puedes ajustar según tu diseño)
const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Product Sans', sans-serif;
    background-color: #f4f7f6;
    color: #333;
  }
`;

const Section = styled.section`
  padding: 2rem;
  margin: 0 auto;
  max-width: 1000px;
  font-family: 'product_sansregular';
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h1`
  color: var(--primary-color);;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.p`
  margin-bottom: 0.5rem;
  font-size: 1.1rem;

  strong {
    color: #333;
  }
`;

const CarritoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`;

const CarritoItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 1px solid #eee;

  .item-nombre {
    font-weight: bold;
    color: #555;
  }

  .item-cantidad {
    margin-left: 1rem;
    color: #777;
  }

  .item-precio {
    font-weight: bold;
    color: var(--primary-color);;
  }
`;

const TotalsContainer = styled.div`
  margin-top: 2rem;
  border-top: 2px solid var(--primary-color);
  padding-top: 1.5rem;
  text-align: right;

  p {
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }

  .total-final {
    font-size: 1.8rem;
    font-weight: bold;
    color: #28a745; /* Green for final total */
  }
`;

const BannerTitle = styled.h3`
  margin-top: 1rem;
  width: 100%;
  padding: 1rem;
  text-align: center;
  background-color: #f0f0f0; /* Un color de fondo suave para el banner */
  border-radius: 4px;
  color: #333;
`;

const InfoLinkContainer = styled.div`
    text-align: center;
    margin-top: 2rem;
    padding: 1rem;
    background-color: #eef2f7;
    border-radius: 8px;
    font-size: 1.1rem;

    a {
        color: var(--primary-color);
        font-weight: bold;
        text-decoration: underline;
    }
`;



const AfipStatusContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  
  h3 { color: #2e7d32; margin-top: 0; }
  p { margin: 0.5rem 0; font-size: 1.1rem; }
`;

const FacturarBtn = styled.button`
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.2s, background-color 0.2s;
  
  &:hover { 
    background-color: #1565c0;
    transform: scale(1.05);
  }
  &:disabled { background-color: #90caf9; cursor: not-allowed; }
`;

export default function VerPresupuestoPage() {
    const { completeTask } = useLoading();
    useEffect(() => { completeTask('app_init'); }, [completeTask]);

    const { id } = useParams();
    const [presupuesto, setPresupuesto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preciosLink, setPreciosLink] = useState('');
    const [preciosParams, setPreciosParams] = useState(null);
    // Facturación movida al admin

    useEffect(() => {
        if (presupuesto && presupuesto.selectedDate && presupuesto.carrito) {
            const params = new URLSearchParams();

            // Formatear la fecha
            const fecha = new Date(presupuesto.selectedDate);
            params.set('fecha', format(fecha, 'yyyy-MM-dd'));

            // Añadir items del carrito
            presupuesto.carrito.forEach(item => {
                if (item.id && item.cantidad > 0) {
                    params.set(`item_${item.id}_id`, item.id);
                    params.set(`item_${item.id}_cantidad`, item.cantidad);
                }
            });

            // Construir el link final y guardarlo en el estado
            const finalLink = `/precios?${params.toString()}`;
            setPreciosLink(finalLink);
            setPreciosParams(params);
        }
    }, [presupuesto]);

    useEffect(() => {
        const fetchPresupuesto = async () => {
            if (!id) {
                setError("ID de presupuesto no proporcionado.");
                setLoading(false);
                return;
            }
            const db = getDatabase(app);
            // Primero, buscar la ruta completa del presupuesto usando el ID
            const idLookupRef = ref(db, `presupuestos_por_id/${id}`);

            try {
                const idLookupSnapshot = await get(idLookupRef);
                if (!idLookupSnapshot.exists()) {
                    setError("ID de presupuesto no encontrado o no válido.");
                    setLoading(false);
                    return;
                }

                const { path } = idLookupSnapshot.val(); // Obtener la ruta (año/mes/dia)
                const presupuestoRef = ref(db, `presupuestos/${path}/${id}`); // Construir la ruta completa

                const snapshot = await get(presupuestoRef);
                if (snapshot.exists()) {
                    setPresupuesto(snapshot.val());
                } else {
                    setError("Presupuesto no encontrado en la ruta especificada.");
                }
            } catch (err) {
                console.error("Error al cargar el presupuesto:", err);
                if (err.code === 'PERMISSION_DENIED') {
                    setError("No tienes permiso para ver este presupuesto. Contacta al administrador.");
                } else {
                    setError(`Error al cargar el presupuesto: ${err.message || err}`);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPresupuesto();
    }, [id]);



    if (loading) {
        return <Animacion />;
    }

    if (error) {
        return <Section><Title>Error</Title><DetailItem>{error}</DetailItem></Section>;
    }

    if (!presupuesto) {
        return <Section><Title>Presupuesto no encontrado</Title><DetailItem>El presupuesto con el ID {id} no existe o ha sido eliminado.</DetailItem></Section>;
    }

    // Formatear la fecha del evento si existe
    const formattedEventDate = presupuesto.selectedDate
        ? format(new Date(presupuesto.selectedDate), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
        : 'No especificada';

    const itemsAMostrar = [...(presupuesto.carrito || [])];
    if (presupuesto.formData.agregadoManual) {
        const alquilerItemIndex = itemsAMostrar.findIndex(item => [1, 3, 13, 14].includes(item.id));
        const manualItem = {
            nombre: presupuesto.formData.agregadoManual,
            precio: parseFloat(presupuesto.formData.precioAgregadoManual || 0),
            cantidad: 1,
            id: 'manual' // Asignar un ID único para el key
        };
        if (alquilerItemIndex !== -1) {
            itemsAMostrar.splice(alquilerItemIndex + 1, 0, manualItem);
        } else {
            itemsAMostrar.push(manualItem);
        }
    }

    return (
        <>
            <GlobalStyle />
            <Section>
                <Title>Detalles del Presupuesto</Title>

                <DetailItem><strong>Fecha del Evento:</strong> {formattedEventDate}</DetailItem>
                <DetailItem><strong>Cliente:</strong> {presupuesto.formData.nombreCliente || 'N/A'}</DetailItem>
                <DetailItem><strong>Teléfono:</strong> {presupuesto.formData.telefono || 'N/A'}</DetailItem>
                <DetailItem><strong>Descripción del Evento:</strong> {presupuesto.formData.descripcionEvento || ''}</DetailItem>
                <DetailItem><strong>Hora de Inicio:</strong> {presupuesto.formData.inicioEvento ? `${presupuesto.formData.inicioEvento} hs.` : 'Horario a confirmar'}</DetailItem>
                <DetailItem><strong>Hora de Fin:</strong> {presupuesto.formData.finEvento ? `${presupuesto.formData.finEvento} hs.` : 'Horario a confirmar'}</DetailItem>

                <BannerTitle>Servicios agendados</BannerTitle>
                {itemsAMostrar.length > 0 ? (
                    <CarritoList>
                        {itemsAMostrar.map((item, index) => (
                            <CarritoItem key={item.id || index}>
                                <div>
                                    <span className="item-cantidad">{item.cantidad} x </span>
                                    <span className="item-nombre">{item.nombre}</span>
                                </div>
                                <span className="item-precio">${(item.precio * item.cantidad).toFixed(2)}</span>
                            </CarritoItem>
                        ))}
                    </CarritoList>
                ) : (
                    <DetailItem>No hay servicios seleccionados.</DetailItem>
                )}

                <TotalsContainer>
                    {presupuesto.formData.descuento > 0 && <p>Subtotal: ${presupuesto.subtotal?.toFixed(2) || '0.00'}</p>}
                    {presupuesto.formData.descuento > 0 && <p>Descuento: ${presupuesto.montoDescuento?.toFixed(2) || '0.00'}</p>}
                    {presupuesto.formData.descuento > 0 && presupuesto.formData.motivoDescuento && <p style={{ fontSize: '0.9rem', color: '#777' }}>({presupuesto.formData.motivoDescuento})</p>}
                    <p className="total-final">Total Final: ${presupuesto.totalFinal?.toFixed(2) || '0.00'}</p>
                    {presupuesto.formData.seña > 0 && <p>Seña: ${presupuesto.formData.seña}</p>}
                    {presupuesto.formData.seña > 0 && <p>Restante: ${presupuesto.restante?.toFixed(2) || '0.00'}</p>}
                </TotalsContainer>

                {preciosParams && (
                    <div style={{ marginTop: '3rem' }}>
                        <InfoLinkContainer>
                            <p>
                                <Link to={preciosLink} target="_blank" rel="noopener noreferrer">Abrir detalle de precios en nueva pestaña</Link>
                            </p>
                        </InfoLinkContainer>
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#555' }}>Detalle de lo que incluye tu presupuesto:</h3>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            <PreciosDinamico initialParams={preciosParams} hideLayout={true} />
                        </div>
                    </div>
                )}
            </Section>
        </>
    );
}
