import styled from "styled-components";
import Slider from "./Slider/Slider";
import React, { useState, useEffect } from 'react';
import { app } from "../firebase/firebase";
import { getDatabase, ref, onValue } from "firebase/database";
import EditableField from "./EditableField";

const Section = styled.section`
  width: 100%; /* Responsive width for desktop */
  box-sizing: border-box;
  margin:auto;
  margin-top: 3rem;
  display: flex; /* Make section a flex container */
  justify-content: center; /* Center its content (the .servicios div) */


  .servicios {
    display: grid;
    ${({ $gridMode }) => {
      if ($gridMode === '1x2') return 'grid-template-columns: repeat(2, minmax(250px, 1fr));';
      if ($gridMode === '1x1') return 'grid-template-columns: minmax(250px, 1fr);';
      if ($gridMode === '1x3') return 'grid-template-columns: repeat(3, minmax(250px, 1fr));';
      if ($gridMode === '2x3') return 'grid-template-columns: repeat(3, minmax(250px, 1fr));';
      if ($gridMode === '3x2') return 'grid-template-columns: repeat(2, minmax(250px, 1fr));';
      if ($gridMode === '3x3') return 'grid-template-columns: repeat(3, minmax(250px, 1fr));';
      return 'grid-template-columns: repeat(2, minmax(250px, 1fr));'; // Default to 2x2
    }}
    gap: 2rem;
    /* Removed max-width: 1200px; */
    /* Removed margin: 0 auto; */
    /* Removed width: 100%; */


    .service {
      /* Removed max-width: 400px; to allow items to expand with grid columns */
      border-radius:12px;
      padding: 1.5rem; 
      text-align: center;
      background-color: var(--card-grey);
      display: flex; /* Keep for internal content alignment */
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      
      h3 {
        color: var(--app-primary-text-color, var(--primary-color));
        font-size: 1.5rem; 
      }
      p {
        font-size: 1rem; 
        color: var(--primary-text);
      }
      
      .container {
        width: 100%; 
        aspect-ratio: 1 / 1; /* Changed from 4 / 3 to 1 / 1 for square cells */
      }
      
      .slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
      }
      
      transition: var(--default-transition);
      &:hover {
        background-color:var(--white-text);
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
      }
    }
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    width: 75%; 
    padding: 0 1rem; 
    justify-content:center;
    align-items: center;
    margin:auto;
    margin-top: 0rem;

    .servicios {
      grid-template-columns: 1fr; /* Single column on mobile */
      gap: 1.5rem; 
      
      .service{
          border-radius:12px;
          padding: 0.5rem; 
          text-align: center;
          background-color: var(--card-grey);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin:auto;
          width: 100%; 
          
        .container {
          width: 100%;
          aspect-ratio: 4 / 3;
        }
        
        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        p {
          width: 90%; 
          font-size: 0.9rem; 
        }
      }
    }
  }
`;

export default function Servicios({ isEditable, data: propData, editingField, setEditingField, onSave, gridMode = '2x2', onFileSelect, onOpenGallery }) {

    // Centralized state for images
    const [cellImages, setCellImages] = useState({}); // Changed from imageUrls to cellImages
    const [internalData, setInternalData] = useState({});

    // Effect to fetch and listen for image URL changes
    useEffect(() => {
        const db = getDatabase(app);
        // Fetch images for each cell as arrays
        const cell0ImagesRef = ref(db, "datosId/28/cell0Images");
        const cell1ImagesRef = ref(db, "datosId/28/cell1Images");
        const cell2ImagesRef = ref(db, "datosId/28/cell2Images");
        const cell3ImagesRef = ref(db, "datosId/28/cell3Images");
        const cell4ImagesRef = ref(db, "datosId/28/cell4Images");
        const cell5ImagesRef = ref(db, "datosId/28/cell5Images");
        const cell6ImagesRef = ref(db, "datosId/28/cell6Images");
        const cell7ImagesRef = ref(db, "datosId/28/cell7Images");
        const cell8ImagesRef = ref(db, "datosId/28/cell8Images");

        const unsubscribes = [];

        const setupListener = (cellKey, cellRef) => {
            const unsubscribe = onValue(cellRef, (snapshot) => {
                if (snapshot.exists()) {
                    setCellImages(prev => ({ ...prev, [cellKey]: snapshot.val() }));
                } else {
                    setCellImages(prev => ({ ...prev, [cellKey]: [] })); // Ensure it's an empty array if no data
                }
            });
            unsubscribes.push(unsubscribe);
        };

        setupListener("cell0Images", cell0ImagesRef);
        setupListener("cell1Images", cell1ImagesRef);
        setupListener("cell2Images", cell2ImagesRef);
        setupListener("cell3Images", cell3ImagesRef);
        setupListener("cell4Images", cell4ImagesRef);
        setupListener("cell5Images", cell5ImagesRef);
        setupListener("cell6Images", cell6ImagesRef);
        setupListener("cell7Images", cell7ImagesRef);
        setupListener("cell8Images", cell8ImagesRef);

        return () => unsubscribes.forEach(unsub => unsub()); // Cleanup all listeners
    }, []);

    // Effect for standalone mode
    useEffect(() => {
        if (!propData) {
            const db = getDatabase(app);
            const contentRef = ref(db, "datosId/29");
            const unsubscribe = onValue(contentRef, (snapshot) => {
                if (snapshot.exists()) {
                    setInternalData(snapshot.val());
                }
            });
            return () => unsubscribe();
        }
    }, [propData]);

    const data = propData || internalData;

    const commonEditableProps = { isEditable, editingField, setEditingField, onSave };

    // No need for safeImage helper anymore as we expect arrays

    const gridItems = [
        {
            image: cellImages.cell0Images || [], // Use array from state
            title: data.contenido9,
            description: data.contenido10,
            titleFieldKey: "grid_title_0",
            descriptionFieldKey: "grid_desc_0",
            cellImageKey: "cell0Images", // New key to identify which cell's images to update
        },
        {
            image: cellImages.cell1Images || [],
            title: data.contenido11,
            description: data.contenido12,
            titleFieldKey: "grid_title_1",
            descriptionFieldKey: "grid_desc_1",
            cellImageKey: "cell1Images",
        },
        {
            image: cellImages.cell2Images || [],
            title: data.contenido13,
            description: data.contenido14,
            titleFieldKey: "grid_title_2",
            descriptionFieldKey: "grid_desc_2",
            cellImageKey: "cell2Images",
        },
        {
            image: cellImages.cell3Images || [],
            title: data.contenido15,
            description: data.contenido16,
            titleFieldKey: "grid_title_3",
            descriptionFieldKey: "grid_desc_3",
            cellImageKey: "cell3Images",
        },
        {
            image: cellImages.cell4Images || [],
            title: data.contenido50, // Use new content field
            description: data.contenido51,
            titleFieldKey: "grid_title_4",
            descriptionFieldKey: "grid_desc_4",
            cellImageKey: "cell4Images",
        },
        {
            image: cellImages.cell5Images || [],
            title: data.contenido52, // Use new content field
            description: data.contenido53,
            titleFieldKey: "grid_title_5",
            descriptionFieldKey: "grid_desc_5",
            cellImageKey: "cell5Images",
        },
        {
            image: cellImages.cell6Images || [],
            title: data.contenido54, // Use new content field
            description: data.contenido55,
            titleFieldKey: "grid_title_6",
            descriptionFieldKey: "grid_desc_6",
            cellImageKey: "cell6Images",
        },
        {
            image: cellImages.cell7Images || [],
            title: data.contenido56, // Use new content field
            description: data.contenido57,
            titleFieldKey: "grid_title_7",
            descriptionFieldKey: "grid_desc_7",
            cellImageKey: "cell7Images",
        },
        {
            image: cellImages.cell8Images || [],
            title: data.contenido58, // Use new content field
            description: data.contenido59,
            titleFieldKey: "grid_title_8",
            descriptionFieldKey: "grid_desc_8",
            cellImageKey: "cell8Images",
        },
    ];

    let filteredGridItems = gridItems;
    if (gridMode === '1x2') {
        filteredGridItems = gridItems.slice(0, 2);
    } else if (gridMode === '1x1') {
        filteredGridItems = gridItems.slice(0, 1);
    } else if (gridMode === '1x3') {
        filteredGridItems = gridItems.slice(0, 3);
    } else if (gridMode === '2x2') {
        filteredGridItems = gridItems.slice(0, 4);
    } else if (gridMode === '2x3') {
        filteredGridItems = gridItems.slice(0, 6);
    } else if (gridMode === '3x2') {
        filteredGridItems = gridItems.slice(0, 6);
    } else if (gridMode === '3x3') {
        filteredGridItems = gridItems.slice(0, 9);
    }

    return (
        <Section id="servicios" $gridMode={gridMode}>
            <div className="servicios">
                {filteredGridItems.map(({ image, title, description, titleFieldKey, descriptionFieldKey, cellImageKey }, index) => (
                    <div key={index} className="service">
                        <Slider imagenes={image} isEditable={isEditable} onFileSelect={onFileSelect} cellImageKey={cellImageKey} onOpenGallery={onOpenGallery} />

                        <EditableField
                            as="h3"
                            fieldKey={titleFieldKey}
                            value={isEditable && !title ? "Click para editar título" : title}
                            {...commonEditableProps}
                        />

                        <EditableField
                            as="p"
                            fieldKey={descriptionFieldKey}
                            value={isEditable && !description ? "Click para editar descripción" : description}
                            {...commonEditableProps}
                        />
                    </div>
                ))}
            </div>
        </Section>
    );
}