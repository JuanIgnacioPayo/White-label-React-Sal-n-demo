import React from 'react';
import styled from 'styled-components';
import { useAvailability } from '../contexts/AvailabilityContext';
import { useAuth } from '../contexts/authContext';
import { getAvailableVisitSlots } from '../utils/visitScheduler';

import { FaEdit } from 'react-icons/fa';

import { getDatabase, ref, get, set } from 'firebase/database';
import { useLoading } from '../contexts/LoadingContext';
import { toast } from 'react-toastify';
import EditableField from './EditableField';

const HorariosVisita = ({ isEditable, editingField, setEditingField, onSave, titleText: propTitle, descriptionText: propDesc }) => {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

    

    const { calendarEvents, availableSlotsEvents, scheduledVisitsEvents, budgetEvents, isLoading } = useAvailability();
    const allBusyEvents = React.useMemo(() => {
        return [...(calendarEvents || []), ...(budgetEvents || [])];
    }, [calendarEvents, budgetEvents]);
    const formattedSlots = getAvailableVisitSlots(availableSlotsEvents, scheduledVisitsEvents, allBusyEvents);
    const { currentUser } = useAuth();

    const [salonWhatsApp, setSalonWhatsApp] = React.useState('');
    const [internalTitle, setInternalTitle] = React.useState('Horarios de visita');
    const [internalDesc, setInternalDesc] = React.useState('A continuación se detallan nuestros próximos horarios de visita. Te esperamos para conocer el salón:');

    const [messageTemplate, setMessageTemplate] = React.useState('Estuve viendo los horarios de visita en la web y quiero agendar una el {fecha_horario}.');
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState('');

    // Booking modal state
    const [bookingSlot, setBookingSlot] = React.useState(null);
    const [clientName, setClientName] = React.useState('');
    const [clientPhone, setClientPhone] = React.useState('');

    const nameInputRef = React.useRef(null);
    const phoneInputRef = React.useRef(null);

    React.useEffect(() => {
        if (bookingSlot && nameInputRef.current) {
            setTimeout(() => {
                nameInputRef.current.focus();
            }, 100);
        }
    }, [bookingSlot]);

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            phoneInputRef.current?.focus();
        }
    };

    const handlePhoneKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (clientName && clientPhone) {
                handleConfirmBooking(e);
            }
        }
    };

    React.useEffect(() => {
        const db = getDatabase();
        get(ref(db, 'config/horariosWhatsappTemplate')).then((snapshot) => {
            if (snapshot.exists()) {
                setMessageTemplate(snapshot.val());
            }
        });

        if (!propTitle || !propDesc) {
            get(ref(db, 'datosId/29')).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.horarios_title) setInternalTitle(data.horarios_title);
                    if (data.horarios_desc) setInternalDesc(data.horarios_desc);
                }
            });
        }

        get(ref(db, 'datosId/25')).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let num = data.numero_whatsapp || data.link_whatsapp || '';
                num = num.replace(/[^\d]/g, '');
                if (num) {
                    if (num.length === 10) num = '549' + num;
                    setSalonWhatsApp(num);
                }
            }
        });
    }, [propTitle, propDesc]);

    const displayTitle = propTitle !== undefined ? propTitle : internalTitle;
    const displayDesc = propDesc !== undefined ? propDesc : internalDesc;

    const handleSaveMessage = () => {
        const db = getDatabase();
        set(ref(db, 'config/horariosWhatsappTemplate'), editValue).then(() => {
            setMessageTemplate(editValue);
            setIsEditing(false);
        });
    };

    const openEditModal = () => {
        setEditValue(messageTemplate);
        setIsEditing(true);
    };

    const handleAgendarClick = (slot) => {
        setBookingSlot(slot);
        setClientName('');
        setClientPhone('');
    };

    const handleConfirmBooking = (e) => {
        e.preventDefault();
        if (!clientName || !clientPhone) {
            toast.error("Por favor completa todos los campos.");
            return;
        }

        // Generar mensaje de WhatsApp
        const humanSlot = bookingSlot.formatted.replace(/ (\d{1,2}:\d{2}) hs/, ' a las $1 hs');
        const finalTemplate = messageTemplate.replace('{fecha_horario}', humanSlot) + ` Mi nombre es ${clientName}.`;
        const targetNumber = salonWhatsApp || '5491100000000';
        const waUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(finalTemplate)}`;
        
        // Redirigir inmediatamente
        window.open(waUrl, '_blank');

        // Hacer la reserva en background sin bloquear al usuario
        fetch("/agendarVisita", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: clientName,
                telefono: clientPhone,
                start: bookingSlot.start,
                end: bookingSlot.end,
                originalEventId: bookingSlot.originalEventId
            })
        }).catch(error => {
            console.error("Error silencioso al agendar:", error);
        });

        // Cerrar el modal y limpiar
        setBookingSlot(null);
        setClientName('');
        setClientPhone('');
    };


    return (
        <Container>
            <ContentWrapper>
                <SlotsCard>
                    <EditableField
                        as={Title}
                        fieldKey="horarios_title"
                        value={displayTitle}
                        isEditable={isEditable}
                        editingField={editingField}
                        setEditingField={setEditingField}
                        onSave={onSave}
                    />
                    {isEditable && currentUser && (
                        <AdminControls>
                            <EditButton onClick={openEditModal}>
                                <FaEdit /> Editar mensaje de WhatsApp
                            </EditButton>
                        </AdminControls>
                    )}
                    <EditableField
                        as={Description}
                        fieldKey="horarios_desc"
                        value={displayDesc}
                        isEditable={isEditable}
                        editingField={editingField}
                        setEditingField={setEditingField}
                        onSave={onSave}
                    />
                    
                    {isLoading ? (
                        <LoadingText>Cargando horarios...</LoadingText>
                    ) : (
                        Array.isArray(formattedSlots) && formattedSlots.length > 0 ? (
                            formattedSlots.map((slot, index) => {
                                const now = new Date();
                                const isSoon = new Date(slot.start).getTime() - now.getTime() < 2 * 60 * 60 * 1000;
                                return (
                                    <SlotItem key={index}>
                                        <SlotText>{slot.formatted}</SlotText>
                                        <AgendarButton 
                                            as="button"
                                            onClick={() => handleAgendarClick(slot)}
                                            disabled={isSoon}
                                            title={isSoon ? "No se puede agendar con tan poca anticipación" : "Agendar visita"}
                                        >
                                            Agendar
                                        </AgendarButton>
                                    </SlotItem>
                                );
                            })
                        ) : (
                            <NoSlotsText>Por el momento no hay nuevos horarios de visita confirmados.</NoSlotsText>
                        )
                    )}
                </SlotsCard>
            </ContentWrapper>
            
            {/* Modal para editar plantilla */}
            {isEditing && (
                <ModalOverlay onClick={() => setIsEditing(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <h3>Editar mensaje predefinido de WhatsApp</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                            Usa <strong>{'{fecha_horario}'}</strong> donde quieras que aparezca la fecha seleccionada (ej: "jueves 24/8 a las 16:00 hs").
                        </p>
                        <TextArea 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={4}
                        />
                        <ModalActions>
                            <CancelButton onClick={() => setIsEditing(false)}>Cancelar</CancelButton>
                            <SaveButton onClick={handleSaveMessage}>Guardar cambios</SaveButton>
                        </ModalActions>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Modal para agendar visita */}
            {bookingSlot && (
                <ModalOverlay onClick={() => setBookingSlot(null)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                            <form onSubmit={handleConfirmBooking}>
                                <h3 style={{ marginTop: 0, color: '#1B3168', marginBottom: '15px' }}>Agendar visita</h3>
                                <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '20px' }}>
                                    Fecha elegida: <strong>{bookingSlot.formatted}</strong>
                                </p>
                                <Input 
                                    ref={nameInputRef}
                                    type="text" 
                                    placeholder="Tu nombre completo" 
                                    value={clientName} 
                                    onChange={e => setClientName(e.target.value)} 
                                    onKeyDown={handleNameKeyDown}
                                    required
                                />
                                <Input 
                                    ref={phoneInputRef}
                                    type="tel" 
                                    placeholder="Tu número de teléfono (WhatsApp)" 
                                    value={clientPhone} 
                                    onChange={e => setClientPhone(e.target.value)} 
                                    onKeyDown={handlePhoneKeyDown}
                                    required
                                />
                                <ModalActions>
                                    <CancelButton type="button" onClick={() => setBookingSlot(null)}>Cancelar</CancelButton>
                                    <SaveButton type="submit">Confirmar y contactar</SaveButton>
                                </ModalActions>
                            </form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
};

export default HorariosVisita;

const Container = styled.section`
    width: 100%;
    background-color: transparent;
    padding-top: 2rem;
    padding-bottom: 4rem;
    margin: auto;
    display: flex;
    justify-content: center;
`;

const ContentWrapper = styled.div`
    width: 100%;
    margin: auto;
    text-align: center;
    color: var(--app-text-color, #000);

    @media (max-width: 1023px) {
        max-width: 600px;
        width: 65%;
    }
`;

const Title = styled.h2`
    font-size: 1.5rem;
    text-align: center;
    color: var(--app-primary-text-color, var(--primary-color));
    padding-bottom: 2rem;
`;

const Description = styled.p`
    font-size: 1rem;
    color: var(--app-text-color, #000);
    margin-bottom: 2rem;
    line-height: 1.5;
    text-align: center;
`;

const LoadingText = styled.p`
    font-size: 1.1rem;
    color: #888;
    font-style: italic;
`;

const SlotsCard = styled.div`
    background-color: var(--card-grey);
    border: 1px solid #eaeaea;
    border-radius: 10px;
    padding: 25px;
    text-align: left;
    margin: 0 auto;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);

    @media (max-width: 1023px) {
        padding: 15px;
    }
`;

const SlotItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eaeaea;
    
    &:last-child {
        border-bottom: none;
    }
`;

const SlotText = styled.span`
    font-size: 1.2rem;
    color: #333;
    font-weight: bold;
    text-transform: capitalize;

    &::before {
        content: "🕒 ";
    }
`;

const AgendarButton = styled.a`
    font-family: "product_sansregular", sans-serif;
    background-color: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    font-size: 0.95rem;
    font-weight: bold;
    text-decoration: none;
    transition: filter 0.2s ease, transform 0.1s ease;
    display: inline-block;
    white-space: nowrap;
    margin-left: 15px;
    cursor: pointer;

    &:hover {
        filter: brightness(0.9);
        transform: scale(1.02);
    }
    
    &:active {
        transform: scale(0.98);
    }
    
    &:disabled {
        background-color: #999;
        cursor: not-allowed;
        transform: none;
    }

    @media (max-width: 480px) {
        font-size: 0.85rem;
        padding: 6px 12px;
        margin-left: 10px;
    }
`;

const NoSlotsText = styled.p`
    font-size: 1.1rem;
    color: #ff6b6b;
    text-align: center;
    font-weight: 500;
`;

const AdminControls = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
`;
const EditButton = styled.button`
    font-family: "product_sansregular", sans-serif;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 8px 15px;
    border-radius: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #333;
    transition: all 0.2s ease;
    &:hover { background-color: #e0e0e0; }
`;
const ModalOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
`;
const ModalContent = styled.div`
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 90%;
    max-width: 450px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
`;
const TextArea = styled.textarea`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    font-family: "product_sansregular", sans-serif;
    resize: vertical;
    margin-bottom: 20px;
    &:focus { outline: none; border-color: #666; }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    margin-bottom: 15px;
    font-family: "product_sansregular", sans-serif;
    &:focus { outline: none; border-color: #25D366; }
`;

const ModalActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
`;
const CancelButton = styled.button`
    font-family: "product_sansregular", sans-serif;
    padding: 8px 16px;
    background: #f1f1f1;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    &:disabled { opacity: 0.7; cursor: not-allowed; }
`;
const SaveButton = styled.button`
    font-family: "product_sansregular", sans-serif;
    padding: 8px 16px;
    background: #25D366;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    &:disabled { opacity: 0.7; cursor: not-allowed; }
`;
const BackButton = styled.button` 
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #666;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 20px;
    padding: 0;
    font-weight: 500;
    transition: color 0.2s;
    &:hover {
        color: #1B3168;
    }
`;
