import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { app } from '../../firebase/firebase';
import axios from 'axios';
import Clave from '../Calendar/Clave';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  .form-gestion-feriados {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 0rem;
  }

  .form-gestion-feriados h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .gestion-feriados-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .gestion-feriados-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }

  .gestion-feriados-card label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .gestion-feriados-card input[type="date"],
  .gestion-feriados-card input[type="text"] {
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    font-family: 'product_sansregular';
  }

  .gestion-feriados-card input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  .gestion-feriados-card button {
    padding: 8px 16px;
    background-color: var(--primaryColor, #b0aa6d);
    color: var(--whiteText, #ffffff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .gestion-feriados-card button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }

  .gestion-feriados-card ul {
    list-style: none;
    padding: 0;
  }

  .gestion-feriados-card li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0.5rem;
    border-bottom: 1px solid #ccc;
    gap: 10px;
  }

  .gestion-feriados-card li span.text {
    flex: 1;
    word-break: break-word;
  }

  @media screen and (max-width: 480px) {
    .gestion-feriados-card li {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .gestion-feriados-card li > button {
      align-self: flex-end;
    }
  }
`;

const GOOGLE_API_KEY = Clave();



export default function GestionFeriados() {
  const [googleHolidays, setGoogleHolidays] = useState([]);
  const [modifiedHolidays, setModifiedHolidays] = useState({ added: {}, removed: {} });
  const [recurringHolidays, setRecurringHolidays] = useState({});
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', isRecurring: false });
  const [loading, setLoading] = useState(true);

  const fetchGoogleHolidays = useCallback(async () => {
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/es.ar.official%23holiday@group.v.calendar.google.com/events', {
        params: {
          key: GOOGLE_API_KEY,
          timeMin: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          timeMax: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        }
      });
      const events = response.data.items.map(event => ({
        date: event.start.date,
        name: event.summary
      }));
      setGoogleHolidays(events);
    } catch (error) {
      console.error('Error fetching Google holidays:', error);
    }
  }, []);

  const fetchModifiedHolidays = useCallback(async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'feriados_modificados');
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setModifiedHolidays({
          added: data.added || {},
          removed: data.removed || {}
        });
      } else {
        setModifiedHolidays({ added: {}, removed: {} });
      }
    } catch (error) {
      console.error('Error fetching modified holidays:', error);
    }
  }, []);

  const fetchRecurringHolidays = useCallback(async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'feriados_recurrentes');
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setRecurringHolidays(snapshot.val());
      } else {
        setRecurringHolidays({});
      }
    } catch (error) {
      console.error('Error fetching recurring holidays:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchGoogleHolidays(),
        fetchModifiedHolidays(),
        fetchRecurringHolidays()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchGoogleHolidays, fetchModifiedHolidays, fetchRecurringHolidays]);

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('Por favor, complete la fecha y el nombre del feriado.');
      return;
    }
    const db = getDatabase(app);

    if (newHoliday.isRecurring) {
      const dateParts = newHoliday.date.split('-');
      const monthDayKey = `${dateParts[1]}-${dateParts[2]}`; // MM-DD
      const dbRef = ref(db, `feriados_recurrentes/${monthDayKey}`);
      await set(dbRef, { name: newHoliday.name, monthDay: monthDayKey });
    } else {
      const dateKey = newHoliday.date.replace(/-/g, '');
      const dbRef = ref(db, `feriados_modificados/added/${dateKey}`);
      await set(dbRef, newHoliday);
    }
    setNewHoliday({ date: '', name: '', isRecurring: false });
    fetchModifiedHolidays();
    fetchRecurringHolidays();
  };

  const handleRemoveHoliday = async (holiday) => {
    const db = getDatabase(app);
    const dateKey = holiday.date.replace(/-/g, '');
    const dbRef = ref(db, `feriados_modificados/removed/${dateKey}`);
    await set(dbRef, holiday);
    fetchModifiedHolidays();
  };

  const handleRestoreHoliday = async (holiday) => {
    const db = getDatabase(app);
    const dateKey = holiday.date.replace(/-/g, '');
    const dbRef = ref(db, `feriados_modificados/removed/${dateKey}`);
    await remove(dbRef);
    fetchModifiedHolidays();
  };

  const handleUndoAddHoliday = async (holiday) => {
    const db = getDatabase(app);
    const dateKey = holiday.date.replace(/-/g, '');
    const dbRef = ref(db, `feriados_modificados/added/${dateKey}`);
    await remove(dbRef);
    fetchModifiedHolidays();
  };

  const handleRemoveRecurringHoliday = async (holiday) => {
    const db = getDatabase(app);
    const dbRef = ref(db, `feriados_recurrentes/${holiday.monthDay}`);
    await remove(dbRef);
    fetchRecurringHolidays();
  };

  const finalHolidays = googleHolidays
    .filter(h => !modifiedHolidays.removed[h.date.replace(/-/g, '')])
    .map(h => ({ ...h, id: `google-${h.date}` })) // Add unique id for Google holidays
    .concat(Object.values(modifiedHolidays.added).map(h => ({ ...h, id: `added-${h.date}` }))); // Add unique id for added holidays

  return (
    <>
      <GlobalStyle />
      <div className="form-gestion-feriados">
        <h2>Gestión de Feriados</h2>
        {loading ? <p>Cargando feriados...</p> : (
          <>
            <div className="gestion-feriados-card">
              <h3>Agregar Nuevo Feriado</h3>
              <div className="form-group">
                <label htmlFor="newHolidayDate">Fecha</label>
                <input
                  type="date"
                  id="newHolidayDate"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newHolidayName">Nombre</label>
                <input
                  type="text"
                  id="newHolidayName"
                  placeholder="Nombre del feriado"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newHoliday.isRecurring}
                  onChange={(e) => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })}
                />
                <label htmlFor="isRecurring">Feriado Recurrente (todos los años)</label>
              </div>
              <button onClick={handleAddHoliday}>Agregar</button>
            </div>

            <div className="gestion-feriados-card">
              <h3>Feriados Activos</h3>
              <ul>
                {finalHolidays.sort((a, b) => new Date(a.date) - new Date(b.date)).map(holiday => (
                  <li key={holiday.id}>
                    {holiday.date} - {holiday.name}
                    <button onClick={() => handleRemoveHoliday(holiday)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gestion-feriados-card">
              <h3>Feriados Eliminados</h3>
              <ul>
                {Object.values(modifiedHolidays.removed).map(holiday => (
                  <li key={`removed-${holiday.date}`}>
                    {holiday.date} - {holiday.name}
                    <button onClick={() => handleRestoreHoliday(holiday)}>Restaurar</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gestion-feriados-card">
              <h3>Feriados Agregados Manualmente</h3>
              <ul>
                {Object.values(modifiedHolidays.added).map(holiday => (
                  <li key={`added-${holiday.date}`}>
                    {holiday.date} - {holiday.name}
                    <button onClick={() => handleUndoAddHoliday(holiday)}>Deshacer</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gestion-feriados-card">
              <h3>Feriados Recurrentes</h3>
              <ul>
                {Object.values(recurringHolidays).map(holiday => (
                  <li key={`recurring-${holiday.monthDay}`}>
                    {holiday.monthDay} - {holiday.name}
                    <button onClick={() => handleRemoveRecurringHoliday(holiday)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}