import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { database } from '../../firebase/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.2rem;
`;

const AddButton = styled.button.attrs({ type: 'button' })`
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: 0.2s;

  &:hover {
    background: #45a049;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th {
    background: #f5f5f5;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #555;
    border-bottom: 2px solid #ddd;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #eee;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  tr:hover {
    background: #fafafa;
  }
  
  @media (max-width: 768px) {
    th, td {
      padding: 8px;
      font-size: 0.85rem;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
  word-break: break-all;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const ActionButton = styled.button.attrs({ type: 'button' })`
  background: ${props => props.$danger ? '#f44336' : props.$primary ? '#2196F3' : '#f5f5f5'};
  color: ${props => props.$danger || props.$primary ? 'white' : '#666'};
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  margin-left: 5px;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;

  &:hover {
    opacity: 0.8;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
`;

const PaymentEntitiesManager = () => {
    const [entities, setEntities] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', endpoint: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [newForm, setNewForm] = useState({ name: '', endpoint: '' });

    useEffect(() => {
        const entitiesRef = ref(database, 'config/paymentEntities');
        const unsubscribe = onValue(entitiesRef, (snapshot) => {
            const data = snapshot.val() || {};
            setEntities(data);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = () => {
        if (!newForm.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        const entitiesRef = ref(database, 'config/paymentEntities');
        const newEntity = {
            name: newForm.name.trim(),
            endpoint: newForm.endpoint.trim() || null,
            keywords: [newForm.name.trim().toUpperCase()],
            createdAt: Date.now()
        };

        if (editingId) {
            // Update existing entity
            const entityRef = ref(database, `config/paymentEntities/${editingId}`);
            update(entityRef, {
                name: newForm.name.trim(),
                endpoint: newForm.endpoint.trim() || null,
                keywords: [newForm.name.trim().toUpperCase()],
                updatedAt: Date.now()
            })
                .then(() => {
                    toast.success("Empresa actualizada");
                    setNewForm({ name: '', endpoint: '' });
                    setIsAdding(false);
                    setEditingId(null);
                })
                .catch((error) => {
                    toast.error("Error al actualizar empresa");
                    console.error(error);
                });
        } else {
            // Create new entity
            push(entitiesRef, newEntity)
                .then(() => {
                    toast.success("Empresa agregada");
                    setNewForm({ name: '', endpoint: '' });
                    setIsAdding(false);
                })
                .catch((error) => {
                    toast.error("Error al agregar empresa");
                    console.error(error);
                });
        }
    };

    const handleEdit = (id) => {
        const entity = entities[id];
        setEditingId(id);
        setNewForm({ name: entity.name, endpoint: entity.endpoint || '' });
        setIsAdding(true); // Show the form
    };

    const handleSave = (id) => {
        if (!editForm.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        const entityRef = ref(database, `config/paymentEntities/${id}`);
        const updates = {
            name: editForm.name.trim(),
            endpoint: editForm.endpoint.trim() || null,
            keywords: [editForm.name.trim().toUpperCase()],
            updatedAt: Date.now()
        };

        update(entityRef, updates)
            .then(() => {
                toast.success("Empresa actualizada");
                setEditingId(null);
            })
            .catch((error) => {
                toast.error("Error al actualizar empresa");
                console.error(error);
            });
    };

    const handleDelete = (id) => {
        const entity = entities[id];
        if (!window.confirm(`¿Eliminar "${entity.name}"?`)) return;

        const entityRef = ref(database, `config/paymentEntities/${id}`);
        remove(entityRef)
            .then(() => toast.success("Empresa eliminada"))
            .catch((error) => {
                toast.error("Error al eliminar empresa");
                console.error(error);
            });
    };

    const entitiesArray = Object.entries(entities);

    return (
        <Container>
            <Header>
                <Title>🏢 Empresas de Pago</Title>
                <AddButton onClick={() => { setIsAdding(!isAdding); setEditingId(null); setNewForm({ name: '', endpoint: '' }); }}>
                    {isAdding ? <FaTimes /> : <FaPlus />}
                    {isAdding ? 'Cancelar' : 'Agregar'}
                </AddButton>
            </Header>

            {isAdding && (
                <Table style={{ marginBottom: 20 }}>
                    <thead>
                        <tr>
                            <th colSpan={3} style={{ textAlign: 'center', background: editingId ? '#fff3cd' : '#d1ecf1' }}>
                                {editingId ? '✏️ Editar Empresa' : '➕ Nueva Empresa'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <Input
                                    placeholder="Nombre de la empresa"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                />
                            </td>
                            <td>
                                <Input
                                    placeholder="URL del endpoint (opcional)"
                                    value={newForm.endpoint}
                                    onChange={(e) => setNewForm({ ...newForm, endpoint: e.target.value })}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', maxWidth: '350px' }}>
                                    💡 <b>Cómo obtener la URL:</b> Ingresá a <a href="https://www.mercadopago.com.ar/sp/recurrent/entities-search?type=oneshot" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'underline' }}>Mercado Pago (Pagar Servicios)</a>, buscá la empresa y seleccionala. Cuando te pida ingresar el código de barras, copiá la URL completa de tu navegador y pegala aquí.
                                </div>
                            </td>
                            <td style={{ width: 100 }}>
                                <ActionButton $primary onClick={handleAdd}>
                                    <FaSave /> Guardar
                                </ActionButton>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            )}

            {entitiesArray.length === 0 ? (
                <EmptyState>
                    No hay empresas configuradas. <br />
                    Hacé click en "Agregar" para crear la primera.
                </EmptyState>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th style={{ width: 140 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entitiesArray.map(([id, entity]) => (
                            <tr key={id}>
                                <td>
                                    <strong>{entity.name}</strong>
                                </td>
                                <td>
                                    <ActionButton onClick={() => handleEdit(id)}>
                                        <FaEdit /> Editar
                                    </ActionButton>
                                    <ActionButton $danger onClick={() => handleDelete(id)}>
                                        <FaTrash /> Eliminar
                                    </ActionButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default PaymentEntitiesManager;
