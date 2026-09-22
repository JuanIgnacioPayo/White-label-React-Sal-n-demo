import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';
import { app } from '../../firebase/firebase';
import EditableText from '../EditableText';
import styled from 'styled-components';
import SymbolToggle, { types } from '../SymbolToggle/SymbolToggle';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AclaracionesContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid var(--border-color, #eee);
  border-radius: 8px;
  background-color: transparent;
`;

const AclaracionItem = styled.div`
  background-color: var(--app-background-color, #ffffec);
  padding: 10px 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  box-shadow: 0 4px 6px var(--shadow-color, rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-bottom: none;
  opacity: ${props => props.$isDragging ? 0.5 : 1};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px var(--shadow-color, rgba(0, 0, 0, 0.15));
  }

  &:last-child {
    border-bottom: none;
  }

  .editable-text-container {
    flex-grow: 1;
    margin-right: 1rem;
  }
`;

const AddButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;

  &:hover {
    background-color: #218838;
  }
`;

const RemoveButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background-color: #c82333;
  }
`;

const Title = styled.h2`
  background-color: var(--app-primary-text-color, var(--primary-color));
  color: var(--white-text);
  text-align: center;
  text-shadow: 2px 2px 10px var(--primary-text);
  border-radius: 5px;
  margin-bottom: 1rem;
  padding: 1rem;
  width: calc(100% + 2rem);
  margin-left: -1rem;
  margin-right: -1rem;
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin-right: 0.5rem;
  cursor: ${props => props.$isEditable ? 'grab' : 'default'};
  color: var(--secondary-text, #666);
  font-size: 1.5rem;
  user-select: none;
  touch-action: none;
  
  &:active {
    cursor: ${props => props.$isEditable ? 'grabbing' : 'default'};
  }
`;

function SortableAclaracion({ aclaracion, currentUser, onSaveText, onToggleType, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: aclaracion.id, disabled: !currentUser });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <AclaracionItem
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      $isEditable={!!currentUser}
      {...attributes}
    >
      {currentUser && (
        <DragHandle {...listeners} $isEditable={!!currentUser}>
          ☰
        </DragHandle>
      )}
      <SymbolToggle
        type={aclaracion.type}
        onToggle={() => onToggleType(aclaracion.id, aclaracion.type)}
        isEditable={!!currentUser}
      />
      <EditableText
        value={aclaracion.text}
        onSave={(newText) => onSaveText(aclaracion.id, newText)}
        isEditable={!!currentUser}
        isTextArea={true}
      />
      {currentUser && (
        <RemoveButton onClick={() => onRemove(aclaracion.id)}>
          Eliminar
        </RemoveButton>
      )}
    </AclaracionItem>
  );
}

export default function AclaracionesDinamicas({ currentUser, showToast, bannerTitle, onSaveBannerTitle }) {
  const [aclaraciones, setAclaraciones] = useState([]);
  const db = getDatabase(app);
  const dbRef = ref(db, 'datosId/29/aclaraciones');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedAclaraciones = Object.keys(data).map(key => ({
          id: key,
          text: data[key].text,
          type: data[key].type || 'check',
          order: data[key].order !== undefined ? data[key].order : 999,
        }));

        // Sort by order
        loadedAclaraciones.sort((a, b) => a.order - b.order);

        // If any items lack proper order, reassign
        const needsReorder = loadedAclaraciones.some(item => item.order === 999);
        if (needsReorder) {
          loadedAclaraciones.forEach((item, index) => {
            if (item.order === 999) {
              update(ref(db, `datosId/29/aclaraciones/${item.id}`), { order: index });
            }
          });
        }

        setAclaraciones(loadedAclaraciones);
      } else {
        setAclaraciones([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = aclaraciones.findIndex(item => item.id === active.id);
    const newIndex = aclaraciones.findIndex(item => item.id === over.id);

    const newAclaraciones = arrayMove(aclaraciones, oldIndex, newIndex);
    setAclaraciones(newAclaraciones);

    // Update order in Firebase
    try {
      const updates = {};
      newAclaraciones.forEach((item, index) => {
        updates[`datosId/29/aclaraciones/${item.id}/order`] = index;
      });
      await update(ref(db), updates);
    } catch (error) {
      console.error('Error updating order:', error);
      if (showToast) showToast('Error al reordenar', 'error');
    }
  };

  const handleAddAclaracion = async () => {
    if (!currentUser) return;
    try {
      const newAclaracionRef = push(dbRef);
      const nextOrder = aclaraciones.length;
      await update(newAclaracionRef, {
        text: 'Nueva aclaración',
        type: 'check',
        order: nextOrder
      });
      showToast('Nueva aclaración agregada', 'success');
    } catch (error) {
      console.error('Error al agregar aclaración:', error);
      showToast('Error al agregar aclaración', 'error');
    }
  };

  const handleRemoveAclaracion = async (id) => {
    if (!currentUser) return;
    try {
      await remove(ref(db, `datosId/29/aclaraciones/${id}`));
      showToast('Aclaración eliminada', 'success');
    } catch (error) {
      console.error('Error al eliminar aclaración:', error);
      showToast('Error al eliminar aclaración', 'error');
    }
  };

  const handleSaveAclaracion = async (id, newText) => {
    if (!currentUser) return;
    try {
      await update(ref(db, `datosId/29/aclaraciones/${id}`), { text: newText });
      showToast('Aclaración actualizada', 'success');
    } catch (error) {
      console.error('Error al actualizar aclaración:', error);
      showToast('Error al actualizar aclaración', 'error');
    }
  };

  const handleToggleType = async (id, currentType) => {
    if (!currentUser) return;

    const currentIndex = types.indexOf(currentType);
    const validIndex = currentIndex !== -1 ? currentIndex : 0;

    const nextIndex = (validIndex + 1) % types.length;
    const newType = types[nextIndex];

    try {
      await update(ref(db, `datosId/29/aclaraciones/${id}`), { type: newType });
    } catch (error) {
      console.error('Error al actualizar tipo:', error);
      showToast('Error al actualizar tipo', 'error');
    }
  };

  return (
    <AclaracionesContainer>
      <Title>
        <EditableText
          value={bannerTitle}
          onSave={onSaveBannerTitle}
          isEditable={!!currentUser}
        />
      </Title>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={aclaraciones.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {aclaraciones.map((aclaracion) => (
            <SortableAclaracion
              key={aclaracion.id}
              aclaracion={aclaracion}
              currentUser={currentUser}
              onSaveText={handleSaveAclaracion}
              onToggleType={handleToggleType}
              onRemove={handleRemoveAclaracion}
            />
          ))}
        </SortableContext>
      </DndContext>
      {currentUser && (
        <AddButton onClick={handleAddAclaracion}>
          Agregar Aclaración
        </AddButton>
      )}
    </AclaracionesContainer>
  );
}
