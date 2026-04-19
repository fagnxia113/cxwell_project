import 'reflect-metadata'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { db } from './database/connection.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { performanceMiddleware } from './middleware/performanceMiddleware.js'
import { logger } from './utils/logger.js'
import apiRouter from './routes/index.js'
import { initUsersTable } from './routes/auth.js'
import { schedulerService } from './services/SchedulerService.js'
import { workflowEventListener } from './services/WorkflowEventListener.js'
import { EventScheduler } from './core/events/EventScheduler.js'
import { initializeModules } from './modules/index.js'
import { WorkflowTemplatesService } from './services/WorkflowTemplates.js'
import { definitionService } from './services/DefinitionService.js'
import { metadataService } from './services/MetadataService.js'
import { initializeContainer } from './core/di/container.js'
import { formTemplateService } from './services/FormTemplateService.js'
import { equipmentFormTemplates } from './modules/equipment/workflow/EquipmentFormTemplates.js'
import cron from 'node-cron'
import { attendanceService } from './services/AttendanceService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.SERVER_PORT || process.env.PORT || 8080

const getCorsOrigins = (): string[] => {
  const corsOriginsEnv = process.env.CORS_ORIGINS
  if (corsOriginsEnv) {
    return corsOriginsEnv.split(',').map(origin => origin.trim())
  }
  return [
    'http://localhost:3000',
    'http://localhost:5173'
  ]
}

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getCorsOrigins()
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(performanceMiddleware)

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  })
  next()
})

app.use('/api', apiRouter)

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
app.use('/uploads', express.static(uploadsDir))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function initializeDefaultWorkflowDefinitions() {
  try {
    logger.info('初始化默认流程定义...')
    
    const templates = WorkflowTemplatesService.getAllTemplates()
    let createdCount = 0

    for (const template of templates) {
      const existingDefinition = await definitionService.getDefinitionByKey(template.id)
      
      if (!existingDefinition) {
        const definition = await definitionService.createDefinition({
          key: template.id,
          name: template.name,
          category: template.category,
          entity_type: template.entityType,
          nodes: template.definition.nodes,
          edges: template.definition.edges,
          form_schema: template.formSchema,
        })
        
        logger.info(`创建流程定义: ${template.name} (版本: ${definition.version || 1})`)
        createdCount++
      } else {
        // 自动同步已知模板的改动到数据库 (V3 增强逻辑)
        await definitionService.updateDefinition(existingDefinition.id, {
          name: template.name,
          category: template.category,
          entity_type: template.entityType,
          node_config: {
            nodes: template.definition.nodes,
            edges: template.definition.edges
          },
          form_schema: template.formSchema,
        })
        logger.info(`同步流程定义到数据库: ${template.name}`)
      }
    }
    
    logger.info(`流程定义初始化完成，共创建 ${createdCount} 个流程定义`)
  } catch (error: any) {
    logger.error('初始化流程定义失败', error)
  }
}

async function initializeDefaultFormTemplates() {
  try {
    logger.info('开始同步设备相关表单模板...');
    await formTemplateService.initializeDefaultFormTemplates(equipmentFormTemplates);
    logger.info('表单模板同步完成');
  } catch (error: any) {
    logger.error('同步表单模板失败:', error);
  }
}

async function startServer() {
  try {
    await db.connect()
    
    initializeContainer()
    await initializeModules()

    await metadataService.load()
    
    await initUsersTable()
    
    await initializeDefaultWorkflowDefinitions()
    await initializeDefaultFormTemplates()
    
    await schedulerService.start()
    
    const { container } = await import('./core/di/container.js');
    const { EventScheduler } = await import('./core/events/EventScheduler.js');
    const eventProcessor = container.resolve('EventProcessor');
    const eventScheduler = new EventScheduler(eventProcessor as any);
    eventScheduler.start(5000);
    logger.info('EventScheduler started with interval 5000ms');
    
    workflowEventListener.setupListeners()
    
    // 定时任务：每日 18:00 催报日报
    cron.schedule('0 18 * * *', async () => {
      logger.info('开始执行每日 18:00 日报自动催报任务...')
      try {
        const count = await attendanceService.sendDailyReportReminders()
        logger.info(`日报催报任务执行完成，共发送 ${count} 条提醒`)
      } catch (error: any) {
        logger.error('日报催报任务执行失败:', error)
      }
    });

    // 404 和错误处理中间件必须在所有路由之后
    app.use(notFoundHandler)
    app.use(errorHandler)
    
    const server = app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`)
    })
    
    const gracefulShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`)
      
      await schedulerService.stop()
      
      server.close(async () => {
        logger.info('服务器已关闭')
        try {
          await db.disconnect()
          logger.info('数据库连接已断开')
        } catch (err: any) {
          logger.error('断开数据库连接失败', err)
        }
        process.exit(0)
      })
      
      setTimeout(() => {
        logger.error('强制关闭服务器')
        process.exit(1)
      }, 10000)
    }
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
  } catch (error: any) {
    logger.error('启动服务器失败', error)
    process.exit(1)
  }
}

startServer()

export default app
