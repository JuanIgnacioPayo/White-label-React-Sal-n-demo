import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set, update } from 'firebase/database';
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import { app } from '../../firebase/firebase';
import styled, { createGlobalStyle } from 'styled-components';
import ImageGalleryModal from './ImageGalleryModal';

const GlobalStyle = createGlobalStyle`
  .form-servicios-admin {
    max-width: 1000px;
    margin: auto;
    top: 0rem;
    padding: 1rem;
    padding-bottom: 120px; /* Added padding for floating buttons */
    background-color:var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
    margin-top: 2rem;
  }

  .form-servicios-admin h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .servicios-admin-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .servicios-admin-card ul {
    list-style: none;
    padding: 0;
    width: 100%;
  }

  .servicios-admin-card li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #ccc;
  }

  .servicios-admin-card label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #555;
    font-size: 0.9rem;
  }

  .servicios-admin-card input {
    padding: 0.5rem;
    font-size: 0.95rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    font-family: 'product_sansregular';
  }

  .servicios-admin-card button {
    padding: 6px 10px;
    background-color: var(--primaryColor, #b0aa6d);
    color: var(--whiteText, #ffffff);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: bold;
    transition: background-color 0.3s ease, transform 0.2s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    
  }

  .servicios-admin-card button:hover {
    background-color: var(--primaryText, #111241);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }

  @media screen and (max-width: 600px) {
    .servicios-admin-card li {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      padding: 1rem 0.5rem;
    }
    .servicios-admin-card li .service-list {
      width: 100%;
      display: block;
      margin-bottom: 5px;
    }
    .servicios-admin-card li > div {
      align-self: flex-end;
    }
  }
`;

const FormContainer = styled.div`
  background-color: var(--app-background-color, #f0f0f0);
  
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: var(--app-text-color, #000);
  h2 {
    
    margin: 2rem;
    margin-left: 0;
  }
  .service-list {
    list-style-type: none;
    padding: 0;
    width: 50%;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: var(--app-text-color, #000);
  
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: var(--app-background-color, #fff);
  color: var(--app-text-color, #000);
`;

const Button = styled.button`
  background-color: var(--primary-color, #007bff);
  color: white;
  padding: 0.5rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover {
    opacity: 0.9;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 5px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const List = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
`;

export default function ServiciosAdmin() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [rentalServiceNames, setRentalServiceNames] = useState(null);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [editingRentalName, setEditingRentalName] = useState(null);
  const [datosId33, setDatosId33] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // New state for datosId/33 editing
  const [isDatosId33ModalOpen, setIsDatosId33ModalOpen] = useState(false);
  const [editingDatosId33Field, setEditingDatosId33Field] = useState(null);
  
  // New state for image gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const servicioIdToAclaracionContenidoMapping = {
    1: 'contenido97',
    2: 'contenido98',
    3: 'contenido99',
    4: 'contenido100',
    5: 'contenido101',
    6: 'contenido81',
    7: 'contenido82',
    8: 'contenido83',
    9: 'contenido84',
    10: 'contenido102',
    11: 'contenido103',
    12: 'contenido104',
    13: 'contenido105',
    14: 'contenido106',
  };

  const fetchServices = async () => {
    const db = getDatabase(app);
    const servicesRef = ref(db, 'optionalServices');
    try {
      const snapshot = await get(servicesRef);
      if (snapshot.exists()) {
        const servicesData = snapshot.val();
        const servicesArray = Array.isArray(servicesData)
          ? servicesData.filter(s => s)
          : Object.values(servicesData);
        setServicios(servicesArray);
      } else {
        setError('No se encontraron servicios opcionales en la base de datos.');
      }
    } catch (err) {
      setError('Error al cargar los servicios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRentalNames = async () => {
      const db = getDatabase(app);
      const rentalNamesRef = ref(db, 'serviceNames/rental');
      try {
        const snapshot = await get(rentalNamesRef);
        if (snapshot.exists()) {
          setRentalServiceNames(snapshot.val());
        }
      } catch (err) {
        console.error("Error fetching rental service names:", err);
      }
    };
    fetchServices();
    fetchRentalNames();
    fetchDatosId33();
  }, []);

  const fetchDatosId33 = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/33');
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setDatosId33(snapshot.val());
      }
    } catch (err) {
      console.error("Error fetching datosId/33:", err);
    }
  };

  const handleEdit = (servicio) => {
    let tooltipText = servicio.tooltipText;
    if (!tooltipText && datosId33) {
      const contenidoKey = servicioIdToAclaracionContenidoMapping[servicio.id];
      if (contenidoKey) {
        tooltipText = datosId33[contenidoKey];
      }
    }
    setEditingService({ ...servicio, tooltipText: tooltipText || '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setImageFile(null);
  };

  const handleRentalEdit = (key, value) => {
    setEditingRentalName({ key, value });
    setIsRentalModalOpen(true);
  };

  const handleRentalCloseModal = () => {
    setIsRentalModalOpen(false);
    setEditingRentalName(null);
  };

  const handleRentalInputChange = (e) => {
    const { value } = e.target;
    setEditingRentalName(prev => ({ ...prev, value }));
  };

  const handleRentalSave = async () => {
    if (!editingRentalName) return;

    const db = getDatabase(app);
    const rentalNameRef = ref(db, `serviceNames/rental/${editingRentalName.key}`);
    try {
      await set(rentalNameRef, editingRentalName.value);
      setRentalServiceNames(prev => ({ ...prev, [editingRentalName.key]: editingRentalName.value }));
      handleRentalCloseModal();
      alert("Nombre del servicio de alquiler guardado exitosamente.");
    } catch (error) {
      console.error("Error al guardar el nombre del servicio de alquiler:", error);
      alert("Ocurrió un error al guardar los cambios.");
    }
  };

  // --- NEW HANDLERS FOR datosId/33 FIELDS ---
  const handleDatosId33Edit = (key, value) => {
    setEditingDatosId33Field({ key, value });
    setIsDatosId33ModalOpen(true);
  };

  const handleDatosId33CloseModal = () => {
    setIsDatosId33ModalOpen(false);
    setEditingDatosId33Field(null);
  };

  const handleDatosId33InputChange = (e) => {
    const { value } = e.target;
    setEditingDatosId33Field(prev => ({ ...prev, value }));
  };

  const handleDatosId33Save = async () => {
    if (!editingDatosId33Field) return;

    const db = getDatabase(app);
    const dbRef = ref(db, 'datosId/33');
    try {
      await update(dbRef, { [editingDatosId33Field.key]: editingDatosId33Field.value });
      setDatosId33(prev => ({ ...prev, [editingDatosId33Field.key]: editingDatosId33Field.value }));
      handleDatosId33CloseModal();
      alert("Texto guardado exitosamente en datosId/33.");
    } catch (error) {
      console.error("Error al guardar texto en datosId/33:", error);
      alert("Ocurrió un error al guardar los cambios.");
    }
  };
  // --- END NEW HANDLERS ---


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingService(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAdd = () => {
    const newId = Math.max(...servicios.map(s => s.id), 0) + 1;
    setEditingService({ id: newId, nombre: '', priceKey: '', imageUrl: '' });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingService || !editingService.nombre) {
      alert("El nombre del servicio no puede estar vacío.");
      return;
    }

    setUploading(true);
    let serviceToSave = { ...editingService };

    // If a new file was selected, upload it and get the URL
    if (imageFile) {
      try {
        const downloadURL = await uploadToFirebaseStorage(imageFile);
        serviceToSave.imageUrl = downloadURL;
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        alert('Error al subir la imagen. No se guardaron los cambios.');
        setUploading(false);
        return;
      }
    }

    // Continue to save the service data (with new or existing imageUrl) to the database
    const db = getDatabase(app);
    const servicesRef = ref(db, 'optionalServices');
    try {
      const snapshot = await get(servicesRef);
      const currentServices = snapshot.exists() ? (Array.isArray(snapshot.val()) ? snapshot.val().filter(s => s) : Object.values(snapshot.val())) : [];
      const serviceIndex = currentServices.findIndex(s => s.id === serviceToSave.id);
      let updatedServices;

      if (serviceIndex > -1) {
        updatedServices = [...currentServices];
        updatedServices[serviceIndex] = serviceToSave;
      } else {
        updatedServices = [...currentServices, serviceToSave];
      }

      await set(servicesRef, updatedServices);
      alert("Servicio guardado exitosamente.");
      setServicios(updatedServices); // Update state directly instead of reloading
    } catch (error) {
      console.error("Error al guardar el servicio:", error);
      alert("Ocurrió un error al guardar los cambios.");
    } finally {
      setUploading(false);
      handleCloseModal();
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.")) {
      return;
    }

    const db = getDatabase(app);
    const servicesRef = ref(db, 'optionalServices');

    try {
      const snapshot = await get(servicesRef);
      if (snapshot.exists()) {
        const currentServices = snapshot.val();
        const servicesArray = Array.isArray(currentServices)
          ? currentServices.filter(s => s)
          : Object.values(currentServices);

        const updatedServices = servicesArray.filter(s => s.id !== serviceId);

        await set(servicesRef, updatedServices);
        setServicios(updatedServices);

        const priceKey = `servicio_${serviceId}_`;
        const priceDeletionPromises = [];
        for (let i = 1; i <= 24; i++) {
          const priceRef = ref(db, `datosId/${i}/${priceKey}`);
          priceDeletionPromises.push(set(priceRef, null));
        }
        await Promise.all(priceDeletionPromises);

        alert("Servicio y sus precios asociados han sido eliminados exitosamente.");
      }
    } catch (error) {
      console.error("Error al eliminar el servicio y/o sus precios:", error);
      alert("Ocurrió un error al eliminar el servicio.");
    }
  };

  if (loading) {
    return <div className="form-servicios-admin">Cargando servicios...</div>;
  }

  if (error) {
    return <div className="form-servicios-admin">Error: {error}</div>;
  }

  return (
    <>
      <GlobalStyle />
      <div className="form-servicios-admin">
        <h2>Administrar Servicios Opcionales</h2>
        <div className="servicios-admin-card">
          <button onClick={handleAdd}>Agregar Nuevo Servicio</button>
          <ul>
            {servicios.sort((a, b) => a.id - b.id).map((servicio) => (
              <li key={servicio.id}>
                <span className='service-list'>{servicio.id} - {servicio.nombre}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => handleEdit(servicio)}>Editar</button>
                  <button onClick={() => handleDelete(servicio.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h2>Administrar Nombres de Servicios de Alquiler</h2>
        <div className="servicios-admin-card">
          <ul>
            {rentalServiceNames && Object.entries(rentalServiceNames).map(([key, value]) => (
              <li key={key}>
                <span>{key} - {value}</span>
                <div>
                  <button onClick={() => handleRentalEdit(key, value)}>Editar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* --- NEW SECTION FOR DATOSID/33 FIELDS --- */}
        <h2>Administrar Textos de Camareras</h2>
        <div className="servicios-admin-card">
          <ul>
            {datosId33 && (
              <>
                <li>
                  <span>**Nombre Inicial (contenido521):** {datosId33.contenido521 || 'Contratación de camarera por 3hs'}</span>
                  <div>
                    <button onClick={() => handleDatosId33Edit('contenido521', datosId33.contenido521 || '')}>Editar</button>
                  </div>
                </li>
                <li>
                  <span>**Nombre por Hora (contenido522):** {datosId33.contenido522 || 'Contratación de camarera por hora'}</span>
                  <div>
                    <button onClick={() => handleDatosId33Edit('contenido522', datosId33.contenido522 || '')}>Editar</button>
                  </div>
                </li>
                 <li>
                  <span>**Aclaración Completa (contenido101):** {datosId33.contenido101 || 'La aclaración completa para la camarera.'}</span>
                  <div>
                    <button onClick={() => handleDatosId33Edit('contenido101', datosId33.contenido101 || '')}>Editar</button>
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>
        {/* --- END NEW SECTION --- */}

        {isModalOpen && editingService && (
          <ModalBackdrop>
            <ModalContent>
              <h3>{servicios.some(s => s.id === editingService.id) ? 'Editando Servicio' : 'Agregando Servicio'}</h3>
              <FormGroup>
                <Label>ID: {editingService.id}</Label>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="nombre">Nombre del Servicio</Label>
                <Input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={editingService.nombre}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="priceKey">Price Key</Label>
                <Input
                  type="text"
                  id="priceKey"
                  name="priceKey"
                  placeholder="e.g., camarera, metegol"
                  value={editingService.priceKey || ''}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="tooltipText">Tooltip Text</Label>
                <Input
                  type="text"
                  id="tooltipText"
                  name="tooltipText"
                  placeholder="e.g., Aclaración sobre el servicio"
                  value={editingService.tooltipText || ''}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>Imagen del Servicio</Label>
                {editingService.imageUrl && <img src={editingService.imageUrl} alt="Preview" style={{ maxWidth: '100px', display: 'block', margin: '10px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ flex: 1 }}
                  />
                  <Button type="button" onClick={() => setIsGalleryOpen(true)} style={{ padding: '0.5rem', backgroundColor: '#17a2b8', whiteSpace: 'nowrap' }}>
                    Elegir de galería
                  </Button>
                </div>
              </FormGroup>
              <div style={{ marginTop: '1rem' }}>
                <Button onClick={handleSave} disabled={uploading}>
                  {uploading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button onClick={handleCloseModal} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancelar</Button>
              </div>
            </ModalContent>
          </ModalBackdrop>
        )}

        <ImageGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={(url) => {
            setEditingService(prev => ({ ...prev, imageUrl: url }));
            setIsGalleryOpen(false);
          }}
        />

        {isRentalModalOpen && editingRentalName && (
          <ModalBackdrop>
            <ModalContent>
              <h3>Editando Nombre de Servicio de Alquiler</h3>
              <FormGroup>
                <Label>Tipo: {editingRentalName.key}</Label>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="rentalName">Nombre del Servicio</Label>
                <Input
                  type="text"
                  id="rentalName"
                  name="rentalName"
                  value={editingRentalName.value}
                  onChange={handleRentalInputChange}
                />
              </FormGroup>
              <button onClick={handleRentalSave}>Guardar Cambios</button>
              <button onClick={handleRentalCloseModal}>Cancelar</button>
            </ModalContent>
          </ModalBackdrop>
        )}

        {/* --- NEW MODAL FOR DATOSID/33 FIELDS --- */}
        {isDatosId33ModalOpen && editingDatosId33Field && (
          <ModalBackdrop>
            <ModalContent>
              <h3>Editando Texto: {editingDatosId33Field.key}</h3>
              <FormGroup>
                <Label htmlFor="datosId33Value">Contenido</Label>
                <Input
                  type="text"
                  id="datosId33Value"
                  name="datosId33Value"
                  value={editingDatosId33Field.value}
                  onChange={handleDatosId33InputChange}
                />
              </FormGroup>
              <div style={{ marginTop: '1rem' }}>
                <Button onClick={handleDatosId33Save}>Guardar Cambios</Button>
                <Button onClick={handleDatosId33CloseModal} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancelar</Button>
              </div>
            </ModalContent>
          </ModalBackdrop>
        )}
        {/* --- END NEW MODAL --- */}
      </div>
    </>
  );
}