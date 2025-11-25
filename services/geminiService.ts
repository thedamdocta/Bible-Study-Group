import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  // Lazy init to prevent top-level crashes if process is undefined
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const generateStudyNotes = async (
  verseText: string, 
  bookName: string, 
  chapter: number
): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `
      You are a deeply knowledgeable biblical scholar and historian. 
      Provide a concise, culturally rich, and theological explanation for the following passage from ${bookName} Chapter ${chapter}:
      "${verseText}"
      
      Include:
      1. Historical context (Who, When, Where).
      2. Key Greek/Hebrew word insights if applicable.
      3. Theological significance.
      
      Keep it under 200 words. Format with clear headings in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights found.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to load study notes at this time.";
  }
};

export const chatWithStudyCoach = async (
  message: string,
  context: string
): Promise<string> => {
  try {
     const ai = getAI();
     const prompt = `
      Context: User is reading ${context}.
      User Question: ${message}
      
      Answer as a helpful, neutral study coach. Cite sources if possible. Keep it conversational but academic.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I'm thinking...";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I couldn't process that request.";
  }
}