import express from 'express';
declare class MedJourneyServer {
    private app;
    private server;
    constructor();
    initialize(): Promise<void>;
    private initializeServices;
    private configureMiddleware;
    private configureRoutes;
    private configureErrorHandling;
    start(): Promise<void>;
    private gracefulShutdown;
    getApp(): express.Application;
}
export default MedJourneyServer;
export { MedJourneyServer };
//# sourceMappingURL=server.d.ts.map