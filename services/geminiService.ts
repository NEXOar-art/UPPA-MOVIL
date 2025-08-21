

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { API_KEY_ERROR_MESSAGE, GEMINI_TEXT_MODEL, GEMINI_CHAT_DRAFT_MODEL } from '../constants';
import { RatingHistoryEntry } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error(API_KEY_ERROR_MESSAGE);
}

export const analyzeSentiment = async (text: string): Promise<'positive' | 'negative' | 'neutral' | 'unknown'> => {
  if (!ai) {
    console.warn("Gemini AI SDK not initialized due to missing API key. Sentiment analysis disabled.");
    return 'unknown';
  }

  const prompt = `Analiza el sentimiento del siguiente texto y clasifícalo como "positive", "negative", o "neutral". Responde solo con una de esas tres palabras. Texto: "${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
    });
    const resultText = response.text.trim().toLowerCase();
    if (resultText === 'positive' || resultText === 'negative' || resultText === 'neutral') {
      return resultText;
    }
    console.warn(`Unexpected sentiment analysis response: ${resultText}`);
    return 'unknown';
  } catch (error) {
    console.error("Error analyzing sentiment with Gemini:", error);
    return 'unknown';
  }
};

export const getAIAssistantResponse = async (userQuestion: string, busLineName: string, combinedContext: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini AI SDK not initialized due to missing API key. AI Assistant disabled.");
    throw new Error("El asistente IA no está disponible debido a un problema de configuración (clave API).");
  }

  const systemInstruction = `Eres UppA, un asistente virtual amigable y servicial para la línea de colectivo ${busLineName} en Argentina. 
  Tu conocimiento se basa en información general de la línea (como rutas, horarios, paradas principales) y también en los reportes recientes de los usuarios que te proporciono. 
  Responde las preguntas de los usuarios sobre el estado de la línea, posibles demoras, problemas, horarios, rutas o consejos generales basados en toda esta información. 
  Si la información no está explícitamente en el contexto provisto (tanto general como de reportes), indícalo claramente. 
  Sé conciso, útil y responde en español. Incorpora emojis relevantes para hacer la respuesta más amigable y visualmente atractiva (por ejemplo, 🚌 para buses, ⏰ para horarios, 🚨 para emergencias). No inventes información que no esté en el contexto.`;
  
  const fullPrompt = `Contexto para ${busLineName}:\n${combinedContext}\n\nPregunta del usuario: "${userQuestion}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5, 
        }
    });
    return response.text.trim();
  } catch (error: any) {
    console.error("Error getting AI assistant response from Gemini:", error);
    throw new Error(`Error al contactar al asistente IA: ${error.message || 'Fallo en la comunicación con el servicio.'}`);
  }
};

export const draftChatResponse = async (originalText: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini AI SDK not initialized due to missing API key. AI drafting disabled.");
    throw new Error("La función de borrador IA no está disponible debido a un problema de configuración (clave API).");
  }

  const systemInstruction = `Eres un asistente de escritura para una app de chat sobre transporte público. 
  Tu tarea es mejorar el mensaje de un usuario. Puedes hacerlo más claro, conciso, amigable, o reformularlo si es una pregunta para obtener mejores respuestas.
  Considera el contexto de un chat rápido y en movimiento.
  Responde únicamente con el texto mejorado o la sugerencia. No incluyas saludos ni explicaciones sobre tu función.`;
  
  const fullPrompt = `Por favor, mejora o reformula el siguiente mensaje para un chat de transporte público: "${originalText}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_CHAT_DRAFT_MODEL,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7, // Slightly more creative for drafting
        }
    });
    return response.text.trim();
  } catch (error: any) {
    console.error("Error drafting chat response with Gemini:", error);
    throw new Error(`Error al generar borrador con IA: ${error.message || 'Fallo en la comunicación con el servicio.'}`);
  }
};


export const getAiRouteSummary = async (originAddress: string, destinationAddress: string, routeInfo: string, userReportsContext: string): Promise<string> => {
    if (!ai) {
        throw new Error("El asistente IA no está disponible debido a un problema de configuración (clave API).");
    }

    const systemInstruction = `Eres UppA, un asistente de planificación de viajes para una app de transporte en Argentina. 
    Tu tarea es analizar una ruta de viaje y los reportes recientes de la comunidad para dar un resumen útil y consejos.
    Basado en el origen, destino, detalles de la ruta, y los reportes, proporciona:
    1. Un resumen conciso (1-2 frases) del estado general del viaje.
    2. Menciona cualquier problema específico de los reportes (demoras, incidentes, etc.) que pueda afectar la ruta.
    3. Ofrece un consejo práctico (ej. "Considera salir 10 minutos antes por la demora reportada").
    Responde en español, de forma amigable y directa. Incorpora emojis relevantes para hacer el resumen más visual (ej. 🗺️ para rutas, ✅ para consejos, ⚠️ para alertas). No inventes información. Si no hay reportes, simplemente indica que el viaje parece estar sin novedades.`;

    const fullPrompt = `Análisis de Viaje:
    - Origen: ${originAddress}
    - Destino: ${destinationAddress}
    - Información de la Ruta: ${routeInfo}
    - Reportes Recientes de la Comunidad en la Zona: ${userReportsContext || "No hay reportes recientes disponibles."}
    
    Por favor, genera el resumen y consejo del viaje.`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
            }
        });
        return response.text.trim();
    } catch (error: any) {
        console.error("Error getting AI route summary from Gemini:", error);
        throw new Error(`Error al generar resumen IA del viaje: ${error.message || 'Fallo en la comunicación con el servicio.'}`);
    }
};

export const getReviewSummary = async (comments: string[]): Promise<string> => {
    if (!ai || comments.length === 0) {
        return "No hay suficientes comentarios para generar un resumen.";
    }

    const systemInstruction = `Eres un asistente que resume comentarios de usuarios para un servicio de transporte.
    Analiza los siguientes comentarios y genera un resumen conciso de 1-2 frases que capture los puntos clave, tanto positivos como negativos.
    Responde únicamente con el resumen en español.`;

    const fullPrompt = `Por favor, resume los siguientes comentarios de usuarios:\n- ${comments.join('\n- ')}`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: fullPrompt,
            config: {
                systemInstruction,
                temperature: 0.6,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting AI review summary:", error);
        return "No se pudo generar el resumen.";
    }
};

export const getPredictiveAlerts = async (reviews: RatingHistoryEntry[]): Promise<string> => {
    if (!ai || reviews.length < 3) {
        return "No hay suficientes datos para generar una alerta predictiva. Se necesita más feedback de la comunidad.";
    }

    const systemInstruction = `Eres un analista de datos experto para una app de transporte. Tu trabajo es identificar patrones preocupantes en las reseñas negativas de los usuarios para generar una alerta proactiva para el equipo de operaciones.
    **El texto del comentario del usuario es la fuente de información más importante, ya que contiene el contexto detallado del problema.** Analiza las reseñas proporcionadas, prestando especial atención a los comentarios.
    Busca problemas recurrentes, menciones de seguridad, higiene o comportamiento del conductor. No te limites a los números de calificación; profundiza en el significado de los comentarios.
    Tu respuesta debe ser una alerta clara y accionable en español, con el formato:
    **Alerta Predictiva:** [Descripción del patrón detectado]
    **Sugerencia Operativa:** [Acción recomendada para mitigar el problema]
    Si no encuentras un patrón claro, indica "No se detectaron patrones de alerta significativos en los datos actuales."`;

    const reviewData = reviews.map(r => 
        `Rating: ${r.overallRating}/5. Scores: Limpieza(${r.scores.cleanliness}), Seguridad(${r.scores.safety}), Puntualidad(${r.scores.punctuality}), Amabilidad(${r.scores.kindness}). Comentario: "${r.comment || 'N/A'}"`
    ).join('\n');

    const fullPrompt = `Analiza los siguientes datos de reseñas para generar una alerta predictiva. Enfócate en los comentarios para entender el contexto real:\n${reviewData}`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: fullPrompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting AI predictive alert:", error);
        return "Error al generar la alerta predictiva.";
    }
};