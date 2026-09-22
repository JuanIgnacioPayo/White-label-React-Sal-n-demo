
import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const CompactComponentReorder = () => {
  const [componentOrder, setComponentOrder] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const database = getDatabase(app);

  const componentOrderRef = useRef(componentOrder);
  useEffect(() => {
    componentOrderRef.current = componentOrder;
  }, [componentOrder]);

  const updateFirebaseOrder = (newOrder) => {
    set(ref(database, 'componentOrder'), newOrder)
      .then(() => console.log('Component order updated in Firebase successfully!'))
      .catch((error) => console.error('Error updating component order in Firebase:', error));
  };

  const onDragStart = () => setIsDragging(true);

  const onDragEnd = (result) => {
    setIsDragging(false);
    const { source, destination } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const currentOrder = componentOrderRef.current;
    let visibleComponents = currentOrder.filter(c => c.isVisible);
    let hiddenComponents = currentOrder.filter(c => !c.isVisible);
    let draggedItem;

    if (source.droppableId === 'visibleComponents') {
      [draggedItem] = visibleComponents.splice(source.index, 1);
      if (destination.droppableId === 'hiddenComponents') {
        draggedItem.isVisible = false;
        hiddenComponents.splice(destination.index, 0, draggedItem);
      } else {
        visibleComponents.splice(destination.index, 0, draggedItem);
      }
    } else {
      [draggedItem] = hiddenComponents.splice(source.index, 1);
      if (destination.droppableId === 'visibleComponents') {
        draggedItem.isVisible = true;
        visibleComponents.splice(destination.index, 0, draggedItem);
      } else {
        hiddenComponents.splice(destination.index, 0, draggedItem);
      }
    }

    const newComponentOrder = [...visibleComponents, ...hiddenComponents];
    setComponentOrder(newComponentOrder);
    updateFirebaseOrder(newComponentOrder);
  };

  const handleToggleVisibility = (componentName) => {
    const newOrder = componentOrder.map(comp =>
      comp.name === componentName ? { ...comp, isVisible: !comp.isVisible } : comp
    );
    setComponentOrder(newOrder);
    updateFirebaseOrder(newOrder);
  };

  useEffect(() => {
    const dbRef = ref(database, 'componentOrder');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (!isDragging) {
        const allKnownComponentNames = [
          'Header', 'Navbar', 'Home', 'QuienesSomos',
          'Calendar', 'SocialMediaRow',
          'ReviewsAndTestimonials', 'Grid2x2', 'NewContactSection',
          'Footer', 'Branding', 'ScrollToTop', 'HorariosVisita'
        ];

        const firebaseData = snapshot.val();
        let processedFirebaseOrder = [];

        if (firebaseData) {
          processedFirebaseOrder = firebaseData
            .map(item => (typeof item === 'string' ? { name: item, isVisible: true } : item))
            .filter(item => allKnownComponentNames.includes(item.name));
        }

        const firebaseNames = new Set(processedFirebaseOrder.map(comp => comp.name));
        const finalComponentOrder = [...processedFirebaseOrder];
        allKnownComponentNames.forEach(name => {
          if (!firebaseNames.has(name)) {
            finalComponentOrder.push({ name: name, isVisible: true });
          }
        });

        const currentOrderFromRef = componentOrderRef.current;
        const isSameOrder = currentOrderFromRef.length === finalComponentOrder.length &&
          currentOrderFromRef.every((comp, index) =>
            comp.name === finalComponentOrder[index].name &&
            comp.isVisible === finalComponentOrder[index].isVisible
          );

        if (!isSameOrder) {
          setComponentOrder(finalComponentOrder);
          // If we appended new known components, sync them to Firebase automatically
          updateFirebaseOrder(finalComponentOrder);
        }
      }
    });

    return () => unsubscribe();
  }, [database, isDragging]);

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="visibleComponents">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyle: 'none', padding: 0, marginBottom: '10px' }}>
              {componentOrder.filter(comp => comp.isVisible).map((component, index) => (
                <Draggable key={component.name} draggableId={component.name} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        userSelect: 'none', padding: '5px', margin: '0 0 5px 0',
                        backgroundColor: '#e6f7ff', border: '1px solid #91d5ff',
                        borderRadius: '3px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '14px', ...provided.draggableProps.style,
                      }}
                    >
                      <span>{component.name}</span>
                      <button onClick={() => handleToggleVisibility(component.name)} style={{ padding: '2px 5px', fontSize: '12px' }}>
                        {component.isVisible ? 'Visible' : 'Oculto'}
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
        <Droppable droppableId="hiddenComponents">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyle: 'none', padding: 0 }}>
              {componentOrder.filter(comp => !comp.isVisible).map((component, index) => (
                <Draggable key={component.name} draggableId={component.name} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        userSelect: 'none', padding: '5px', margin: '0 0 5px 0',
                        backgroundColor: '#fff1f0', border: '1px solid #ffa39e',
                        borderRadius: '3px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '14px', ...provided.draggableProps.style,
                      }}
                    >
                      <span>{component.name}</span>
                      <button onClick={() => handleToggleVisibility(component.name)} style={{ padding: '2px 5px', fontSize: '12px' }}>
                        {component.isVisible ? 'Visible' : 'Oculto'}
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default CompactComponentReorder;
