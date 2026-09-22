import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { AVAILABLE_ICONS, ReceiptIcon } from "./receiptInfograficoUtils";

export default function IconPickerModal({ isOpen, onClose, currentIcon, onSelectIcon, cardTitle }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Todos");

    const categories = ["Todos", "Tiempo", "Sonido", "Alerta", "Cocina", "Espacio", "Comunidad"];

    const filteredIcons = useMemo(() => {
        return AVAILABLE_ICONS.filter((item) => {
            const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
            const matchesSearch =
                item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchTerm]);

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <div>
                        <h3 className="modal-title">Elegir Ícono para la Tarjeta</h3>
                        {cardTitle && <p className="modal-subtitle">{cardTitle}</p>}
                    </div>
                    <button type="button" className="btn-close" onClick={onClose}>
                        ✕
                    </button>
                </ModalHeader>

                <FilterBar>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre o concepto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        autoFocus
                    />
                    <div className="categories-list">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                className={`cat-btn ${selectedCategory === cat ? "active" : ""}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </FilterBar>

                <IconsGrid>
                    {filteredIcons.length === 0 ? (
                        <div className="empty-state">No se encontraron íconos coincidentes.</div>
                    ) : (
                        filteredIcons.map((item) => {
                            const isSelected = (currentIcon || "").toLowerCase() === item.id.toLowerCase();
                            return (
                                <IconButton
                                    key={item.id}
                                    type="button"
                                    className={isSelected ? "selected" : ""}
                                    onClick={() => {
                                        onSelectIcon(item.id);
                                        onClose();
                                    }}
                                    title={item.label}
                                >
                                    <div className="icon-preview">
                                        <ReceiptIcon name={item.id} size={28} strokeWidth={2} />
                                    </div>
                                    <span className="icon-name">{item.label}</span>
                                </IconButton>
                            );
                        })
                    )}
                </IconsGrid>
            </ModalContent>
        </ModalOverlay>
    );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(3px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid #e2e8f0;

  .modal-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
  }

  .modal-subtitle {
    margin: 4px 0 0 0;
    font-size: 0.84rem;
    color: #64748b;
    max-width: 480px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-close {
    background: transparent;
    border: none;
    font-size: 1.25rem;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    line-height: 1;
    transition: all 0.15s;

    &:hover {
      color: #0f172a;
      background-color: #f1f5f9;
    }
  }
`;

const FilterBar = styled.div`
  padding: 12px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
  }

  .categories-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .cat-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background-color: #f1f5f9;
        color: #0f172a;
      }

      &.active {
        background-color: #2563eb;
        color: #ffffff;
        border-color: #2563eb;
      }
    }
  }
`;

const IconsGrid = styled.div`
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  overflow-y: auto;
  max-height: 400px;

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 30px;
    color: #64748b;
    font-size: 0.9rem;
  }
`;

const IconButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 6px;
  background-color: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 6px;

  .icon-preview {
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s;
  }

  .icon-name {
    font-size: 0.73rem;
    color: #475569;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &:hover {
    border-color: #2563eb;
    background-color: #eff6ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

    .icon-preview {
      color: #2563eb;
      transform: scale(1.1);
    }

    .icon-name {
      color: #1d4ed8;
    }
  }

  &.selected {
    border-color: #2563eb;
    background-color: #dbeafe;
    box-shadow: 0 0 0 2px #2563eb;

    .icon-preview {
      color: #1d4ed8;
    }

    .icon-name {
      color: #1d4ed8;
      font-weight: 700;
    }
  }
`;
