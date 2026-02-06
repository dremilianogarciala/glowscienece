
import { GoogleGenAI } from "@google/genai";
import { ImageSize, AspectRatio, AIAgent } from "../types";

// Conversación con Gemini 3 Pro para razonamiento avanzado
export const chatWithGemini = async (
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  agent?: AIAgent
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const dynamicSystemInstruction = agent 
    ? `
      IDENTIDAD: ${agent.name}
      ROL: ${agent.role}
      DIRECTIVAS PRINCIPALES: ${agent.systemPrompt}
      BASE DE CONOCIMIENTO: ${agent.knowledgeContent}
      ${agent.strictMode ? "REGLA: Solo responde basándote en la base de conocimiento." : ""}
      RESTRICCIONES: ${agent.constraints.join(', ')}
    `
    : "Eres un asistente experto llamado OmniAgent.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: agent?.strictMode ? 0.2 : 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error in chatWithGemini:", error);
    return "Error procesando con Gemini 3 Pro.";
  }
};

// Generación de imágenes de alta fidelidad
export const generateAIImage = async (prompt: string, size: ImageSize, ratio: AspectRatio) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Usar Gemini 3 Pro Image para calidades 2K/4K, de lo contrario Flash Image
  const isHighQuality = size === '2K' || size === '4K';
  const model = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: model, 
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: ratio,
          ...(isHighQuality ? { imageSize: size } : {})
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("AUTH_REQUIRED");
    throw error;
  }
};

// Generación de Video usando Veo 3.1 Fast
export const generateAIVideo = async (prompt: string, ratio: '16:9' | '9:16') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: ratio
      }
    });

    // Polling del estado del video
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - No URI");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("AUTH_REQUIRED");
    throw error;
  }
};

// Edición de imágenes con Gemini 2.5 Flash Image
export const editAIImage = async (base64Image: string, prompt: string, ratio: AspectRatio) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const [header, data] = base64Image.split(',');
    const mimeType = header.split(':')[1].split(';')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: { imageConfig: { aspectRatio: ratio } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found after edit");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) throw new Error("AUTH_REQUIRED");
    throw error;
  }
};
