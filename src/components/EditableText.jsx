import React, { useState, useEffect, useRef } from 'react';

const EditableText = ({ value, onSave, isEditable, isTextArea = false, className = '', startInEditMode = false, placeholder = '', as: Component = 'span' }) => {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);



  // Original logic for non-textarea or non-editable text
  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (onSave) {
        onSave(currentValue);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isTextArea) {
      e.preventDefault();
      inputRef.current.blur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      inputRef.current.blur();
    }
  };

  return (
    <>
      {isEditing && isEditable ? (
        isTextArea ? (
          <textarea
            ref={inputRef}
            className={`form-textarea mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${className}`}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={placeholder}
            style={{ boxSizing: 'border-box', fontFamily: 'product sans', width: '100%', flex: 1 }}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            className={`form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${className}`}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={placeholder}
            style={{ boxSizing: 'border-box', fontFamily: 'product sans', width: '100%', flex: 1 }}
          />
        )
      ) : (
        <Component
          className={`editable-text-display ${className} ${isEditable ? 'can-edit hover:bg-gray-100 p-1 rounded cursor-pointer' : ''}`}
          onDoubleClick={handleDoubleClick}
        >
          {value || placeholder} {/* Display placeholder if value is empty */}
        </Component>
      )}
    </>
  );
};

export default EditableText;
