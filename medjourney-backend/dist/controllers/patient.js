"use strict";
// 患者管理控制器
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const logger_1 = require("../utils/logger");
const response_1 = __importDefault(require("../utils/response"));
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
class PatientController {
    databaseService = database_1.DatabaseServiceFactory.getInstance();
    // 创建患者
    createPatient = async (req, res, next) => {
        try {
            const patientData = req.body;
            logger_1.logger.info('创建患者请求', {
                requestId: req.requestId,
                email: patientData.email,
                name: patientData.name
            });
            // 检查邮箱是否已存在
            const existingPatients = await this.databaseService.listPatients({ email: patientData.email });
            if (existingPatients.data.length > 0) {
                throw new errors_1.ValidationError('该邮箱已被注册');
            }
            // 创建患者
            const patient = await this.databaseService.createPatient(patientData);
            // 生成访问令牌
            const token = (0, auth_1.generateToken)({
                patient_id: patient.id,
                email: patient.email,
                role: 'patient'
            });
            logger_1.logger.info('患者创建成功', {
                requestId: req.requestId,
                patientId: patient.id,
                email: patient.email
            });
            response_1.default.created(res, {
                patient,
                token
            }, '患者账户创建成功');
        }
        catch (error) {
            logger_1.logger.error('创建患者失败', error, {
                requestId: req.requestId,
                body: req.body
            });
            next(error);
        }
    };
    // 获取患者信息
    getPatient = async (req, res, next) => {
        try {
            const { patientId } = req.params;
            logger_1.logger.debug('获取患者信息', {
                requestId: req.requestId,
                patientId
            });
            const patient = await this.databaseService.getPatient(patientId);
            if (!patient) {
                throw new errors_1.NotFoundError('患者不存在');
            }
            response_1.default.success(res, patient);
        }
        catch (error) {
            logger_1.logger.error('获取患者信息失败', error, {
                requestId: req.requestId,
                patientId: req.params.patientId
            });
            next(error);
        }
    };
    // 更新患者信息
    updatePatient = async (req, res, next) => {
        try {
            const { patientId } = req.params;
            const updateData = req.body;
            logger_1.logger.info('更新患者信息', {
                requestId: req.requestId,
                patientId,
                updateFields: Object.keys(updateData)
            });
            // 检查患者是否存在
            const existingPatient = await this.databaseService.getPatient(patientId);
            if (!existingPatient) {
                throw new errors_1.NotFoundError('患者不存在');
            }
            // 如果更新邮箱，检查是否冲突
            if (updateData.email && updateData.email !== existingPatient.email) {
                const conflictPatients = await this.databaseService.listPatients({ email: updateData.email });
                if (conflictPatients.data.length > 0) {
                    throw new errors_1.ValidationError('该邮箱已被其他用户使用');
                }
            }
            const updatedPatient = await this.databaseService.updatePatient(patientId, updateData);
            logger_1.logger.info('患者信息更新成功', {
                requestId: req.requestId,
                patientId
            });
            response_1.default.success(res, updatedPatient, '患者信息更新成功');
        }
        catch (error) {
            logger_1.logger.error('更新患者信息失败', error, {
                requestId: req.requestId,
                patientId: req.params.patientId,
                body: req.body
            });
            next(error);
        }
    };
    // 删除患者
    deletePatient = async (req, res, next) => {
        try {
            const { patientId } = req.params;
            logger_1.logger.info('删除患者请求', {
                requestId: req.requestId,
                patientId
            });
            // 检查患者是否存在
            const existingPatient = await this.databaseService.getPatient(patientId);
            if (!existingPatient) {
                throw new errors_1.NotFoundError('患者不存在');
            }
            const success = await this.databaseService.deletePatient(patientId);
            if (!success) {
                throw new Error('删除患者失败');
            }
            logger_1.logger.info('患者删除成功', {
                requestId: req.requestId,
                patientId
            });
            response_1.default.noContent(res);
        }
        catch (error) {
            logger_1.logger.error('删除患者失败', error, {
                requestId: req.requestId,
                patientId: req.params.patientId
            });
            next(error);
        }
    };
    // 获取患者列表
    listPatients = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.q;
            const sortBy = req.query.sort || 'created_at';
            const sortOrder = req.query.order || 'desc';
            logger_1.logger.debug('获取患者列表', {
                requestId: req.requestId,
                page,
                limit,
                search,
                sortBy,
                sortOrder
            });
            // 构建查询选项
            const options = {
                page,
                limit,
                sortBy,
                sortOrder
            };
            if (search) {
                options.search = search;
            }
            const result = await this.databaseService.listPatients(options);
            response_1.default.paginated(res, result.data, {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            });
        }
        catch (error) {
            logger_1.logger.error('获取患者列表失败', error, {
                requestId: req.requestId,
                query: req.query
            });
            next(error);
        }
    };
    // 患者登录
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            logger_1.logger.info('患者登录请求', {
                requestId: req.requestId,
                email
            });
            // 查找患者
            const patients = await this.databaseService.listPatients({ email });
            if (patients.data.length === 0) {
                throw new errors_1.NotFoundError('用户不存在');
            }
            const patient = patients.data[0];
            // 在实际应用中，这里应该验证密码
            // 由于这是MVP，我们暂时跳过密码验证
            // 生成访问令牌
            const token = (0, auth_1.generateToken)({
                patient_id: patient.id,
                email: patient.email,
                role: 'patient'
            });
            logger_1.logger.info('患者登录成功', {
                requestId: req.requestId,
                patientId: patient.id,
                email: patient.email
            });
            response_1.default.success(res, {
                patient,
                token
            }, '登录成功');
        }
        catch (error) {
            logger_1.logger.error('患者登录失败', error, {
                requestId: req.requestId,
                email: req.body.email
            });
            next(error);
        }
    };
    // 获取当前患者信息
    getCurrentPatient = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.NotFoundError('用户未认证');
            }
            const patient = await this.databaseService.getPatient(req.user.patient_id);
            if (!patient) {
                throw new errors_1.NotFoundError('患者不存在');
            }
            response_1.default.success(res, patient);
        }
        catch (error) {
            logger_1.logger.error('获取当前患者信息失败', error, {
                requestId: req.requestId,
                patientId: req.user?.patient_id
            });
            next(error);
        }
    };
}
exports.default = new PatientController();
//# sourceMappingURL=patient.js.map