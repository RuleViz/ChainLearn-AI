import { AIConfig, Expert } from "../types";
import { EXPERT_LIBRARY,getExpertForRouting } from "@/src/expert";
import {callOpenAICompatible} from './geminiService'

export class ExpertRouterService{
    private aiconfig: AIConfig;

    constructor(config: AIConfig){
        this.aiconfig = config;
    }

    private buildRoutingPrompt(topic: string): string {
        const experts = getExpertForRouting();

        return `
        根据用户输入的学习主题，从专家库中选择最合适的专家。

用户输入: "${topic}"

可选专家:
${experts.map(expert => `- ID: ${expert.id}, 名称: ${expert.name}, 介绍: ${expert.description}`).join('\n')}

请直接返回最合适的专家ID，不要其他内容。`
    }
    

    private async callOpenAI(prompt: string): Promise<string>{
        try{
            return await callOpenAICompatible(
                this.aiconfig,
                [
                    {
                        role: "system",
                        content: "你是专家路由系统，根据主题选择最合适的专家ID。请只返回专家ID。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                'text'
            );
        }catch(error){
            console.error("Expert routing API call failed:", error);
            throw error;
        }
    }

    //主路由方法 
    async routerToExpert(topic: string): Promise<string> {
        try{
            //1. 构建路由提示词
            const prompt = this.buildRoutingPrompt(topic);

            //2. 调用AI获取专家ID(使用现有的标准化调用)
            const expertId = await this.callOpenAI(prompt);

            //3.清理响应(去除可能的额外内容)
            const cleanedExpertId = expertId.trim().replace(/[^a-zA-Z0-9-_]/g, '');

            //4. 验证专家ID是否存在
            const expert = EXPERT_LIBRARY.find(e => e.id === cleanedExpertId);
            if(!expert) {
                console.warn(`AI返回的专家ID ${cleanedExpertId} 不存在，使用默认专家`);
                //降级到第一个专家
                return EXPERT_LIBRARY[0].id;
            }
            return cleanedExpertId;
        }catch(error){
            console.error("专家路由失败，使用默认专家:", error);
            //降级到第一个专家
            return EXPERT_LIBRARY[0].id;
        }
    }

    getExpertById(expertId: string): Expert | undefined{
        return EXPERT_LIBRARY.find(expert => expert.id === expertId);
    }

}