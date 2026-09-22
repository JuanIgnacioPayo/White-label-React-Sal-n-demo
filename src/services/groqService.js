import Groq from "groq-sdk";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../firebase/firebase";

let groqInstance = null;

export const getGroqApiKey = async () => {
    // Intentar buscar en Realtime Database primero (si así lo configuraste)
    try {
        const db = getDatabase(app);
        const keySnapshot = await get(ref(db, 'config/apiKeys/groq'));
        
        if (keySnapshot.exists() && keySnapshot.val().trim() !== '') {
            let rawKey = keySnapshot.val().trim();
            if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
                rawKey = rawKey.substring(1, rawKey.length - 1).trim();
            }
            if (rawKey === 'leaked_key_removed') {
                console.warn("Database Groq key is the known invalid key. Falling back to .env key.");
            } else {
                return rawKey;
            }
        }
    } catch (e) {
        console.error("Error fetching Groq API key from DB:", e);
    }
    
    // Fallback al .env local si existe
    return import.meta.env.VITE_GROQ_API_KEY || null;
};

export const getGroqInstance = async () => {
    const apiKey = await getGroqApiKey();
    if (!apiKey) {
        throw new Error("Groq API Key not configured. Please add VITE_GROQ_API_KEY to your .env file or database.");
    }

    if (!groqInstance || groqInstance.apiKey !== apiKey) {
        groqInstance = new Groq({ 
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Necesario para llamar a Groq directo desde el frontend
        });
    }
    return groqInstance;
};

export const askGroqAI = async (userPrompt, systemPromptContent, previousMessages = []) => {
    try {
        const groq = await getGroqInstance();
        
        const messages = [];
        if (systemPromptContent) {
            messages.push({ role: "system", content: systemPromptContent });
        }
        
        // Add previous messages (limiting to last 6 messages to preserve token limit)
        const recentMessages = previousMessages.slice(-6);
        recentMessages.forEach(msg => {
            messages.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        });

        // Add the current prompt
        messages.push({ role: "user", content: userPrompt });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-120b", // Modelo OpenAI/GPT-OSS 120B de alto rendimiento
        });
        
        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error in askGroqAI frontend:", error);
        throw error;
    }
};
