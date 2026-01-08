import { AIConfig, Expert } from "../types";
import { getEnabledExperts, getExpertForRouting, getExpertById } from "../src/expert";
import { callOpenAICompatible } from './geminiService';

export class ExpertRouterService {
  private aiconfig: AIConfig;

  constructor(config: AIConfig) {
    this.aiconfig = config;
  }

  // 更新配置
  updateConfig(config: AIConfig): void {
    this.aiconfig = config;
  }

  private buildRoutingPrompt(topic: string): string {
    const experts = getExpertForRouting();

    return `你是一个专家路由系统。根据用户的学习主题，选择最匹配的专家。

用户学习主题: "${topic}"

可选专家列表:
${experts.map(expert => `- ID: ${expert.id}
  名称: ${expert.name}
  擅长领域: ${expert.description}`).join('\n\n')}

选择规则:
1. 根据主题关键词匹配专家的擅长领域
2. 如果主题明确属于某个专家的领域，选择该专家
3. 只有当主题不属于任何专家的明确领域时，才选择通用专家 (prof-general)
4. 物理相关选 dr-physics，数学相关选 prof-math，编程相关选 prof-code

请只返回最匹配的专家ID，不要任何其他内容。`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    try {
      return await callOpenAICompatible(
        this.aiconfig,
        [
          {
            role: "system",
            content: "你是专家路由系统。你的任务是根据学习主题选择最匹配的专家ID。你必须且只能返回一个专家ID（如 dr-physics、prof-math 等），不要返回任何其他文字、解释或标点符号。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        'text'
      );
    } catch (error) {
      console.error("Expert routing API call failed:", error);
      throw error;
    }
  }

  // 主路由方法
  async routerToExpert(topic: string): Promise<string> {
    const enabledExperts = getEnabledExperts();
    
    if (enabledExperts.length === 0) {
      console.warn("没有启用的专家，使用默认专家");
      return 'prof-general';
    }

    try {
      // 1. 构建路由提示词
      const prompt = this.buildRoutingPrompt(topic);
      console.log("[Expert Router] 路由主题:", topic);

      // 2. 调用AI获取专家ID
      const expertId = await this.callOpenAI(prompt);
      console.log("[Expert Router] AI 返回原始响应:", expertId);

      // 3. 清理响应 - 提取专家ID
      const cleanedExpertId = expertId.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      console.log("[Expert Router] 清理后的专家ID:", cleanedExpertId);

      // 4. 验证专家ID是否存在且启用
      const expert = enabledExperts.find(e => e.id === cleanedExpertId);
      if (!expert) {
        console.warn(`[Expert Router] 专家ID "${cleanedExpertId}" 不存在或未启用，使用默认专家`);
        return enabledExperts[0].id;
      }
      
      console.log("[Expert Router] 成功匹配专家:", expert.name);
      return cleanedExpertId;
    } catch (error) {
      console.error("[Expert Router] 路由失败，使用默认专家:", error);
      return enabledExperts[0].id;
    }
  }

  getExpertById(expertId: string): Expert | undefined {
    return getExpertById(expertId);
  }
}
