import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.25s ease-out;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalHeader = styled.div`
  padding: 1.2rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 {
    margin: 0;
    color: #333;
    font-size: 1.3rem;
    font-weight: bold;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  transition: color 0.15s;
  &:hover {
    color: #333;
  }
`;

const EditorLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SidebarTabs = styled.div`
  width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
    padding: 0.5rem;
    min-height: 55px;
  }
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 0.8rem 1.5rem;
  text-align: left;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  color: ${props => props.$active ? '#2b8a3e' : '#495057'};
  background-color: ${props => props.$active ? '#e8f5e9' : 'transparent'};
  border-left: 4px solid ${props => props.$active ? '#2b8a3e' : 'transparent'};
  cursor: pointer;
  font-family: 'product_sansregular', sans-serif;
  font-size: 0.95rem;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    background-color: ${props => props.$active ? '#e8f5e9' : '#f1f3f5'};
  }

  @media (max-width: 768px) {
    text-align: center;
    padding: 0.5rem 1rem;
    border-left: none;
    border-bottom: 3px solid ${props => props.$active ? '#2b8a3e' : 'transparent'};
    white-space: nowrap;
    width: auto;
  }
`;

const FormPane = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  
  label {
    font-weight: bold;
    font-size: 0.85rem;
    color: #495057;
  }
  
  input, textarea {
    padding: 0.65rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: 'product_sansregular', sans-serif;
    transition: border-color 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: #2b8a3e;
      box-shadow: 0 0 0 3px rgba(43, 138, 62, 0.15);
    }
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols || 2}, 1fr);
  gap: 1rem;
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const ItemListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f8f9fa;
`;

const ItemRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  input {
    flex: 1;
  }
`;

const RoundButton = styled.button`
  background: ${props => props.$bg || '#2b8a3e'};
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: #ced4da;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
  width: 100%;
  margin-top: auto;
  margin-bottom: 10px;

  &:hover {
    background-color: var(--primary-color); // Or a slightly darker shade
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const TemplateEditorModal = ({
    setShowTemplateEditor,
    tempTemplateConfig,
    editorActiveTab,
    setEditorActiveTab,
    handleUpdateTempConfig,
    handleUpdateArrayItem,
    handleRemoveArrayItem,
    handleAddArrayItem,
    handleRestoreDefaultTemplateConfig,
    handleSaveTemplateConfig
}) => {
    return (
        <ModalOverlay>
            <ModalContent>
                <ModalHeader>
                    <h3>⚙️ Editar Plantilla del Presupuesto PDF</h3>
                    <CloseButton onClick={() => setShowTemplateEditor(false)}>✕</CloseButton>
                </ModalHeader>
                
                <EditorLayout>
                    <SidebarTabs>
                        <TabButton $active={editorActiveTab === 'general'} onClick={() => setEditorActiveTab('general')}>
                            General
                        </TabButton>
                        <TabButton $active={editorActiveTab === 'ubicacion'} onClick={() => setEditorActiveTab('ubicacion')}>
                            Ubicación
                        </TabButton>
                        <TabButton $active={editorActiveTab === 'contacto'} onClick={() => setEditorActiveTab('contacto')}>
                            Contacto y Redes
                        </TabButton>
                        <TabButton $active={editorActiveTab === 'amenities'} onClick={() => setEditorActiveTab('amenities')}>
                            Amenities
                        </TabButton>
                        <TabButton $active={editorActiveTab === 'pago'} onClick={() => setEditorActiveTab('pago')}>
                            Factura y No Incluye
                        </TabButton>
                        <TabButton $active={editorActiveTab === 'seccionesPredeterminadas'} onClick={() => setEditorActiveTab('seccionesPredeterminadas')}>
                            Secciones Predeterminadas
                        </TabButton>
                    </SidebarTabs>
                    
                    <FormPane>
                        {editorActiveTab === 'general' && (
                            <>
                                <FormGroup>
                                    <label>Subtítulo del Salón (Cabecera):</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.subtitulo || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'subtitulo', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Tipos de Eventos:</label>
                                    <textarea 
                                        rows="3"
                                        value={tempTemplateConfig.tiposEvento || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'tiposEvento', e.target.value)}
                                    />
                                </FormGroup>
                                <Row $cols={3}>
                                    <FormGroup>
                                        <label>Comensales Mínimo:</label>
                                        <input 
                                            type="number" 
                                            value={tempTemplateConfig.comensales?.minimo || ''} 
                                            onChange={(e) => handleUpdateTempConfig('comensales', 'minimo', parseInt(e.target.value) || 0)}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Comensales Máximo:</label>
                                        <input 
                                            type="number" 
                                            value={tempTemplateConfig.comensales?.maximo || ''} 
                                            onChange={(e) => handleUpdateTempConfig('comensales', 'maximo', parseInt(e.target.value) || 0)}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Tipo Comensal:</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.comensales?.tipo || ''} 
                                            onChange={(e) => handleUpdateTempConfig('comensales', 'tipo', e.target.value)}
                                        />
                                    </FormGroup>
                                </Row>
                                <FormGroup>
                                    <label>Texto Fotos (Instrucción):</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.textoFotos || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'textoFotos', e.target.value)}
                                    />
                                </FormGroup>
                            </>
                        )}

                        {editorActiveTab === 'ubicacion' && (
                            <>
                                <FormGroup>
                                    <label>Dirección:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.ubicacion?.direccion || ''} 
                                        onChange={(e) => handleUpdateTempConfig('ubicacion', 'direccion', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Ciudad y Provincia:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.ubicacion?.ciudad || ''} 
                                        onChange={(e) => handleUpdateTempConfig('ubicacion', 'ciudad', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Referencia de Ubicación:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.ubicacion?.referencia || ''} 
                                        onChange={(e) => handleUpdateTempConfig('ubicacion', 'referencia', e.target.value)}
                                    />
                                </FormGroup>
                            </>
                        )}

                        {editorActiveTab === 'contacto' && (
                            <>
                                <Row>
                                    <FormGroup>
                                        <label>Teléfono:</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.contacto?.telefono || ''} 
                                            onChange={(e) => handleUpdateTempConfig('contacto', 'telefono', e.target.value)}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Email de Contacto:</label>
                                        <input 
                                            type="email" 
                                            value={tempTemplateConfig.contacto?.email || ''} 
                                            onChange={(e) => handleUpdateTempConfig('contacto', 'email', e.target.value)}
                                        />
                                    </FormGroup>
                                </Row>
                                <FormGroup>
                                    <label>Sitio Web:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.contacto?.web || ''} 
                                        onChange={(e) => handleUpdateTempConfig('contacto', 'web', e.target.value)}
                                    />
                                </FormGroup>
                                <Row>
                                    <FormGroup>
                                        <label>Enlace de Instagram:</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.redes?.instagram || ''} 
                                            onChange={(e) => handleUpdateTempConfig('redes', 'instagram', e.target.value)}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Usuario Instagram (ej: salonmagiceventos):</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.redes?.instagramNombre || ''} 
                                            onChange={(e) => handleUpdateTempConfig('redes', 'instagramNombre', e.target.value)}
                                        />
                                    </FormGroup>
                                </Row>
                                <Row>
                                    <FormGroup>
                                        <label>Enlace de Facebook:</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.redes?.facebook || ''} 
                                            onChange={(e) => handleUpdateTempConfig('redes', 'facebook', e.target.value)}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Usuario Facebook (ej: salonmagiceventos):</label>
                                        <input 
                                            type="text" 
                                            value={tempTemplateConfig.redes?.facebookNombre || ''} 
                                            onChange={(e) => handleUpdateTempConfig('redes', 'facebookNombre', e.target.value)}
                                        />
                                    </FormGroup>
                                </Row>
                            </>
                        )}

                        {editorActiveTab === 'amenities' && (
                            <>
                                <FormGroup>
                                    <label>Título Amenities Interior:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.amenitiesInteriorTitulo || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'amenitiesInteriorTitulo', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Items Amenities Interior:</label>
                                    <ItemListContainer>
                                        {(tempTemplateConfig.amenitiesInterior || []).map((item, index) => (
                                            <ItemRow key={`int-${index}`}>
                                                <input 
                                                    type="text" 
                                                    value={item} 
                                                    onChange={(e) => handleUpdateArrayItem('amenitiesInterior', index, e.target.value)}
                                                />
                                                <RoundButton $bg="#dc3545" onClick={() => handleRemoveArrayItem('amenitiesInterior', index)}>✕</RoundButton>
                                            </ItemRow>
                                        ))}
                                        <Button onClick={() => handleAddArrayItem('amenitiesInterior')} style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                            + Agregar Item
                                        </Button>
                                    </ItemListContainer>
                                </FormGroup>

                                <FormGroup style={{ marginTop: '1rem' }}>
                                    <label>Título Amenities Exterior:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.amenitiesExteriorTitulo || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'amenitiesExteriorTitulo', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Items Amenities Exterior:</label>
                                    <ItemListContainer>
                                        {(tempTemplateConfig.amenitiesExterior || []).map((item, index) => (
                                            <ItemRow key={`ext-${index}`}>
                                                <input 
                                                    type="text" 
                                                    value={item} 
                                                    onChange={(e) => handleUpdateArrayItem('amenitiesExterior', index, e.target.value)}
                                                />
                                                <RoundButton $bg="#dc3545" onClick={() => handleRemoveArrayItem('amenitiesExterior', index)}>✕</RoundButton>
                                            </ItemRow>
                                        ))}
                                        <Button onClick={() => handleAddArrayItem('amenitiesExterior')} style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                            + Agregar Item
                                        </Button>
                                    </ItemListContainer>
                                </FormGroup>
                            </>
                        )}

                        {editorActiveTab === 'pago' && (
                            <>
                                <FormGroup>
                                    <label>Facturación:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.facturacion || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'facturacion', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Medios de Pago:</label>
                                    <input 
                                        type="text" 
                                        value={tempTemplateConfig.mediosDePago || ''} 
                                        onChange={(e) => handleUpdateTempConfig(null, 'mediosDePago', e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>No Incluye (Exclusiones):</label>
                                    <ItemListContainer>
                                        {(tempTemplateConfig.noIncluye || []).map((item, index) => (
                                            <ItemRow key={`inc-${index}`}>
                                                <input 
                                                    type="text" 
                                                    value={item} 
                                                    onChange={(e) => handleUpdateArrayItem('noIncluye', index, e.target.value)}
                                                />
                                                <RoundButton $bg="#dc3545" onClick={() => handleRemoveArrayItem('noIncluye', index)}>✕</RoundButton>
                                            </ItemRow>
                                        ))}
                                        <Button onClick={() => handleAddArrayItem('noIncluye')} style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                            + Agregar Item
                                        </Button>
                                    </ItemListContainer>
                                </FormGroup>
                            </>
                        )}

                        {editorActiveTab === 'seccionesPredeterminadas' && (
                            <>
                                <div style={{ borderBottom: '2px solid #2b8a3e', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: '#2b8a3e' }}>🍽️ Catering Predeterminado</h4>
                                </div>
                                <Row>
                                    <FormGroup>
                                        <label>Nombre de sección:</label>
                                        <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.catering?.nombre || ''}
                                            onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.catering', 'nombre', e.target.value)} />
                                    </FormGroup>
                                    <Row>
                                        <FormGroup>
                                            <label>Costo pp ($):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.catering?.costoPP || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.catering', 'costoPP', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <label>Margen (%):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.catering?.margen || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.catering', 'margen', e.target.value)} />
                                        </FormGroup>
                                    </Row>
                                </Row>
                                <FormGroup>
                                    <label>Detalle:</label>
                                    <textarea rows={3} value={tempTemplateConfig.seccionesPredeterminadas?.catering?.detalle || ''}
                                        onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.catering', 'detalle', e.target.value)} />
                                </FormGroup>

                                <div style={{ borderBottom: '2px solid #862e9c', paddingBottom: '0.5rem', margin: '2rem 0 1rem 0' }}>
                                    <h4 style={{ margin: 0, color: '#862e9c' }}>🍹 Barra de Tragos Predeterminada</h4>
                                </div>
                                <Row>
                                    <FormGroup>
                                        <label>Nombre de sección:</label>
                                        <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.barra?.nombre || ''}
                                            onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.barra', 'nombre', e.target.value)} />
                                    </FormGroup>
                                    <Row>
                                        <FormGroup>
                                            <label>Costo pp ($):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.barra?.costoPP || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.barra', 'costoPP', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <label>Margen (%):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.barra?.margen || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.barra', 'margen', e.target.value)} />
                                        </FormGroup>
                                    </Row>
                                </Row>
                                <FormGroup>
                                    <label>Detalle:</label>
                                    <textarea rows={3} value={tempTemplateConfig.seccionesPredeterminadas?.barra?.detalle || ''}
                                        onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.barra', 'detalle', e.target.value)} />
                                </FormGroup>

                                <div style={{ borderBottom: '2px solid #1c7ed6', paddingBottom: '0.5rem', margin: '2rem 0 1rem 0' }}>
                                    <h4 style={{ margin: 0, color: '#1c7ed6' }}>🎵 Show y Animación Predeterminada</h4>
                                </div>
                                <Row>
                                    <FormGroup>
                                        <label>Nombre de sección:</label>
                                        <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.animacion?.nombre || ''}
                                            onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.animacion', 'nombre', e.target.value)} />
                                    </FormGroup>
                                    <Row>
                                        <FormGroup>
                                            <label>Costo pp ($):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.animacion?.costoPP || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.animacion', 'costoPP', e.target.value)} />
                                        </FormGroup>
                                        <FormGroup>
                                            <label>Margen (%):</label>
                                            <input type="text" value={tempTemplateConfig.seccionesPredeterminadas?.animacion?.margen || ''}
                                                onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.animacion', 'margen', e.target.value)} />
                                        </FormGroup>
                                    </Row>
                                </Row>
                                <FormGroup>
                                    <label>Detalle:</label>
                                    <textarea rows={3} value={tempTemplateConfig.seccionesPredeterminadas?.animacion?.detalle || ''}
                                        onChange={(e) => handleUpdateTempConfig('seccionesPredeterminadas.animacion', 'detalle', e.target.value)} />
                                </FormGroup>
                            </>
                        )}
                    </FormPane>
                </EditorLayout>
                
                <ModalFooter>
                    <Button onClick={handleRestoreDefaultTemplateConfig} style={{ width: 'auto', margin: 0, backgroundColor: '#ffc107', color: '#212529' }}>
                        ⚠️ Restaurar por Defecto
                    </Button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={() => setShowTemplateEditor(false)} style={{ width: 'auto', margin: 0, backgroundColor: '#6c757d' }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveTemplateConfig} style={{ width: 'auto', margin: 0, backgroundColor: '#28a745' }}>
                            Guardar Cambios
                        </Button>
                    </div>
                </ModalFooter>
            </ModalContent>
        </ModalOverlay>
    );
};

export default TemplateEditorModal;
