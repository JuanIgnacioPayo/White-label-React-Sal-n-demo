/**
 * Utilidad para detectar si un presupuesto cuenta con seña abonada,
 * ya sea por campo numérico explícito (formData.seña) o mencionada
 * en alguno de los campos de texto (nombreCliente, descripcionEvento, notas, etc.).
 */

const SENA_WORD_REGEX = /(?:^|[^a-záéíóúñ0-9])(seña|sena|señado|señada|senado|senada)s?(?:[^a-záéíóúñ0-9]|$)/i;
const NEGATIVE_SENA_REGEX = /(?:sin|falta|no\s+dej[oó]|no\s+tiene)\s+(?:de\s+)?(?:seña|sena|señado|señada|senado|senada)/i;

// Patrón A: "seña/sena [$] 180000" o "seña: $ 180.000" o "seña de $180.000"
const AMOUNT_AFTER_REGEX = /(?:seña|sena|señado|señada|senado|senada)s?\s*(?:de|por|es|:)?\s*\$?\s*([\d]{1,3}(?:\.[\d]{3})+|[\d]+)/i;

// Patrón B: "$180000 de seña" o "180.000 seña"
const AMOUNT_BEFORE_REGEX = /\$?\s*([\d]{1,3}(?:\.[\d]{3})+|[\d]+)\s*(?:de|\$)?\s*(?:seña|sena|señado|señada|senado|senada)s?/i;

function parseArgentineAmount(str) {
    if (!str) return 0;
    // Si viene con puntos separadores de miles (ej: 180.000), los removemos
    const cleaned = str.replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function collectStringsFromObject(obj) {
    if (!obj || typeof obj !== 'object') return [];
    let strings = [];
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && val.trim() !== '') {
            strings.push(val);
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            strings = strings.concat(collectStringsFromObject(val));
        }
    }
    return strings;
}

/**
 * Analiza un presupuesto y determina si tiene seña.
 * @param {Object} budget - Objeto presupuesto (de Firebase o local)
 * @returns {{ hasSena: boolean, senaAmount: number, senaSource: 'field' | 'text' | 'none' }}
 */
export function detectBudgetSena(budget) {
    if (!budget) {
        return { hasSena: false, senaAmount: 0, senaSource: 'none' };
    }

    // 1. Verificación explícita en campo numérico
    const explicitVal = budget?.formData?.seña !== undefined ? budget.formData.seña : budget.seña;
    const explicitNum = parseFloat(explicitVal || 0);
    if (!isNaN(explicitNum) && explicitNum > 0) {
        return {
            hasSena: true,
            senaAmount: explicitNum,
            senaSource: 'field'
        };
    }

    // 2. Búsqueda en campos de texto
    const allStrings = collectStringsFromObject(budget);
    if (allStrings.length === 0) {
        return { hasSena: false, senaAmount: 0, senaSource: 'none' };
    }

    const fullText = allStrings.join(' ');

    // Si tiene frases negativas explícitas como "sin seña" o "falta seña" y ningún monto positivo
    const hasNegative = NEGATIVE_SENA_REGEX.test(fullText);

    if (SENA_WORD_REGEX.test(fullText)) {
        // Intentar extraer monto numérico
        let extractedAmount = 0;
        const matchAfter = fullText.match(AMOUNT_AFTER_REGEX);
        if (matchAfter && matchAfter[1]) {
            extractedAmount = parseArgentineAmount(matchAfter[1]);
        }

        if (extractedAmount <= 0) {
            const matchBefore = fullText.match(AMOUNT_BEFORE_REGEX);
            if (matchBefore && matchBefore[1]) {
                extractedAmount = parseArgentineAmount(matchBefore[1]);
            }
        }

        if (extractedAmount > 0) {
            return {
                hasSena: true,
                senaAmount: extractedAmount,
                senaSource: 'text'
            };
        }

        // Si no tiene monto, pero no es una frase negativa (ej: "Nadia (seña)", "dejó seña")
        if (!hasNegative) {
            return {
                hasSena: true,
                senaAmount: 0,
                senaSource: 'text'
            };
        }
    }

    return { hasSena: false, senaAmount: 0, senaSource: 'none' };
}
