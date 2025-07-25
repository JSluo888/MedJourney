import { RAGService } from '../types/services';
declare class MockRAGService implements RAGService {
    private vectorStore;
    private retriever;
    private chain;
    private embeddings;
    private llm;
    private isInitialized;
    initialize(): Promise<void>;
    addDocuments(documents: Array<{
        content: string;
        metadata: Record<string, any>;
    }>): Promise<void>;
    query(question: string, options?: {
        topK?: number;
        threshold?: number;
        filter?: Record<string, any>;
    }): Promise<{
        answer: string;
        sources: Array<{
            content: string;
            metadata: Record<string, any>;
            score: number;
        }>;
        confidence: number;
    }>;
    private createRAGChain;
    private mockQuery;
    private calculateRelevanceScore;
    private generateMockAnswer;
    updateIndex(): Promise<void>;
    getStats(): any;
}
declare class RAGServiceFactory {
    private static instance;
    static create(): Promise<RAGService>;
    static getInstance(): RAGService | null;
    static reset(): void;
}
export { RAGServiceFactory, MockRAGService };
export default RAGServiceFactory;
//# sourceMappingURL=rag.d.ts.map