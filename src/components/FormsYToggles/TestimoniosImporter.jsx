import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import Tesseract from 'tesseract.js';
import { askGroqAI } from '../../services/groqService';

const ImporterContainer = styled.div`
  background: #f8fbff;
  border: 2px dashed #0066cc;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  transition: background 0.2s ease;

  &:hover {
    background: #eef6ff;
  }
`;

const ImporterInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  font-family: inherit;
  resize: vertical;
`;

const ImporterActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const systemPrompt = `Eres un asistente que extrae testimonios de Google Maps a partir del texto extraído de una captura.
Extrae la información y devuelve un JSON estricto con el siguiente formato.
Si no encuentras texto de la reseña, fíjate si solo hay una respuesta del propietario, y en ese caso deja el texto de la reseña vacío.
{
  "nombre": "Nombre del Cliente",
  "texto": "Texto de la reseña (vacío si solo hay estrellas o respuesta del dueño)",
  "calificacion": "5",
  "fecha": "YYYY-MM-DD",
  "es_local_guide": true o false,
  "opiniones_usuario": "número de opiniones si aparece (ej: 18)",
  "fotos_usuario": "número de fotos si aparece (ej: 2)",
  "red": "Google"
}
Calcula la fecha aproximada (si dice 'hace 8 meses', réstale 8 meses a hoy).
Si no hay mención a las estrellas, asume que es "5".
No devuelvas NADA más que el JSON puro, sin bloques \`\`\`json ni texto adicional.`;

export default function TestimoniosImporter({ onImport }) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        await processImage(file);
        break;
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processImage(file);
    }
  };

      const processImage = async (file) => {
    setIsProcessing(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      toast.info('Escaneando texto de la imagen (puede demorar unos segundos)...', { autoClose: 3000, toastId: "ocr" });

      const { data: { text } } = await Tesseract.recognize(
        dataUrl,
        'spa',
        { logger: m => console.log(m) }
      );

      if (!text || text.trim().length === 0) {
        throw new Error("No se pudo detectar texto en la imagen.");
      }

      const response = await askGroqAI(
        `Extrae los datos de este texto que fue escaneado de una reseña: ${text}`,
        systemPrompt
      );
      
      handleAIResponse(response);
    } catch (error) {
      console.error(error);
      toast.error(`Error de IA (Imagen): ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
    if (!inputText.trim()) return toast.warning('Pega texto primero.');
    setIsProcessing(true);
    try {
      const response = await askGroqAI(
        `Extrae los datos de este texto: ${inputText}`,
        systemPrompt
      );
      handleAIResponse(response);
      setInputText('');
    } catch (error) {
      console.error(error);
      toast.error(`Error de IA (Texto): ${error.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIResponse = (response) => {
    try {
      // Limpiar posible formato markdown residual
      const cleanJson = response.replace(/```json/gi, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      const today = new Date().toISOString().split('T')[0];
      const newTestimonio = {
        nombre: data.nombre || 'Sin nombre',
        texto: data.texto || '',
        avatar: data.nombre ? data.nombre.charAt(0).toUpperCase() : 'S',
        calificacion: data.calificacion?.toString() || '5',
        fecha: data.fecha || today,
        es_local_guide: data.es_local_guide !== undefined ? data.es_local_guide : true,
        opiniones_usuario: data.opiniones_usuario || '',
        fotos_usuario: data.fotos_usuario || '',
        link_opinion_completa: '',
        es_nuevo: true,
        red: data.red || 'Google'
      };

      onImport(newTestimonio);
      toast.success('¡Testimonio mágico importado! Revisa la lista abajo.');
    } catch (error) {
      console.error("Error parseando respuesta:", response, error);
      toast.error('La IA no devolvió un formato válido. Intenta de nuevo.');
    }
  };

  return (
    <ImporterContainer onPaste={handlePaste}>
      <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>✨ Importador Mágico (IA)</h3>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '15px' }}>
        <strong>Pegá una captura de pantalla (Ctrl+V)</strong> o escribí/pegá texto de Google Maps aquí abajo. La Inteligencia Artificial extraerá los datos automáticamente.
      </p>
      
      <ImporterInput 
        placeholder="Pegá aquí el texto o presiona Ctrl+V para pegar una imagen de la reseña..." 
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        disabled={isProcessing}
      />

      <ImporterActions>
        <button 
          type="button"
          onClick={handleProcessText} 
          disabled={isProcessing}
          style={{ background: '#0066cc' }}
        >
          {isProcessing ? 'Procesando...' : 'Extraer desde Texto'}
        </button>

        <label style={{
           padding: '12px 25px', background: '#008800', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
        }}>
          {isProcessing ? 'Procesando...' : '📷 Subir Captura'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={isProcessing} />
        </label>
      </ImporterActions>
    </ImporterContainer>
  );
}
