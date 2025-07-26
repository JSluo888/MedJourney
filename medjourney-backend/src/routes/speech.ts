// 语音合成路由

import { Router } from 'express';
import { SpeechController } from '../controllers/speech';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();
const speechController = new SpeechController();

// 请求验证中间件
const validateSpeechSynthesis = [
  body('text').isString().isLength({ min: 1, max: 1000 }).withMessage('文本内容是必填项，长度在1-1000个字符'),
  body('voice_id').isString().optional(),
  body('model_id').isString().optional(),
  body('voice_settings').isObject().optional(),
  handleValidationErrors
];

// ElevenLabs 语音合成
router.post('/synthesize',
  authenticateToken,
  validateSpeechSynthesis,
  speechController.synthesizeSpeech.bind(speechController)
);

// 流式语音合成
router.post('/stream',
  authenticateToken,
  validateSpeechSynthesis,
  speechController.streamSpeech.bind(speechController)
);

// 获取可用声音列表
router.get('/voices',
  authenticateToken,
  speechController.getVoices.bind(speechController)
);

// 获取语音合成服务状态
router.get('/status',
  authenticateToken,
  speechController.getStatus.bind(speechController)
);

export default router;
