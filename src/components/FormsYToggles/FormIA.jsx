import styled from "styled-components";
import { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, set, get } from "firebase/database";
import { toast } from 'react-toastify';

// --- Styled Components (Mismos que antes, se mantienen para consistencia) ---

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--cardGrey, #fffbf5);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0rem;
  width: 100%;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  gap:1rem;
  padding-bottom: 120px; /* Add padding for floating buttons */
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--primaryText, #111241);
  font-size: 1.1rem;
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid var(--secondaryText, #c6c3c3);
  border-radius: 4px;
  font-size: 1rem;
  min-height: 200px; /* Altura para el texto principal de la IA */
  resize: vertical;
  width: calc(100% - 24px);
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: var(--primaryColor, #b0aa6d);
    box-shadow: 0 0 0 2px rgba(176, 170, 109, 0.3);
  }
`;

const Input = styled.input` /* Changed from InputNumber to Input for general use */
  padding: 12px;
  border: 1px solid var(--secondaryText, #c6c3c3);
  border-radius: 4px;
  font-size: 1rem;
  width: calc(100% - 24px);
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: var(--primaryColor, #b0aa6d);
    box-shadow: 0 0 0 2px rgba(176, 170, 109, 0.3);
  }
`;

const ImagePreview = styled.img`
  max-width: 100px;
  max-height: 100px;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  object-fit: contain;
`;


const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const Button = styled.button`
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

  &:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;



// --- Componente FormIA ---
const FormIA = () => {
  const [iaTexts, setIaTexts] = useState({
    texto: '',
    audioSpeed: 1.0
  });
  const [loading, setLoading] = useState(true);

  const db = getDatabase(app);
  const iaTextsRef = ref(db, 'iaTexts');

  // Load IA texts and image URL on component mount
  useEffect(() => {
    const fetchIaTexts = async () => {
      try {
        const iaTextsSnapshot = await get(iaTextsRef);

        let texto = '';
        let audioSpeed = 1.0;

        if (iaTextsSnapshot.exists()) {
          const data = iaTextsSnapshot.val();
          texto = data.texto || '';
          audioSpeed = data.audioSpeed !== undefined ? parseFloat(data.audioSpeed) : 1.0;
        }

        setIaTexts({
          texto,
          audioSpeed
        });
      } catch (error) {
        console.error("Error al cargar los textos de la IA:", error);
        toast.error('Error al cargar la configuración de IA. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchIaTexts();
  }, []);

  // Handle changes in inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setIaTexts(prevTexts => ({
      ...prevTexts,
      [name]: name === 'audioSpeed' ? parseFloat(value) : value
    }));
  };

  // Save changes to the database
  const handleSave = async () => {
    setLoading(true);
    try {
      const iaDataToSave = {
        texto: iaTexts.texto,
        audioSpeed: iaTexts.audioSpeed
      };

      await set(iaTextsRef, iaDataToSave);

      toast.success('¡Configuración de IA guardada exitosamente!');
    } catch (error) {
      console.error("Error al guardar la configuración de la IA:", error);
      toast.error('Error al guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FormContainer><p>Cargando configuración de IA...</p></FormContainer>;
  }

  return (
    <FormContainer>
      <h2>Configuración de Inteligencia Artificial</h2>
      <p>Modifica el texto principal y la velocidad de lectura que la IA de tu aplicación utilizará para interactuar con los usuarios. Cada cambio se guardará automáticamente al hacer clic en "Guardar Cambios".</p>

      <FormGroup>
        <Label htmlFor="audioSpeed">Velocidad del Audio (Ej: 1.0 para normal, 1.5 más rápido, 0.75 más lento):</Label>
        <Input
          type="number"
          id="audioSpeed"
          name="audioSpeed"
          value={iaTexts.audioSpeed}
          onChange={handleChange}
          step="0.1"
          min="0.5"
          max="3.0"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="texto">Texto Principal de la IA:</Label>
        <TextArea
          rows="50"
          id="texto"
          name="texto"
          value={iaTexts.texto}
          onChange={handleChange}
          placeholder="Escribe aquí el texto que tu inteligencia artificial leerá a los usuarios..."
        />
      </FormGroup>




      <FloatingButtonContainer>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </FloatingButtonContainer>
    </FormContainer>
  );
};

export default FormIA;