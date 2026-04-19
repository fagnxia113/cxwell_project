import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { emailService } from '../services/EmailService.js';
import { thirdPartyConfigService } from '../services/ThirdPartyService.js';
import { db } from '../database/connection.js';

const router = Router();

router.use(authenticate);

/**
 * 获取系统配置
 * GET /api/system-config
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const configs = await db.query<any>(
      `SELECT config_key, config_value, description, updated_at FROM system_configs ORDER BY config_key`
    );

    // 将配置项按组分类
    const grouped: Record<string, any> = {};
    for (const c of configs) {
      const group = c.config_key.split('_')[0]; // smtp, wecom, etc.
      if (!grouped[group]) grouped[group] = {};
      grouped[group][c.config_key] = {
        value: c.config_key === 'smtp_pass' ? (c.config_value ? '******' : '') : c.config_value,
        description: c.description,
        updated_at: c.updated_at
      };
    }

    res.json({ success: true, data: grouped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 保存 SMTP 配置
 * POST /api/system-config/smtp
 */
router.post('/smtp', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { host, port, user, pass, from } = req.body;

    await emailService.saveConfig({ host, port: parseInt(port), user, pass, from });

    res.json({ success: true, message: 'SMTP 配置已保存' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 测试 SMTP 连接
 * POST /api/system-config/smtp/test
 */
router.post('/smtp/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await emailService.testConnection();
    res.json({ success: result.success, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取 SMTP 配置（脱敏）
 * GET /api/system-config/smtp
 */
router.get('/smtp', requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = await emailService.getCurrentConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取企业微信配置
 */
router.get('/wechat-work', requireAdmin, async (req: Request, res: Response) => {
  try {
    const configs = await thirdPartyConfigService.getConfigs({ platform_type: 'wechat_work' });
    if (configs.length > 0) {
      const c = configs[0];
      res.json({
        success: true,
        data: {
          corpId: c.corp_id,
          agentId: c.agent_id,
          appSecret: '******', // 安全起见不回显
          checkinSecret: '******',
          syncEnabled: c.sync_enabled
        }
      });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 保存企业微信配置
 */
router.post('/wechat-work', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { corpId, agentId, appSecret, checkinSecret, syncEnabled } = req.body;
    const configs = await thirdPartyConfigService.getConfigs({ platform_type: 'wechat_work' });

    const params: any = {
      corp_id: corpId,
      agent_id: agentId,
      sync_enabled: syncEnabled,
      config: { checkin_secret: checkinSecret }
    };

    if (appSecret && appSecret !== '******') {
      params.app_secret = appSecret;
    }

    if (configs.length > 0) {
      await thirdPartyConfigService.updateConfig(configs[0].id, params);
    } else {
      await thirdPartyConfigService.createConfig({
        platform_type: 'wechat_work',
        name: '企业微信官方对接',
        ...params,
        app_secret: appSecret // 新建时必须有 secret
      });
    }

    res.json({ success: true, message: '企业微信配置已保存' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
