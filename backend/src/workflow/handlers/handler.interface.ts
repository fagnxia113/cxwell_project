export interface IWorkflowHandler {
  handle(tx: any, businessId: string, instance: any, variables: any): Promise<void>;
}

export const WORKFLOW_HANDLER_TOKEN = 'WORKFLOW_HANDLER';
