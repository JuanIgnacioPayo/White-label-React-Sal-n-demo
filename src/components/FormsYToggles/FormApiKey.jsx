import styled from "styled-components";
import { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, set, get } from "firebase/database";
import { toast } from 'react-toastify';

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

const Input = styled.input`
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

const FormApiKey = () => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [loading, setLoading] = useState(true);

  const db = getDatabase(app);
  const apiKeyRef = ref(db, 'config/apiKeys/google_gemini');

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const apiKeySnapshot = await get(apiKeyRef);
        if (apiKeySnapshot.exists()) {
          setGeminiApiKey(apiKeySnapshot.val() || '');
        }
      } catch (error) {
        console.error("Error al cargar la API Key:", error);
        toast.error('Error al cargar la configuración. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  const handleChange = (e) => {
    setGeminiApiKey(e.target.value);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let cleanedKey = (geminiApiKey || '').trim();
      if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
        cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1).trim();
      }

      await set(apiKeyRef, cleanedKey);
      toast.success('¡Clave API guardada exitosamente!');
    } catch (error) {
      console.error("Error al guardar la Clave API:", error);
      toast.error('Error al guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FormContainer><p>Cargando configuración...</p></FormContainer>;
  }

  return (
    <FormContainer>
      <h2>Clave API</h2>
      <p>Configura la clave de acceso para los servicios de inteligencia artificial.</p>

      <FormGroup style={{ backgroundColor: 'rgba(176, 170, 109, 0.08)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(176, 170, 109, 0.2)' }}>
        <Label htmlFor="geminiApiKey" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔑 Clave API de Google Gemini (AI Studio):
        </Label>
        <Input
          type="password"
          id="geminiApiKey"
          name="geminiApiKey"
          value={geminiApiKey}
          onChange={handleChange}
          placeholder="Pega aquí tu API Key de Google AI Studio (ej: AIzaSy...)"
        />
        <small style={{ color: '#555', marginTop: '6px', fontSize: '0.9rem', lineHeight: '1.4' }}>
          Puedes obtener una Clave API <strong>100% gratuita</strong> en <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primaryColor, #b0aa6d)', textDecoration: 'underline', fontWeight: 'bold' }}>Google AI Studio</a>. La versión gratuita admite hasta 1.500 consultas por día, lo cual es ideal para mantener el asistente virtual activo sin costo alguno.
        </small>
      </FormGroup>

      <FloatingButtonContainer>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </FloatingButtonContainer>
    </FormContainer>
  );
};

export default FormApiKey;
