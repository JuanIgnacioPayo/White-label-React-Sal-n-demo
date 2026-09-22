import React, { useState, useEffect, useMemo } from 'react';
import { ReactSortable } from "react-sortablejs";
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { getDatabase, ref as dbRef, push, remove, update, onValue } from 'firebase/database';
import { app } from '../firebase/firebase';
import { useAuth } from '../contexts/authContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import EditableText from '../components/EditableText';
import { uploadToFirebaseStorage } from '../utils/storageUpload';
import SEO from '../components/SEO';
import { useSiteContext } from '../contexts/SiteContext';

const EmpleosPage = () => {
  const { currentUser } = useAuth();
  const { siteName } = useSiteContext();
  const db = getDatabase(app);
  
  const [vacantes, setVacantes] = useState({});
  const [postulaciones, setPostulaciones] = useState({});
  const [proveedores, setProveedores] = useState({});
  const [config, setConfig] = useState({});

  const sortedVacantes = useMemo(() => {
    return Object.entries(vacantes)
      .map(([id, vac]) => ({ id, ...vac }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [vacantes]);

  const handleReorderVacantes = (newList) => {
    const updates = {};
    newList.forEach((vac, index) => {
      updates[`empleos/vacantes/${vac.id}/order`] = index;
    });
    update(dbRef(db), updates);
  };
  
  const [activeColumn, setActiveColumn] = useState('none');
  
  const [isEditingVacante, setIsEditingVacante] = useState(false);
  const [currentVacanteId, setCurrentVacanteId] = useState(null);
  const [vacanteData, setVacanteData] = useState({ titulo: '', descripcion: '', horas: '', isPaused: false, contratos: [] });
  
  const [isApplying, setIsApplying] = useState(false);
  const [applyingTo, setApplyingTo] = useState(null);
  const [showPausedAlert, setShowPausedAlert] = useState(false);
  const [pendingApplyVac, setPendingApplyVac] = useState(null);
  const [postulanteData, setPostulanteData] = useState({ nombre: '', contacto: '', sueldo: '', rolesSeleccionados: [] });
  const [cvFile, setCvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // External services state
  const initialProveedorState = { nombre: '', rubro: '', contacto: '', descripcion: '', comision: '' };
  const [proveedorData, setProveedorData] = useState(initialProveedorState);
  const [isSubmittingProveedor, setIsSubmittingProveedor] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const vacantesRef = dbRef(db, 'empleos/vacantes');
    const unsubVacantes = onValue(vacantesRef, (snapshot) => {
      setVacantes(snapshot.exists() ? snapshot.val() : {});
    });
    
    const postulacionesRef = dbRef(db, 'empleos/postulaciones');
    const unsubPostulaciones = onValue(postulacionesRef, (snapshot) => {
      setPostulaciones(snapshot.exists() ? snapshot.val() : {});
    });

    const proveedoresRef = dbRef(db, 'empleos/proveedores');
    const unsubProveedores = onValue(proveedoresRef, (snapshot) => {
      setProveedores(snapshot.exists() ? snapshot.val() : {});
    });
    
    const configRef = dbRef(db, 'empleos/config');
    const unsubConfig = onValue(configRef, (snapshot) => {
      setConfig(snapshot.exists() ? snapshot.val() : {});
    });
    
    return () => {
      unsubVacantes();
      unsubPostulaciones();
      unsubProveedores();
      unsubConfig();
    };
  }, [db]);
  
  const handleSaveVacante = async (e) => {
    e.preventDefault();
    try {
      if (currentVacanteId) {
        await update(dbRef(db, `empleos/vacantes/${currentVacanteId}`), vacanteData);
      } else {
        await push(dbRef(db, 'empleos/vacantes'), { ...vacanteData, createdAt: Date.now() });
      }
      setIsEditingVacante(false);
      setVacanteData({ titulo: '', descripcion: '', horas: '', isPaused: false, contratos: [] });
      setCurrentVacanteId(null);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };
  
  const handleDeleteVacante = async (id) => {
    if (window.confirm('¿Seguro que querés eliminar esta vacante?')) {
      try {
        await remove(dbRef(db, `empleos/vacantes/${id}`));
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

  const handleTogglePause = async (id, vac) => {
    try {
      await update(dbRef(db, `empleos/vacantes/${id}`), { isPaused: !vac.isPaused });
    } catch (err) {
      alert("Error al pausar: " + err.message);
    }
  };
  
  const handleEditVacante = (id, data) => {
    setCurrentVacanteId(id);
    setVacanteData({ ...data, isPaused: data.isPaused || false });
    setIsEditingVacante(true);
  };
  
  const handleApply = (id, titulo, horas, isPaused) => {
    if (isPaused) {
      setPendingApplyVac({ id, titulo, horas });
      setShowPausedAlert(true);
    } else {
      setApplyingTo({ id, titulo, horas, isPaused: false });
      setPostulanteData({ nombre: '', contacto: '', sueldo: '', rolesSeleccionados: [] });
      setCvFile(null);
      setIsApplying(true);
    }
  };
  
  const handleSubmitPostulacion = async (e) => {
    e.preventDefault();
    
    let cvUrl = '';
    if (cvFile) {
      setIsUploading(true);
      try {
        cvUrl = await uploadToFirebaseStorage(cvFile);
      } catch (err) {
        setIsUploading(false);
        alert('Error subiendo el CV: ' + err.message);
        return;
      }
    }
    
    try {
      const isGeneral = applyingTo?.isGeneral;
      const dataToSave = {
        nombre: postulanteData.nombre,
        contacto: postulanteData.contacto,
        sueldo: postulanteData.sueldo,
        cvUrl,
        vacanteId: isGeneral ? 'general' : applyingTo.id,
        vacanteTitulo: isGeneral ? 'Postulación General' : applyingTo.titulo,
        rolesSeleccionados: isGeneral 
          ? (postulanteData.rolesSeleccionados || []).map(vid => vacantes[vid]?.titulo).filter(Boolean) 
          : [],
        horas: applyingTo.horas || 'N/A',
        timestamp: Date.now()
      };

      await push(dbRef(db, 'empleos/postulaciones'), dataToSave);
      setIsApplying(false);
      setApplyingTo(null);
      setCvFile(null);
      setIsUploading(false);
      alert('¡Postulación enviada con éxito!');
    } catch (err) {
      setIsUploading(false);
      alert('Error enviando postulación: ' + err.message);
    }
  };

  const handleProveedorSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProveedor(true);
    try {
      await push(dbRef(db, 'empleos/proveedores'), {
        ...proveedorData,
        timestamp: Date.now()
      });
      alert('¡Propuesta enviada con éxito! Nos pondremos en contacto pronto.');
      setProveedorData(initialProveedorState);
    } catch (err) {
      alert('Error enviando la propuesta: ' + err.message);
    } finally {
      setIsSubmittingProveedor(false);
    }
  };
  
  const handleDeletePostulacion = async (id) => {
    if (window.confirm('¿Seguro que querés eliminar esta postulación?')) {
      try {
        await remove(dbRef(db, `empleos/postulaciones/${id}`));
      } catch (err) {
        alert("Error al eliminar postulación: " + err.message);
      }
    }
  };

  const handleDeleteProveedor = async (id) => {
    if (window.confirm('¿Seguro que querés eliminar este proveedor?')) {
      try {
        await remove(dbRef(db, `empleos/proveedores/${id}`));
      } catch (err) {
        alert("Error al eliminar proveedor: " + err.message);
      }
    }
  };

  const sortedPostulaciones = Object.entries(postulaciones).sort((a, b) => b[1].timestamp - a[1].timestamp);

  return (
    <>
      <SEO
        title={`Trabajá con Nosotros - ${siteName}`}
        description={`Oportunidades laborales en ${siteName}. Sumate a nuestro equipo de trabajo en el salón de eventos.`}
        url="/trabaja-con-nosotros"
      />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: '#fdfced', padding: '10px 20px', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>←</span> 
          <span style={{ fontFamily: "'playlistscript', cursive", fontSize: '1.4rem', paddingTop: '3px' }}>{siteName || 'Salón Magic Eventos'}</span>
        </Link>
        <div className="layout-toggles" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="toggle-btn" 
            style={{ 
              padding: '6px 15px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              borderRadius: '20px',
              border: activeColumn === 'none' || activeColumn === 'empleos' ? '2px solid var(--primary-color)' : '2px solid #ccc',
              backgroundColor: activeColumn === 'none' || activeColumn === 'empleos' ? 'var(--primary-color)' : 'transparent',
              color: activeColumn === 'none' || activeColumn === 'empleos' ? 'white' : '#999',
              cursor: 'pointer',
              transition: 'all 0.3s' 
            }} 
            onClick={() => setActiveColumn('empleos')}
          >
            Busco trabajo
          </button>
          <button 
            className="toggle-btn" 
            style={{ 
              padding: '6px 15px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              borderRadius: '20px',
              border: activeColumn === 'none' || activeColumn === 'proveedores' ? '2px solid var(--primary-color)' : '2px solid #ccc',
              backgroundColor: activeColumn === 'none' || activeColumn === 'proveedores' ? 'var(--primary-color)' : 'transparent',
              color: activeColumn === 'none' || activeColumn === 'proveedores' ? 'white' : '#999',
              cursor: 'pointer',
              transition: 'all 0.3s' 
            }} 
            onClick={() => setActiveColumn('proveedores')}
          >
            Quiero que ofrezcan mis servicios
          </button>
        </div>
      </div>
      <Container style={{ paddingTop: '80px' }}>
        <div className={`columns-wrapper active-${activeColumn}`}>
          <div className="col-empleos" onClick={() => setActiveColumn('empleos')} style={{ cursor: activeColumn !== 'empleos' ? 'pointer' : 'default' }}>
        <EditableText 
          as="h1"
          value={config?.tituloBolsa || 'Bolsa de Trabajo'}
          onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { tituloBolsa: newVal })}
          isEditable={!!currentUser}
        />
        <EditableText 
          as="p"
          className="subtitle"
          value={config?.subtituloBolsa || 'Sumate a nuestro equipo. Conocé las vacantes disponibles y postulate.'}
          onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { subtituloBolsa: newVal })}
          isEditable={!!currentUser}
          isTextArea={true}
        />
        
        {currentUser && (
          <button className="btn-primary admin-btn" onClick={() => {
            setVacanteData({ titulo: '', descripcion: '', horas: '', isPaused: false, contratos: [] });
            setCurrentVacanteId(null);
            setIsEditingVacante(true);
          }}>
            + Nueva Vacante (Admin)
          </button>
        )}

        <div className="vacantes-list">
          {Object.keys(vacantes).length === 0 ? (
            <div className="vacantes-list">
              <p style={{textAlign: 'center', marginTop: '20px'}}>Actualmente no hay vacantes abiertas.</p>
            </div>
          ) : (
            <ReactSortable
              list={sortedVacantes}
              setList={handleReorderVacantes}
              animation={200}
              handle=".drag-handle"
              ghostClass="sortable-ghost"
              disabled={!currentUser}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
            {sortedVacantes.map((vac) => {
              const id = vac.id;
              return (
              <div key={id} className={`vacante-card ${vac.isPaused ? 'paused' : ''}`} title={vac.isPaused ? "Este puesto no está siendo requerido por la empresa pero de todas formas podés dejar tu CV." : ""}>
                {vac.isPaused && <div className="paused-overlay">Oferta Pausada</div>}
                {currentUser && (
                  <div 
                    className="drag-handle" 
                    style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'grab', color: '#ccc', padding: '5px', fontSize: '1.2rem', zIndex: 10 }}
                    title="Arrastrar para reordenar"
                  >
                    ☰
                  </div>
                )}
                <h3>
                  <EditableText 
                    value={vac.titulo}
                    onSave={async (newVal) => {
                      if (newVal !== vac.titulo) {
                        try { await update(dbRef(db, `empleos/vacantes/${id}`), { titulo: newVal }); }
                        catch (err) { alert("Error: " + err.message); }
                      }
                    }}
                    isEditable={!!currentUser}
                    as="span"
                  />
                </h3>
                <p className="horas-badge">
                  ⏱ Tiempo de jornada de trabajo: 
                  {' '}
                  <EditableText 
                    value={vac.horas}
                    onSave={async (newVal) => {
                      if (newVal !== vac.horas) {
                        try { await update(dbRef(db, `empleos/vacantes/${id}`), { horas: newVal }); }
                        catch (err) { alert("Error: " + err.message); }
                      }
                    }}
                    isEditable={!!currentUser}
                    as="span"
                  />
                  {' '}horas
                </p>
                <div className="contratos-list" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', marginRight: '5px' }}>Tipo de contrato:</span>
                  {['Mensual', 'Semanal', 'Diario', 'Eventual'].map(tipo => {
                    const isActive = vac.contratos?.includes(tipo);
                    return (
                      <span 
                        key={tipo} 
                        className={`contrato-badge ${isActive ? 'active' : 'inactive'} ${currentUser ? 'clickable' : ''}`}
                        onClick={async () => {
                          if (!currentUser) return;
                          const currentContratos = vac.contratos || [];
                          const newContratos = isActive 
                            ? currentContratos.filter(c => c !== tipo) 
                            : [...currentContratos, tipo];
                          try {
                            await update(dbRef(db, `empleos/vacantes/${id}`), { contratos: newContratos });
                          } catch (err) {
                            alert("Error al actualizar contrato: " + err.message);
                          }
                        }}
                      >
                        {tipo}
                      </span>
                    );
                  })}
                </div>
                <p className="desc">
                  <EditableText 
                    value={vac.descripcion}
                    onSave={async (newVal) => {
                      if (newVal !== vac.descripcion) {
                        try { await update(dbRef(db, `empleos/vacantes/${id}`), { descripcion: newVal }); }
                        catch (err) { alert("Error: " + err.message); }
                      }
                    }}
                    isEditable={!!currentUser}
                    isTextArea={true}
                    as="span"
                  />
                </p>
                
                <div className="actions">
                  {!currentUser && (
                    <button className="btn-apply" onClick={() => handleApply(id, vac.titulo, vac.horas, vac.isPaused)}>
                      {vac.isPaused ? "Aplicar (CV)" : "Aplicar"}
                    </button>
                  )}
                  {currentUser && (
                    <div className="admin-actions">
                      <button onClick={() => handleTogglePause(id, vac)}>{vac.isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}</button>
                      <button onClick={() => handleDeleteVacante(id)}>🗑️ Borrar</button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
            </ReactSortable>
          )}
        </div>

        <div className="postulaciones-section">
          <h2>Postulaciones Recientes</h2>
          {sortedPostulaciones.length === 0 ? (
            <p>Todavía no hay postulantes.</p>
          ) : (
            <ul className="postulantes-list">
              {sortedPostulaciones.map(([id, post]) => {
                const obfuscateName = (name) => {
                  if (!name) return 'Anónimo';
                  const parts = name.trim().split(' ');
                  if (parts.length === 1) return parts[0].substring(0, 3) + '***';
                  return parts[0] + ' ' + '*'.repeat(Math.max(parts.slice(1).join(' ').length, 3));
                };
                return (
                  <li key={id} className="postulante-item">
                    <div className="postulante-info">
                      <strong>{currentUser ? post.nombre : obfuscateName(post.nombre)}</strong> aplicó para <span>{post.vacanteTitulo}</span>
                      <span className="date">{new Date(post.timestamp).toLocaleDateString('es-AR')}</span>
                    </div>
                  {currentUser && (
                    <div className="admin-details">
                      <div style={{ flex: 1 }}>
                        <p>📞 {post.contacto} {post.sueldo ? `| 💰 ${post.sueldo}` : ''} | {post.horas}</p>
                        {post.rolesSeleccionados?.length > 0 && (
                          <p style={{ marginTop: '5px' }}>📌 Interesado en: {post.rolesSeleccionados.join(', ')}</p>
                        )}
                      </div>
                      <div className="admin-postulacion-actions">
                        {post.cvUrl && (
                          <a href={post.cvUrl} target="_blank" rel="noopener noreferrer" className="btn-cv">📄 Ver CV</a>
                        )}
                        <button className="btn-delete" onClick={() => handleDeletePostulacion(id)}>Borrar</button>
                      </div>
                    </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          </div>

        </div>
          <div className="col-proveedores" onClick={() => setActiveColumn('proveedores')} style={{ cursor: activeColumn !== 'proveedores' ? 'pointer' : 'default' }}>
            <div className="proveedores-section">
          <EditableText 
            as="h2"
            value={config?.tituloProveedores || '¿Brindás servicios y querés que te publiquemos?'}
            onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { tituloProveedores: newVal })}
            isEditable={!!currentUser}
          />
          <EditableText 
            as="p"
            className="subtitle"
            value={config?.subtituloProveedores || 'Si sos decorador/a, fotógrafo/a, DJ, o brindás servicios de catering, podés sumarte a nuestra lista de proveedores recomendados.'}
            onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { subtituloProveedores: newVal })}
            isEditable={!!currentUser}
            isTextArea={true}
          />
          
          <div className="proveedores-info-box">
            <EditableText 
              as="h3"
              value={config?.tituloComoFunciona || '¿Cómo funciona?'}
              onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { tituloComoFunciona: newVal })}
              isEditable={!!currentUser}
            />
            <EditableText 
              as="p"
              value={config?.textoComoFunciona || 'Recomendamos tus servicios a nuestros clientes que alquilan el salón. A cambio, trabajamos bajo una modalidad de comisión por cada evento cerrado a través de nuestra recomendación. Si estás de acuerdo, completá el formulario abajo y nos contactaremos con vos para los detalles.'}
              onSave={async (newVal) => await update(dbRef(db, 'empleos/config'), { textoComoFunciona: newVal })}
              isEditable={!!currentUser}
              isTextArea={true}
            />
          </div>

          <form onSubmit={handleProveedorSubmit} className="proveedor-form">
            <input type="text" placeholder="Nombre de tu emprendimiento o servicio" value={proveedorData.nombre} onChange={e => setProveedorData({...proveedorData, nombre: e.target.value})} required />
            <select value={proveedorData.rubro} onChange={e => setProveedorData({...proveedorData, rubro: e.target.value})} required>
              <option value="">Seleccioná tu rubro...</option>
              <option value="Decoración">Decoración</option>
              <option value="Fotografía/Video">Fotografía y Video</option>
              <option value="Catering">Catering</option>
              <option value="DJ/Animación">DJ / Animación</option>
              <option value="Mobiliario">Alquiler de Mobiliario</option>
              <option value="Otro">Otro</option>
            </select>
            <input type="text" placeholder="Teléfono o Email de contacto" value={proveedorData.contacto} onChange={e => setProveedorData({...proveedorData, contacto: e.target.value})} required />
            <input type="text" placeholder="Comisión que ofrezco, por ejemplo 10%" value={proveedorData.comision} onChange={e => setProveedorData({...proveedorData, comision: e.target.value})} required />
            <textarea placeholder="Contanos brevemente sobre tus servicios y experiencia..." rows="3" value={proveedorData.descripcion} onChange={e => setProveedorData({...proveedorData, descripcion: e.target.value})} required></textarea>
            
            <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#555' }}>
              <EditableText 
                value={config?.textoProveedores || 'Dependiendo del tipo de servicios que ofrezcas puede que no podamos agregarte, porque ya tenemos muchos de ese tipo, o porque no son compatibles con nuestro salón.'}
                onSave={async (newVal) => {
                  await update(dbRef(db, 'empleos/config'), { textoProveedores: newVal });
                }}
                isEditable={!!currentUser}
                isTextArea={true}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }} disabled={isSubmittingProveedor}>
              {isSubmittingProveedor ? 'Enviando...' : 'Enviar mi propuesta'}
            </button>
          </form>

          {currentUser && Object.keys(proveedores || {}).length > 0 && (
            <div className="admin-proveedores-list" style={{ marginTop: '40px' }}>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Propuestas Recibidas (Solo Admin)</h3>
              <ul className="postulantes-list">
                {Object.entries(proveedores).sort(([,a], [,b]) => b.timestamp - a.timestamp).map(([id, prov]) => (
                  <li key={id} className="postulante-item">
                    <div className="postulante-info">
                      <strong>{prov.nombre}</strong> - <span>{prov.rubro}</span>
                      <span className="date">{new Date(prov.timestamp).toLocaleDateString('es-AR')}</span>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                        <p>Contacto: {prov.contacto}</p>
                        <p>Comisión ofrecida: {prov.comision || 'No especificada'}</p>
                        <p style={{ marginTop: '5px' }}>💬 {prov.descripcion}</p>
                      </div>
                    </div>
                    <div className="admin-postulacion-actions">
                      <button className="btn-delete" onClick={() => handleDeleteProveedor(id)}>Borrar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        </div>
        </div>

        <Modal isOpen={isEditingVacante} onClose={() => setIsEditingVacante(false)}>
          <ModalContent>
            <h2>{currentVacanteId ? 'Editar Vacante' : 'Nueva Vacante'}</h2>
            <form onSubmit={handleSaveVacante}>
              <input type="text" placeholder="Título del empleo" value={vacanteData.titulo} onChange={e => setVacanteData({...vacanteData, titulo: e.target.value})} required />
              <input type="text" placeholder="Cantidad de horas (ej: 4, 8)" value={vacanteData.horas} onChange={e => setVacanteData({...vacanteData, horas: e.target.value})} required />
              <textarea placeholder="Breve descripción" value={vacanteData.descripcion} onChange={e => setVacanteData({...vacanteData, descripcion: e.target.value})} required rows="4" />
              
              <div className="contratos-form">
                <label>Tipos de Contrato:</label>
                <div className="checkboxes">
                  {['Mensual', 'Semanal', 'Diario', 'Eventual'].map(tipo => (
                    <label key={tipo} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={vacanteData.contratos?.includes(tipo) || false} 
                        onChange={(e) => {
                          const current = vacanteData.contratos || [];
                          if (e.target.checked) {
                            setVacanteData({ ...vacanteData, contratos: [...current, tipo] });
                          } else {
                            setVacanteData({ ...vacanteData, contratos: current.filter(c => c !== tipo) });
                          }
                        }}
                      /> {tipo}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary">Guardar</button>
            </form>
          </ModalContent>
        </Modal>

        <Modal isOpen={showPausedAlert} onClose={() => setShowPausedAlert(false)}>
          <ModalContent>
            <h2>Puesto temporalmente inactivo</h2>
            <p>Esta oferta de trabajo no está disponible en este momento. Sin embargo, si querés aplicar de todas formas, podés dejar tus datos para el futuro.</p>
            <button className="btn-primary mt-4" onClick={() => {
              setShowPausedAlert(false);
              setApplyingTo({ ...pendingApplyVac, isPaused: true, isGeneral: true });
              setPostulanteData({...postulanteData, rolesSeleccionados: [pendingApplyVac.id]});
              setIsApplying(true);
            }}>
              Dejar mis datos para el futuro
            </button>
          </ModalContent>
        </Modal>

        <Modal isOpen={isApplying} onClose={() => setIsApplying(false)}>
          <ModalContent>
            <h2>{applyingTo?.isGeneral ? 'Postulación General (Futuras Vacantes)' : `Aplicar a: ${applyingTo?.titulo}`}</h2>
            <form onSubmit={handleSubmitPostulacion}>
              <input type="text" placeholder="Tu Nombre Completo" value={postulanteData.nombre} onChange={e => setPostulanteData({...postulanteData, nombre: e.target.value})} required />
              <input type="text" placeholder="Teléfono o Mail de contacto" value={postulanteData.contacto} onChange={e => setPostulanteData({...postulanteData, contacto: e.target.value})} required />
              {!applyingTo?.isGeneral && (
                <input type="text" placeholder={`Sueldo pretendido (${applyingTo?.horas || ''})`} value={postulanteData.sueldo} onChange={e => setPostulanteData({...postulanteData, sueldo: e.target.value})} required />
              )}
              
              {applyingTo?.isGeneral && (
                <div className="contratos-form">
                  <label>Roles que te interesan (podés marcar varios):</label>
                  <div className="checkboxes" style={{ flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(vacantes).map(([vid, v]) => (
                      <label key={vid} className="checkbox-label" style={{ cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={postulanteData.rolesSeleccionados?.includes(vid) || false}
                          onChange={(e) => {
                            const current = postulanteData.rolesSeleccionados || [];
                            if (e.target.checked) {
                              setPostulanteData({ ...postulanteData, rolesSeleccionados: [...current, vid] });
                            } else {
                              setPostulanteData({ ...postulanteData, rolesSeleccionados: current.filter(i => i !== vid) });
                            }
                          }}
                        /> {v.titulo} {v.isPaused ? '(Inactivo)' : ''}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="file-input-group">
                <label>Adjuntar CV (PDF, JPG, PNG):</label>
                <input type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={e => setCvFile(e.target.files[0])} />
              </div>
              
              <button type="submit" className="btn-primary" disabled={isUploading}>
                {isUploading ? 'Enviando...' : 'Enviar Postulación'}
              </button>
            </form>
          </ModalContent>
        </Modal>

      </Container>
      <Footer />
    </>
  );
};

const Container = styled.div`
  padding: 40px 0 40px;
  width: 85%;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
  font-family: 'product_sansregular', sans-serif;

  button, input, textarea {
    font-family: inherit;
  }

  .columns-wrapper {
    display: flex;
    gap: 30px;
    transition: all 0.4s ease;
    width: 100%;
  }

  @media (max-width: 850px) {
    .columns-wrapper {
      flex-direction: column;
    }
    .columns-wrapper.active-empleos .col-empleos {
      order: 1;
    }
    .columns-wrapper.active-empleos .col-proveedores {
      order: 2;
    }
    .columns-wrapper.active-proveedores .col-proveedores {
      order: 1;
    }
    .columns-wrapper.active-proveedores .col-empleos {
      order: 2;
    }
  }

  .col-empleos, .col-proveedores {
    transition: all 0.4s ease;
    flex: 1;
    min-width: 0;
  }

  .columns-wrapper.active-empleos .col-empleos {
    flex: 2;
  }
  .columns-wrapper.active-empleos .col-proveedores {
    flex: 0.5;
    opacity: 0.6;
    transform: scale(0.95);
  }
  .columns-wrapper.active-empleos .col-proveedores:hover {
    opacity: 1;
  }
  /* Typography shrink */
  .columns-wrapper.active-empleos .col-proveedores h2 {
    font-size: 1.1rem;
    word-break: break-word;
  }
  .columns-wrapper.active-empleos .col-proveedores .subtitle {
    font-size: 0.8rem;
  }
  .columns-wrapper.active-empleos .col-proveedores h3 {
    font-size: 0.95rem;
  }
  .columns-wrapper.active-empleos .col-proveedores p {
    font-size: 0.8rem;
  }

  .columns-wrapper.active-proveedores .col-proveedores {
    flex: 2;
  }
  .columns-wrapper.active-proveedores .col-empleos {
    flex: 0.5;
    opacity: 0.6;
    transform: scale(0.95);
  }
  .columns-wrapper.active-proveedores .col-empleos:hover {
    opacity: 1;
  }
  /* Typography shrink */
  .columns-wrapper.active-proveedores .col-empleos h1 {
    font-size: 1.2rem;
  }
  .columns-wrapper.active-proveedores .col-empleos .subtitle {
    font-size: 0.8rem;
  }
  .columns-wrapper.active-proveedores .col-empleos p {
    font-size: 0.8rem;
  }
  .columns-wrapper.active-proveedores .col-empleos h3 {
    font-size: 1rem;
  }

  .proveedores-section {
    margin-top: 0px;
    background: #f9f9f9;
    padding: 30px;
    border-radius: 12px;
    border: 1px solid #eee;

    h2 {
      margin-bottom: 10px;
      font-size: 1.8rem;
    }

    .subtitle {
      text-align: center;
      margin-bottom: 20px;
      color: #666;
    }

    .proveedores-info-box {
      background: rgba(16, 185, 129, 0.1);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid var(--primary-color);
      h3 {
        margin: 0 0 10px 0;
        font-size: 1.1rem;
        color: var(--primary-color);
        text-align: left;
      }
      p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    .proveedor-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-width: 600px;
      margin: 0 auto;

      input[type="text"], select, textarea {
        padding: 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 1rem;
      }
    }
  }

  h1 {
    font-family: 'product_sansregular', sans-serif;
    color: var(--primary-color);
    text-align: center;
    margin-bottom: 10px;
  }
  
  .subtitle {
    text-align: center;
    color: var(--secondary-text);
    margin-bottom: 30px;
  }

  .admin-btn {
    display: block;
    margin: 0 auto 30px;
  }

  .vacantes-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 50px;
  }

  .vacante-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid #eee;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &.paused {
      filter: grayscale(0.8) opacity(0.8);
      
      h3 {
        color: #777;
      }
      
      .paused-overlay {
        position: absolute;
        top: 15px;
        right: -35px;
        background: #666;
        color: white;
        padding: 5px 40px;
        transform: rotate(45deg);
        font-size: 0.8rem;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 2;
      }
    }

    h3 {
      margin: 0 0 10px;
      font-size: 1.4rem;
      color: #333;
    }

    .horas-badge {
      display: inline-block;
      background: var(--primary-color);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.85rem;
      margin-bottom: 15px;
    }

    .contratos-list {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;

      .contrato-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        border: 2px solid;
        
        &.active {
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        
        &.inactive {
          border-color: rgba(239, 68, 68, 0.4);
          color: #999;
          background: #f9f9f9;
          text-decoration: line-through;
        }

        &.clickable {
          cursor: pointer;
          transition: transform 0.1s, opacity 0.1s;
          &:hover {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      }
    }

    .desc {
      color: #555;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      z-index: 3;
      position: relative;

      .btn-apply {
        background: #10b981;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, background 0.2s;
        &:hover {
          background: #059669;
          transform: translateY(-2px);
        }
      }

      .admin-actions {
        display: flex;
        gap: 10px;
        button {
          background: transparent;
          border: 1px solid #ccc;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          background: white;
          &:hover {
            background: #f5f5f5;
          }
        }
      }
    }
  }

  .postulaciones-section {
    background: var(--app-background-color, #fdfbf5);
    padding: 30px;
    border-radius: 12px;
    border: 1px solid #e5e5e5;
    
    h2 {
      margin-bottom: 20px;
      color: var(--primary-color);
    }

    .postulantes-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 15px;

      .postulante-item {
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        
        .postulante-info {
          font-size: 1.05rem;
          color: #333;
          span {
            font-weight: bold;
            color: var(--primary-color);
          }
          .date {
            float: right;
            font-size: 0.85rem;
            color: #999;
            font-weight: normal;
          }
        }

        .admin-details {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #ccc;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          p {
            margin: 0;
            color: #666;
            font-size: 0.95rem;
          }
          
          .admin-postulacion-actions {
            display: flex;
            gap: 10px;
            
            .btn-cv {
              background: #3b82f6;
              color: white;
              padding: 4px 10px;
              border-radius: 4px;
              text-decoration: none;
              font-size: 0.9rem;
              &:hover {
                background: #2563eb;
              }
            }
            
            .btn-delete {
              background: #ef4444;
              color: white;
              border: none;
              padding: 4px 10px;
              border-radius: 4px;
              cursor: pointer;
              &:hover {
                background: #dc2626;
              }
            }
          }
        }
      }
    }
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    &:hover {
      opacity: 0.9;
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  h2 {
    color: var(--primary-color);
    margin: 0;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    
    .contratos-form {
      display: flex;
      flex-direction: column;
      gap: 5px;
      label {
        font-size: 0.9rem;
        color: #555;
        font-weight: bold;
      }
      .checkboxes {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        .checkbox-label {
          font-weight: normal;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        }
      }
    }

    .file-input-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      label {
        font-size: 0.9rem;
        color: #555;
      }
    }
    
    input, textarea {
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-family: inherit;
      font-size: 1rem;
      background: white;
      color: black;
    }
  }
`;

export default EmpleosPage;
