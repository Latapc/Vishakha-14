import { GoogleGenAI } from "@google/genai";

// Initialize AI lazily to ensure environment is ready
let ai: any = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const getEmojisForPrompt = async (prompt: string): Promise<string[]> => {
  try {
    const client = getAI();
    if (!client) return [];

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a JSON array containing 5 to 8 emojis that represent or relate to the topic: "${prompt}". 
      Return only the JSON array. Do not include any explanation or labels. 
      Example format: ["🐶", "🐕", "🐾"]`
    });

    const text = response.text || "";
    if (!text) return [];

    // More robust JSON extraction: find the first '[' and last ']'
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1) {
      // Fallback: try to match any emoji-like characters if JSON fails
      const emojiMatch = text.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu);
      return emojiMatch ? emojiMatch.slice(0, 8) : [];
    }

    const jsonString = text.substring(startIdx, endIdx + 1);
    const emojis = JSON.parse(jsonString);
    
    if (Array.isArray(emojis)) {
      return emojis.filter(e => typeof e === 'string');
    }
    return [];
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return a few generic emojis if AI fails so the UI doesn't feel broken
    return ["✨", "🎨", "🎉", "🔥"];
  }
};
