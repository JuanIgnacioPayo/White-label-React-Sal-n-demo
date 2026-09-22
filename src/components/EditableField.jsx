import React, { useState, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import './EditableField.css'; // Import the CSS file

// Reusable component for Click-to-Edit functionality

const theme = {
  // Example content styles for Lexical, apply your own CSS
  // These are basic placeholders and would typically be defined in a CSS file
  paragraph: "editor-paragraph",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    code: "editor-text-code",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
  },
  link: "editor-link",
  hashtag: "editor-hashtag",
  blockquote: "editor-blockquote",
  code: "editor-code",
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    cdata: "editor-tokenComment",
    char: "editor-tokenSelector",
  },
};

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.focus();
  }, [editor]);

  return null;
}

const EditableField = ({ fieldKey, value, onSave, editingField, setEditingField, isEditable, as: Component = 'p', isNumeric = false, isModalEdit = false, ...props }) => {
  const [editedValue, setEditedValue] = useState(isNumeric ? (value || '').replace(/\D/g, '') : value);
  const [isFocused, setIsFocused] = useState(false); // New state to track focus
  const editorWrapperRef = useRef(null);

  useEffect(() => {
    setEditedValue(isNumeric ? (value || '').replace(/\D/g, '') : value);
  }, [value, isNumeric]);

  // Effect to handle Escape key (only if not in modal edit mode)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (setEditingField) setEditingField(null);
      }
    };

    if (!isModalEdit && isEditable && editingField === fieldKey) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditable, editingField, fieldKey, setEditingField, isModalEdit]);

  // Render editable state if isModalEdit is true, or if it's the active editing field
  if (isModalEdit || (isEditable && editingField === fieldKey)) {
    return (
      <div
        className={`editor-wrapper ${isFocused ? 'focused' : ''}`}
        ref={editorWrapperRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <LexicalComposer initialConfig={{
          namespace: 'EditableFieldEditor',
          theme,
          onError(error) {
            console.error(error);
          },
          nodes: [],
          editorState: () => {
            $getRoot().append($createTextNode(editedValue));
          },
        }}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-content-editable" />}
            placeholder={<div className="editor-placeholder">Enter some text...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MyCustomAutoFocusPlugin />
          <OnChangePlugin onChange={(editorState) => {
            editorState.read(() => {
              const root = $getRoot();
              setEditedValue(root.getTextContent());
            });
          }} />
        </LexicalComposer>
        <button className="save-button" onClick={() => onSave(fieldKey, editedValue)}>Guardar</button>
        {!isModalEdit && <button className="cancel-button" onClick={(e) => { e.stopPropagation(); console.log("Cancel button clicked"); setEditingField(null); }}>Cancelar</button>}
      </div>
    );
  }

  // Render the static text. It becomes clickable if isEditable is true.
  const displayValue = (isEditable && !value) ? 'Hacé doble click para editar este texto' : value;
  const placeholderStyle = (isEditable && !value) ? { opacity: 0.4, fontStyle: 'italic' } : {};
  return (
    <Component {...props} style={placeholderStyle} onClick={(e) => { if (isEditable) { e.preventDefault(); setEditingField(fieldKey); } }} dangerouslySetInnerHTML={{ __html: displayValue }} />
  );
};

export default EditableField;
