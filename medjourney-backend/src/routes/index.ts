// 主路由文件

import { Router } from 'express';
import patientRoutes from './patient';
import sessionRoutes from './session';
import familyRoutes from './family';
import doctorRoutes from './doctor';
import uploadRoutes from './upload';
import reportsRoutes from './reports';
import { healthCheck } from '../middleware';

const router = Router();

// 健康检查
router.use(healthCheck);

// API版本前缀
const API_VERSION = '/v1';

// 注册路由
router.use(`${API_VERSION}/patients`, patientRoutes);
router.use(`${API_VERSION}/sessions`, sessionRoutes);
router.use(`${API_VERSION}/family`, familyRoutes);
router.use(`${API_VERSION}/doctor`, doctorRoutes);
router.use(`${API_VERSION}/upload`, uploadRoutes);
router.use(`${API_VERSION}/reports`, reportsRoutes);

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
      reports: `${API_VERSION}/reports`,
      health: '/health'
    },
    documentation: 'https://docs.medjourney.ai',
    timestamp: new Date().toISOString()
  });
});

export default router;