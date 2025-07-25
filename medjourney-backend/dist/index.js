"use strict";
// 应用入口文件
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const logger_1 = require("./utils/logger");
// 创建服务器实例
async function startServer() {
    try {
        logger_1.logger.info('🚀 MedJourney MVP 后端服务启动中...');
        const server = new server_1.default();
        await server.start();
        logger_1.logger.info('✓ MedJourney MVP 后端服务已成功启动');
    }
    catch (error) {
        logger_1.logger.error('服务器启动失败', error);
        process.exit(1);
    }
}
// 启动服务器
startServer();
//# sourceMappingURL=index.js.map