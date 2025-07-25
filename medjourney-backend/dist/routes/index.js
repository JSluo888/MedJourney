"use strict";
// 主路由文件
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_1 = __importDefault(require("./patient"));
const session_1 = __importDefault(require("./session"));
const family_1 = __importDefault(require("./family"));
const doctor_1 = __importDefault(require("./doctor"));
const upload_1 = __importDefault(require("./upload"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// 健康检查
router.use(middleware_1.healthCheck);
// API版本前缀
const API_VERSION = '/v1';
// 注册路由
router.use(`${API_VERSION}/patients`, patient_1.default);
router.use(`${API_VERSION}/sessions`, session_1.default);
router.use(`${API_VERSION}/family`, family_1.default);
router.use(`${API_VERSION}/doctor`, doctor_1.default);
router.use(`${API_VERSION}/upload`, upload_1.default);
// API根路径信息
router.get(API_VERSION, (req, res) => {
    res.json({
        name: 'MedJourney API',
        version: '1.0.0',
        description: 'AI陪伴式阿尔茨海默病护理平台API',
        endpoints: {
            patients: `${API_VERSION}/patients`,
            sessions: `${API_VERSION}/sessions`,
            family: `${API_VERSION}/family`,
            doctor: `${API_VERSION}/doctor`,
            upload: `${API_VERSION}/upload`,
            health: '/health'
        },
        documentation: 'https://docs.medjourney.ai',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map