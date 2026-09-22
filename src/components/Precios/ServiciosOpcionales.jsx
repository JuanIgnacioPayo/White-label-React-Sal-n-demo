import React, { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';
import EditableText from '../EditableText';
import ServiciosExternosRecomendados from './ServiciosExternosRecomendados';
import HorarioSlider from './HorarioSlider'; // New import

// Estilos básicos para el nuevo componente (pueden ser ajustados)


export default function ServiciosOpcionales({
  serviciosOpcionales,
  onCarritoUpdate,
  carrito,
  showToast,
  selectedDate,
  allFetchedPrices,
  isferiado,
  inputValue546,
  inputValue547,
  inputValue548,
  handleReservaPorWhatsapp,
  generarYCopiarLink,
  linkCopiado,
  compartirPorWhatsapp,
  descuentoAdmin,
  tipoDescuentoAdmin,
  setDescuentoAdmin,
  mensajeEditable,
  mensajeFecha,
  precioAMostrar,
  precioTotal,
  isAdmin,
  handleGoToPresupuesto,
  handleSaveRentalName,
  handleSaveServicioNombre,
  carritoTitulo,
  handleSaveCarritoTitulo,
  handleSaveCamareraTitle,
  camareraInitialTitle,
  inputValue531, inputValue532, inputValue533, inputValue534, inputValue535, inputValue536,
  inputValue537, inputValue538, inputValue539, inputValue540, inputValue541, inputValue542,
  inputValue543, inputValue544, inputValue545,
  openWhatsappLink,
  bannerServiciosOpcionalesText,
  handleSaveBannerServiciosOpcionalesText,
  bannerTitle,
  onSaveBannerTitle,
  currentUser,
  externalServices,
  onAddService,
  onRemoveService,
  onSaveService,
  currentRentalService, // New prop
  presupuestoLink,
  handleSaveAclaracion,
  scheduleRules, // New prop
  onTimeChange, // New prop
  initialDuration, // New prop for HorarioSlider
  initialStartTime, // New prop for HorarioSlider
  minHour, // New prop for HorarioSlider
  isWeekendPricing, // Determines if we fallback to weekend prices (solves Friday fixed structure bug)
  handleImageClick // Passed from parent to open gallery
}) {
  const [activeTooltipId, setActiveTooltipId] = useState(null);
  const [customDescuento, setCustomDescuento] = useState(10);
  const timeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);


  const handleTooltipShow = (id, text = '') => {
    setActiveTooltipId(id);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Calculate dynamic duration: 1000ms base + 40ms per character
    const duration = 1000 + (text.length * 40);
    timeoutRef.current = setTimeout(() => {
      setActiveTooltipId(null);
    }, Math.min(duration, 11000)); // Cap at 11 seconds for very long texts


  };

  const handleTooltipHide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveTooltipId(null);
  };



  const isSpecialHoliday = (date) => {
    if (!date) return false;
    const day = date.getDate();
    const month = date.getMonth();
    return (
      (month === 11 && (day === 24 || day === 25 || day === 31)) || // December
      (month === 0 && day === 1) || // January
      (month === 4 && day === 1)    // May
    );
  };

  const serviciosUnicos = [1, 3, 7, 8, 9, 10, 12, 13, 14];

  // --- NUEVA LÓGICA PARA CAMARERAS ---

  const agregarCamarera = (servicioBase) => {
    const prevCarrito = carrito;
    const newCamarera = {
      ...servicioBase,
      id: 5, // Asegurarse que el ID es 5
      nombre: "Contratación de camarera",
      precio: allFetchedPrices.e_camarera_, // Precio por hora
      cantidad: 3,
      uuid: `camarera-${Date.now()}-${Math.random()}`
    };
    const newCarrito = [...prevCarrito, newCamarera];
    onCarritoUpdate(newCarrito);
    showToast(`Se agregó una camarera al carrito (contratación mínima de 3hs).`, 'success');
  };

  const modificarHorasCamarera = (uuid, cambio) => { // cambio puede ser 1 o -1
    const prevCarrito = carrito;
    let newCarrito;
    const itemAModificar = prevCarrito.find(item => item.uuid === uuid);

    if (!itemAModificar) return;

    const nuevaCantidad = itemAModificar.cantidad + cambio;

    if (nuevaCantidad < 3) {
      // Si se decrementa por debajo de 3 horas, se elimina la camarera
      newCarrito = prevCarrito.filter(item => item.uuid !== uuid);
      showToast(`Se eliminó una camarera del carrito.`, 'error');
    } else {
      // Si no, solo se actualizan las horas
      newCarrito = prevCarrito.map(item =>
        item.uuid === uuid ? { ...item, cantidad: nuevaCantidad, nombre: 'Contratación de camarera' } : item
      );
      const toastMessage = cambio > 0 ? 'Se agregó 1 hora a la camarera.' : 'Se quitó 1 hora a la camarera.';
      showToast(toastMessage, 'success');
    }
    onCarritoUpdate(newCarrito);
  };

  // --- FIN NUEVA LÓGICA ---

  const agregarAlCarrito = (servicio) => {
    let newCarrito;
    const prevCarrito = carrito;
    const serviciosAlquiler = [1, 3, 13, 14];
    const fechaFormateadaCarrito = selectedDate?.toLocaleDateString('es-AR');

    // La lógica de la camarera (ID 5) ahora se maneja con sus propias funciones
    if (servicio.id === 5) {
      // El botón principal solo agrega la primera. Las adicionales se agregan con el otro botón.
      if (!carrito.some(item => item.id === 5)) {
        agregarCamarera(servicio);
      }
      return; // Salir de la función para no ejecutar el resto
    }

    if (serviciosAlquiler.includes(servicio.id) && selectedDate) {
      showToast("Servicio de alquiler actualizado", 'success');
      const alquilerExistenteIndex = prevCarrito.findIndex(item => serviciosAlquiler.includes(item.id));
      const nuevoServicioAlquiler = { ...servicio, cantidad: 1, fechaEvento: fechaFormateadaCarrito };

      if (alquilerExistenteIndex > -1) {
        const tempCarrito = [...prevCarrito];
        tempCarrito[alquilerExistenteIndex] = nuevoServicioAlquiler;
        newCarrito = tempCarrito;
      } else {
        newCarrito = [...prevCarrito, nuevoServicioAlquiler];
      }
    } else {
      const itemExistenteOtros = prevCarrito.find(item => item.id === servicio.id);
      if (itemExistenteOtros && serviciosUnicos.includes(servicio.id)) {
        showToast(`${servicio.nombre} ya está en el carrito. Solo puedes agregar una unidad de este servicio.`, 'info');
        newCarrito = prevCarrito;
      } else if (itemExistenteOtros) {
        showToast(`Se agregó 1 ${servicio.nombre} al carrito`, 'success');
        newCarrito = prevCarrito.map(item =>
          item.id === servicio.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        showToast(`Se agregó 1 ${servicio.nombre} al carrito`, 'success');
        newCarrito = [...prevCarrito, { ...servicio, cantidad: 1 }];
      }
    }
    onCarritoUpdate(newCarrito);
  };

  const eliminarDelCarrito = (id) => {
    let newCarrito;
    const prevCarrito = carrito;
    const itemExistente = prevCarrito.find(item => item.id === id);

    // La lógica de camarera (ID 5) se maneja con modificarHorasCamarera, por lo que aquí no se toca
    if (itemExistente && itemExistente.id !== 5) {
      if (itemExistente.cantidad > 1) {
        newCarrito = prevCarrito.map(item =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        );
      } else {
        newCarrito = prevCarrito.filter(item => item.id !== id);
      }
    } else {
      newCarrito = prevCarrito;
    }
    onCarritoUpdate(newCarrito);
  };


  const camarerasEnCarrito = carrito.filter(item => item.id === 5);
  const otrosItemsCarrito = carrito.filter(item => item.id !== 5);

  return (
    <ServiciosContainer>
      <h2 className="banner2">
        <EditableText
          value={bannerServiciosOpcionalesText}
          onSave={handleSaveBannerServiciosOpcionalesText}
          isEditable={!!currentUser}
        />
      </h2>
      <div className="grid" >
        <ul className={`Opcionales ${isAdmin ? 'admin-mode' : ''}`} >
          {selectedDate && (
            <li 
              className={`servicio ${activeTooltipId === 'rental' ? 'high-z' : ''}`}
              onMouseEnter={() => handleTooltipShow('rental', 'Alquiler de las instalaciones para la fecha seleccionada.')}
              onMouseLeave={handleTooltipHide}
              onTouchStart={() => handleTooltipShow('rental', 'Alquiler de las instalaciones para la fecha seleccionada.')}
            >
                {(isAdmin || (currentRentalService && serviciosOpcionales.find(s => s.id === currentRentalService.id)?.imageUrl)) && (
                  <img 
                    src={currentRentalService && serviciosOpcionales.find(s => s.id === currentRentalService.id)?.imageUrl ? `${serviciosOpcionales.find(s => s.id === currentRentalService.id)?.imageUrl}&t=${new Date().getTime()}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20style%3D%22background%3A%23f0f0f0%22%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ESubir%20Foto%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                    alt="Alquiler de instalaciones" 
                    className="service-image-hover"
                    onClick={() => handleImageClick && currentRentalService && handleImageClick(currentRentalService.id)}
                    style={{ 
                      cursor: handleImageClick ? 'pointer' : 'default', 
                      pointerEvents: isAdmin ? 'auto' : 'none',
                      zIndex: 1 
                    }} 
                  />
                )}
              <div className="service-tooltip-wrapper">
                <div className="service-text-content">
                  <p>
                    <EditableText
                      value={mensajeEditable}
                      onSave={handleSaveRentalName}
                      isEditable={!!currentUser}
                      as="span"
                    />
                    <span>{mensajeFecha}</span>
                  </p>
                  <p className="bold"> ${precioAMostrar}</p>
                </div>
                <StyledOptionalServiceButton
                  onClick={() => {
                    if (currentRentalService) {
                      agregarAlCarrito(currentRentalService);
                    }
                  }}
                  disabled={currentRentalService && carrito.some(item => item.id === currentRentalService.id)}
                >
                  <div className={`servicioCantidad ${currentRentalService && carrito.some(item => item.id === currentRentalService.id) ? 'in-cart-quantity' : ''}`}>
                    {currentRentalService && carrito.some(item => item.id === currentRentalService.id) ? 1 : 0}
                  </div>
                  <h5>{currentRentalService && carrito.some(item => item.id === currentRentalService.id) ? 'Agregado' : 'Agregar'}</h5>
                </StyledOptionalServiceButton>

                {activeTooltipId === 'rental' && (
                  <span className="service-tooltip-content">Alquiler de las instalaciones para la fecha seleccionada.</span>
                )}
              </div>
            </li>)}




          {serviciosOpcionales
            .filter(servicio => servicio.id !== 1 && servicio.id !== 2 && servicio.id !== 3 && servicio.id !== 4 && servicio.id !== 13 && servicio.id !== 14)
            .sort((a, b) => {
              const desiredOrder = [10, 15, 12, 5, 6, 8, 7, 9, 11];
              const indexA = desiredOrder.indexOf(a.id);
              const indexB = desiredOrder.indexOf(b.id);
              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
            })
            .map((servicio) => {
              const itemEnCarrito = carrito.find(item => item.id === servicio.id);
              const isMaxedOut = itemEnCarrito && serviciosUnicos.includes(servicio.id);
              const hayCamareraEnCarrito = carrito.some(item => item.id === 5);

              if (servicio.id === 5) {
                return (
                  <li 
                    key="camarera-service" 
                    className={`servicio ${selectedDate ? '' : 'disabled-service'} ${activeTooltipId === 5 ? 'high-z' : ''}`}
                    onMouseEnter={() => handleTooltipShow(5, servicio.tooltipText || servicio.aclaracion || '')}
                    onMouseLeave={handleTooltipHide}
                    onTouchStart={() => handleTooltipShow(5, servicio.tooltipText || servicio.aclaracion || '')}
                  >
                    {(isAdmin || servicio.imageUrl) && <img 
                      src={servicio.imageUrl ? `${servicio.imageUrl}&t=${new Date().getTime()}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20style%3D%22background%3A%23f0f0f0%22%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ESubir%20Foto%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                      alt={servicio.nombre} 
                      className="service-image-hover" 
                      onClick={() => handleImageClick && handleImageClick(servicio.id)}
                      style={{ 
                        cursor: handleImageClick ? 'pointer' : 'default', 
                        pointerEvents: isAdmin ? 'auto' : 'none',
                        zIndex: 1 
                      }}
                    />}
                    <div className="service-tooltip-wrapper">
                      <div className="service-text-content">
                        <EditableText
                          value={camareraInitialTitle || 'Contratación de camarera'}
                          onSave={(newValue) => handleSaveCamareraTitle('initial', newValue)}
                          isEditable={!!currentUser}
                        />
                        <p className="bold">${servicio.precio * 3} (3hs min.)</p>
                      </div>
                      <StyledOptionalServiceButton
                        onClick={() => agregarCamarera(servicio)}
                        disabled={isSpecialHoliday(selectedDate)}
                      >
                        <div className={`servicioCantidad ${camarerasEnCarrito.length > 0 ? 'in-cart-quantity' : ''}`}>
                          {camarerasEnCarrito.length}
                        </div>
                        <h5>{hayCamareraEnCarrito ? 'Agregar otra camarera' : 'Agregar'}</h5>
                      </StyledOptionalServiceButton>
                      
                      {activeTooltipId === 5 && (
                        <span className="service-tooltip-content">{servicio.tooltipText || servicio.aclaracion}</span>
                      )}
                    </div>

                  </li>

                );
              }

              return (
                <li 
                  key={servicio.id} 
                  className={`servicio ${selectedDate ? '' : 'disabled-service'} ${activeTooltipId === servicio.id ? 'high-z' : ''}`}
                  onMouseEnter={() => handleTooltipShow(servicio.id, servicio.tooltipText || servicio.aclaracion || '')}
                  onMouseLeave={handleTooltipHide}
                  onTouchStart={() => handleTooltipShow(servicio.id, servicio.tooltipText || servicio.aclaracion || '')}
                >
                  {(isAdmin || servicio.imageUrl) && <img 
                    src={servicio.imageUrl ? `${servicio.imageUrl}&t=${new Date().getTime()}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20style%3D%22background%3A%23f0f0f0%22%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ESubir%20Foto%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                    alt={servicio.nombre} 
                    className="service-image-hover" 
                    onClick={() => handleImageClick && handleImageClick(servicio.id)}
                    style={{ 
                      cursor: handleImageClick ? 'pointer' : 'default', 
                      pointerEvents: isAdmin ? 'auto' : 'none',
                      zIndex: 1 
                    }}
                  />}
                  <div className="service-tooltip-wrapper">
                    <div className="service-text-content">
                      <EditableText
                        value={servicio.nombre}
                        onSave={(newValue) => handleSaveServicioNombre(servicio.id, newValue)}
                        isEditable={!!currentUser}
                      />
                      <p className="bold">
                        {`$${typeof servicio.precio === 'string' ? (parseFloat(servicio.precio) || servicio.precio) : servicio.precio}`}
                      </p>
                    </div>
                    <StyledOptionalServiceButton
                      onClick={() => agregarAlCarrito(servicio)}
                      disabled={isMaxedOut || (isSpecialHoliday(selectedDate) && (servicio.id === 12))}
                    >
                      <div className={`servicioCantidad ${itemEnCarrito && itemEnCarrito.cantidad > 0 ? 'in-cart-quantity' : ''}`}>
                        {isMaxedOut ? 1 : (itemEnCarrito?.cantidad || 0)}
                      </div>
                      <h5> Agregar</h5>
                    </StyledOptionalServiceButton>
                    
                    {activeTooltipId === servicio.id && (
                      <span className="service-tooltip-content">
                        {servicio.tooltipText || servicio.aclaracion}
                      </span>
                    )}
                  </div>

                </li>

              );
            })}


          {/* muestra el servicio hora extra que corresponde al día de la semana */}
          {selectedDate && (
            <li 
              className={`servicio ${activeTooltipId === 'extra-hour' ? 'high-z' : ''}`}
              onMouseEnter={() => {
                const text = isWeekendPricing
                  ? (serviciosOpcionales.find(s => s.id === 4)?.tooltipText || serviciosOpcionales.find(s => s.id === 4)?.aclaracion || '') 
                  : (serviciosOpcionales.find(s => s.id === 2)?.tooltipText || serviciosOpcionales.find(s => s.id === 2)?.aclaracion || '');
                handleTooltipShow('extra-hour', text);
              }}
              onMouseLeave={handleTooltipHide}
              onTouchStart={() => {
                const text = isWeekendPricing
                  ? (serviciosOpcionales.find(s => s.id === 4)?.tooltipText || serviciosOpcionales.find(s => s.id === 4)?.aclaracion || '') 
                  : (serviciosOpcionales.find(s => s.id === 2)?.tooltipText || serviciosOpcionales.find(s => s.id === 2)?.aclaracion || '');
                handleTooltipShow('extra-hour', text);
              }}
            >
                {(isAdmin || (isWeekendPricing 
                  ? serviciosOpcionales.find(s => s.id === 4)?.imageUrl 
                  : serviciosOpcionales.find(s => s.id === 2)?.imageUrl)) && (
                  <img 
                    src={(isWeekendPricing ? serviciosOpcionales.find(s => s.id === 4)?.imageUrl : serviciosOpcionales.find(s => s.id === 2)?.imageUrl) ? `${isWeekendPricing ? serviciosOpcionales.find(s => s.id === 4)?.imageUrl : serviciosOpcionales.find(s => s.id === 2)?.imageUrl}&t=${new Date().getTime()}` : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20style%3D%22background%3A%23f0f0f0%22%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ESubir%20Foto%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                    alt="Hora extra" 
                    className="service-image-hover" 
                    onClick={() => handleImageClick && handleImageClick(isWeekendPricing ? 4 : 2)}
                    style={{ 
                      cursor: handleImageClick ? 'pointer' : 'default', 
                      pointerEvents: isAdmin ? 'auto' : 'none',
                      zIndex: 1 
                    }}
                  />
                )}
              <div className="service-tooltip-wrapper">
                <div className="service-text-content">
                  <EditableText
                    value={isWeekendPricing
                      ? serviciosOpcionales.find(s => s.id === 4)?.nombre || "Hora extra de evento"
                      : serviciosOpcionales.find(s => s.id === 2)?.nombre || "Hora extra de evento"}
                    onSave={(newValue) => handleSaveServicioNombre(
                      isWeekendPricing
                        ? 4 // ID for "Hora extra"
                        : 2 // ID for "Hora extra promo"
                      , newValue)}
                    isEditable={!!currentUser}
                  />
                  <p className="bold">
                    ${isWeekendPricing ? allFetchedPrices.c_hora_extra_finde_ : allFetchedPrices.d_hora_extra_semana_}
                  </p>
                </div>
                <StyledOptionalServiceButton onClick={() => agregarAlCarrito(serviciosOpcionales.find(servicio => (
                  isWeekendPricing
                    ? servicio.priceKey === 'c_hora_extra_finde_'
                    : servicio.priceKey === 'd_hora_extra_semana_'
                )))}>
                  {(() => {
                    const horaExtraService = serviciosOpcionales.find(servicio => (
                      isWeekendPricing
                        ? servicio.priceKey === 'c_hora_extra_finde_'
                        : servicio.priceKey === 'd_hora_extra_semana_'
                    ));
                    const itemEnCarrito = carrito.find(item => item.id === horaExtraService?.id);
                    const isInCart = itemEnCarrito && itemEnCarrito.cantidad > 0;
                    return (
                      <div className={`servicioCantidad ${isInCart ? 'in-cart-quantity' : ''}`}>
                        {itemEnCarrito?.cantidad || 0}
                      </div>
                    );
                  })()}
                  <h5>Agregar</h5>
                </StyledOptionalServiceButton>
                
                {activeTooltipId === 'extra-hour' && (
                  <span className="service-tooltip-content">
                    {isWeekendPricing ? (serviciosOpcionales.find(s => s.id === 4)?.tooltipText || serviciosOpcionales.find(s => s.id === 4)?.aclaracion || 'Aclaración por defecto') : (serviciosOpcionales.find(s => s.id === 2)?.tooltipText || serviciosOpcionales.find(s => s.id === 2)?.aclaracion || 'Aclaración por defecto')}
                  </span>
                )}
              </div>
            </li>

          )}
          {isAdmin && (
            <li className="servicio">
              <div 
                className="service-tooltip-wrapper"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <p>Descuento Especial (</p>
                  {(tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto') && <span>$</span>}
                  <input
                    type="number"
                    value={descuentoAdmin > 0 ? descuentoAdmin : customDescuento}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (descuentoAdmin > 0) {
                        setDescuentoAdmin(val);
                      } else {
                        setCustomDescuento(val);
                      }
                    }}
                    style={{ width: (tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto') ? '80px' : '40px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}
                    min="0"
                    max={(tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto') ? "10000000" : "100"}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {tipoDescuentoAdmin !== '$' && tipoDescuentoAdmin !== 'monto' && <p>%)</p>}
                  {(tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto') && <p>)</p>}
                </div>
                <p className="bold" style={{ color: "#28a745" }}>Aplica a todo el carrito</p>
                <StyledOptionalServiceButton onClick={() => setDescuentoAdmin(prev => prev > 0 ? 0 : customDescuento)}>
                  <div className={`servicioCantidad ${descuentoAdmin > 0 ? 'in-cart-quantity' : ''}`}>
                    {descuentoAdmin > 0 ? 1 : 0}
                  </div>
                  <h5>{descuentoAdmin > 0 ? "Agregado" : "Agregar"}</h5>
                </StyledOptionalServiceButton>
              </div>
            </li>
          )}

        </ul>
      </div>

      <div className="carrito" >
        <div className="carrito-titulo-container" >
          <EditableText
            value={carritoTitulo}
            onSave={handleSaveCarritoTitulo}
            isEditable={!!currentUser}
            as="h3"
            className="carrito-titulo"
          />
        </div>

        {carrito.length === 0 ? (
          <p>Tu carrito está vacío</p>

        ) : (
          <>
            <ul className="carrito-lista">
              {[...otrosItemsCarrito, ...camarerasEnCarrito].sort((a, b) => {
                const isARental = [1, 3, 13, 14].includes(a.id);
                const isBRental = [1, 3, 13, 14].includes(b.id);
                if (isARental && !isBRental) return -1;
                if (!isARental && isBRental) return 1;
                if (a.id === 5 && b.id !== 5) return 1; // Poner camareras al final
                if (a.id !== 5 && b.id === 5) return -1;
                return (a.uuid || a.id) > (b.uuid || b.id) ? 1 : -1; // Sort camareras by uuid
              }).map(item => (
                <li key={item.uuid || item.id} className="carrito-item">
                  <div className="item-details">
                    <span className="item-nombre">
                      {[1, 3, 13, 14].includes(item.id) ? item.descripcion : item.nombre}
                      {item.id !== 5 && item.descripcion2 ? ` (${item.descripcion2})` : ''}
                    </span>

                  </div>
                  <div className="item-controles">
                    {item.id === 5 ? (
                      <div className="cantidad-control">
                        <button className="btn-cantidad" onClick={() => modificarHorasCamarera(item.uuid, -1)}>-</button>
                        <span className="item-cantidad">x {item.cantidad} hs</span>
                        <button className="btn-cantidad" onClick={() => modificarHorasCamarera(item.uuid, 1)}>+</button>
                      </div>
                    ) : (
                      <div className="cantidad-control">
                        <div className="btn-cantidad-placeholder">
                          {![1, 3, 13, 14].includes(item.id) &&
                            <button className="btn-cantidad" onClick={() => eliminarDelCarrito(item.id)}>-</button>
                          }
                        </div>
                        <span className="item-cantidad">x {item.cantidad}</span>
                        <div className="btn-cantidad-placeholder">
                          {!serviciosUnicos.includes(item.id) &&
                            <button className="btn-cantidad" onClick={() => agregarAlCarrito(item)}>+</button>
                          }
                        </div>
                      </div>
                    )}
                    <span className="item-total"> ${item.cantidad * item.precio}</span>
                  </div>
                </li>
              ))}
              {descuentoAdmin > 0 && (
                <>
                  <li className="carrito-item" style={{ borderTop: "1px dashed #ccc", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                    <div className="item-details">
                      <span className="item-nombre" style={{ color: '#666' }}>
                        Subtotal
                      </span>
                    </div>
                    <div className="item-controles">
                      <span className="item-total" style={{ color: '#666' }}> 
                        ${tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto' 
                          ? Number(precioTotal + descuentoAdmin).toLocaleString('es-AR')
                          : Number(precioTotal / (1 - descuentoAdmin / 100)).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </li>
                  <li className="carrito-item">
                    <div className="item-details">
                      <span className="item-nombre" style={{ color: '#4caf50' }}>
                        Descuento {tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto' ? `$${Number(descuentoAdmin).toLocaleString('es-AR')}` : `${descuentoAdmin}%`}
                      </span>
                    </div>
                  <div className="item-controles">
                    <div className="cantidad-control">
                      <div className="btn-cantidad-placeholder">
                        {isAdmin && (
                          <button className="btn-cantidad" onClick={() => setDescuentoAdmin(0)}>-</button>
                        )}
                      </div>
                      <span className="item-cantidad">x 1</span>
                      <div className="btn-cantidad-placeholder"></div>
                    </div>
                    <span className="item-total" style={{ color: '#4caf50' }}> 
                      -${tipoDescuentoAdmin === '$' || tipoDescuentoAdmin === 'monto'
                        ? Number(descuentoAdmin).toLocaleString('es-AR')
                        : Number((precioTotal / (1 - descuentoAdmin / 100)) - precioTotal).toLocaleString('es-AR')}
                    </span>
                  </div>
                </li>
                </>
              )}
            </ul>

            <p className="carrito-total">
              Total: ${Number(precioTotal).toLocaleString('es-AR')}
            </p>
            <p className="carrito-total-coments">
              Seña: ${Number(allFetchedPrices.l_seña_ || 0).toLocaleString('es-AR')} para reservar la fecha. El restante de ${Number(precioTotal - (allFetchedPrices.l_seña_ || 0)).toLocaleString('es-AR')} se puede ir pagando hasta el día del evento.
            </p>

            <div className="lowButtons" >

              {isAdmin ? (
                <div className="contenedorAwhatsapp">
                  <a onClick={handleGoToPresupuesto} className="aPresupuesto">
                    Ir al presupuesto
                  </a>
                </div>
              ) : (
                <div className="contenedorAwhatsapp">
                  <a onClick={() => {
                    generarYCopiarLink(selectedDate, carrito, true, true);
                    handleReservaPorWhatsapp();
                  }} className="aWhatsapp" target="blank" >  {inputValue547}
                  </a>
                </div>
              )}
              
              <div className="contenedorAwhatsapp">
                <a onClick={() => {
                  generarYCopiarLink(selectedDate, carrito, true, true);
                }} className="aWhatsapp" style={{
                  backgroundColor: 'var(--card-grey) !important',
                  border: '1px solid var(--primary-color) !important',
                  color: 'var(--primary-color) !important',
                  marginTop: '1rem',
                  fontSize: '0.9rem',
                  padding: '0.5rem 1rem',
                  boxShadow: 'none'
                }} >
                  Copiar link del carrito
                </a>
              </div>
              <div className="contenedorAwhatsapp">
                {linkCopiado && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ color: "green" }}>✅ Link copiado al portapapeles</p>
                    <a onClick={compartirPorWhatsapp} className="aWhatsapp2">
                      {inputValue548}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ServiciosExternosRecomendados
        externalServices={externalServices}
        onAddService={onAddService}
        onRemoveService={onRemoveService}
        onSaveService={onSaveService}
        openWhatsappLink={openWhatsappLink}
        bannerTitle={bannerTitle}
        onSaveBannerTitle={onSaveBannerTitle}
        currentUser={currentUser}

      />
    </ServiciosContainer>
  );
}

const ServiciosContainer = styled.div`
      /* Estilos para el contenedor de servicios */
      .grid {
    .Opcionales {
      display: grid; 
      grid-template-columns: repeat(4, 1fr); /* 4 columns */
      gap: 0.3rem;
      padding: 0.3rem;
      list-style: none;
      margin: 0;

      /* Desktop/Tablet li.servicio styles */
      li.servicio {
        position: relative; /* Needed for image hover positioning */
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0.3rem;
        min-height: 100px; /* Minimum height for uniformity */

        border-radius: 8px; /* Rounded borders */
        width: 100%; /* Set explicit width for each cell */

        > div {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        span {
          overflow-wrap: break-word;
          font-size: 0.7rem;
        }

        h3, p {
          font-size: 0.75rem !important;
          margin-bottom: 0.2rem;
          line-height: 1.1;
        }
      
        .bold {
          font-weight: bold;
        }

        .service-image-hover {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          pointer-events: none;
          border-radius: 8px;
          z-index: 1;
        }

        &:hover .service-image-hover {
          opacity: 1;
        }
      }

      @media screen and (min-width: 769px) and (max-width: 1080px) {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.2rem;
        padding: 0.2rem;

        li.servicio {
          width: 100%;
          min-height: 120px;
          padding: 0.2rem;
        }
      }

      @media screen and (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.2rem;
        padding: 0.2rem;

        li.servicio {
          width: 100%; /* Set explicit width for each cell on mobile */
          min-height: 120px; /* Minimum height for uniformity on mobile */
          padding: 0.2rem;
        }

        /* Mobile-specific tooltip alignment */
        .Opcionales li.servicio:nth-child(2n+1) .tooltip .tooltiptext {
          left: 0;
          transform: translateX(0);
        }

        .Opcionales li.servicio:nth-child(2n+2) .tooltip .tooltiptext {
          left: auto;
          right: 0;
          transform: translateX(0);
        }
      }
    }
  }

      .carrito {
    .carrito-titulo-container {
        font-size: 1em;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      padding:10px;
      margin-right:0;
      margin-left:0;

    }
  }

      .high-z {
        z-index: 1000 !important;
      }

      .service-tooltip-wrapper {
        position: relative;
        z-index: 2;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .service-text-content {
        transition: opacity 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      li.servicio:hover .service-image-hover ~ .service-tooltip-wrapper .service-text-content {
        opacity: 0;
      }

      .service-text-content:focus-within {
        opacity: 1 !important;
      }

      .service-tooltip-content {
        display: block !important;
        visibility: visible !important;
        width: 300px !important;
        max-width: calc(100vw - 32px) !important;
        background-color: #f8f9fa !important;
        color: #1a1a1a !important;
        text-align: center !important;
        border-radius: 12px !important;
        padding: 12px 16px !important;
        position: absolute !important;
        z-index: 9999 !important;
        top: 100% !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        opacity: 1 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
        border: 1px solid #dee2e6 !important;
        font-family: 'product_sansregular', sans-serif !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        animation: tooltipFadeIn 0.3s ease;
      }

      @media screen and (max-width: 768px) {
        .service-tooltip-content {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          bottom: auto !important;
          transform: translate(-50%, -50%) !important;
          width: 88vw !important;
          max-width: 320px !important;
          z-index: 100000 !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35) !important;
          border: 2px solid var(--primary-color, #948924) !important;
          font-size: 13px !important;
          padding: 14px 18px !important;
        }

        .service-tooltip-content::after {
          display: none !important;
        }
      }

      .service-tooltip-content::after {
        content: " ";
        position: absolute;
        bottom: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent #f8f9fa transparent;
      }

      @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      .tooltip .tooltiptext::after {
        content: " ";
        position: absolute;
        bottom: 100%; /* Flecha en la parte superior */
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent #f5f5f5 transparent;
      }



      .lowButtons {
        display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      width: 100%;
  }

      .contenedorAwhatsapp {
        width: 100%;
      display: flex;
      justify-content: center;
  }

      .aWhatsapp {
        background-color: white !important; /* Force White background */
        color: #25D366 !important; /* Force Green Text */
        font-size: 0.95rem;
        font-weight: bold;
        text-shadow: none !important; /* Remove text shadow */
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        text-align: center;
        text-decoration: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s, filter 0.2s, background-color 0.2s;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 85%;
        max-width: 320px;
        height: auto;
        min-height: 48px;
        box-sizing: border-box;
        border: 2px solid #25D366 !important; /* Force Green Border */
  }

      .aWhatsapp:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 8px rgba(0,0,0,0.2);
        background-color: rgba(255, 255, 255, 0.85) !important; /* White with transparency on hover */
  }

      .aPresupuesto {
        background-color: #2196F3 !important; 
        color: white !important; 
        font-size: 0.95rem;
        font-weight: bold;
        text-shadow: none !important; 
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        text-align: center;
        text-decoration: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s, filter 0.2s, background-color 0.2s;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 85%;
        max-width: 320px;
        height: auto;
        min-height: 48px;
        box-sizing: border-box;
        border: 2px solid #2196F3 !important; 
  }

      .aPresupuesto:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 8px rgba(0,0,0,0.2);
        background-color: #1976D2 !important; 
  }

      `;

const CarritoContainer = styled.div`
      /* Estilos para el contenedor del carrito */
      border: 1px solid #ccc;
      padding: 15px;
      margin-top: 20px;


      `;

const ServicioItem = styled.div`
      /* Estilos para cada item de servicio */
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;

      `;

const CarritoItem = styled.div`
      /* Estilos para cada item en el carrito */
      display: flex;
      justify-content: space-between;
      `;

const StyledOptionalServiceButton = styled.button`
      margin-top: auto;
      border: none;
      background-color: var(--app-primary-text-color, var(--primary-color));
      color: var(--white-text);
      padding: 0.3rem; /* padding más chico */
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 0.8rem; /* fuente más chica */
      bottom: 0;
      transition: 0.2s ease-in-out;
      cursor: pointer;
      width: 100%; /* Revert to 100% to fill parent li */
      border-radius: 5px;
      height: auto;
      min-height: 1.5rem;
      text-shadow: 0.5px 0.5px 2px var(--primary-text);
      box-shadow: 0px 0.5px 2px rgba(0,0,0,0.6);
      font-family: 'product_sansregular';
      z-index: 2; /* Ensure button is above hover image */

      &:disabled {
        background-color: gray !important; /* Gray background */
      color: white !important; /* White text for better contrast */
      cursor: not-allowed; /* Not-allowed cursor */
  }

      h5 {
        font-size: 1.0rem; /* Desktop font size - 0.1rem */
  }

      &:hover {
        filter: brightness(110%);
      text-shadow: 0.2px 0.5px 1px var(--primary-text);
      box-shadow: 0px 0.25px 1px rgba(0,0,0,0.3);
      border-radius: 10px;
  }

      @media screen and (min-width: 280px) and (max-width: 1080px) {
        margin-top: 1rem;
      margin-left: auto;
      margin-right: auto;
      font-size: 0.8rem;
      width: 100%;
      height: auto;

      h5 {
        font-size: 1.0rem; /* Mobile font size (no change) */
    }
  }
      `;