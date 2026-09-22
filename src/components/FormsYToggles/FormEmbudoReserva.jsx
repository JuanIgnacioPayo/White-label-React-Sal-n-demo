import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { app } from "../../firebase/firebase";
import { getDatabase, ref, onValue, update } from "firebase/database";

const AdminSection = styled.div`
  background-color: var(--card-grey, #f9f9f9);
  padding: 2rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  text-align: left;

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
    margin-top: 1.5rem;
  }

  input, textarea {
    width: 100%;
    padding: 0.8rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 1rem;
    transition: border-color 0.2s;
    font-family: 'product_sansregular';
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--primary-color, #ff6b6b);
    }
  }

  .help-text {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 10px;
    margin-top: 0;
  }
`;

const FormEmbudoReserva = ({ toggle }) => {
    const [whatsappReservaTemplate, setWhatsappReservaTemplate] = useState('');
    const [reservaModalTitle, setReservaModalTitle] = useState('¡Excelente! Tu reserva está casi lista 🚀');
    const [reservaModalText, setReservaModalText] = useState('Recuerda que para confirmarla necesitamos que realices la seña mediante transferencia bancaria. Aquí tienes los datos:');
    const [reservaModalCbu, setReservaModalCbu] = useState('0000000000000000000000');
    const [reservaModalBankDetails, setReservaModalBankDetails] = useState('Alias: ALIAS.BANCO\nTitular: Juan Perez\nBanco: Banco Nación');

    const db = getDatabase(app);

    useEffect(() => {
        const textRef = ref(db, "datosId/29");
        const unsubscribe = onValue(textRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setWhatsappReservaTemplate(data.whatsapp_reserva_template || 'Hola Juan!\n\nQuiero reservar el día *{FECHA}*\n\n*Servicios seleccionados:*\n{CARRITO}\n*Total: ${TOTAL}*\n\nSeña necesaria para reservar: ${SENA}\n\n{LINK}');
                setReservaModalTitle(data.reserva_modal_title || '¡Excelente! Tu reserva está casi lista 🚀');
                setReservaModalText(data.reserva_modal_text || 'Recuerda que para confirmarla necesitamos que realices la seña mediante transferencia bancaria. Aquí tienes los datos:');
                setReservaModalCbu(data.reserva_modal_cbu || '0000000000000000000000');
                setReservaModalBankDetails(data.reserva_modal_bank_details || 'Alias: ALIAS.BANCO\nTitular: Juan Perez\nBanco: Banco Nación');
            }
        });

        return () => unsubscribe();
    }, [db]);

    const handleSaveField = async (fieldKey, value) => {
        const updates = {};
        updates[`/datosId/29/${fieldKey}`] = value;
        try {
            await update(ref(db), updates);
            // Optionally could add a toast notification here if you import your context
            console.log(`Guardado exitoso: ${fieldKey}`);
        } catch (error) {
            console.error("Error al guardar:", error);
        }
    };

    return (
        <div>
            <AdminSection>
                <h2>1. Plantilla de Mensaje de WhatsApp (Botón de Reserva)</h2>
                <p className="help-text">
                    Este es el mensaje que se enviará cuando el usuario haga clic en "Reservar" al final del presupuesto.
                    <br/><br/>
                    Puedes usar las siguientes variables (comodines) que se reemplazarán automáticamente:
                    <br/><b>{'{FECHA}'}</b>: La fecha seleccionada
                    <br/><b>{'{CARRITO}'}</b>: Lista de servicios elegidos y precios
                    <br/><b>{'{TOTAL}'}</b>: Monto total del alquiler
                    <br/><b>{'{SENA}'}</b>: Monto de la seña requerida
                    <br/><b>{'{LINK}'}</b>: Link directo al presupuesto armado
                </p>
                <textarea
                    value={whatsappReservaTemplate}
                    onChange={(e) => setWhatsappReservaTemplate(e.target.value)}
                    onBlur={(e) => handleSaveField('whatsapp_reserva_template', e.target.value)}
                    rows={8}
                />
            </AdminSection>

            <AdminSection>
                <h2>2. Modal de Transferencia Bancaria</h2>
                <p className="help-text">
                    Este mensaje aparecerá en tu página web <b>después</b> de que el usuario envíe el mensaje de WhatsApp, para recordarle que debe hacer la transferencia para confirmar la seña.
                </p>

                <label>Título del Modal</label>
                <input
                    type="text"
                    value={reservaModalTitle}
                    onChange={(e) => setReservaModalTitle(e.target.value)}
                    onBlur={(e) => handleSaveField('reserva_modal_title', e.target.value)}
                />

                <label>Texto de Introducción</label>
                <textarea
                    value={reservaModalText}
                    onChange={(e) => setReservaModalText(e.target.value)}
                    onBlur={(e) => handleSaveField('reserva_modal_text', e.target.value)}
                    rows={3}
                />

                <label>CBU / CVU (Solo el número)</label>
                <input
                    type="text"
                    value={reservaModalCbu}
                    onChange={(e) => setReservaModalCbu(e.target.value)}
                    onBlur={(e) => handleSaveField('reserva_modal_cbu', e.target.value)}
                />

                <label>Resto de los Datos Bancarios (Alias, Banco, Titular)</label>
                <textarea
                    value={reservaModalBankDetails}
                    onChange={(e) => setReservaModalBankDetails(e.target.value)}
                    onBlur={(e) => handleSaveField('reserva_modal_bank_details', e.target.value)}
                    rows={4}
                />
            </AdminSection>
        </div>
    );
};

export default FormEmbudoReserva;
