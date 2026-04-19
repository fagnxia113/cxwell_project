import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { KnowledgeUseCase } from '../application/KnowledgeUseCase.js';
import { validateBody } from '../../../middleware/zodValidator.js';
import { createKnowledgeSchema, updateKnowledgeSchema } from '../domain/KnowledgeDTO.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requirePermission } from '../../../middleware/authMiddleware.js';

const knowledgeUploadDir = process.env.KNOWLEDGE_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'knowledge-assets');
if (!fs.existsSync(knowledgeUploadDir)) {
  fs.mkdirSync(knowledgeUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, knowledgeUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } 
});

function getKnowledgeUseCase(): KnowledgeUseCase {
  return container.resolve(KnowledgeUseCase);
}

const router = Router();

// 批量上传接口
router.post('/upload', authenticate, requirePermission('knowledge:manage'), upload.array('files'), async (req: any, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const { type, project_id, parent_id, customNames, visibility_type, permissions } = req.body;
    const author = req.user?.name || 'System';
    const creator_id = req.user?.id;
    const namesArray = Array.isArray(customNames) ? customNames : [customNames];
    
    // Parse permissions if stringified (often happens with multipart/form-data)
    let parsedPermissions = [];
    if (permissions) {
      try {
        parsedPermissions = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
      } catch (e) { console.error('Failed to parse permissions:', e); }
    }

    const results = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const url = `/uploads/knowledge-assets/${file.filename}`;
      let originalName = namesArray[i] || file.originalname;
      try {
        originalName = decodeURIComponent(originalName);
      } catch {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8');
      }
      const item = await getKnowledgeUseCase().createKnowledge({
        title: originalName,
        type: type || 'Document',
        author,
        date: new Date(),
        url,
        project_id: project_id && project_id !== 'null' ? project_id : null,
        parent_id: parent_id && parent_id !== 'null' && parent_id !== '' ? parent_id : null,
        is_folder: false,
        creator_id,
        visibility_type: visibility_type || 'everyone',
        permissions: parsedPermissions
      });
      results.push(item);
    }

    res.status(201).json({ success: true, data: results });
  } catch (error: any) {
    console.error('[Knowledge Batch Upload Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { type, search, parent_id, all } = req.query;
    const user = (req as any).user;
    
    const userContext = {
      userId: user.id,
      departmentId: user.departmentId,
      positionId: user.positionId,
      role: user.role
    };

    if (type === 'Folder' && all === 'true') {
      const items = await getKnowledgeUseCase().getAllFolders(userContext);
      res.json({ success: true, data: items });
      return;
    }
    
    const pid = parent_id === 'root' ? null : (typeof parent_id === 'string' ? parent_id : undefined);
    
    const items = await getKnowledgeUseCase().getAllKnowledge({
      type: typeof type === 'string' ? type : undefined,
      search: typeof search === 'string' ? search : undefined,
      parent_id: pid
    }, userContext);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/is-empty', authenticate, async (req: Request, res: Response) => {
  try {
    const isEmpty = await getKnowledgeUseCase().isFolderEmpty(req.params.id as string);
    res.json({ success: true, data: { isEmpty } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await getKnowledgeUseCase().getKnowledgeById(req.params.id as string);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    
    // Simple check for detail view as well
    const user = (req as any).user;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isCreator = item.creator_id === user.id;
    const isEveryone = item.visibility_type === 'everyone';
    
    const hasExplicitPerm = item.permissions?.some((p: any) => 
      (p.target_type === 'user' && p.target_id === user.id) ||
      (p.target_type === 'department' && p.target_id === user.departmentId) ||
      (p.target_type === 'position' && p.target_id === user.positionId)
    );

    if (!isAdmin && !isCreator && !isEveryone && !hasExplicitPerm) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建文件夹或记录
router.post('/', authenticate, requirePermission('knowledge:manage'), validateBody(createKnowledgeSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const item = await getKnowledgeUseCase().createKnowledge({
      ...req.body,
      author: user?.name || 'System',
      creator_id: user?.id
    });
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, requirePermission('knowledge:manage'), validateBody(updateKnowledgeSchema), async (req: Request, res: Response) => {
  try {
    const item = await getKnowledgeUseCase().updateKnowledge(req.params.id as string, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticate, requirePermission('knowledge:manage'), async (req: Request, res: Response) => {
  try {
    await getKnowledgeUseCase().deleteKnowledge(req.params.id as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
