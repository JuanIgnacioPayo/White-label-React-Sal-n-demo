import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const RichEditableText = ({ value, onSave, isEditable, className = '', placeholder = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) {
      onSave(currentValue);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentValue(value);
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  // Prevenir que Quill genere <p><br></p> por defecto si está vacío
  const handleChange = (content, delta, source, editor) => {
    if (editor.getText().trim().length === 0) {
      setCurrentValue("");
    } else {
      setCurrentValue(content);
    }
  };

  if (isEditing && isEditable) {
    return (
      <div className="rich-editor-container" style={{ position: 'relative', zIndex: 1000, background: 'white', border: '1px solid #ccc', padding: '5px', borderRadius: '4px', minWidth: '300px' }}>
        <ReactQuill 
          theme="snow" 
          value={currentValue} 
          onChange={handleChange} 
          modules={modules}
          placeholder={placeholder}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' }}>
          <button onClick={handleCancel} style={{ padding: '4px 8px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'black' }}>Cancelar</button>
          <button onClick={handleSave} style={{ padding: '4px 8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    );
  }

  // Quill a veces exporta contenido en bloques (ej. <p>). 
  // Para mantener el layout en línea, usamos un <span> si es posible, o un <div>.
  // Usaremos un <div> con un contenedor flex si lo necesitamos.
  
  return (
    <div
      className={`editable-text-display ${className} ${isEditable ? 'can-edit' : ''}`}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: isEditable ? 'pointer' : 'default',
        padding: isEditable ? '2px' : '0',
        borderRadius: '4px',
        border: isEditable ? '1px dashed transparent' : 'none',
        minWidth: '20px',
        minHeight: '20px'
      }}
      onMouseEnter={(e) => { if(isEditable) e.currentTarget.style.border = '1px dashed #aaa'; }}
      onMouseLeave={(e) => { if(isEditable) e.currentTarget.style.border = '1px dashed transparent'; }}
    >
      {value ? (
        <span dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <span style={{ color: '#aaa', fontStyle: 'italic' }}>{placeholder || 'Doble clic para editar...'}</span>
      )}
    </div>
  );
};

export default RichEditableText;
