import { z } from 'zod';

export const knowledgePermissionSchema = z.object({
  target_type: z.enum(['department', 'position', 'user']),
  target_id: z.string().uuid()
});

export const knowledgeItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.enum(['SOP', 'Video', 'Document', 'Folder']),
  author: z.string(),
  date: z.string().or(z.date()),
  url: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  
  // Hierarchy fields
  is_folder: z.boolean().default(false),
  parent_id: z.string().uuid().optional().nullable(),
  
  // Permission fields
  creator_id: z.string().uuid().optional().nullable(),
  visibility_type: z.enum(['everyone', 'private', 'specified']).default('everyone'),
  permissions: z.array(knowledgePermissionSchema).optional(),

  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const createKnowledgeSchema = knowledgeItemSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true,
  author: true,
  date: true
}).extend({
  title: z.string().optional(),
  type: z.enum(['SOP', 'Video', 'Document', 'Folder']).default('Document'),
  author: z.string().optional(),
  date: z.string().or(z.date()).optional()
});

export const updateKnowledgeSchema = createKnowledgeSchema.partial();

export type KnowledgeItemDTO = z.infer<typeof knowledgeItemSchema>;
export type CreateKnowledgeDTO = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeDTO = z.infer<typeof updateKnowledgeSchema>;
