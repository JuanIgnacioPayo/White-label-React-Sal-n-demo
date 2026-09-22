import React, { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, get, set } from "firebase/database";
import styled, { createGlobalStyle } from "styled-components";
import { toast } from 'react-toastify';

const GlobalStyle = createGlobalStyle`


  .form-gestion-calendarios {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 20px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 0rem;
  }

  .form-gestion-calendarios h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .gestion-calendarios-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .gestion-calendarios-card label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .gestion-calendarios-card input {
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    font-family: 'product_sansregular';
  }

  .gestion-calendarios-card button {
    padding: 12px 25px;
    background-color: var(--primaryColor, #b0aa6d);
    color: var(--whiteText, #ffffff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    margin-right: 10px;
  }

  .gestion-calendarios-card button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
`;

const GestionCalendarios = () => {
    const [calendarIds, setCalendarIds] = useState({
        eventsCalendarId: '',
        holidaysCalendarId: '',
        visitSlotsCalendarId: '',
        scheduledVisitsCalendarId: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const db = getDatabase();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const calendarConfigRef = ref(db, 'config/calendarIDs');

            const calendarSnapshot = await get(calendarConfigRef);

            if (calendarSnapshot.exists()) {
                setCalendarIds(calendarSnapshot.val());
            }
        } catch (error) {
            toast.error("Error al cargar la configuración.");
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [db]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCalendarChange = (e) => {
        const { name, value } = e.target;
        setCalendarIds(prevState => ({ ...prevState, [name]: value }));
    };


    const handleCalendarSave = async () => {
        setIsSaving(true);
        const configRef = ref(db, 'config/calendarIDs');
        toast.promise(
            set(configRef, calendarIds),
            {
                pending: 'Guardando configuración de calendarios...',
                success: 'Configuración de calendarios guardada.',
                error: 'Error al guardar configuración de calendarios.'
            }
        ).finally(() => setIsSaving(false));
    };


    if (isLoading) {
        return <p>Cargando configuración...</p>;
    }

    return (
        <>
            <GlobalStyle />
            <div className="form-gestion-calendarios">
                <h2>Gestionar IDs de Calendarios de Google</h2>
                <div className="gestion-calendarios-card">
                    <div className="form-group">
                        <label htmlFor="eventsCalendarId">ID Calendario de Eventos (Salón)</label>
                        <input
                            type="text"
                            id="eventsCalendarId"
                            name="eventsCalendarId"
                            value={calendarIds.eventsCalendarId}
                            onChange={handleCalendarChange}
                            placeholder="ej: demo@salonmagiceventos.com.ar"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="holidaysCalendarId">ID Calendario de Feriados</label>
                        <input
                            type="text"
                            id="holidaysCalendarId"
                            name="holidaysCalendarId"
                            value={calendarIds.holidaysCalendarId}
                            onChange={handleCalendarChange}
                            placeholder="ej: es.ar.official#holiday@group.v.calendar.google.com"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="visitSlotsCalendarId">ID Calendario de Disponibilidad de Visitas</label>
                        <input
                            type="text"
                            id="visitSlotsCalendarId"
                            name="visitSlotsCalendarId"
                            value={calendarIds.visitSlotsCalendarId || ''}
                            onChange={handleCalendarChange}
                            placeholder="ej: a0fjsiu8np8eq3nhsg8lgjg6io@group.calendar.google.com"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="scheduledVisitsCalendarId">ID Calendario de Visitas Confirmadas</label>
                        <input
                            type="text"
                            id="scheduledVisitsCalendarId"
                            name="scheduledVisitsCalendarId"
                            value={calendarIds.scheduledVisitsCalendarId || ''}
                            onChange={handleCalendarChange}
                            placeholder="ej: visitas@group.calendar.google.com"
                        />
                    </div>
                    <button onClick={handleCalendarSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>


            </div>
        </>
    );
};

export default GestionCalendarios;
