import { GoogleGenAI, GenerateContentResponse, Tool, Type } from "@google/genai";
import { API_KEY_ERROR_MESSAGE, GEMINI_TEXT_MODEL, GEMINI_CHAT_DRAFT_MODEL } from '../constants';
import { RatingHistoryEntry, UppyChatMessage } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error(API_KEY_ERROR_MESSAGE);
}

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getWeatherForLocation',
        description: 'Obtiene el pronóstico del tiempo actual para una ubicación específica.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            location: {
              type: Type.STRING,
              description: 'La ciudad o ubicación para la cual obtener el tiempo. Por ejemplo: "Zárate, Buenos Aires"',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'saveUserPreference',
        description: 'Guarda una preferencia del usuario para futuras interacciones. Usar cuando el usuario declare explícitamente un gusto, aversión o requisito para sus viajes.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            preference: {
              type: Type.STRING,
              description: 'La preferencia específica declarada por el usuario. Por ejemplo: "Evitar colectivos nocturnos", "Preferir rutas con menos paradas", "No me gustan los colectivos llenos".',
            },
          },
          required: ['preference'],
        },
      },
    ],
  },
];


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

export const getUppySystemInstruction = (userName: string, busLineContext: string, reportSummary: string, preferencesSummary: string): string => {
  return `
ROL Y OBJETIVO PRINCIPAL:
Tu nombre es UppY. Eres el asistente de viaje inteligente y proactivo de la plataforma "UppA". Tu objetivo fundamental no es solo responder a las consultas de los usuarios, sino anticiparte a sus necesidades para ofrecer una experiencia de viaje fluida, completa y totalmente humana. Eres la compañía de viaje que transforma la planificación y la ejecución de traslados en una tarea simple y agradable. Cuando te pregunten por el clima, usa la herramienta 'getWeatherForLocation'. Si el usuario expresa una preferencia de viaje (ej. "no me gustan los colectivos de noche"), usa la herramienta 'saveUserPreference' para recordarla.

PERSONA Y TONO DE COMUNICACIÓN (GUARDRAILS):
- Cordial y Respetuoso: Inicia siempre las interacciones con un saludo amigable y dirígete al usuario por su nombre (${userName}) para crear una conexión personal. Mantén un tono respetuoso en todo momento.
- Atento y Empático: Escucha activamente las necesidades del usuario. Si un usuario expresa frustración por un retraso o un inconveniente, valida sus sentimientos antes de ofrecer una solución.
- Claro y Conciso: Proporciona información precisa, completa y fácil de entender. Evita la jerga técnica y estructura las respuestas de forma lógica.
- Interacción Humana: Tu diálogo debe ser natural y fluido. Evita respuestas robóticas. El objetivo es que el usuario sienta que está conversando con un asistente humano experto.
- Uso de Emojis: Utiliza emojis (como ✨, 🚌, 📍, ☀️, 🌧️) para listas o para resaltar puntos clave, en lugar de usar asteriscos (*). Tu comunicación debe ser visualmente atractiva.

BASE DE CONOCIMIENTO Y MEMORIA (KNOWLEDGE AND MEMORY):
- Maestría sobre la Plataforma UppA: Posees un conocimiento exhaustivo de cada funcionalidad de la plataforma. Puedes guiar al usuario paso a paso en cualquier proceso, como añadir un método de pago, reservar un viaje o configurar su perfil.
- Experto en Transporte (Basado en datos micros.pdf):
  - Línea de Colectivo 228 (MOTSA): Dominas toda la información del documento, incluyendo:
    - Rutas y Ramales: Conoces la ruta principal (Pte. Saavedra - Luján) y todos sus segmentos específicos.
    - Ruta Campana - Zárate: Sabes que tiene 80 paradas y una duración aproximada de 78 minutos.
    - Lista Detallada de Paradas (Ramal Campana-Zárate):
      - Paradas Clave en Campana: Vigalondo Y Bomberos Voluntarios, Vigalondo Y Sierra, A. Schinoni 222, Escuela Técnica Roberto Rocca, Estación Campana, San Martín y Luis Costa, San Martín y Güemes, San Martín y Av. Mitre, Belgrano y Alberdi.
      - Paradas en Colectora Sur: Colectora Sur y Grassi, Colectora Sur y Avenida Bellomo, Colectora Sur y Avenida Lavezzari, Colectora Sur y Avenida Mitre, Colectora Sur y Magaldi, Colectora Sur y Antártida Argentina, Colectora Sur y Maipú.
      - Paradas en Av. Varela: Av. Rubén Varela y Salmini, Av. Rubén Varela y Av. Teniente Perón, Av. Rubén Varela y Bertolini, Av. Ruben Varela y Sivori, Av. Ruben Varela y Av. Ameghino.
      - Paradas en Gral. Belgrano (Zárate): Gral. Belgrano y Alberdi (Zárate), Gral. Belgrano y Jean Jaures, Gral. Belgrano y Av. Mitre (Zárate), Gral. Belgrano y De Dominicis, Gral. Belgrano y Becerra, Gral. Belgrano y Alem (Zárate).
      - Paradas en Zárate (Centro y Avenidas): Av. Lavalle 800 (Zárate), Av. Lavalle 400 (Zárate), Leandro Alem 1200 (Zárate), Leandro Alem 800 (Zárate), Florestano Andrade Atucha 200 (Zárate), Av. Anta y España (Zárate), Calle Juan José Paso 1100 (Zárate), y Centro De Transferencia De Zárate.
      - Otras paradas notables: Schinoni Y Miracca, Casaux Y Chapuis, Fremi Y Cassaux, Casaux Y Goujon, Doctor Salk 204, Viamonte 1299, Uruguay 642, Av. Rivadavia 1410, Jean Jaures y 3 de Febrero (Zárate), Av. Mitre y Gral. Paz (Zárate), RP 6.
    - Horarios y Frecuencias: Tienes memorizados los horarios de operación y las frecuencias para días de semana (05:15 - 21:45, cada 30 min), sábados (05:15 - 21:55, cada 40 min) y domingos (05:30 - 21:30, cada 60 min).
- Memoria Conversacional: Recuerdas el contexto de la conversación actual y las interacciones recientes para ofrecer respuestas coherentes y evitar que el usuario tenga que repetirse.
- CONTEXTO ADICIONAL: ${busLineContext}

MEMORIA ADAPTATIVA (PREFERENCIAS DEL USUARIO):
Recuerda y aplica las siguientes preferencias guardadas de ${userName} en todas tus sugerencias y respuestas. Adáptate a su estilo de viaje.
${preferencesSummary || 'Aún no se han guardado preferencias.'}

INTELIGENCIA DE LA COMUNIDAD EN VIVO (ÚLTIMOS REPORTES):
Aquí tienes un resumen de los reportes más recientes de los usuarios para la línea actual. Utiliza esta información para responder de forma inteligente sobre el estado del servicio, demoras, seguridad, etc. Si el usuario pregunta "cómo está el servicio" o similar, basa tu respuesta principalmente en estos datos.
${reportSummary || 'No hay reportes recientes disponibles.'}
`;
}

export const getUppyResponse = async (
  systemInstruction: string,
  history: any[]
): Promise<GenerateContentResponse> => {
  if (!ai) {
    throw new Error("El asistente IA no está disponible debido a un problema de configuración (clave API).");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: history,
        config: {
          systemInstruction: systemInstruction,
// FIX: The `tools` property must be inside the `config` object.
          tools: tools,
          temperature: 0.7, 
        }
    });
    return response;
  } catch (error: any) {
    console.error("Error getting Uppy response from Gemini:", error);
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

// Simple in-memory cache for AI summaries to reduce API calls
const summaryCache = new Map<string, { summary: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL for cached summaries

export const getAiRouteSummary = async (originAddress: string, destinationAddress: string, routeInfo: string, userReportsContext: string): Promise<string> => {
    if (!ai) {
        throw new Error("El asistente IA no está disponible debido a un problema de configuración (clave API).");
    }

    const cacheKey = `${originAddress.toLowerCase().trim()}|${destinationAddress.toLowerCase().trim()}`;
    const cachedEntry = summaryCache.get(cacheKey);

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL)) {
        console.log("Returning cached AI route summary for:", cacheKey);
        return cachedEntry.summary;
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
        const summary = response.text.trim();
        summaryCache.set(cacheKey, { summary, timestamp: Date.now() });
        return summary;
    } catch (error: any) {
        console.error("Error getting AI route summary from Gemini:", error);
        const errorMessage = String(error.message || error);
        // Gracefully handle rate limit errors by returning a user-friendly message
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            return "⚠️ El análisis IA de la ruta no está disponible temporalmente por alto tráfico. Por favor, revisa los detalles del viaje y los reportes de la comunidad manualmente.";
        }
        // For other errors, we still throw to notify the user of a different problem
        throw new Error(`Error al generar resumen IA del viaje: ${errorMessage || 'Fallo en la comunicación con el servicio.'}`);
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