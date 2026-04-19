export class CreateKnowledgeDto {
  title: string;
  type?: string;
  content?: string;
  fileUrl?: string;
  isFolder?: boolean;
  parentId?: string;
  visibilityType?: string;
  permissions?: Array<{
    targetType: string;
    targetId: string;
    permission?: string;
  }>;
}
