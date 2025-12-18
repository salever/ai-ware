import { GoogleGenAI, Type } from "@google/genai";
import { ResearchPlan, ResearchReport, Flashcard, ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const PLAN_SYSTEM_INSTRUCTION = `
You are an expert Research Lead. Your goal is to structure a "Deep Research" plan based on a user's query.
The user needs a structured framework to approve before you start.
Break down the topic into logical sections. For each section, list specific key information points to investigate.
Return the response strictly as a JSON object matching the schema provided.
Do not be conversational. Be precise, analytical, and comprehensive.
IMPORTANT: All generated content (titles, objectives, descriptions, points) MUST be in Simplified Chinese (zh-CN).
`;

const RESEARCH_SYSTEM_INSTRUCTION = `
You are a Deep Research Agent. You have been given a specific research plan approved by the user.
Your task is to execute this plan thoroughly. 
Use the Google Search tool to find up-to-date, accurate, and detailed information for each enabled section and point in the plan.
Synthesize the information into a high-quality, long-form professional report formatted in Markdown.
Cite sources where possible using links.
IMPORTANT: The final report MUST be written in Simplified Chinese (zh-CN).
`;

export const generateResearchPlan = async (query: string, currentPlan?: ResearchPlan, modificationRequest?: string): Promise<ResearchPlan> => {
  const modelId = "gemini-3-flash-preview"; 

  let prompt = `Create a research framework in Simplified Chinese for the topic: "${query}".`;
  
  if (currentPlan && modificationRequest) {
    prompt += `\n\nThe user has reviewed a previous version of the plan and requested changes: "${modificationRequest}".
    
    Here is the previous plan JSON they were looking at (some items might be disabled/removed by them, pay attention to what they kept):
    ${JSON.stringify(currentPlan)}
    
    Please regenerate the plan in Simplified Chinese, incorporating their feedback and keeping the structure similar where appropriate but improving it based on the request.`;
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: PLAN_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A professional title for the research report (in Chinese)" },
          objective: { type: Type.STRING, description: "A one-sentence summary of the research goal (in Chinese)" },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Unique UUID for the section" },
                title: { type: Type.STRING, description: "Section title (in Chinese)" },
                description: { type: Type.STRING, description: "Brief description of what this section covers (in Chinese)" },
                points: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Unique UUID for the point" },
                      content: { type: Type.STRING, description: "Specific question or data point to research (in Chinese)" }
                    },
                    required: ["id", "content"]
                  }
                }
              },
              required: ["id", "title", "points"]
            }
          }
        },
        required: ["title", "sections", "objective"]
      }
    }
  });

  const rawJson = response.text;
  if (!rawJson) throw new Error("未生成计划");
  
  const parsed = JSON.parse(rawJson);
  
  const processedPlan: ResearchPlan = {
    title: parsed.title,
    objective: parsed.objective,
    sections: parsed.sections.map((s: any) => ({
      id: s.id || crypto.randomUUID(),
      title: s.title,
      description: s.description || '',
      isEnabled: true,
      points: s.points.map((p: any) => ({
        id: p.id || crypto.randomUUID(),
        content: p.content,
        isEnabled: true
      }))
    }))
  };

  return processedPlan;
};

const generateCoverImage = async (prompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A professional, abstract, high-quality, futuristic editorial illustration representing the concept of: ${prompt}. Minimalist, business tech style. Aspect Ratio 16:9.` },
        ],
      },
      config: {
         // imageConfig is not strictly needed for nano models if not specifying size/aspect ratio in a specific way, 
         // but we rely on the prompt for style. 
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.warn("Image generation failed", e);
    return undefined;
  }
  return undefined;
};

export const executeResearch = async (plan: ResearchPlan): Promise<ResearchReport> => {
  const startTime = Date.now();
  
  // Filter the plan to only include enabled items
  const activePlan = {
    title: plan.title,
    objective: plan.objective,
    sections: plan.sections
      .filter(s => s.isEnabled)
      .map(s => ({
        title: s.title,
        description: s.description,
        points: s.points.filter(p => p.isEnabled).map(p => p.content)
      }))
      .filter(s => s.points.length > 0)
  };

  const textPrompt = `
  Here is the approved research plan:
  ${JSON.stringify(activePlan, null, 2)}
  
  Conduct the research and write the final report.
  The report should be in Markdown format and written in Simplified Chinese.
  IMPORTANT: Use H2 (##) for EACH section title exactly as defined in the plan.
  Do not merge sections. Maintain the structure.
  Use bullet points/paragraphs as needed.
  Be exhaustive and detailed.
  `;

  // Run text research and image generation in parallel
  const [textResponse, imageUrl] = await Promise.all([
    ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: textPrompt,
      config: {
        systemInstruction: RESEARCH_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }]
      }
    }),
    generateCoverImage(plan.title)
  ]);

  const markdown = textResponse.text || "研究已完成，但未生成文本。";
  
  // Extract sources
  const sources: { title: string; uri: string }[] = [];
  const candidates = textResponse.candidates;
  if (candidates && candidates[0]) {
      const chunks = candidates[0].groundingMetadata?.groundingChunks;
      if (chunks) {
          chunks.forEach((chunk: any) => {
              if (chunk.web) {
                  sources.push({ title: chunk.web.title, uri: chunk.web.uri });
              }
          });
      }
  }

  const endTime = Date.now();
  const timeElapsed = Math.ceil((endTime - startTime) / 1000) + "s";
  const wordCount = markdown.length;

  return { 
    title: plan.title,
    markdown, 
    sources,
    imageUrl,
    wordCount,
    timeElapsed
  };
};

export const generateFlashcards = async (sectionContent: string): Promise<Flashcard[]> => {
  const prompt = `Based on the following text, create 3-5 high-quality flashcards for learning key concepts.
  Text: "${sectionContent.substring(0, 3000)}..."
  
  Return strictly JSON format.
  Front: Question or Term.
  Back: Answer or Definition (concise).
  Language: Simplified Chinese.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });

  const raw = response.text;
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return parsed.map((item: any) => ({
    id: crypto.randomUUID(),
    front: item.front,
    back: item.back
  }));
};

export const refineSectionContent = async (originalContent: string, instruction: string): Promise<string> => {
  const prompt = `You are a professional editor. Rewrite the following report section based on the user's instruction.
  
  User Instruction: "${instruction}"
  
  Original Text:
  ${originalContent}
  
  Output ONLY the rewritten markdown text. Maintain professional tone.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || originalContent;
};

export const chatWithSection = async (sectionContent: string, history: ChatMessage[], message: string): Promise<string> => {
  const systemInstruction = `You are an AI assistant helping a user study a specific section of a research report.
  The content of the section is provided below. Answer questions based on this content.
  
  Section Content:
  ${sectionContent}
  `;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: { systemInstruction },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
  });

  const result = await chat.sendMessage({ message });
  return result.text || "我无法回答这个问题。";
};