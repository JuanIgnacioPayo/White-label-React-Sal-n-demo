const admin = require('firebase-admin');
const { logger } = require("firebase-functions/v2");

/**
 * Logs Gemini usage to Firebase Realtime Database.
 * Path: usage_logs/{YYYY-MM-DD}/{featureId}
 * 
 * @param {string} featureId - Identifier for the feature (e.g., 'agent_moreno', 'news_summary')
 * @param {string} modelName - Name of the model used (e.g., 'gemini-1.5-pro')
 * @param {object} usageMetadata - Usage metadata from Gemini response (promptTokenCount, candidatesTokenCount, totalTokenCount)
 */
async function logGeminiUsage(featureId, modelName, usageMetadata) {
    if (!usageMetadata) return;

    try {
        const db = admin.database();
        // Force Argentina Timezone
        const now = new Date();
        const year = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: 'numeric' });
        const month = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", month: '2-digit' });
        const day = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", day: '2-digit' });
        const today = `${year}-${month}-${day}`;
        const logRef = db.ref(`usage_logs/${today}/${featureId}`);

        // We use a transaction to aggregate atomically
        await logRef.transaction((currentData) => {
            if (!currentData) {
                return {
                    name: featureId,
                    model: modelName,
                    count: 1,
                    promptTokens: usageMetadata.promptTokenCount || 0,
                    candidateTokens: usageMetadata.candidatesTokenCount || 0,
                    totalTokens: usageMetadata.totalTokenCount || 0,
                    lastUpdated: Date.now()
                };
            }

            return {
                ...currentData,
                count: (currentData.count || 0) + 1,
                promptTokens: (currentData.promptTokens || 0) + (usageMetadata.promptTokenCount || 0),
                candidateTokens: (currentData.candidateTokens || 0) + (usageMetadata.candidatesTokenCount || 0),
                totalTokens: (currentData.totalTokens || 0) + (usageMetadata.totalTokenCount || 0),
                lastUpdated: Date.now()
            };
        });

    } catch (error) {
        logger.error(`Failed to log usage for ${featureId}:`, error);
        // Do not throw, logging failure shouldn't stop the main process
    }
}

module.exports = {
    logGeminiUsage
};
