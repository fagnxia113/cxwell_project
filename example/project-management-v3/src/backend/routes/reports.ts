import express from 'express'
import multer from 'multer'
import path from 'path'
import { db } from '../database/connection.js'

const router = express.Router()

// 修复 multer 中文文件名乱码的工具函数
const decodeFilename = (name: string) => {
  try {
    return Buffer.from(name, 'latin1').toString('utf8')
  } catch (e) {
    return name
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.REPORTS_UPLOAD_DIR || process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'reports')
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const originalName = decodeFilename(file.originalname)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(originalName))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
})

// 文件上传
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { report_id, project_id } = req.body
    console.log('收到上传请求:', { file: req.file?.originalname, report_id, project_id })

    if (!req.file || !report_id) {
      console.error('缺少文件或报告ID:', { hasFile: !!req.file, report_id })
      res.status(400).json({ error: '缺少文件或报告ID' })
      return
    }

    const fileUrl = `/uploads/reports/${req.file.filename}`
    const submitDate = new Date().toISOString().split('T')[0]

    console.log('正在查找报告信息:', report_id)
    const originalName = decodeFilename(req.file.originalname)
    const attId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    await db.execute(
      'INSERT INTO project_report_attachments (id, report_id, file_url, file_name) VALUES (?, ?, ?, ?)',
      [attId, report_id, fileUrl, originalName]
    )

    // 更新主表状态
    await db.execute(
      `UPDATE project_reports SET status = 'submitted', updated_at = NOW() WHERE id = ?`,
      [report_id]
    )

    console.log('上传成功')
    res.json({ success: true, file_url: fileUrl, file_name: originalName, id: attId })
  } catch (error: any) {
    console.error('上传过程中发生内部错误:', error)
    res.status(500).json({ error: error.message || '服务器内部错误' })
  }
})

// 获取项目的所有报告
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query
    const whereClause = project_id ? 'WHERE project_id = ?' : 'WHERE 1=1'
    const params = project_id ? [project_id] : []

    const reports = await db.query(
      `SELECT * FROM project_reports ${whereClause} ORDER BY created_at DESC`,
      params
    ) as any[]

    if (reports.length > 0) {
      const reportIds = reports.map(r => r.id)
      const attachments = await db.query(
        `SELECT * FROM project_report_attachments WHERE report_id IN (${reportIds.map(() => '?').join(',')})`,
        reportIds
      ) as any[]

      // 将附件按 report_id 分组
      reports.forEach(report => {
        report.attachments = attachments.filter(a => a.report_id === report.id)
      })
    }

    res.json(reports)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// 创建报告
router.post('/', async (req, res) => {
  try {
    const { project_id, milestone_id, name, copies = 1, remarks, status = 'pending' } = req.body

    if (!project_id || !milestone_id || !name) {
      res.status(400).json({ error: '缺少必填字段' })
      return
    }

    const id = `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.execute(
      `INSERT INTO project_reports (id, project_id, milestone_id, name, copies, status, remarks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, project_id, milestone_id, name, copies, status, remarks || null]
    )
    res.json({ id, project_id, milestone_id, name, copies, status, remarks, submit_copies: 0 })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// 更新报告
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, status, submit_copies, submit_date, remarks, copies, file_url, file_name } = req.body

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (copies !== undefined) {
      updates.push('copies = ?')
      params.push(copies)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (submit_copies !== undefined) {
      updates.push('submit_copies = ?')
      params.push(submit_copies)
    }
    if (submit_date !== undefined) {
      updates.push('submit_date = ?')
      params.push(submit_date)
    }
    if (file_url !== undefined) {
      updates.push('file_url = ?')
      params.push(file_url)
    }
    if (file_name !== undefined) {
      updates.push('file_name = ?')
      params.push(file_name)
    }
    if (remarks !== undefined) {
      updates.push('remarks = ?')
      params.push(remarks)
    }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' })
      return
    }

    updates.push('updated_at = NOW()')
    params.push(id)

    await db.execute(
      `UPDATE project_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    res.json({ id, ...req.body })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// 删除附件
router.delete('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM project_report_attachments WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// 删除报告
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM project_reports WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
