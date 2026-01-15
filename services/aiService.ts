import { PlanResponse, ChatMessage, AIConfig, Expert, ProviderConfig } from "../types";
import { Language, getLanguage } from './i18n';

// 获取当前激活的服务商和模型
const getActiveProviderAndModel = (config: AIConfig): { provider: ProviderConfig | null; modelId: string; baseUrl: string; apiKey: string } => {
  if (config.providers && config.activeProviderId) {
    const provider = config.providers.find(p => p.id === config.activeProviderId);
    if (provider) {
      return {
        provider,
        modelId: config.activeModelId || provider.models[0]?.id || '',
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
      };
    }
  }
  // 兼容旧版配置
  return {
    provider: null,
    modelId: config.modelId || '',
    baseUrl: config.baseUrl || '',
    apiKey: config.apiKey || '',
  };
};

// --- OpenAI 兼容 API 调用 ---
export const callAI = async (
  config: AIConfig,
  messages: Array<{ role: string; content: string }>,
  responseFormat?: 'json_object' | 'text'
): Promise<string> => {
  const { modelId, baseUrl, apiKey } = getActiveProviderAndModel(config);
  
  if (!apiKey) {
    throw new Error("请先配置 API Key");
  }
  if (!baseUrl) {
    throw new Error("请先配置 Base URL");
  }
  if (!modelId) {
    throw new Error("请先选择模型");
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  // 确保 roles 是 OpenAI 兼容的 (map 'model' -> 'assistant')
  const sanitizedMessages = messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : m.role,
    content: m.content
  }));

  const body: any = {
    model: modelId,
    messages: sanitizedMessages,
    temperature: 0.7,
  };

  // 先尝试带 JSON mode，如果失败则回退
  const tryRequest = async (useJsonMode: boolean): Promise<string> => {
    const requestBody = { ...body };
    if (useJsonMode && responseFormat === 'json_object') {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 如果是 JSON mode 不支持的错误，返回特殊标记让外层重试
      if (useJsonMode && (errorText.includes('json') || errorText.includes('Json') || errorText.includes('thinking'))) {
        throw new Error('JSON_MODE_NOT_SUPPORTED');
      }
      throw new Error(`API 错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  };

  try {
    // 先尝试带 JSON mode
    return await tryRequest(responseFormat === 'json_object');
  } catch (error: any) {
    // 如果 JSON mode 不支持，回退到普通模式
    if (error.message === 'JSON_MODE_NOT_SUPPORTED') {
      console.log('JSON mode not supported, falling back to text mode');
      return await tryRequest(false);
    }
    console.error("API 调用错误:", error);
    throw error;
  }
};

/**
 * 从 AI 响应中解析 JSON，处理 markdown 代码块
 */
const cleanAndParseJson = <T>(text: string): T => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 尝试提取 markdown 代码块中的 JSON
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // 尝试找到第一个 { 和最后一个 }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("无法解析 JSON 响应: " + text.substring(0, 100) + "...");
  }
};

// --- 导出的服务函数 ---

// 根据细度获取节点数量范围
const getNodeCountByGranularity = (granularity: string): string => {
  switch (granularity) {
    case 'brief':
      return '2-3';
    case 'detailed':
      return '7-10';
    case 'standard':
    default:
      return '4-6';
  }
};

// 根据细度获取描述
const getGranularityDescription = (granularity: string): string => {
  switch (granularity) {
    case 'brief':
      return 'Keep it concise and focus on the most essential concepts only.';
    case 'detailed':
      return 'Be thorough and comprehensive, covering all important subtopics and details.';
    case 'standard':
    default:
      return 'Balance depth and efficiency, covering key concepts without being too brief or too detailed.';
  }
};

export const generateLearningPlan = async (topic: string, config: AIConfig, expert?: Expert, language?: Language): Promise<PlanResponse> => {
  const nodeCount = getNodeCountByGranularity(config.granularity || 'standard');
  const granularityDesc = getGranularityDescription(config.granularity || 'standard');
  const lang = language || getLanguage();
  
  // 语言指令
  const languageInstruction = lang === 'zh' 
    ? '请使用中文回复。所有学习节点的标题(title)和描述(description)都必须是中文。'
    : 'Please respond in English. All learning node titles and descriptions must be in English.';
  
  const systemPrompt = expert
    ? `You are ${expert.name}. ${expert.systemPrompt}

       ${languageInstruction}
       
       Create a structured, step-by-step learning path for the topic: "${topic}".
       Break this down into ${nodeCount} logical chapters (nodes).
       ${granularityDesc}
       Each chapter should represent a distinct phase of learning.
       Return ONLY valid JSON with a "plan" array containing objects with "title" and "description".`
    : `You are an expert curriculum designer.
       
       ${languageInstruction}
       
       Create a structured, step-by-step learning path for the topic: "${topic}".
       Break this down into ${nodeCount} logical chapters (nodes).
       ${granularityDesc}
       Each chapter should represent a distinct phase of learning.
       Return ONLY valid JSON with a "plan" array containing objects with "title" and "description".`;

  const responseText = await callAI(
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
  config: AIConfig,
  expert?: Expert,
  language?: Language
): Promise<{ initialMessage: string; microSteps: string[] }> => {
  const lang = language || getLanguage();
  
  // 语言指令
  const languageInstruction = lang === 'zh' 
    ? '请使用中文回复。所有内容（包括欢迎消息和学习目标）都必须是中文。'
    : 'Please respond in English. All content (including welcome message and learning goals) must be in English.';
  
  const prompt = expert
    ? `You are ${expert.name}. ${expert.systemPrompt}

       ${languageInstruction}

       You are now teaching "${title}".
       Goal: ${description}

       Context from previous learning steps:
       ${previousContext ? previousContext : "This is the very first step. Assume no prior specific knowledge."}

       Your Task:
       1. Create 3-5 specific "Micro-steps" (key concepts) we will cover in this chat session.
       2. Write an "initialMessage" to start the conversation.
          - Welcome the user.
          - Briefly mention what we will cover.
          - Ask a simple opening question.

       Return ONLY valid JSON with fields: "initialMessage" (string) and "microSteps" (string array).`
    : `You are a friendly, expert tutor teaching "${title}".
       
       ${languageInstruction}
       
       Goal: ${description}

       Context from previous learning steps:
       ${previousContext ? previousContext : "This is the very first step. Assume no prior specific knowledge."}

       Your Task:
       1. Create 3-5 specific "Micro-steps" (key concepts) we will cover in this chat session.
       2. Write an "initialMessage" to start the conversation.
          - Welcome the user.
          - Briefly mention what we will cover.
          - Ask a simple opening question.

       Return ONLY valid JSON with fields: "initialMessage" (string) and "microSteps" (string array).`;

  const responseText = await callAI(
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
  config: AIConfig,
  expert?: Expert,
  language?: Language
): Promise<string> => {
  const lang = language || getLanguage();
  const expertIdentity = expert 
    ? `You are ${expert.name}. ${expert.systemPrompt}\n\n` 
    : '';
  
  // 语言指令
  const languageInstruction = lang === 'zh' 
    ? '\n\nIMPORTANT: You MUST respond in Chinese (中文). All explanations, examples, and conversations must be in Chinese.'
    : '\n\nIMPORTANT: You MUST respond in English. All explanations, examples, and conversations must be in English.';
    
  const systemInstruction = `${expertIdentity}You are an expert tutor for the topic: "${title}".${languageInstruction}
    
    The structured goals (Micro-steps) for this session are:
    ${microSteps.map(s => `- ${s}`).join('\n')}

    Your goal is to guide the user through these steps interactively.
    - Do NOT dump long lectures.
    - Explain one concept at a time.
    - Check for understanding before moving to the next micro-step.
    - Be encouraging and concise.
    - Use Markdown for formatting (bold, code blocks, lists).
    
    IMPORTANT - Math Formulas:
    When explaining mathematical concepts, equations, or formulas, you MUST use LaTeX notation:
    - Use $...$ for inline math (e.g., $E = mc^2$, $\\frac{a}{b}$, $\\sqrt{x}$)
    - Use $...$ for block/display math (centered, larger formulas)
    
    Examples:
    - Inline: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$
    - Block:
    $
    \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
    $
    
    Common LaTeX commands:
    - Fractions: \\frac{numerator}{denominator}
    - Square root: \\sqrt{x}, \\sqrt[n]{x}
    - Powers: x^2, x^{10}
    - Subscripts: x_1, x_{10}
    - Greek letters: \\alpha, \\beta, \\gamma, \\pi, \\theta
    - Summation: \\sum_{i=1}^{n}
    - Integral: \\int_a^b
    - Limits: \\lim_{x \\to 0}
    - Matrices: \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
    
    IMPORTANT - Visual Learning:
    When explaining complex structures, relationships, or processes, you SHOULD use diagrams.
    
    Use \`\`\`mermaid code blocks with these SIMPLE formats:
    
    1. FLOWCHART (for processes, steps, decisions):
    \`\`\`mermaid
    graph TD
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    C --> D[End]
    \`\`\`
    
    2. SEQUENCE (for interactions between entities):
    \`\`\`mermaid
    sequenceDiagram
    Client->>Server: Request
    Server->>Database: Query
    Database-->>Server: Data
    Server-->>Client: Response
    \`\`\`
    
    3. TREE/MINDMAP (for hierarchies):
    \`\`\`mermaid
    mindmap
    Root Topic
      Branch 1
        Leaf 1
        Leaf 2
      Branch 2
        Leaf 3
    \`\`\`
    
    CRITICAL RULES:
    - Use ONLY English text in labels
    - Keep labels SHORT (2-4 words max)
    - NO special characters: () [] {} quotes
    - Max 8-10 nodes per diagram
    - Use simple node IDs: A, B, C or Step1, Step2
    - Prefer flowchart (graph TD) when unsure
    
    GOOD examples:
    - A[Start Process]
    - B[Check Status]
    - C[Send Data]
    
    BAD examples (will fail):
    - A[print()函数]
    - B[User's Input]
    - C[Data [Array]]
  `;

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(m => ({ role: m.role, content: m.text }))
  ];

  return await callAI(config, messages);
};

export const summarizeNodeChat = async (
  title: string,
  chatHistory: ChatMessage[],
  config: AIConfig,
  language?: Language
): Promise<string> => {
  const lang = language || getLanguage();
  const transcript = chatHistory
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  // 语言指令
  const languageInstruction = lang === 'zh' 
    ? '请使用中文撰写总结。'
    : 'Please write the summary in English.';

  const prompt = `
    ${languageInstruction}
    
    Review the following tutoring session about "${title}":
    
    --- START TRANSCRIPT ---
    ${transcript}
    --- END TRANSCRIPT ---

    Create a concise summary (max 150 words) of what was taught and what the user now understands.
    This summary will be used as the "Prior Knowledge" context for the NEXT lesson.
  `;

  return await callAI(
    config,
    [{ role: "user", content: prompt }]
  );
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const generateNodeQuiz = async (
  title: string,
  chatHistory: ChatMessage[],
  config: AIConfig,
  language?: Language
): Promise<QuizQuestion[]> => {
  const lang = language || getLanguage();
  const transcript = chatHistory
    .map(m => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  // 语言指令
  const languageInstruction = lang === 'zh' 
    ? '请使用中文生成所有测验问题、选项和解释。'
    : 'Please generate all quiz questions, options, and explanations in English.';

  const prompt = `
    ${languageInstruction}
    
    Based on the following tutoring session about "${title}", generate 3-5 multiple choice quiz questions to test the user's understanding.

    --- START TRANSCRIPT ---
    ${transcript}
    --- END TRANSCRIPT ---

    Requirements:
    1. Each question should have 4 options
    2. Include the correct answer index (0-3)
    3. Provide a clear explanation for why the answer is correct
    4. Questions should cover key concepts from the session
    5. Make questions practical and test real understanding, not just memorization

    Return ONLY valid JSON with a "questions" array containing objects with:
    - "question" (string): The question text
    - "options" (string array): 4 possible answers
    - "correctAnswer" (number): Index of correct answer (0-3)
    - "explanation" (string): Why this answer is correct
  `;

  const responseText = await callAI(
    config,
    [
      { role: "system", content: "You are a helpful assistant that creates quiz questions and outputs JSON." },
      { role: "user", content: prompt }
    ],
    'json_object'
  );
  
  const result = cleanAndParseJson<{ questions: QuizQuestion[] }>(responseText);
  return result.questions || [];
};
