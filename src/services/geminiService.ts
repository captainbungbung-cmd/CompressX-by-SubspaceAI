import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  sentiment?: string;
}

export const summarizeContent = async (content: string, type: 'url' | 'file' | 'text'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a high-fidelity information distiller. Analyze the following content and provide a visually stunning, high-density summary.
      
      Instructions:
      1. Provide a "🚀 Snapshot" (1-2 sentences of the absolute core message).
      2. "💎 Key Pillars" (Bullet points of the most critical facts or arguments).
      3. "🧠 Context & Nuance" (Briefly explain the background or target audience).
      4. "📊 Data & Insights" (Extract any specific metrics, dates, or names).
      
      Use clean markdown. Use emojis sparingly but effectively at the start of headers. Ensure the tone is professional but engaging.
      
      Content Type: ${type}
      Content:
      ${content}`,
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to generate summary with AI.");
  }
};

export const summarizeBook = async (bookTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep literary search and synthesis for the book: "${bookTitle}".
      
      Your goal is accuracy, depth, and presentation. Provide:
      1. **📖 Executive Abstract**: Core thesis or plot overview.
      2. **🎭 Thematic Deep-Dive**: Analysis of major philosophical or structural themes.
      3. **💡 Critical Takeaways**: What a reader must know after finishing.
      4. **🌍 Historical/Cultural Impact**: Why this book matters in its field.
      5. **📑 Logical Flow**: A condensed breakdown of the book's narrative or logical structure.
      
      Use professional formatting, clean headers, and bullet points. Ground all facts in reputable sources.`,
      tools: [{ googleSearch: {} }],
    });

    return response.text || "No book summary found.";
  } catch (error) {
    console.error("Gemini Book Search Error:", error);
    throw new Error("Failed to perform deep search for this book.");
  }
};

export const summarizeFile = async (fileData: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: fileData.split(',')[1] || fileData,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a document intelligence expert. Carefully scan this file and provide an accurate, high-engagement technical summary.
          Include:
          - 📄 **Document Type & Purpose**
          - 🎯 **Executive Summary**
          - 🔍 **Detailed Findings/Points**
          - 🌩️ **Actionable Insights**
          
          Format with clean markdown and distinct sections.`,
        }
      ],
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini File Error:", error);
    throw new Error("Failed to generate file summary with AI.");
  }
};

export const researchTopic = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform an exhaustive deep research and synthesis on the topic: "${topic}".
      
      Instructions:
      1. **🌐 Situation Analysis**: Current state of the topic.
      2. **⚡ Key Breakthroughs/Facts**: The most important data points or events.
      3. **⚖️ Conflicting Perspectives**: Different expert views or debates.
      4. **🔮 Future Outlook**: Where this topic is headed.
      5. **🏁 Dense Summary**: A compact distillation of all findings.
      
      Use professional markdown, structure with clear headers, and provide high-density information.`,
      tools: [{ googleSearch: {} }],
    });

    return response.text || "No research results found.";
  } catch (error) {
    console.error("Gemini Research Error:", error);
    throw new Error("Failed to perform deep research on this topic.");
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into ${targetLanguage}. Maintain the markdown formatting and the tone of the original summary.

      Text:
      ${text}`,
    });

    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw new Error("Failed to translate summary.");
  }
};
