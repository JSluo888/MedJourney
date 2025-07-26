import { EventEmitter } from 'events';
import { TENFrameworkService } from '../types/services';
declare class TENFrameworkServiceImpl extends EventEmitter implements TENFrameworkService {
    private ws;
    private isConnected;
    private endpoint;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    private heartbeatInterval;
    private activeSessions;
    private stepfunService;
    private elevenLabsService;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    sendMessage(message: {
        type: 'text' | 'audio' | 'image';
        content: string | ArrayBuffer;
        sessionId: string;
    }): Promise<{
        messageId: string;
        status: 'sent' | 'delivered' | 'failed';
    }>;
    onMessage(callback: (message: {
        messageId: string;
        type: 'text' | 'audio';
        content: string;
        confidence: number;
        sessionId: string;
    }) => void): void;
    onStatusChange(callback: (status: {
        sessionId: string;
        status: 'idle' | 'listening' | 'processing' | 'speaking';
    }) => void): void;
    createSession(options: {
        patientId: string;
        agoraChannelName: string;
        agoraUid: string;
    }): Promise<{
        sessionId: string;
        agoraToken: string;
    }>;
    private processMessage;
    private updateSessionStatus;
    private handleMessage;
    private handleReconnect;
    private sendInitMessage;
    private startHeartbeat;
    private stopHeartbeat;
    private sendPong;
    private audioToText;
    private imageToText;
    private generateMessageId;
    private generateSessionId;
    private generateAgoraToken;
    healthCheck(): Promise<boolean>;
    getStats(): any;
    getActiveSessions(): string[];
    closeSession(sessionId: string): Promise<void>;
}
declare class TENFrameworkServiceFactory {
    private static instance;
    static create(): TENFrameworkService;
    static getInstance(): TENFrameworkService | null;
    static reset(): void;
}
export { TENFrameworkServiceFactory, TENFrameworkServiceImpl };
export default TENFrameworkServiceFactory;
//# sourceMappingURL=ten-framework.d.ts.map