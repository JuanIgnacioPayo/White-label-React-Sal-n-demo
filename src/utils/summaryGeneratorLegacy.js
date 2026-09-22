// src/utils/summaryGenerator.js

const removePriceFromTitle = (title) => {
    // Regex to match price patterns like $123, $123.45, $ 123, etc.
    // It looks for a dollar sign, optional space, and then numbers (with optional decimal part).
    if (typeof title !== 'string') {
        return '';
    }
    return title.replace(/\$\s*\d+(\.\d{1,2})?/g, '').trim();
};

/**
 * Generates a plain text summary from a budget object.
 * @param {object} presupuesto - The budget object.
 * @param {object} presupuesto.formData - The form data (client name, phone, etc.).
 * @param {Array} presupuesto.carrito - The list of items in the cart.
 * @param {number} presupuesto.subtotal - The subtotal amount.
 * @param {number} presupuesto.montoDescuento - The discount amount.
 * @param {number} presupuesto.totalFinal - The final total amount.
 * @param {number} presupuesto.restante - The remaining amount.
 * @returns {string} The generated plain text summary.
 */
export const generateSummaryTextLegacy = (presupuesto) => {
    if (!presupuesto) return '';

    const { formData, carrito, subtotal, montoDescuento, totalFinal, restante } = presupuesto;
    const { nombreCliente, telefono, descripcionEvento, descuento, motivoDescuento, seña, inicioEvento, finEvento } = formData || {};

    let texto = '';

    if (nombreCliente) texto += `${nombreCliente} `;
    if (telefono) texto += `${telefono}. `;

    if (descripcionEvento) {
        const capitalizedDescripcion = descripcionEvento.charAt(0).toUpperCase() + descripcionEvento.slice(1);
        texto += `${capitalizedDescripcion}. `;
    }

    const alquilerIds = [1, 3, 13, 14];
    const horaExtraIds = [2, 4];

    let alquilerText = '';
    let horarioText = '';

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
            alquilerText = `Alquiler ${alquilerDurationText} $${total}. `;
            const hasDigitsInicio = /\d/.test(inicioEvento || '');
            const hasDigitsFin = /\d/.test(finEvento || '');

            if (!inicioEvento && !finEvento) {
                horarioText = 'Horario a definir. ';
            } else if (!hasDigitsInicio && !hasDigitsFin) {
                // Pure text schedule, no digits (e.g. "A convenir", "Tarde", "A definir")
                const textParts = [];
                if (inicioEvento) textParts.push(inicioEvento);
                if (finEvento) textParts.push(finEvento);
                horarioText = `Horario ${textParts.join(' - ')}. `;
            } else {
                // Numeric schedule present
                if (inicioEvento && finEvento) {
                    horarioText = `Horario de ${inicioEvento} a ${finEvento}hs. `;
                } else if (inicioEvento) {
                    horarioText = `Horario desde ${inicioEvento}hs. `;
                } else {
                    horarioText = `Horario hasta ${finEvento}hs. `;
                }
            }
        }
        texto += alquilerText;

        // 2. Hora Extra
        const horaExtraItem = carrito.find(item => horaExtraIds.includes(item.id));
        if (horaExtraItem) {
            const total = horaExtraItem.precio * horaExtraItem.cantidad;
            const cantidadText = horaExtraItem.cantidad > 1 ? ` x${horaExtraItem.cantidad}` : '';
            texto += `Hora extra de evento${cantidadText} $${total}. `;
        }

        // Add horarioText after Hora Extra
        texto += horarioText;

        // 1. Waitresses (Special grouping logic)
        const isCamarera = (item) => String(item.id) === '5' || item.nombre.toLowerCase().includes('camarera');
        const camarerasItems = carrito.filter(isCamarera);

        if (camarerasItems.length > 0) {
            const countToWord = {
                1: 'Una', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco',
                6: 'Seis', 7: 'Siete', 8: 'Ocho', 9: 'Nueve', 10: 'Diez'
            };

            // Group by duration (hours)
            const groups = {};
            camarerasItems.forEach(item => {
                const duration = item.cantidad;
                if (!groups[duration]) groups[duration] = [];
                groups[duration].push(item);
            });

            // Process each group
            Object.entries(groups).forEach(([duration, items]) => {
                const count = items.length;
                const totalCamareras = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

                const numberWord = countToWord[count] || count;
                const plural = count > 1 ? 's' : '';

                texto += `${numberWord} camarera${plural} por ${duration}hs $${totalCamareras.toFixed(0)}. `;
            });
        }

        // 2. Specific Services in requested order
        const orderedIds = [6, 7, 8, 9, 12, 11]; // Camarera (5) handled above. Removed from this list.
        orderedIds.forEach(id => {
            const item = carrito.find(i => String(i.id) === String(id));
            if (item) {
                const total = item.precio * item.cantidad;
                if (String(id) === '7') {
                    const cantidadText = item.cantidad > 1 ? ` x${item.cantidad}` : '';
                    texto += `Inflable${cantidadText} $${total.toFixed(0)}. `;
                } else {
                    const cantidadText = item.cantidad > 1 ? ` x${item.cantidad}` : '';
                    texto += `${removePriceFromTitle(item.nombre)}${cantidadText} $${total.toFixed(0)}. `;
                }
            }
        });

        // 3. Manual Addition
        if (formData.agregadoManual) {
            texto += `${formData.agregadoManual}`;
            if (parseFloat(formData.precioAgregadoManual) > 0) {
                texto += ` $${parseFloat(formData.precioAgregadoManual).toFixed(0)}. `;
            } else {
                texto += `. `;
            }
        }

        // 4. Free/Boolean Items (Screen, Grill)
        if (carrito.find(i => String(i.id) === '10')) texto += 'Usan pantalla. ';
        
        const hasParrillero = carrito.some(i => String(i.id) === '12');
        const hasParrillaItem = carrito.some(i => (String(i.id) === '16' || (i.nombre || '').toLowerCase().includes('parrilla')) && String(i.id) !== '12');
        if (hasParrillaItem && !hasParrillero) {
            texto += 'Usan la parrilla. ';
        }

        // 5. Catch-all for others
        // Identify all processed items to avoid duplication
        const processedIds = [...alquilerIds, ...horaExtraIds, ...orderedIds, 5, 10, 16].map(id => String(id));

        carrito.forEach(item => {
            // Check if already processed as camarera or via orderedIds/booleans
            if (isCamarera(item) || processedIds.includes(String(item.id)) || String(item.id) === '16' || item.nombre.toLowerCase().includes('parrilla')) return;

            const total = item.precio * item.cantidad;
            const cantidadText = item.cantidad > 1 ? ` x${item.cantidad}` : '';
            texto += `${removePriceFromTitle(item.nombre)}${cantidadText} $${total.toFixed(0)}. `;
        });
    }

    if (montoDescuento > 0) {
        texto += `Subtotal $${(subtotal || 0).toFixed(0)}. `;
        texto += `Descuento $${(montoDescuento || 0).toFixed(0)}. `;
        if (motivoDescuento) {
            texto += `${motivoDescuento}. `;
        }
    }
    if (totalFinal > 0) {
        texto += `Total $${(totalFinal || 0).toFixed(0)}. `;
    }
    if (seña > 0) {
        texto += `Seña $${seña}. `;
        texto += `Restan $${(restante || 0).toFixed(0)}`;
    }

    return texto.trim();
};
