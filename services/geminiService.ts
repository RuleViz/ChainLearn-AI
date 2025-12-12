import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlanResponse, ChatMessage, AIConfig } from "../types";

// --- Google Gemini Implementation (Default) ---
const geminiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL_FAST = "gemini-2.5-flash";
const GEMINI_MODEL_REASONING = "gemini-2.5-flash";

// --- OpenAI / Custom Implementation ---
const callOpenAICompatible = async (
  config: AIConfig,
  messages: Array<{ role: string; content: string }>,
  responseFormat?: 'json_object' | 'text'
): Promise<string> => {
  if (!config.apiKey) {
    throw new Error("API Key is required for custom provider.");
  }
  if (!config.baseUrl) {
    throw new Error("Base URL is required for custom provider.");
  }

  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${config.apiKey}`
  };

  // Fix: Ensure roles are OpenAI compatible (map 'model' -> 'assistant')
  const sanitizedMessages = messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : m.role,
    content: m.content
  }));

  const body: any = {
    model: config.modelId || 'gpt-3.5-turbo',
    messages: sanitizedMessages,
    temperature: 0.7,
  };

  if (responseFormat === 'json_object') {
    // Note: Not all providers support response_format. We rely on prompt engineering as primary method,
    // but pass this for providers that do support it (like OpenAI native).
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Custom Provider Call Error:", error);
    throw error;
  }
};

/**
 * Helper to parse JSON from AI response, handling markdown code blocks often returned by open models.
 */
const cleanAndParseJson = <T>(text: string): T => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try stripping markdown code blocks ```json ... ```
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // 3. Try finding the first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("Failed to parse JSON from response: " + text.substring(0, 100) + "...");
  }
};

// --- Exported Services ---

export const generateLearningPlan = async (topic: string, config: AIConfig): Promise<PlanResponse> => {
  const systemPrompt = `
    You are an expert curriculum designer. 
    Create a structured, step-by-step learning path for the topic: "${topic}".
    Break this down into 4-6 logical chapters (nodes).
    Each chapter should represent a distinct phase of learning.
    Return ONLY valid JSON with a "plan" array containing objects with "title" and "description".
  `;

  // GEMINI PATH
  if (config.provider === 'GEMINI') {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
      required: ["plan"],
    };

    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(response.text || "{}") as PlanResponse;
  }

  // CUSTOM PATH
  const responseText = await callOpenAICompatible(
    config,
    [
      { role: "system", content: "You are a helpful assistant that outputs JSON." },
      { role: "user", content: systemPrompt }
    ],
    'json_object'
  );
  return cleanAndParseJson<PlanResponse>(responseText);
};

export const initializeNodeChat = async (
  title: string,
  description: string,
  previousContext: string,
  config: AIConfig
): Promise<{ initialMessage: string; microSteps: string[] }> => {
  const prompt = `
    You are a friendly, expert tutor teaching "${title}".
    Goal: ${description}
    
    Context from previous learning steps:
    ${previousContext ? previousContext : "This is the very first step. Assume no prior specific knowledge."}

    Your Task:
    1. Create 3-5 specific "Micro-steps" (key concepts) we will cover in this chat session.
    2. Write an "initialMessage" to start the conversation. 
       - Welcome the user.
       - Briefly mention what we will cover.
       - Ask a simple opening question.
    
    Return ONLY valid JSON with fields: "initialMessage" (string) and "microSteps" (string array).
  `;

  // GEMINI PATH
  if (config.provider === 'GEMINI') {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        initialMessage: { type: Type.STRING },
        microSteps: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }
        },
      },
      required: ["initialMessage", "microSteps"],
    };

    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(response.text || "{}");
  }

  // CUSTOM PATH
  const responseText = await callOpenAICompatible(
    config,
    [
        { role: "system", content: "You are a helpful tutor that outputs JSON." },
        { role: "user", content: prompt }
    ],
    'json_object'
  );
  return cleanAndParseJson(responseText);
};

export const sendChatMessage = async (
  title: string,
  microSteps: string[],
  history: ChatMessage[],
  config: AIConfig
): Promise<string> => {
  const systemInstruction = `
    You are an expert tutor for the topic: "${title}".
    
    The structured goals (Micro-steps) for this session are:
    ${microSteps.map(s => `- ${s}`).join('\n')}

    Your goal is to guide the user through these steps interactively.
    - Do NOT dump long lectures.
    - Explain one concept at a time.
    - Check for understanding before moving to the next micro-step.
    - Be encouraging and concise.
    - Use Markdown for formatting (bold, code blocks, lists).
  `;

  // GEMINI PATH
  if (config.provider === 'GEMINI') {
    const chat = geminiClient.chats.create({
      model: GEMINI_MODEL_REASONING,
      config: { systemInstruction },
      history: history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })),
    });

    const lastMessage = history[history.length - 1];
    const result = await chat.sendMessage({ message: lastMessage.text });
    return result.text || "";
  }

  // CUSTOM PATH
  // Reconstruct full conversation for stateless API
  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(m => ({ role: m.role, content: m.text }))
  ];

  return await callOpenAICompatible(config, messages);
};

export const summarizeNodeChat = async (
  title: string,
  chatHistory: ChatMessage[],
  config: AIConfig
): Promise<string> => {
  const transcript = chatHistory
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  const prompt = `
    Review the following tutoring session about "${title}":
    
    --- START TRANSCRIPT ---
    ${transcript}
    --- END TRANSCRIPT ---

    Create a concise summary (max 150 words) of what was taught and what the user now understands.
    This summary will be used as the "Prior Knowledge" context for the NEXT lesson.
  `;

  // GEMINI PATH
  if (config.provider === 'GEMINI') {
    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: prompt,
    });
    return response.text || "Summary generation failed.";
  }

  // CUSTOM PATH
  return await callOpenAICompatible(
    config,
    [{ role: "user", content: prompt }]
  );
};