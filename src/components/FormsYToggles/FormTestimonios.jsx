import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { createGlobalStyle, styled } from 'styled-components';
import { toast } from 'react-toastify';
import TestimoniosImporter from './TestimoniosImporter';



const GlobalStyle = createGlobalStyle`
  .form-testimonios {
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

  .form-testimonios h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .testimonio-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .row label {
    flex: 1 1 150px;
    display: flex;
    flex-direction: column;
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .row input,
  .row textarea {
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    font-family: 'product_sansregular';
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  button {
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
  }

  button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
`;

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 10px;
`;

export default function FormTestimonios({ toggle }) {
  const [testimonios, setTestimonios] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchTestimonios = async () => {
      try {
        const db = getDatabase(app);
        const dbRef = ref(db, `datosId/${toggle}/testimonios`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const testimoniosData = snapshot.val();

          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          const processedAndSortedTestimonios = testimoniosData
            .map(testimonio => {
              const testimonialDate = testimonio.fecha ? new Date(testimonio.fecha) : null;
              const esNuevo = testimonialDate ? testimonialDate > oneMonthAgo : false;
              return {
                ...testimonio,
                es_nuevo: esNuevo
              };
            })
            .sort((a, b) => (a.fecha && b.fecha) ? new Date(b.fecha) - new Date(a.fecha) : 0);

          setTestimonios(processedAndSortedTestimonios);
        } else {
          setTestimonios([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestimonios();
  }, [toggle]);

  const handleChange = (index, field, value) => {
    const updated = [...testimonios];
    updated[index][field] = value;

    if (field === 'fecha') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const testimonialDate = new Date(value);
      updated[index].es_nuevo = testimonialDate > oneMonthAgo;
    }

    if (field === 'nombre') {
      if (!updated[index].avatar || updated[index].avatar.length <= 1) {
        updated[index].avatar = value ? value.charAt(0).toUpperCase() : '';
      }
    }

    setTestimonios(updated);
  };

  const handleImportTestimonio = (nuevoTestimonio) => {
    setTestimonios([nuevoTestimonio, ...testimonios]);
  };

  const addTestimonio = () => {
    const today = new Date().toISOString().split('T')[0];
    const newTestimonio = {
      nombre: '',
      texto: '',
      avatar: '',
      calificacion: '5',
      fecha: today,
      es_local_guide: true,
      opiniones_usuario: '',
      fotos_usuario: '',
      link_opinion_completa: '',
      es_nuevo: true,
      red: 'Google',
    };
    setTestimonios([newTestimonio, ...testimonios]);
    toast.success('Nuevo testimonio agregado a la lista.');
  };

  const deleteTestimonio = (index) => {
    const updated = testimonios.filter((_, i) => i !== index);
    setTestimonios(updated);
    toast.success('Testimonio eliminado de la lista.');
  };

  const guardarTestimonios = async () => {
    setIsSaving(true);
    const db = getDatabase(app);
    const dbRef = ref(db, `datosId/${toggle}/testimonios`);

    toast.promise(
      set(dbRef, testimonios),
      {
        pending: 'Guardando testimonios...',
        success: 'Testimonios actualizados con éxito.',
        error: 'Error al guardar los testimonios.'
      }
    ).finally(() => {
      setIsSaving(false);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = formRef.current;
      const focusable = Array.from(form.querySelectorAll('input, textarea'));
      const index = focusable.indexOf(e.target);
      if (index > -1) {
        const nextElement = focusable[index + 1];
        if (nextElement) {
          nextElement.focus();
        } else {
          // if it is the last element, we can blur it
          e.target.blur();
        }
      }
    }
  };



  return (
    <>
      <GlobalStyle />
      <div className="form-testimonios" ref={formRef}>
        <h2>Administrar testimonios de google</h2>
        <TestimoniosImporter onImport={handleImportTestimonio} />
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <p>⏳ Cargando testimonios...</p>
          </div>
        ) : (
          <>
            {testimonios.map((testimonio, index) => (
              <div className="testimonio-card" key={index}>
                <div className="row">
                  <label>Nombre:
                    <input value={testimonio.nombre} onChange={e => handleChange(index, 'nombre', e.target.value)} onKeyDown={handleKeyDown} />
                  </label>
                  <label>Avatar:
                    <input value={testimonio.avatar} onChange={e => handleChange(index, 'avatar', e.target.value)} onKeyDown={handleKeyDown} />
                  </label>
                  <label>Calificación:
                <input type="number" value={testimonio.calificacion} onChange={e => handleChange(index, 'calificacion', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
              <label>Fecha:
                <input type="date" value={testimonio.fecha} onChange={e => handleChange(index, 'fecha', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
            </div>
            <div className="row">
              <label>Texto:
                <textarea value={testimonio.texto} onChange={e => handleChange(index, 'texto', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
            </div>
            <div className="row">
              <label>Opiniones usuario:
                <input value={testimonio.opiniones_usuario} onChange={e => handleChange(index, 'opiniones_usuario', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
              <label>Fotos usuario:
                <input value={testimonio.fotos_usuario} onChange={e => handleChange(index, 'fotos_usuario', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
              <label>Link opinión completa:
                <input value={testimonio.link_opinion_completa} onChange={e => handleChange(index, 'link_opinion_completa', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
            </div>
            <div className="row">
              <label>
                <input type="checkbox" checked={testimonio.es_local_guide} onChange={e => handleChange(index, 'es_local_guide', e.target.checked)} /> Es Local Guide
              </label>
              <label>
                <input type="checkbox" checked={testimonio.es_nuevo || false} readOnly /> Es nuevo
              </label>
              <label>Red:
                <input value={testimonio.red} onChange={e => handleChange(index, 'red', e.target.value)} onKeyDown={handleKeyDown} />
              </label>
            </div>
              <button onClick={() => deleteTestimonio(index)} disabled={isSaving}>Eliminar</button>
            </div>
          ))}
          </>
        )}
      </div>
      <FloatingButtonContainer>
        <button onClick={addTestimonio} disabled={isSaving}>Agregar Testimonio</button>
        <button onClick={guardarTestimonios} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Todos'}
        </button>
      </FloatingButtonContainer>
    </>
  );
}
