import styled from "styled-components";
import { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, set, get } from "firebase/database";
import { toast } from 'react-toastify';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  background: var(--cardGrey, #fffbf5);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin-top: 0rem;
  width: 100%;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  gap: 1.5rem;
  padding-bottom: 120px; /* Padding for floating buttons */
  font-family: 'product_sansregular', sans-serif;
`;

const FormHeader = styled.div`
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 15px;
  margin-bottom: 10px;

  h2 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--primaryText, #111241);
    font-weight: bold;
  }

  p {
    margin: 8px 0 0 0;
    color: var(--secondaryText, #666);
    font-size: 0.95rem;
    line-height: 1.4;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  color: var(--primaryText, #111241);
  font-size: 1.1rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid var(--secondaryText, #c6c3c3);
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--whiteText, #ffffff);
  transition: all 0.3s ease;
  font-family: 'product_sansregular', sans-serif;

  &:focus {
    outline: none;
    border-color: var(--primaryColor, #b0aa6d);
    box-shadow: 0 0 0 3px rgba(176, 170, 109, 0.25);
  }

  &:hover {
    border-color: #a0995c;
  }
`;

const InfoBox = styled.div`
  background-color: rgba(176, 170, 109, 0.1);
  border-left: 4px solid var(--primaryColor, #b0aa6d);
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
`;

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const Button = styled.button`
  padding: 12px 30px;
  background-color: var(--primaryColor, #b0aa6d);
  color: var(--whiteText, #ffffff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FormEstadisticas = () => {
  const [stats, setStats] = useState({
    totalVisits: 0,
    likes: 0,
    siteStartDate: '17/05/2023'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const db = getDatabase(app);
  const statsRef = ref(db, 'siteStats');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const snapshot = await get(statsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setStats({
            totalVisits: data.totalVisits !== undefined ? parseInt(data.totalVisits, 10) : 0,
            likes: data.likes !== undefined ? parseInt(data.likes, 10) : 0,
            siteStartDate: data.siteStartDate || '17/05/2023'
          });
        }
      } catch (error) {
        console.error("Error al cargar las estadísticas:", error);
        toast.error('Error al cargar las estadísticas de visitas y me gustas.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStats(prev => ({
      ...prev,
      [name]: name === 'siteStartDate' ? value : parseInt(value, 10) || 0
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Guardamos forzando trainingComplete: true para asegurar que las visitas se vuelvan visibles en el pie
      const updatedStats = {
        ...stats,
        trainingComplete: true,
        trainingStartDate: new Date().toISOString(),
        trainingVisits: stats.totalVisits // Ajustamos visitas de entrenamiento
      };

      await set(statsRef, updatedStats);
      toast.success('¡Estadísticas actualizadas con éxito!');
    } catch (error) {
      console.error("Error al guardar estadísticas:", error);
      toast.error('Error al guardar las estadísticas. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormContainer><p>Cargando estadísticas del sitio...</p></FormContainer>;
  }

  return (
    <FormContainer>
      <FormHeader>
        <h2>Configuración de Estadísticas</h2>
        <p>
          Administra la cantidad de visitas y de "me gustas" que se visualizan en el pie de página público de tu sitio web.
        </p>
      </FormHeader>

      <InfoBox>
        💡 <strong>Nota sobre la visibilidad:</strong> Guardar los cambios aquí activará automáticamente la visualización del contador de visitas en el sitio público, marcando el proceso de inicialización técnica como completado.
      </InfoBox>

      <FormGroup>
        <Label htmlFor="totalVisits">Cantidad de Visitas Totales:</Label>
        <Input
          type="number"
          id="totalVisits"
          name="totalVisits"
          value={stats.totalVisits}
          onChange={handleChange}
          placeholder="Ej: 80000"
          min="0"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="likes">Cantidad de "Me Gusta" (Likes):</Label>
        <Input
          type="number"
          id="likes"
          name="likes"
          value={stats.likes}
          onChange={handleChange}
          placeholder="Ej: 5"
          min="0"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="siteStartDate">Fecha de Inicio del Sitio:</Label>
        <Input
          type="text"
          id="siteStartDate"
          name="siteStartDate"
          value={stats.siteStartDate}
          onChange={handleChange}
          placeholder="DD/MM/AAAA"
        />
      </FormGroup>

      <FloatingButtonContainer>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </FloatingButtonContainer>
    </FormContainer>
  );
};

export default FormEstadisticas;
