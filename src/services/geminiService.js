import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebase/firebase";

// Instancia global opcional
let genAIInstance = null;

/**
 * Obtiene la API Key de Gemini desde la Realtime Database
 */
export const getGeminiApiKey = async () => {
    try {
        const db = getDatabase(app);
        const keySnapshot = await get(ref(db, 'config/apiKeys/google_gemini'));
        
        if (keySnapshot.exists() && keySnapshot.val().trim() !== '') {
            let rawKey = keySnapshot.val().trim();
            if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
                rawKey = rawKey.substring(1, rawKey.length - 1).trim();
            }
            return rawKey;
        }
    } catch (e) {
        console.error("Error fetching Gemini API key from DB:", e);
    }
    
    // Fallback al .env local si existe
    return import.meta.env.VITE_GEMINI_API_KEY || null;
};

/**
 * Inicializa y obtiene una instancia del modelo Gemini
 */
export const getGenAIModel = async (modelName = "gemini-1.5-flash", systemInstruction = null) => {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key not configured.");
    }

    if (!genAIInstance || genAIInstance.apiKey !== apiKey) {
        genAIInstance = new GoogleGenerativeAI(apiKey);
    }

    const config = { model: modelName };
    if (systemInstruction) {
        config.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    return genAIInstance.getGenerativeModel(config);
};

/**
 * Función principal para reemplazar a askAI de Cloud Functions
 */
export const askGeminiAI = async (userPrompt, systemPromptContent) => {
    try {
        const model = await getGenAIModel("gemini-1.5-flash", systemPromptContent);
        
        // Iniciar chat
        const chat = model.startChat();
        
        // Enviar mensaje
        const result = await chat.sendMessage(userPrompt);
        
        // Por ahora no soportamos llamadas a funciones (tools) complejas en el frontend
        // como generatePriceLink, ya que eso se maneja en el processDateQuery.
        // Si el modelo retorna texto, lo usamos.
        
        return result.response.text();
    } catch (error) {
        console.error("Error in askGeminiAI frontend:", error);
        throw error;
    }
};

export const askGeminiWithImage = async (userPrompt, base64Image, mimeType, systemPromptContent) => {
    try {
        const model = await getGenAIModel("gemini-1.5-flash", systemPromptContent);
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType
            }
        };

        const result = await model.generateContent([userPrompt, imagePart]);
        return result.response.text();
    } catch (error) {
        console.error("Error in askGeminiWithImage frontend:", error);
        throw error;
    }
};
