
export const parseSummaryText = (text, optionalServices = []) => {
    if (!text) return { formData: {}, carrito: [] };

    const resultFormData = {
        nombreCliente: '',
        telefono: '',
        descripcionEvento: '',
        inicioEvento: '',
        finEvento: '',
        seña: 0,
        montoDescuento: 0,
        motivoDescuento: '',
        agregadoManual: '',
        precioAgregadoManual: 0,
    };
    const resultCarrito = [];

    // Helper regexes
    const moneyRegex = /\$\s*([\d\.,]+)/;
    const cleanPrice = (str) => parseFloat(str.replace(/\./g, '').replace(',', '.'));

    // Split text into tokens/sentences.
    // We split by ". " or close to that.
    const tokens = text.split('. ').map(t => t.trim()).filter(t => t.length > 0);

    // 1. Header: Name Phone. (Heuristic: First token)
    if (tokens.length > 0) {
        let firstToken = tokens[0];
        // Check for phone number
        const phoneMatch = firstToken.match(/(\d[\d\s-]{6,})/);
        if (phoneMatch) {
            resultFormData.telefono = phoneMatch[0].trim();
            resultFormData.nombreCliente = firstToken.replace(phoneMatch[0], '').trim();
        } else {
            // Assume just name if no phone logic found easily, or name is the whole thing
            resultFormData.nombreCliente = firstToken;
        }
    }

    // 2. Event Description or Items
    // We iterate from index 1.
    for (let i = 1; i < tokens.length; i++) {
        let token = tokens[i];

        // Skip empty or purely financial summary tokens at the end if we can detect them
        if (token.startsWith('Total $') || token.startsWith('Restan $')) continue;

        let matched = false;

        // --- ALQUILER ---
        if (token.toLowerCase().includes('alquiler') && !token.toLowerCase().includes('pantalla')) {
            // "Alquiler por 3hs $10000"
            const durationMatch = token.match(/por (\d)hs/);
            const priceMatch = token.match(moneyRegex);

            let id = 13; // Default 4hs
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                if (hours === 3) id = 1; // Alquiler 3hs
                if (hours === 4) id = 13; // Alquiler 4hs (or 3, 13, 14? We use 13 as safe default for 4hs)
            }

            const precio = priceMatch ? cleanPrice(priceMatch[1]) : 0;

            resultCarrito.push({
                id: id,
                nombre: 'Alquiler Salón', // Or mapped name
                cantidad: 1,
                precio: precio
            });
            matched = true;
        }

        // --- HORARIO ---
        else if (token.toLowerCase().startsWith('horario de')) {
            // "Horario de 13:00 a 17:00hs"
            const match = token.match(/de\s+([\d:]+)\s+a\s+([\d:]+)hs/);
            if (match) {
                resultFormData.inicioEvento = match[1];
                resultFormData.finEvento = match[2];
            }
            matched = true;
        }

        // --- HORA EXTRA ---
        else if (token.toLowerCase().includes('hora extra')) {
            // "Hora extra de evento x2 $5000"
            const countMatch = token.match(/x(\d+)/);
            const priceMatch = token.match(moneyRegex);
            const count = countMatch ? parseInt(countMatch[1]) : 1;
            const total = priceMatch ? cleanPrice(priceMatch[1]) : 0;
            const unitPrice = total / count;

            resultCarrito.push({
                id: 2, // Default ID for extra hour
                nombre: 'Hora Extra',
                cantidad: count,
                precio: unitPrice
            });
            matched = true;
        }

        // --- CAMARERAS ---
        else if (token.toLowerCase().includes('camarera')) {
            // "Dos camareras por 4hs $20000"
            const numberWords = { 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6 };
            const firstWord = token.split(' ')[0].toLowerCase();
            let count = numberWords[firstWord] || 1;

            const durationMatch = token.match(/por (\d+)hs/);
            let duration = durationMatch ? parseInt(durationMatch[1]) : 4;

            const priceMatch = token.match(moneyRegex);
            const total = priceMatch ? cleanPrice(priceMatch[1]) : 0;

            // In the summary generator: "price * cantidad" where cantidad is duration. 
            // And multiple waitress items are summed. 
            // Wait, if I have 2 waitresses for 4 hours, formatting is "$total".
            // Implementation in Presupuesto: 
            // "precio": hourly rate? "cantidad": hours? 
            // And we add ONE item per waitress?
            // "camarerasItems.forEach...". 
            // So if I have 2 waitresses, I need to add 2 items to the cart.
            // Each item: id: 5, cantidad: duration, precio: total / count / duration ??
            // Let's look at generator: "totalCamareras = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)".
            // So Total = (PricePerHour * Hours) * Count.
            // Extracted Total = T. 
            // PricePerHour = T / Count / Hours.

            const unitPricePerHour = total / count / duration;

            for (let c = 0; c < count; c++) {
                resultCarrito.push({
                    id: 5,
                    nombre: 'Camarera',
                    cantidad: duration,
                    precio: unitPricePerHour
                });
            }
            matched = true;
        }

        // --- OPTIONAL SERVICES (Inflable, Plaza, etc) ---
        else {
            // Try to match against optional services
            // "Inflable $8000"
            // "Metegol $..."
            // We need to look if the token STARTs with the service name (clean)
            let serviceMatched = false;

            for (const service of optionalServices) {
                // Clean service name? The generator does `removePriceFromTitle`.
                // But here we have the text, so "Inflable".
                if (token.toLowerCase().includes(service.nombre.toLowerCase())) {
                    const priceMatch = token.match(moneyRegex);
                    const total = priceMatch ? cleanPrice(priceMatch[1]) : 0;
                    const countMatch = token.match(/x(\d+)/);
                    const count = countMatch ? parseInt(countMatch[1]) : 1;

                    const unitPrice = total / count;

                    resultCarrito.push({
                        id: service.id,
                        nombre: service.nombre,
                        cantidad: count,
                        precio: unitPrice
                    });
                    serviceMatched = true;
                    matched = true;
                    break;
                }
            }

            // --- BOOLEANS ---
            if (!serviceMatched) {
                if (token.includes('Usan pantalla')) {
                    resultCarrito.push({ id: 10, nombre: 'Pantalla', cantidad: 1, precio: 0 });
                    matched = true;
                } else if (token.includes('Usan la parrilla')) {
                    resultCarrito.push({ id: 16, nombre: 'Parrilla', cantidad: 1, precio: 0 });
                    matched = true;
                }
            }

            // --- MANUAL / UNKNOWN ---
            if (!matched && !token.startsWith('Subtotal') && !token.startsWith('Seña') && !token.startsWith('Descuento')) {
                // Assume Manual
                // "Cerveza $5000"
                const priceMatch = token.match(moneyRegex);
                if (priceMatch) {
                    const price = cleanPrice(priceMatch[1]);
                    const textDesc = token.replace(priceMatch[0], '').trim();

                    // If we already have a manual, append?
                    if (resultFormData.agregadoManual) {
                        resultFormData.agregadoManual += `. ${textDesc}`;
                        resultFormData.precioAgregadoManual = (parseFloat(resultFormData.precioAgregadoManual) + price);
                    } else {
                        resultFormData.agregadoManual = textDesc;
                        resultFormData.precioAgregadoManual = price;
                    }
                } else {
                    // Just description?
                    if (!resultFormData.descripcionEvento) {  // If header didn't take it?
                        // Actually Header takes format "Name Phone".
                        // If this is just text, maybe it's part of description?
                        // But usually description is "Cumple de Juan".
                    }
                }
            }
        }

        // --- FINANCIALS (Seña, Descuento) ---
        if (token.includes('Seña')) {
            const priceMatch = token.match(moneyRegex);
            if (priceMatch) resultFormData.seña = cleanPrice(priceMatch[1]);
        }
        if (token.includes('Descuento')) {
            const priceMatch = token.match(moneyRegex);
            if (priceMatch) resultFormData.montoDescuento = cleanPrice(priceMatch[1]);
        }
    }

    return { formData: resultFormData, carrito: resultCarrito };
};
