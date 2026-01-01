
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY;

export const analyzeAndGenerateScore = async (videoBase64: string, mimeType: string) => {
  // Sử dụng API Key từ hệ thống, không yêu cầu người dùng nhập hay chọn project trả phí
  const ai = new GoogleGenAI({ apiKey: API_KEY! });
  
  // 1. Phân tích bằng model Flash (Nhanh và miễn phí)
  const analysisPrompt = `
    Analyze this rap performance. 
    1. Detect the core emotional mood (e.g. Dark, Epic, Chill, Aggressive).
    2. Detect the BPM (tempo).
    3. List 4 cinematic instruments that would fit as a background beat (e.g. Heavy 808 Bass, Orchestral Strings, Dark Synths, Taiko Drums).
    4. Write a 1-sentence hype report in Vietnamese.
    Return strictly JSON.
  `;

  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Model Flash tiết kiệm và mạnh mẽ
    contents: [{ parts: [{ inlineData: { data: videoBase64, mimeType: mimeType } }, { text: analysisPrompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          bpm: { type: Type.NUMBER },
          intensity: { type: Type.NUMBER },
          layers: { type: Type.ARRAY, items: { type: Type.STRING } },
          report: { type: Type.STRING }
        }
      }
    }
  });

  const analysis = JSON.parse(analysisResponse.text);

  // 2. TẠO NHẠC NỀN (INSTRUMENTAL BEAT)
  // Nhấn mạnh việc KHÔNG CÓ LỜI NÓI, chỉ có nhạc cụ để giải quyết vấn đề "chỉ nghe lời"
  const musicPrompt = `Generate a 20-second HIGH-QUALITY CINEMATIC BEAT for a rap song.
    STYLE: Cinematic ${analysis.mood} Rap.
    BPM: ${analysis.bpm}.
    INSTRUMENTATION: ${analysis.layers.join(', ')}.
    REQUIREMENT: Pure instrumental music only. Heavy drums, deep bass, and cinematic atmosphere. 
    ABSOLUTELY NO HUMAN VOICES OR SPEECH.`;
  
  const musicResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    contents: [{ parts: [{ text: musicPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
    },
  });

  const musicAudioData = musicResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return { analysis, musicAudioData };
};
