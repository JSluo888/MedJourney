"use strict";
// 语音合成路由
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const speech_1 = require("../controllers/speech");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const speechController = new speech_1.SpeechController();
// 请求验证中间件
const validateSpeechSynthesis = [
    (0, express_validator_1.body)('text').isString().isLength({ min: 1, max: 1000 }).withMessage('文本内容是必填项，长度在1-1000个字符'),
    (0, express_validator_1.body)('voice_id').isString().optional(),
    (0, express_validator_1.body)('model_id').isString().optional(),
    (0, express_validator_1.body)('voice_settings').isObject().optional(),
    validation_1.handleValidationErrors
];
// ElevenLabs 语音合成
router.post('/synthesize', auth_1.authenticateToken, validateSpeechSynthesis, speechController.synthesizeSpeech.bind(speechController));
// 流式语音合成
router.post('/stream', auth_1.authenticateToken, validateSpeechSynthesis, speechController.streamSpeech.bind(speechController));
// 获取可用声音列表
router.get('/voices', auth_1.authenticateToken, speechController.getVoices.bind(speechController));
// 获取语音合成服务状态
router.get('/status', auth_1.authenticateToken, speechController.getStatus.bind(speechController));
exports.default = router;
//# sourceMappingURL=speech.js.map