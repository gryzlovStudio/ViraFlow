
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processVideoContent(videoBase64: string, mimeType: string) {
  // Использование flash-модели для скорости и отличной работы с транскрибацией
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Твоя задача — проанализировать видео и подготовить контент-пак для публикации в соцсетях (Shorts, Reels, TikTok, YouTube, Rutube).
    
    1. Транскрибация: Выпиши дословно всё, что говорится в видео (на языке оригинала).
    2. Виральный контент (на РУССКОМ языке):
       - titles: Придумай 3 максимально цепляющих (кликбейтных) заголовка, которые заставляют нажать на видео.
       - description: Напиши мощное описание. Оно должно быть кратким, вовлекающим, содержать ключевые слова и призыв к действию (CTA).
       - tags: Составь список из 15 самых эффективных хэштегов (с решеткой #).
       - searchTags: Составь список из 15 поисковых тегов (ключевых фраз). Это словосочетания на русском или английском, которые люди вводят в поиск, чтобы найти подобный контент. БЕЗ решеток.
    
    Верни ответ СТРОГО в формате JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { inlineData: { data: videoBase64, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING, description: "Полный текст из видео" },
          result: {
            type: Type.OBJECT,
            properties: {
              titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 варианта заголовков" },
              description: { type: Type.STRING, description: "Виральное описание" },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "15 хэштегов" },
              searchTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "15 поисковых фраз/тегов" }
            },
            required: ["titles", "description", "tags", "searchTags"]
          }
        },
        required: ["transcription", "result"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Не удалось получить ответ от нейросети. Попробуй другое видео.");
  }

  return JSON.parse(text);
}
