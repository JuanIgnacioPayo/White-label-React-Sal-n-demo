import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { app } from '../../firebase/firebase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import styled from "styled-components";

const StyledListItem = styled.li`
  user-select: none;
  padding: 8px;
  margin: 0 0 8px 0;
  min-height: 50px;
  background-color: #d8f5cfff;
  color: black;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HiddenStyledListItem = styled.li`
  user-select: none;
  padding: 8px;
  margin: 0 0 8px 0;
  min-height: 50px;
  background-color: #fdc8c8ff;
  color: black;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ComponentReorderAdmin = () => {
  const [componentOrder, setComponentOrder] = useState([]);
  const [isDragging, setIsDragging] = useState(false); // New state to track dragging
  const database = getDatabase(app);

  // Use a ref to store the latest componentOrder without triggering re-renders
  const componentOrderRef = useRef(componentOrder);
  useEffect(() => {
    componentOrderRef.current = componentOrder;
  }, [componentOrder]);

  // Function to update order in Firebase
  const updateFirebaseOrder = (newOrder) => {
    set(ref(database, 'componentOrder'), newOrder)
      .then(() => {
        console.log('Component order updated in Firebase successfully!');
      })
      .catch((error) => {
        console.error('Error updating component order in Firebase:', error);
      });
  };

  const onDragStart = () => {
    setIsDragging(true);
  };

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

  // Fetch current order from Firebase
  useEffect(() => {
    const dbRef = ref(database, 'componentOrder');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      // Only update state if not currently dragging
      if (!isDragging) {
        const allKnownComponentNames = [
          'Header', 'Navbar', 'Home', 'QuienesSomos', 'Aclaraciones', 'Calculadora',
          'Calendar', 'Calificaciones', 'InstagramEmbed',
          'ReviewsAndTestimonials', 'Testimonial', 'Testimonial2', 'Grid2x2',
          'Footer', 'Branding', 'ScrollToTop', 'FloatingAiButton', 'Chatbot'
        ];

        const firebaseData = snapshot.val();
        let processedFirebaseOrder = [];

        if (firebaseData) {
          processedFirebaseOrder = firebaseData
            .map(item => {
              if (typeof item === 'string') {
                return { name: item, isVisible: true };
              }
              return item;
            })
            .filter(item => allKnownComponentNames.includes(item.name)); // <-- FILTRO ADICIONAL
        }

        const firebaseNames = new Set(processedFirebaseOrder.map(comp => comp.name));
        const finalComponentOrder = [...processedFirebaseOrder];
        allKnownComponentNames.forEach(name => {
          if (!firebaseNames.has(name)) {
            finalComponentOrder.push({ name: name, isVisible: true });
          }
        });

        // Deep comparison to prevent unnecessary re-renders
        const currentOrderFromRef = componentOrderRef.current;
        const isSameOrder = currentOrderFromRef.length === finalComponentOrder.length &&
                            currentOrderFromRef.every((comp, index) =>
                              comp.name === finalComponentOrder[index].name &&
                              comp.isVisible === finalComponentOrder[index].isVisible
                            );

        if (!isSameOrder) {
          setComponentOrder(finalComponentOrder);
        }
      }
    });

    return () => unsubscribe();
  }, [database, isDragging]); // Add isDragging to dependencies

  return (
    <div style={{ padding: '20px' }}>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <h3>Componentes Visibles</h3>
        <Droppable droppableId="visibleComponents">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ listStyle: 'none', padding: 0 }}
            >
              {componentOrder.filter(comp => comp.isVisible).map((component, index) => (
                <Draggable key={component.name} draggableId={component.name} index={index}>
                  {(provided) => (
                    <StyledListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                    >
                      <span>{component.name}</span>
                      <button
                        onClick={() => handleToggleVisibility(component.name)}
                        style={{
                          backgroundColor: component.isVisible ? 'green' : 'red',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        {component.isVisible ? 'Visible' : 'Oculto'}
                      </button>
                    </StyledListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>

        <h3>Componentes Ocultos</h3>
        <Droppable droppableId="hiddenComponents">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ listStyle: 'none', padding: 0 }}
            >
              {componentOrder.filter(comp => !comp.isVisible).map((component, index) => (
                <Draggable key={component.name} draggableId={component.name} index={index}>
                  {(provided) => (
                    <HiddenStyledListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                    >
                      <span>{component.name}</span>
                      <button
                        onClick={() => handleToggleVisibility(component.name)}
                        style={{
                          backgroundColor: component.isVisible ? 'green' : 'red',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        {component.isVisible ? 'Visible' : 'Oculto'}
                      </button>
                    </HiddenStyledListItem>
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

export default ComponentReorderAdmin;