import { Server as HttpServer } from 'http';
declare class WebSocketServerService {
    private wss;
    private clients;
    private stepfunService;
    private elevenLabsService;
    private cleanupInterval;
    constructor();
    initialize(httpServer: HttpServer): void;
    private handleConnection;
    private handleMessage;
    private handleInitialize;
    private handleTextMessage;
    private handleStartVoiceRecording;
    private handleStopVoiceRecording;
    private handleImageUpload;
    private sendMessage;
    private sendError;
    private cleanupInactiveClients;
    private generateClientId;
    getStats(): any;
    close(): void;
}
export default WebSocketServerService;
export { WebSocketServerService };
//# sourceMappingURL=websocket-server.d.ts.map