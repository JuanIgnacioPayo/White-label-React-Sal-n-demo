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

const ListContainer = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  background-color: var(--app-background-color, #ffffec);
  padding: 10px 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  opacity: ${props => props.$isDragging ? 0.5 : 1};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
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
  margin-top: 5px;
  margin-bottom: 15px;
  display: block;

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
  margin-left: 10px;

  &:hover {
    background-color: #c82333;
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  margin-right: 0.5rem;
  cursor: ${props => props.$isEditable ? 'grab' : 'default'};
  color: #666;
  font-size: 1.5rem;
  user-select: none;
  touch-action: none;
  
  &:active {
    cursor: ${props => props.$isEditable ? 'grabbing' : 'default'};
  }
`;

function SortableItem({ item, isEditable, onSaveText, onToggleType, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !isEditable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            $isDragging={isDragging}
            $isEditable={isEditable}
            {...attributes}
        >
            {isEditable && (
                <DragHandle {...listeners} $isEditable={isEditable}>
                    ☰
                </DragHandle>
            )}
            <SymbolToggle
                type={item.type}
                onToggle={() => onToggleType(item.id, item.type)}
                isEditable={isEditable}
            />
            <EditableText
                value={item.text}
                onSave={(newText) => onSaveText(item.id, newText)}
                isEditable={isEditable}
                isTextArea={true}
            />
            {isEditable && (
                <RemoveButton onClick={() => onRemove(item.id)}>
                    Eliminar
                </RemoveButton>
            )}
        </ListItem>
    );
}

const DynamicSymbolsList = ({
    path,
    currentUser,
    isEditable,
    showToast,
    placeholder = 'Nuevo ítem',
    defaultSymbol = 'check'
}) => {
    const [items, setItems] = useState([]);
    const db = getDatabase(app);
    const listRef = ref(db, path);

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
        const unsubscribe = onValue(listRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedItems = Object.keys(data).map(key => ({
                    id: key,
                    text: data[key].text || '',
                    type: data[key].type || defaultSymbol,
                    order: data[key].order !== undefined ? data[key].order : 999,
                }));

                // Sort by order
                loadedItems.sort((a, b) => a.order - b.order);

                // If any items lack proper order, reassign
                const needsReorder = loadedItems.some(item => item.order === 999);
                if (needsReorder) {
                    loadedItems.forEach((item, index) => {
                        if (item.order === 999) {
                            update(ref(db, `${path}/${item.id}`), { order: index });
                        }
                    });
                }

                setItems(loadedItems);
            } else {
                setItems([]);
            }
        });

        return () => unsubscribe();
    }, [path, defaultSymbol]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        // Update order in Firebase
        try {
            const updates = {};
            newItems.forEach((item, index) => {
                updates[`${path}/${item.id}/order`] = index;
            });
            await update(ref(db), updates);
        } catch (error) {
            console.error('Error updating order:', error);
            if (showToast) showToast('Error al reordenar', 'error');
        }
    };

    const handleAddItem = async () => {
        if (!isEditable) return;
        try {
            const newItemRef = push(listRef);
            const nextOrder = items.length;
            await update(newItemRef, {
                text: placeholder,
                type: defaultSymbol,
                order: nextOrder
            });
            if (showToast) showToast('Ítem agregado', 'success');
        } catch (error) {
            console.error('Error al agregar ítem:', error);
            if (showToast) showToast('Error al agregar ítem', 'error');
        }
    };

    const handleRemoveItem = async (id) => {
        if (!isEditable) return;
        try {
            await remove(ref(db, `${path}/${id}`));
            if (showToast) showToast('Ítem eliminado', 'success');
        } catch (error) {
            console.error('Error al eliminar ítem:', error);
            if (showToast) showToast('Error al eliminar ítem', 'error');
        }
    };

    const handleSaveText = async (id, newText) => {
        if (!isEditable) return;
        try {
            await update(ref(db, `${path}/${id}`), { text: newText });
            if (showToast) showToast('Ítem actualizado', 'success');
        } catch (error) {
            console.error('Error al actualizar ítem:', error);
            if (showToast) showToast('Error al actualizar ítem', 'error');
        }
    };

    const handleToggleType = async (id, currentType) => {
        if (!isEditable) return;

        const currentIndex = types.indexOf(currentType);
        const validIndex = currentIndex !== -1 ? currentIndex : 0;
        const nextIndex = (validIndex + 1) % types.length;
        const newType = types[nextIndex];

        try {
            await update(ref(db, `${path}/${id}`), { type: newType });
        } catch (error) {
            console.error('Error al actualizar tipo:', error);
            if (showToast) showToast('Error al actualizar tipo', 'error');
        }
    };

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ListContainer>
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                item={item}
                                isEditable={isEditable}
                                onSaveText={handleSaveText}
                                onToggleType={handleToggleType}
                                onRemove={handleRemoveItem}
                            />
                        ))}
                    </ListContainer>
                </SortableContext>
            </DndContext>
            {isEditable && (
                <AddButton onClick={handleAddItem}>
                    Agregar
                </AddButton>
            )}
        </div>
    );
};

export default DynamicSymbolsList;
