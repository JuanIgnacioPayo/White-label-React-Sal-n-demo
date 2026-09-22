import React, { useState, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'; // Import OnChangePlugin
import './EditableField.css'; // Import the CSS file


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

const EditableLink = ({
  fieldKey,
  text,
  url,
  onSave,
  isEditable,
  editingField,
  setEditingField,
  isModalEdit = false // Added isModalEdit
}) => {
  const [editedText, setEditedText] = useState(text);
  const [editedUrl, setEditedUrl] = useState(url);
  const [isFocused, setIsFocused] = useState(false); // New state to track focus
  const editorWrapperRef = useRef(null);

  useEffect(() => {
    setEditedText(text);
    setEditedUrl(url);
  }, [text, url]);

  // Effect to handle Escape key (only if not in modal edit mode)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (setEditingField) setEditingField(null); // Only call if setEditingField is provided
      }
    };
    if (!isModalEdit && isEditable && editingField === fieldKey) { // Condition for adding event listener
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditable, editingField, fieldKey, setEditingField, isModalEdit]);

  const handleSave = () => {
    onSave(editedText, editedUrl);
    // In modal edit mode, the modal's onClose handles closing
    if (!isModalEdit && setEditingField) setEditingField(null);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    // In modal edit mode, the modal's onClose handles closing
    if (!isModalEdit && setEditingField) setEditingField(null);
  };

  const handleClick = (e) => {
    if (isEditable && !isModalEdit) { // Prevent activating edit mode if already in modal
      e.preventDefault();
      setEditingField(fieldKey);
    }
  };

  // Render editable state if isModalEdit is true, or if it's the active editing field
  if (isModalEdit || (isEditable && editingField === fieldKey)) {
    return (
      <div
        className={`editor-wrapper ${isFocused ? 'focused' : ''}`}
        ref={editorWrapperRef}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Texto del enlace:</label>
        <LexicalComposer initialConfig={{
          namespace: 'EditableLinkEditor',
          theme,
          onError(error) {
            console.error(error);
          },
          nodes: [],
          editorState: () => {
            $getRoot().append($createTextNode(editedText));
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
              setEditedText(root.getTextContent());
            });
          }} />
        </LexicalComposer>

        <label style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px', display: 'block' }}>URL del enlace:</label>
        <input
          type="text"
          value={editedUrl}
          onChange={(e) => setEditedUrl(e.target.value)}
          className="editor-url-input"
        />

        <div style={{ marginTop: '10px' }}>
          <button className="save-button" onClick={handleSave}>Guardar</button>
          {/* Cancel button only if not in modal edit mode, as modal has its own close */}
          {!isModalEdit && <button className="cancel-button" onClick={handleCancel}>Cancelar</button>}
        </div>
      </div>
    );
  }

  return (
    <a href={url} onClick={handleClick} target="_blank" rel="noreferrer" dangerouslySetInnerHTML={{ __html: text }} />
  );
};

export default EditableLink;

