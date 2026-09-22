import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '../../firebase/firebase';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  max-width: 1100px;
  box-sizing: border-box;
  margin: 1rem auto;
  padding: 1.5rem;
  background-color: transparent; /* Inherit from AdminPage */
  font-family: 'product_sansregular', sans-serif;
  padding-bottom: 150px;
  overflow-x: hidden;
`;

const HeaderSection = styled.div`
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--card-grey, #fdfbf5);
  border-radius: 24px;
  border: 1px solid #e0d9c0;
  box-shadow: 0 10px 30px rgba(148, 137, 36, 0.05);

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const Title = styled.h2`
  color: var(--primary-text, #160529);
  margin-bottom: 1rem;
  font-size: 2.2rem;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.div`
  color: var(--secondary-text, #a79997);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const SectionCard = styled.div`
  width: 100%;
  box-sizing: border-box;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2.5rem;
  border: 1px solid #f0eddf;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const SectionTitle = styled.h3`
  color: var(--primary-color, #948924);
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 24px;
    background: var(--primary-color);
    border-radius: 4px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
  width: 100%;
  box-sizing: border-box;
`;

const RuleItem = styled.div`
  padding: 1.8rem;
  background: #fdfdfb;
  border: 1px solid #f0eee2;
  border-radius: 18px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(148, 137, 36, 0.08);
    border-color: var(--primary-color);
  }
  
  h4 {
    margin: 0;
    color: var(--primary-color);
    font-size: 1.15rem;
    font-weight: bold;
  }
`;

const RuleDetail = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--primary-text);
  
  .label {
    font-weight: bold;
    color: #8a7d5e;
    min-width: 70px;
  }

  .value {
    color: var(--primary-text);
  }
`;

const SelectorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  label {
    font-weight: bold;
    color: var(--primary-text);
    font-size: 1.1rem;
  }

  select {
    padding: 0.8rem 1.2rem;
    border-radius: 12px;
    border: 2px solid #e0d9c0;
    font-size: 0.95rem;
    min-width: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    cursor: pointer;
    background: white;
    color: var(--primary-text);
    outline: none;
    transition: border-color 0.2s;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;

    &:focus {
      border-color: var(--primary-color);
    }
  }
`;

const InfoBanner = styled.div`
  width: 100%;
  box-sizing: border-box;
  background-color: #f8f6e9;
  color: #7a6e4d;
  padding: 1.2rem 1.5rem;
  border-radius: 14px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  border-left: 6px solid var(--primary-color);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const structures = [
  { id: 'dynamic', name: '✨ Sistema Dinámico (Actual)' },
  { id: 'fixed', name: '📅 Estructura Fija (Activar)' },
  { id: 'custom', name: '🛠️ Personalizada (Próximamente)', disabled: true }
];

export default function ScheduleStructureAdmin() {
  const [activeStructure, setActiveStructure] = useState('dynamic');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchActiveStructure = async () => {
      const db = getDatabase(app);
      const structRef = ref(db, 'config/activeScheduleStructure');
      try {
        const snapshot = await get(structRef);
        if (snapshot.exists()) {
          setActiveStructure(snapshot.val());
        } else {
          await set(structRef, 'dynamic');
        }
      } catch (err) {
        console.error("Error fetching active structure:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveStructure();
  }, []);

  useEffect(() => {
    if (saveMessage.text) {
      const timer = setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  const handleStructureChange = async (e) => {
    const newValue = e.target.value;
    setActiveStructure(newValue);
    
    const db = getDatabase(app);
    const structRef = ref(db, 'config/activeScheduleStructure');
    try {
      await set(structRef, newValue);
      setSaveMessage({ text: "Estructura actualizada ✅", type: "success" });
    } catch (err) {
      console.error("Error updating structure:", err);
      setSaveMessage({ text: "Error al actualizar ❌", type: "error" });
    }
  };

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Cargando configuración...</div>;

  return (
    <Container>
      <HeaderSection>
        <Title>Estructura de Horarios</Title>
        <Subtitle>
          Control centralizado de cierres automáticos, duraciones mínimas y reglas de precios según el calendario.
        </Subtitle>
      </HeaderSection>
      
      {saveMessage.text && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: saveMessage.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          {saveMessage.text}
        </div>
      )}

      <InfoBanner>
        <span>💡</span>
        Esta configuración define el comportamiento inteligente del sitio para cada fecha que el cliente selecciona.
      </InfoBanner>

      <SectionCard>
        <SectionTitle>Selección de Modelo</SectionTitle>
        <SelectorWrapper>
          <label htmlFor="structure-select">Modelo Activo:</label>
          <select 
            id="structure-select" 
            value={activeStructure} 
            onChange={handleStructureChange}
          >
            {structures.map(s => (
              <option key={s.id} value={s.id} disabled={s.disabled}>
                {s.name}
              </option>
            ))}
          </select>
        </SelectorWrapper>
      </SectionCard>

      {activeStructure === 'dynamic' ? (
        <SectionCard>
          <SectionTitle>Detalle: Sistema Dinámico</SectionTitle>
          <div style={{marginBottom: '2rem', color: 'var(--secondary-text)', fontSize: '1rem', lineHeight: '1.6'}}>
            El sistema analiza cada fecha, detecta feriados y vísperas, y aplica automáticamente las siguientes reglas:
          </div>
          
          <Grid>
            <RuleItem>
              <h4>☕ Días de Semana (Lun a Jue)</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">21:00 hs</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">3 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Semana"</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🎉 Viernes y Sábados</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">00:00 hs (Medianoche)</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">4 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Finde/Feriado"</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🌞 Domingos (Regulares)</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">21:00 hs</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">4 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Finde/Feriado"</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🔔 Vísperas de Feriado</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">00:00 hs (Medianoche)</span></RuleDetail>
              <RuleDetail><span className="label">Lógica:</span><span className="value">Se activa cierre nocturno extendido</span></RuleDetail>
              <RuleDetail><span className="label">Nota:</span><span className="value">Aplica a cualquier día previo a feriado</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🎄 Navidad y Año Nuevo</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">03:00 hs (Víspera)</span></RuleDetail>
              <RuleDetail><span className="label">Fechas:</span><span className="value">24/12 y 31/12</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">4 Horas fijas</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>📅 Feriados en Semana</h4>
              <RuleDetail><span className="label">Lun-Jue:</span><span className="value">Cierran 21:00 hs si mañana es laborable</span></RuleDetail>
              <RuleDetail><span className="label">Finde Largo:</span><span className="value">Siguen la lógica de Viernes/Sábado</span></RuleDetail>
            </RuleItem>
          </Grid>
        </SectionCard>
      ) : (
        <SectionCard>
          <SectionTitle>Detalle: Estructura Fija</SectionTitle>
          <div style={{marginBottom: '2rem', color: 'var(--secondary-text)', fontSize: '1rem', lineHeight: '1.6'}}>
            Modelo simplificado sin variaciones horarias por vísperas. Ideal para periodos de estabilidad horaria total:
          </div>
          
          <Grid>
            <RuleItem>
              <h4>☕ Lunes a Viernes</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">21:00 hs</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">3 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Semana"</span></RuleDetail>
              <RuleDetail><span className="label">Nota:</span><span className="value">Incluye Viernes como día de semana</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🎉 Sábados y Domingos</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">21:00 hs</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">4 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Finde"</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>📅 Feriados (Cualquier día)</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">21:00 hs</span></RuleDetail>
              <RuleDetail><span className="label">Mínimo:</span><span className="value">4 Horas</span></RuleDetail>
              <RuleDetail><span className="label">Tarifa:</span><span className="value">Precio base "Finde"</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🎄 Navidad y Año Nuevo</h4>
              <RuleDetail><span className="label">Cierre:</span><span className="value">02:00 hs (Víspera)</span></RuleDetail>
              <RuleDetail><span className="label">Fechas:</span><span className="value">24/12 y 31/12</span></RuleDetail>
              <RuleDetail><span className="label">Nota:</span><span className="value">Excepción horaria fija</span></RuleDetail>
            </RuleItem>

            <RuleItem>
              <h4>🚫 Regla de Oro</h4>
              <RuleDetail><span className="label">General:</span><span className="value">Sin variaciones por vísperas</span></RuleDetail>
              <RuleDetail><span className="label">Resto:</span><span className="value">Inamovible a las 21:00 hs</span></RuleDetail>
            </RuleItem>
          </Grid>
        </SectionCard>
      )}
    </Container>
  );
}
