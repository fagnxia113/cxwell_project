export class UpdateKnowledgeDto {
  title?: string;
  content?: string;
  fileUrl?: string;
  visibilityType?: string;
  permissions?: Array<{
    targetType: string;
    targetId: string;
    permission?: string;
  }>;
}
