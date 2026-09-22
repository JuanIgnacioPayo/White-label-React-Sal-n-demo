/**
 * Parses time ranges from event descriptions or summaries.
 * Expected formats: "de 17 a 21hs", "9 a 13h", "19 a 21", "17:00 a 21:00"
 * Returns an object with start and end hours (integer 0-23) or null.
 */
export const extractTimeRange = (text) => {
    if (!text) return null;

    // Normalize text: lowercase
    const cleanText = text.toLowerCase();

    // Regex to capture start and end
    // Looks for patterns like:
    // "17 a 21"
    // "17.30 a 21.30"
    // "de 17:00 a 21:00"
    // Captures: 1=StartHour, 2=StartMin (opt), 3=EndHour, 4=EndMin (opt)
    const regex = /(?:de\s+|desde\s+|horario\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:h|hs|horas)?\s*(?:a|hasta)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:h|hs|horas)?/i;

    const match = cleanText.match(regex);

    if (match) {
        let startHour = parseInt(match[1], 10);
        let endHour = parseInt(match[3], 10);
        const endMin = match[4] ? parseInt(match[4], 10) : 0;

        // If it ends at e.g. 20:30, it occupies the 20th hour, so we want the loop to go up to 21 (exclusive)
        // If it ends at 21:00, loop to 21 (exclusive) -> 20th hour is last one.
        // Wait, "17 a 21" usually means "Ends at 21:00", so 17, 18, 19, 20.
        // "16.30 a 20.30". 16 (partially), 17, 18, 19, 20 (partially).
        // So we want to include 20.
        // If endMin > 0, we increment endHour to include that partial hour ??
        // Or if we strictly follow "17 to 21", it means [17, 21).
        // If "20:30", it is > 20. So ceil(20.5) = 21.

        if (endMin > 0) {
            endHour += 1;
        }

        // Handle overnight events (e.g., "23 a 03") vs mixed 12/24h format (e.g. "12 a 4" meaning 12 to 16)
        // User rule: Events max 9 hours.
        if (endHour < startHour) {
            // Option A: Next Day (standard overnight)
            // e.g. 23 to 3 -> 23 to 27 (+24). Duration 4h.
            // e.g. 12 to 4 -> 12 to 28 (+24). Duration 16h (Too long).
            const endNextDay = endHour + 24;
            const durNextDay = endNextDay - startHour;

            // Option B: PM interpretation (endHour is actually PM in 12h format)
            // e.g. 12 to 4 -> 12 to 16 (+12). Duration 4h.
            // e.g. 23 to 3 -> 23 to 15. Negative. Invalid.
            const endPM = endHour + 12;
            const durPM = endPM - startHour;

            // Heuristic: If overnight is too long (> 13h safe buffer) AND PM duration is valid (0 < d < 13)
            // Then assume PM format.
            if (durNextDay > 13 && durPM > 0 && durPM < 13) {
                endHour = endPM;
            } else {
                endHour = endNextDay;
            }
        }
        else if (endHour === 0 && startHour > 0) {
            // Explicit "a 00hs" or similar
            endHour = 24;
        }

        // Basic validation 
        // Allow endHour > 24 for overnight
        if (startHour >= 0 && startHour <= 24 && endHour >= 0 && endHour <= 48) {
            return { start: startHour, end: endHour };
        }
    }

    return null;
};
