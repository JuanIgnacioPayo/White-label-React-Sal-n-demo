// src/utils/summaryGenerator.js

const removePriceFromTitle = (title) => {
    // Regex to match price patterns like $123, $123.45, $ 123, etc.
    // It looks for a dollar sign, optional space, and then numbers (with optional decimal part).
    if (typeof title !== 'string') {
        return '';
    }
    return title.replace(/\$\s*\d+(\.\d{1,2})?/g, '').trim();
};

export const subtractTime = (timeStr, hoursToSubtract) => {
    if (!timeStr || !/\d/.test(timeStr)) return null;

    let [hours, minutes] = timeStr.replace('.', ':').split(':').map(str => str ? parseInt(str, 10) : 0);
    if (isNaN(hours)) return null;
    if (isNaN(minutes)) minutes = 0;

    let totalMinutes = hours * 60 + minutes;
    totalMinutes -= hoursToSubtract * 60;

    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

export const calculateDecoracionTime = (presupuesto) => {
    if (!presupuesto) return null;
    const formData = presupuesto.formData || {};
    const rawHorasPrevias = (presupuesto.horasPrevias !== undefined && presupuesto.horasPrevias !== null)
        ? presupuesto.horasPrevias
        : (formData.horasPrevias !== undefined && formData.horasPrevias !== null ? formData.horasPrevias : '');

    const strHorasPrevias = String(rawHorasPrevias).trim();

    // Si se especificaron horas previas y NO es un número (ej: "10am", "vienen el dia anterior")
    if (strHorasPrevias !== '') {
        const cleanedStr = strHorasPrevias.replace(',', '.');
        const isNumeric = !isNaN(Number(cleanedStr));
        if (!isNumeric) {
            return {
                isCustomText: true,
                text: strHorasPrevias,
                toString() {
                    return this.text;
                }
            };
        }
    }

    const inicioEvento = presupuesto.inicioEvento || formData.inicioEvento;
    if (!inicioEvento || !/\d/.test(inicioEvento)) return null;

    const carrito = presupuesto.carrito || [];

    const alquilerIds = [1, 3, 13, 14];
    const horaExtraPreviaId = 11;
    const alquilerItem = carrito.find(item => alquilerIds.includes(item.id));

    let horasPreviasSinCargo = 0;
    if (alquilerItem) {
        if (alquilerItem.id === 1) {
            horasPreviasSinCargo = 1.5;
        } else if (alquilerItem.id === 3 || alquilerItem.id === 13 || alquilerItem.id === 14) {
            horasPreviasSinCargo = 2;
        }
    }

    if (strHorasPrevias !== '') {
        const cleanedStr = strHorasPrevias.replace(',', '.');
        if (!isNaN(Number(cleanedStr))) {
            horasPreviasSinCargo = parseFloat(cleanedStr);
        }
    }

    const horaExtraPreviaItem = carrito.find(item => item.id === horaExtraPreviaId);
    const horasExtrasPrevias = horaExtraPreviaItem ? (parseFloat(horaExtraPreviaItem.cantidad) || 0) : 0;
    const totalHorasPrevias = horasPreviasSinCargo + horasExtrasPrevias;

    if (totalHorasPrevias <= 0) return null;

    const calculatedTime = subtractTime(inicioEvento, totalHorasPrevias);
    if (!calculatedTime) return null;

    return {
        isCustomText: false,
        text: calculatedTime,
        toString() {
            return this.text;
        }
    };
};

export const getBudgetServicesList = (presupuesto) => {
    if (!presupuesto) return [];
    const carrito = presupuesto.carrito || [];
    const formData = presupuesto.formData || {};
    const items = [];

    const alquilerIds = [1, 3, 13, 14];
    const horaExtraIds = [2, 4];
    const horaExtraPreviaId = 11;

    // 1. Alquiler
    const alquilerItem = carrito.find(item => alquilerIds.includes(item.id));
    if (alquilerItem) {
        let dur = '';
        if (alquilerItem.id === 1) dur = ' por 3hs';
        else if (alquilerItem.id === 3 || alquilerItem.id === 13 || alquilerItem.id === 14) dur = ' por 4hs';
        items.push({
            id: alquilerItem.id,
            nombre: `Alquiler${dur}`,
            cantidad: alquilerItem.cantidad,
            precio: alquilerItem.precio * alquilerItem.cantidad
        });
    }

    // 2. Hora Extra de evento
    const horaExtraItem = carrito.find(item => horaExtraIds.includes(item.id));
    if (horaExtraItem) {
        items.push({
            id: horaExtraItem.id,
            nombre: 'Hora extra de evento',
            cantidad: horaExtraItem.cantidad,
            precio: horaExtraItem.precio * horaExtraItem.cantidad
        });
    }

    // 3. Hora Extra previa
    const horaExtraPreviaItem = carrito.find(item => item.id === horaExtraPreviaId);
    if (horaExtraPreviaItem) {
        items.push({
            id: horaExtraPreviaItem.id,
            nombre: 'Hora extra previa',
            cantidad: horaExtraPreviaItem.cantidad,
            precio: horaExtraPreviaItem.precio * horaExtraPreviaItem.cantidad
        });
    }

    // 4. Camareras
    const isCamarera = (item) => String(item.id) === '5' || (item.nombre || '').toLowerCase().includes('camarera');
    const camarerasItems = carrito.filter(isCamarera);
    if (camarerasItems.length > 0) {
        const groups = {};
        camarerasItems.forEach(item => {
            const duration = item.cantidad;
            if (!groups[duration]) groups[duration] = [];
            groups[duration].push(item);
        });

        Object.entries(groups).forEach(([duration, groupItems]) => {
            const count = groupItems.length;
            const total = groupItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const plural = count > 1 ? 's' : '';
            items.push({
                nombre: `${count > 1 ? count + ' ' : ''}Camarera${plural} (${duration}hs)`,
                cantidad: count,
                precio: total
            });
        });
    }

    // 5. Servicios específicos ordenados (Inflable, etc.)
    const orderedIds = [6, 7, 8, 9, 12];
    orderedIds.forEach(id => {
        const item = carrito.find(i => String(i.id) === String(id));
        if (item) {
            const total = item.precio * item.cantidad;
            let nombre = removePriceFromTitle(item.nombre);
            if (String(id) === '7' && !nombre.toLowerCase().includes('inflable')) {
                nombre = 'Inflable';
            }
            items.push({
                id: item.id,
                nombre,
                cantidad: item.cantidad,
                precio: total
            });
        }
    });

    // 6. Agregado manual
    if (formData.agregadoManual) {
        items.push({
            nombre: formData.agregadoManual,
            cantidad: 1,
            precio: parseFloat(formData.precioAgregadoManual || 0)
        });
    }

    // 7. Items booleanos / sin costo
    if (carrito.find(i => String(i.id) === '10')) {
        items.push({
            nombre: 'Uso de pantalla',
            cantidad: 1,
            precio: 0
        });
    }

    const hasParrillero = carrito.some(i => String(i.id) === '12');
    const hasParrillaItem = carrito.some(i => (String(i.id) === '16' || (i.nombre || '').toLowerCase().includes('parrilla')) && String(i.id) !== '12');
    if (hasParrillaItem && !hasParrillero) {
        items.push({
            nombre: 'Uso de parrilla',
            cantidad: 1,
            precio: 0
        });
    }

    // 8. Otros servicios no categorizados
    const processedIds = [...alquilerIds, ...horaExtraIds, ...orderedIds, 5, 10, 11, 16].map(id => String(id));
    carrito.forEach(item => {
        if (isCamarera(item) || processedIds.includes(String(item.id)) || String(item.id) === '16' || (item.nombre || '').toLowerCase().includes('parrilla')) return;
        items.push({
            id: item.id,
            nombre: removePriceFromTitle(item.nombre),
            cantidad: item.cantidad,
            precio: item.precio * item.cantidad
        });
    });

    return items;
};

export const generateSummaryText = (presupuesto) => {
    if (!presupuesto) return '';

    const { formData, carrito, subtotal, montoDescuento, totalFinal, restante } = presupuesto;
    const { nombreCliente, telefono, descripcionEvento, motivoDescuento, seña, inicioEvento, finEvento } = formData || {};

    let texto = '';

    if (nombreCliente) texto += `👤 ${nombreCliente} `;
    if (telefono) texto += `📞 ${telefono}\n`;
    else if (nombreCliente) texto += `\n`;

    if (descripcionEvento) {
        const capitalizedDescripcion = descripcionEvento.charAt(0).toUpperCase() + descripcionEvento.slice(1);
        texto += `🔹 ${capitalizedDescripcion}\n`;
    }

    const alquilerIds = [1, 3, 13, 14];
    const horaExtraIds = [2, 4];
    const horaExtraPreviaId = 11;

    let alquilerText = '';
    let horarioText = '';
    let decoracionText = '';

    if (carrito) {
        // 1. Alquiler
        const alquilerItem = carrito.find(item => alquilerIds.includes(item.id));
        if (alquilerItem) {
            const total = alquilerItem.precio * alquilerItem.cantidad;
            let alquilerDurationText = '';
            if (alquilerItem.id === 1) {
                alquilerDurationText = 'por 3hs';
            } else if (alquilerItem.id === 3 || alquilerItem.id === 13 || alquilerItem.id === 14) {
                alquilerDurationText = 'por 4hs';
            }

            alquilerText = `🔹 Alquiler ${alquilerDurationText} $${total}\n`;
            
            const hasDigitsInicio = /\d/.test(inicioEvento || '');
            const hasDigitsFin = /\d/.test(finEvento || '');

            if (!inicioEvento && !finEvento) {
                horarioText = '⏱️ Horario a definir\n';
            } else if (!hasDigitsInicio && !hasDigitsFin) {
                const textParts = [];
                if (inicioEvento) textParts.push(inicioEvento);
                if (finEvento) textParts.push(finEvento);
                horarioText = `⏱️ Horario ${textParts.join(' - ')}\n`;
            } else {
                if (inicioEvento && finEvento) {
                    horarioText = `⏱️ Horario de ${inicioEvento} a ${finEvento}hs\n`;
                } else if (inicioEvento) {
                    horarioText = `⏱️ Horario desde ${inicioEvento}hs\n`;
                } else {
                    horarioText = `⏱️ Horario hasta ${finEvento}hs\n`;
                }
            }

        }

        // Calculo de horario de decoración
        const decoracionInfo = calculateDecoracionTime(presupuesto);
        if (decoracionInfo) {
            if (decoracionInfo.isCustomText) {
                decoracionText = `🔹 Ingreso a decorar: ${decoracionInfo.text}\n`;
            } else {
                decoracionText = `🔹 Ingreso para decorar: ${decoracionInfo.text}hs\n`;
            }
        }

        // Hora Extra Previa (antes del horario de decoracion)
        let horaExtraPreviaText = '';
        const horaExtraPreviaItem = carrito.find(item => item.id === horaExtraPreviaId);
        if (horaExtraPreviaItem) {
            const total = horaExtraPreviaItem.precio * horaExtraPreviaItem.cantidad;
            const cantidadText = horaExtraPreviaItem.cantidad > 1 ? ` x${horaExtraPreviaItem.cantidad}` : '';
            horaExtraPreviaText = `🔹 Hora extra previa${cantidadText} $${total}\n`;
        }

        // Hora Extra de Evento (inmediatamente despues del alquiler)
        let horaExtraEventoText = '';
        const horaExtraItem = carrito.find(item => horaExtraIds.includes(item.id));
        if (horaExtraItem) {
            const total = horaExtraItem.precio * horaExtraItem.cantidad;
            const cantidadText = horaExtraItem.cantidad > 1 ? ` x${horaExtraItem.cantidad}` : '';
            horaExtraEventoText = `🔹 Hora extra de evento${cantidadText} $${total}\n`;
        }

        texto += alquilerText;
        if (horaExtraEventoText) texto += horaExtraEventoText;
        texto += horarioText;
        if (horaExtraPreviaText) texto += horaExtraPreviaText;
        if (decoracionText) texto += decoracionText;

        // 3. Camareras
        const isCamarera = (item) => String(item.id) === '5' || item.nombre.toLowerCase().includes('camarera');
        const camarerasItems = carrito.filter(isCamarera);

        if (camarerasItems.length > 0) {
            const countToWord = {
                1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco',
                6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez'
            };

            const groups = {};
            camarerasItems.forEach(item => {
                const duration = item.cantidad;
                if (!groups[duration]) groups[duration] = [];
                groups[duration].push(item);
            });

            Object.entries(groups).forEach(([duration, items]) => {
                const count = items.length;
                const totalCamareras = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
                const numberWord = countToWord[count] || count;
                const plural = count > 1 ? 's' : '';
                texto += `🔹 ${numberWord} camarera${plural} por ${duration}hs $${totalCamareras.toFixed(0)}\n`;
            });
        }

        // 4. Specific Services in requested order
        const orderedIds = [6, 7, 8, 9, 12]; // Removed 11 as it's handled above
        orderedIds.forEach(id => {
            const item = carrito.find(i => String(i.id) === String(id));
            if (item) {
                const total = item.precio * item.cantidad;
                const cantidadText = item.cantidad > 1 ? ` x${item.cantidad}` : '';
                if (String(id) === '7') {
                    texto += `🔹 Inflable${cantidadText} $${total.toFixed(0)}\n`;
                } else {
                    texto += `🔹 ${removePriceFromTitle(item.nombre)}${cantidadText} $${total.toFixed(0)}\n`;
                }
            }
        });

        // 5. Manual Addition
        if (formData.agregadoManual) {
            texto += `🔹 ${formData.agregadoManual}`;
            if (parseFloat(formData.precioAgregadoManual) > 0) {
                texto += ` $${parseFloat(formData.precioAgregadoManual).toFixed(0)}\n`;
            } else {
                texto += `\n`;
            }
        }

        // 6. Free/Boolean Items (Screen, Grill)
        if (carrito.find(i => String(i.id) === '10')) texto += '🔹 Usan pantalla\n';
        
        const hasParrillero = carrito.some(i => String(i.id) === '12');
        const hasParrillaItem = carrito.some(i => (String(i.id) === '16' || (i.nombre || '').toLowerCase().includes('parrilla')) && String(i.id) !== '12');
        if (hasParrillaItem && !hasParrillero) {
            texto += '🔹 Usan la parrilla\n';
        }

        // 7. Catch-all for others
        const processedIds = [...alquilerIds, ...horaExtraIds, ...orderedIds, 5, 10, 11, 16].map(id => String(id));

        carrito.forEach(item => {
            if (isCamarera(item) || processedIds.includes(String(item.id)) || String(item.id) === '16' || item.nombre.toLowerCase().includes('parrilla')) return;

            const total = item.precio * item.cantidad;
            const cantidadText = item.cantidad > 1 ? ` x${item.cantidad}` : '';
            texto += `🔹 ${removePriceFromTitle(item.nombre)}${cantidadText} $${total.toFixed(0)}\n`;
        });
    }

    if (montoDescuento > 0) {
        texto += `\n🔹 Subtotal $${(subtotal || 0).toFixed(0)}\n`;
        texto += `🔹 Descuento $${(montoDescuento || 0).toFixed(0)}`;
        if (motivoDescuento) {
            texto += ` (${motivoDescuento})`;
        }
        texto += `\n`;
    }
    
    if (totalFinal > 0) {
        texto += `\n💵 *Total $${(totalFinal || 0).toFixed(0)}*\n`;
    }
    if (seña > 0) {
        texto += `🔹 Seña $${seña}\n`;
        texto += `🔹 *Restan $${(restante || 0).toFixed(0)}*`;
    }

    return texto.trim();
};
