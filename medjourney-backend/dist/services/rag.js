"use strict";
// RAG (Retrieval-Augmented Generation) 服务类 - 基于LangChain.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRAGService = exports.RAGServiceFactory = void 0;
const openai_1 = require("@langchain/openai");
const memory_1 = require("langchain/vectorstores/memory");
const text_splitter_1 = require("langchain/text_splitter");
const prompts_1 = require("@langchain/core/prompts");
const combine_documents_1 = require("langchain/chains/combine_documents");
const retrieval_1 = require("langchain/chains/retrieval");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
// Alzheimer's 知识库数据
const ALZHEIMER_KNOWLEDGE_BASE = [
    {
        content: `阿尔茨海默病（Alzheimer's Disease, AD）是一种进行性神经退行性疾病，是痴呆症最常见的类型。
    主要特征包括记忆力下降、认知功能障碍、行为改变和日常生活能力下降。
    疾病通常分为轻度、中度和重度三个阶段，每个阶段有不同的症状表现。`,
        metadata: { category: 'definition', source: 'medical_guide' }
    },
    {
        content: `阿尔茨海默病早期症状包括：
    1. 记忆力问题，特别是短期记忆
    2. 难以完成熟悉的任务
    3. 语言表达困难
    4. 时间和地点定向障碍
    5. 判断力下降
    6. 抽象思维困难
    7. 物品放置错误
    8. 情绪和行为变化
    9. 性格改变
    10. 主动性丧失`,
        metadata: { category: 'symptoms', source: 'clinical_guide' }
    },
    {
        content: `与阿尔茨海默病患者沟通的技巧：
    1. 保持耐心和理解
    2. 说话时保持眼神接触
    3. 使用简单、清晰的语言
    4. 一次只说一件事
    5. 给患者充足的时间回应
    6. 避免争论或纠正错误
    7. 使用熟悉的词汇和概念
    8. 保持积极的语调
    9. 使用非语言沟通，如触摸和拥抱
    10. 创造平静的环境`,
        metadata: { category: 'communication', source: 'caregiving_guide' }
    },
    {
        content: `家属护理阿尔茨海默病患者的建议：
    1. 建立日常例行程序
    2. 创建安全的家庭环境
    3. 鼓励患者参与力所能及的活动
    4. 保持社交联系
    5. 照顾好自己的身心健康
    6. 寻求专业支持和帮助
    7. 与医疗团队保持沟通
    8. 了解疾病的进展
    9. 制定长期护理计划
    10. 加入支持小组`,
        metadata: { category: 'caregiving', source: 'family_guide' }
    },
    {
        content: `阿尔茨海默病的认知刺激活动：
    1. 音乐疗法 - 播放熟悉的音乐
    2. 艺术活动 - 绘画、手工制作
    3. 回忆疗法 - 分享过去的照片和故事
    4. 简单游戏 - 拼图、卡片游戏
    5. 园艺活动 - 照料植物
    6. 烹饪活动 - 简单的食物准备
    7. 阅读活动 - 读书、看报
    8. 体力活动 - 散步、简单运动
    9. 社交活动 - 与朋友家人聊天
    10. 宠物疗法 - 与动物互动`,
        metadata: { category: 'activities', source: 'therapy_guide' }
    },
    {
        content: `阿尔茨海默病患者的营养建议：
    1. 保持均衡饮食
    2. 多吃富含omega-3的食物
    3. 增加抗氧化食物摄入
    4. 保持充足的水分摄入
    5. 限制糖分和加工食品
    6. 规律用餐时间
    7. 提供易于咀嚼和吞咽的食物
    8. 监控体重变化
    9. 考虑营养补充剂
    10. 咨询营养师的专业建议`,
        metadata: { category: 'nutrition', source: 'health_guide' }
    },
    {
        content: `应对阿尔茨海默病患者行为问题的策略：
    1. 识别触发因素
    2. 保持冷静和耐心
    3. 转移注意力
    4. 提供安全感
    5. 避免直接对抗
    6. 使用积极的强化
    7. 创造结构化的环境
    8. 确保充足的休息
    9. 寻求专业帮助
    10. 记录行为模式`,
        metadata: { category: 'behavior', source: 'behavioral_guide' }
    }
];
// 模拟RAG服务类
class MockRAGService {
    vectorStore = null;
    retriever = null;
    chain = null;
    embeddings = null;
    llm = null;
    isInitialized = false;
    async initialize() {
        try {
            logger_1.logger.info('初始化模拟RAG服务...');
            // 在实际环境中，这里会使用真实的OpenAI API
            // 模拟环境中，我们使用内存向量存储
            this.embeddings = new openai_1.OpenAIEmbeddings({
                openAIApiKey: config_1.config.ai.openai_api_key === 'mock-openai-key' ? 'mock' : config_1.config.ai.openai_api_key
            });
            this.llm = new openai_1.ChatOpenAI({
                openAIApiKey: config_1.config.ai.openai_api_key === 'mock-openai-key' ? 'mock' : config_1.config.ai.openai_api_key,
                modelName: config_1.config.ai.openai_model,
                temperature: config_1.config.ai.temperature
            });
            // 初始化向量存储（使用内存存储作为示例）
            this.vectorStore = new memory_1.MemoryVectorStore(this.embeddings);
            // 添加知识库文档
            await this.addDocuments(ALZHEIMER_KNOWLEDGE_BASE);
            // 创建检索器
            this.retriever = this.vectorStore.asRetriever({
                k: 3, // 返回最相关的3个文档
                searchType: 'similarity'
            });
            // 创建RAG链
            await this.createRAGChain();
            this.isInitialized = true;
            logger_1.logger.info('模拟RAG服务初始化完成');
        }
        catch (error) {
            logger_1.logger.error('RAG服务初始化失败', error);
            // 如果真实服务失败，使用完全模拟的实现
            this.isInitialized = true;
            logger_1.logger.warn('使用完全模拟的RAG实现');
        }
    }
    async addDocuments(documents) {
        try {
            // 文本分割
            const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            });
            const docs = [];
            for (const doc of documents) {
                const splitDocs = await textSplitter.createDocuments([doc.content], [doc.metadata]);
                docs.push(...splitDocs);
            }
            if (this.vectorStore) {
                await this.vectorStore.addDocuments(docs);
                logger_1.logger.info(`添加了 ${docs.length} 个文档到向量库`);
            }
            else {
                logger_1.logger.warn('向量存储未初始化，跳过文档添加');
            }
        }
        catch (error) {
            logger_1.logger.error('添加文档到向量库失败', error);
            throw new errors_1.AIServiceError('无法添加文档到知识库');
        }
    }
    async query(question, options) {
        if (!this.isInitialized) {
            throw new errors_1.AIServiceError('RAG服务未初始化');
        }
        try {
            logger_1.logger.debug('RAG查询开始', { question: question.substring(0, 100) });
            // 如果真实RAG链可用，使用它
            if (this.chain && this.vectorStore) {
                const result = await this.chain.invoke({
                    input: question
                });
                // 获取相关文档
                const relevantDocs = await this.retriever.getRelevantDocuments(question);
                return {
                    answer: result.answer,
                    sources: relevantDocs.map((doc, index) => ({
                        content: doc.pageContent,
                        metadata: doc.metadata,
                        score: 0.9 - (index * 0.1) // 模拟相关性分数
                    })),
                    confidence: 0.85 + Math.random() * 0.1
                };
            }
            else {
                // 使用模拟实现
                return this.mockQuery(question, options);
            }
        }
        catch (error) {
            logger_1.logger.error('RAG查询失败', error);
            // 回退到模拟查询
            return this.mockQuery(question, options);
        }
    }
    async createRAGChain() {
        try {
            if (!this.llm || !this.retriever) {
                throw new Error('LLM或检索器未初始化');
            }
            // 创建提示词模板
            const prompt = prompts_1.ChatPromptTemplate.fromTemplate(`
你是一个专业的阿尔茨海默病护理助手。请根据以下上下文信息回答用户的问题。
如果上下文中没有相关信息，请基于你的医学知识给出专业建议，但要说明这不是上下文提供的信息。

上下文信息:
{context}

用户问题: {input}

请提供温暖、专业且实用的回答：`);
            // 创建文档组合链
            const combineDocsChain = await (0, combine_documents_1.createStuffDocumentsChain)({
                llm: this.llm,
                prompt
            });
            // 创建检索链
            this.chain = await (0, retrieval_1.createRetrievalChain)({
                retriever: this.retriever,
                combineDocsChain
            });
            logger_1.logger.info('RAG链创建成功');
        }
        catch (error) {
            logger_1.logger.error('创建RAG链失败', error);
            throw error;
        }
    }
    mockQuery(question, options) {
        logger_1.logger.debug('使用模拟RAG查询', { question: question.substring(0, 100) });
        const questionLower = question.toLowerCase();
        const topK = options?.topK || 3;
        // 基于关键词匹配找到相关文档
        const relevantDocs = ALZHEIMER_KNOWLEDGE_BASE
            .map((doc, index) => ({
            ...doc,
            score: this.calculateRelevanceScore(questionLower, doc.content.toLowerCase())
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        // 生成答案
        const answer = this.generateMockAnswer(question, relevantDocs);
        return {
            answer,
            sources: relevantDocs.map(doc => ({
                content: doc.content,
                metadata: doc.metadata,
                score: doc.score
            })),
            confidence: Math.max(relevantDocs[0]?.score || 0.5, 0.5)
        };
    }
    calculateRelevanceScore(question, content) {
        const questionWords = question.split(/\s+/).filter(word => word.length > 1);
        let score = 0;
        questionWords.forEach(word => {
            if (content.includes(word)) {
                score += 0.1;
            }
        });
        // 特定关键词权重
        const keywordWeights = {
            '症状': 0.3,
            '护理': 0.3,
            '沟通': 0.3,
            '营养': 0.3,
            '行为': 0.3,
            '记忆': 0.3,
            '认知': 0.3,
            '家属': 0.3,
            '治疗': 0.3,
            '活动': 0.3
        };
        Object.entries(keywordWeights).forEach(([keyword, weight]) => {
            if (question.includes(keyword) && content.includes(keyword)) {
                score += weight;
            }
        });
        return Math.min(score, 1.0);
    }
    generateMockAnswer(question, relevantDocs) {
        const questionLower = question.toLowerCase();
        // 基于问题类型生成答案
        if (questionLower.includes('症状') || questionLower.includes('表现')) {
            return `根据医学资料，阿尔茨海默病的主要症状包括记忆力下降、认知功能障碍、语言表达困难等。在早期阶段，患者可能出现短期记忆问题，难以完成熟悉的任务。建议密切观察这些变化，并及时咨询专业医生。`;
        }
        if (questionLower.includes('护理') || questionLower.includes('照顾')) {
            return `护理阿尔茨海默病患者需要耐心和专业知识。建议建立规律的日常例行程序，创造安全的家庭环境，鼓励患者参与力所能及的活动。同时，家属也要注意照顾好自己的身心健康，寻求必要的专业支持。`;
        }
        if (questionLower.includes('沟通') || questionLower.includes('交流')) {
            return `与阿尔茨海默病患者沟通需要特殊技巧。建议保持耐心和理解，使用简单清晰的语言，一次只说一件事，给患者充足的时间回应。避免争论或纠正错误，保持积极的语调，使用非语言沟通如触摸和拥抱。`;
        }
        if (questionLower.includes('营养') || questionLower.includes('饮食')) {
            return `阿尔茨海默病患者的营养管理很重要。建议保持均衡饮食，多吃富含omega-3的食物，增加抗氧化食物摄入，保持充足的水分摄入。规律用餐时间，提供易于咀嚼和吞咽的食物，必要时咨询营养师。`;
        }
        if (questionLower.includes('活动') || questionLower.includes('锻炼')) {
            return `认知刺激活动对阿尔茨海默病患者很有益。可以尝试音乐疗法、艺术活动、回忆疗法、简单游戏、园艺活动等。这些活动有助于延缓认知功能下降，提高生活质量。建议选择患者感兴趣且能力范围内的活动。`;
        }
        // 默认回答
        return `谢谢您的问题。阿尔茨海默病是一个复杂的疾病，每个患者的情况都可能不同。建议您与专业的医疗团队保持密切沟通，制定个性化的护理计划。如果您有具体的担忧，请及时咨询医生。我在这里会尽力为您提供支持和信息。`;
    }
    async updateIndex() {
        logger_1.logger.info('更新RAG索引（模拟）');
        // 在真实实现中，这里会重新构建向量索引
    }
    // 获取统计信息
    getStats() {
        return {
            isInitialized: this.isInitialized,
            documentsCount: ALZHEIMER_KNOWLEDGE_BASE.length,
            categories: Array.from(new Set(ALZHEIMER_KNOWLEDGE_BASE.map(doc => doc.metadata.category)))
        };
    }
}
exports.MockRAGService = MockRAGService;
// RAG服务工厂
class RAGServiceFactory {
    static instance = null;
    static async create() {
        if (RAGServiceFactory.instance) {
            return RAGServiceFactory.instance;
        }
        const service = new MockRAGService();
        await service.initialize();
        RAGServiceFactory.instance = service;
        logger_1.logger.info('RAG服务创建完成');
        return service;
    }
    static getInstance() {
        return RAGServiceFactory.instance;
    }
    static reset() {
        RAGServiceFactory.instance = null;
    }
}
exports.RAGServiceFactory = RAGServiceFactory;
exports.default = RAGServiceFactory;
//# sourceMappingURL=rag.js.map