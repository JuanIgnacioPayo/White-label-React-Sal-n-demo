import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const CalendarConfig = ({ eventsCalendarId, holidaysCalendarId, visitSlotsCalendarId, onSave, onCancel }) => {
    const [formState, setFormState] = useState({
        events: eventsCalendarId,
        holidays: holidaysCalendarId,
        visitSlots: visitSlotsCalendarId,
    });

    useEffect(() => {
        setFormState({
            events: eventsCalendarId,
            holidays: holidaysCalendarId,
            visitSlots: visitSlotsCalendarId,
        });
    }, [eventsCalendarId, holidaysCalendarId, visitSlotsCalendarId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSave = () => {
        onSave(formState.events, formState.holidays, formState.visitSlots);
    };

    return (
        <ConfigSection>
            <h3>Configuración de Calendarios</h3>
            <Form>
                <label>
                    ID Calendario de Eventos:
                    <input type="text" name="events" value={formState.events} onChange={handleChange} />
                </label>
                <label>
                    ID Calendario de Feriados:
                    <input type="text" name="holidays" value={formState.holidays} onChange={handleChange} />
                </label>
                <label>
                    ID Calendario de Visitas:
                    <input type="text" name="visitSlots" value={formState.visitSlots} onChange={handleChange} />
                </label>
            </Form>
            <ButtonContainer>
                <button onClick={onCancel}>Cancelar</button>
                <button onClick={handleSave}>Guardar Cambios</button>
            </ButtonContainer>
        </ConfigSection>
    );
};

const ConfigSection = styled.div`
    border: 1px solid var(--border-color, #ccc);
    border-radius: 8px;
    padding: 1rem;
    padding-top: 0px;

    background-color: var(--card-grey, #f9f9f9);
    color: var(--primary-text);
`;

const Form = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;


    label {
        display: flex;
        flex-direction: column;
        font-weight: bold;
        color: var(--primary-text);
    }

    input {
        padding: 0.8rem;
        border: 1px solid var(--border-color, #ccc);
        border-radius: 4px;
        margin-top: 0.5rem;
        font-size: 1rem;
        background-color: var(--input-bg, #ffffff);
        color: var(--primary-text);
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;

    button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;

        &:first-child {
            background-color: var(--hover-bg, #ccc);
            color: var(--primary-text, black);
            border: 1px solid var(--border-color, transparent);
        }

        &:last-child {
            background-color: var(--primary-color);
            color: white;
        }
    }
`;

export default CalendarConfig;
