import { createGlobalStyle } from 'styled-components';

export const FestiveThemeGlobalStyle = createGlobalStyle`
  .form-festive-themes {
    max-width: 1000px;
    margin: auto;
    padding: 1rem;
    padding-bottom: 120px;
    background-color: var(--card-grey);
    border-radius: 12px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    font-family: 'product_sansregular';
  }
  .form-festive-themes h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }
  .festive-theme-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .form-group {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
  }
  .form-group label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #334155;
  }
  .form-group input, .form-group select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: 'product_sansregular';
  }
  .color-picker-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .color-picker-group input[type="color"] {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    cursor: pointer;
  }
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    margin-right: 10px;
  }
  .btn-primary {
    background-color: var(--primary-color);
    color: white;
  }
  .btn-danger {
    background-color: #dc3545;
    color: white;
  }
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  .theme-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  .img-preview {
    max-width: 200px;
    max-height: 100px;
    object-fit: contain;
    margin-top: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fdfbf5;
  }

  /* Estilos para el listado de ideas y feriados */
  .ideas-toggle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
  .btn-ideas-toggle {
    background: linear-gradient(135deg, var(--primary-color, #948924) 0%, #160529 100%);
    color: white;
    font-size: 1rem;
    padding: 12px 28px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(22, 5, 41, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-ideas-toggle:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 20px rgba(22, 5, 41, 0.35);
  }
  .btn-ideas-toggle:active {
    transform: translateY(-1px);
  }
  .holiday-ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .holiday-idea-card {
    background: white;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .holiday-idea-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color, #948924);
  }
  .idea-card-header {
    padding: 1.2rem;
    background: #fdfbf5;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 90px;
  }
  .idea-card-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: #1a1a1a;
    font-weight: 700;
  }
  .idea-date {
    font-size: 0.85rem;
    color: #666;
    font-weight: 500;
  }
  .idea-badge {
    position: absolute;
    top: 12px;
    right: 48px;
    background: rgba(148, 137, 36, 0.1);
    color: #948924;
    font-size: 0.72rem;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .idea-badge.next-year {
    background: rgba(22, 5, 41, 0.1);
    color: #160529;
  }
  .ideas-list {
    padding: 1.2rem;
    flex-grow: 1;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ideas-list li {
    font-size: 0.88rem;
    line-height: 1.4;
    color: #444;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .quick-apply-btn {
    margin: 0 1.2rem 1.2rem 1.2rem;
    background-color: #fdfbf5;
    color: #948924;
    border: 1px solid rgba(148, 137, 36, 0.3);
    border-radius: 10px;
    padding: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.85rem;
  }
  .quick-apply-btn:hover {
    background-color: #948924;
    color: white;
    border-color: #948924;
    transform: translateY(-2px);
  }
  .quick-apply-btn:active {
    transform: translateY(0);
  }

  /* Estilos para el botón de previsualización */
  .preview-btn {
    margin: 0 1.2rem 1.2rem 1.2rem;
    background-color: #f3e9f9;
    color: #8a2be2;
    border: 1px solid rgba(138, 43, 226, 0.3);
    border-radius: 10px;
    padding: 10px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.85rem;
  }
  .preview-btn:hover {
    background-color: #8a2be2;
    color: white;
    border-color: #8a2be2;
    transform: translateY(-2px);
  }
  .preview-btn:active {
    transform: translateY(0);
  }
  .preview-btn.active {
    background-color: #e21334;
    color: white;
    border-color: #e21334;
    box-shadow: 0 4px 12px rgba(226, 19, 52, 0.3);
  }
  
  /* Banner de alerta de simulación de tema */
  .preview-alert-banner {
    background: linear-gradient(135deg, #e21334 0%, #b30006 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 25px rgba(226, 19, 52, 0.25);
    animation: pulseGlow 2.5s infinite;
  }
  @keyframes pulseGlow {
    0% { box-shadow: 0 8px 25px rgba(226, 19, 52, 0.25); }
    50% { box-shadow: 0 8px 35px rgba(226, 19, 52, 0.45); }
    100% { box-shadow: 0 8px 25px rgba(226, 19, 52, 0.25); }
  }
  .preview-alert-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
    font-size: 1.05rem;
  }
  .btn-preview-stop {
    background-color: white;
    color: #e21334;
    border: none;
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
  .btn-preview-stop:hover {
    transform: translateY(-2px);
    background-color: #fff0f2;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 1rem;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(148, 137, 36, 0.1);
    border-top: 4px solid var(--primary-color, #948924);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media screen and (max-width: 768px) {
    .holiday-ideas-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* Estilos de selección y lote */
  .ideas-bulk-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fdfbf5;
    border-radius: 12px;
    padding: 15px 20px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(148, 137, 36, 0.25);
    flex-wrap: wrap;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }
  .bulk-info-text {
    font-size: 0.95rem;
    color: #4e3d30;
    font-weight: 500;
  }
  .bulk-buttons-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .btn-bulk-action {
    background-color: var(--primary-color, #948924);
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    box-shadow: 0 4px 10px rgba(148, 137, 36, 0.2);
  }
  .btn-bulk-action:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(148, 137, 36, 0.35);
  }
  .btn-bulk-action:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn-bulk-action:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn-bulk-secondary {
    background-color: transparent;
    color: #4e3d30;
    border: 1.5px solid #4e3d30;
    padding: 9px 16px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }
  .btn-bulk-secondary:hover {
    background-color: rgba(78, 61, 48, 0.05);
  }
  
  /* Animación y selección de la tarjeta */
  .holiday-idea-card {
    cursor: pointer;
    border: 2px solid rgba(0, 0, 0, 0.08) !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  }
  .holiday-idea-card.selected {
    border-color: var(--primary-color, #948924) !important;
    box-shadow: 0 0 0 2px rgba(148, 137, 36, 0.25), 0 15px 35px rgba(0, 0, 0, 0.08) !important;
    transform: scale(1.03) translateY(-4px) !important;
    background-color: #faf9f0 !important;
  }
  .holiday-idea-card.already-created {
    border-color: #10b981 !important;
    background-color: #f0fdf4 !important;
    cursor: default !important;
  }
  .holiday-idea-card.already-created .select-indicator {
    border-color: #10b981 !important;
    background-color: #10b981 !important;
    transform: none !important;
  }
  .holiday-idea-card.already-created .select-indicator::after {
    opacity: 1 !important;
  }
  
  /* Indicador checkbox circular */
  .select-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #ccc;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .holiday-idea-card.selected .select-indicator {
    border-color: var(--primary-color, #948924);
    background-color: var(--primary-color, #948924);
    transform: scale(1.1);
  }
  .select-indicator::after {
    content: '✓';
    color: white;
    font-weight: 900;
    font-size: 0.85rem;
    opacity: 0;
    transition: all 0.2s ease;
  }
  .holiday-idea-card.selected .select-indicator::after {
    opacity: 1;
  }

  /* Grid and Cards for Configured Themes */
  .configured-themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }
  .configured-theme-item-card {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    cursor: pointer;
  }
  .configured-theme-item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.06);
    border-color: var(--primary-color, #948924);
  }
  .configured-theme-img-preview {
    width: 100%;
    height: 100px;
    object-fit: contain;
    border-radius: 6px;
    background: #fdfbf5;
    border: 1px solid #f1f1f1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-size: 1.5rem;
  }
  .configured-theme-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    font-size: 0.65rem;
    font-weight: bold;
    padding: 3px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  .configured-theme-badge.active {
    background: #ecfdf5;
    color: #10b981;
  }
  .configured-theme-badge.inactive {
    background: #f3f4f6;
    color: #6b7280;
  }
  .configured-theme-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
  }
  .configured-theme-details h4 {
    margin: 0;
    font-size: 0.95rem;
    color: #1f2937;
    font-weight: bold;
  }
  .configured-theme-date {
    font-size: 0.78rem;
    color: #6b7280;
    font-weight: 500;
  }
  .configured-theme-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .configured-theme-actions .btn {
    flex-grow: 1;
    margin: 0;
    padding: 8px;
    font-size: 0.78rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  /* Compact Theme Row */
  .configured-theme-compact-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.01);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .configured-theme-compact-row:hover {
    border-color: var(--primary-color, #948924);
    background: #fafaf5;
  }
  .configured-theme-compact-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .configured-theme-compact-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .configured-theme-compact-status-dot.active {
    background-color: #10b981;
    box-shadow: 0 0 6px #10b981;
  }
  .configured-theme-compact-status-dot.inactive {
    background-color: #9ca3af;
  }
  .configured-theme-compact-row strong {
    font-size: 0.9rem;
    color: #1f2937;
  }
`;
