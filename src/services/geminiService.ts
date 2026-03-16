import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getBookCompanionResponse(
  bookTitle: string,
  bookContent: string,
  userPrompt: string,
  history: { role: 'user' | 'ai', text: string }[] = []
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are the LIVING BOOK COMPANION (LBC). 
    You are an AI-powered interactive book system designed to enhance reader engagement.
    
    Current Book: "${bookTitle}"
    Context from Book: "${bookContent}"
    
    Your responsibilities:
    1. Read the provided text and generate clear, context-aware responses to reader questions.
    2. Summarize sections accurately when requested.
    3. Provide insights, explanations, or examples to help the reader understand complex topics.
    4. Maintain the book's context and preserve the author's voice.
    
    Constraints:
    - Do not generate content outside the scope of the book unless explaining concepts.
    - Avoid speculation or adding new lore.
    - Keep responses under 200 words.
    - Be concise, clear, and faithful to the original text.
  `;

  const contents = [
    ...history.map(h => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text }]
    })),
    {
      role: 'user',
      parts: [{ text: userPrompt }]
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: {
        systemInstruction,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error while trying to analyze the book. Please try again.";
  }
}
