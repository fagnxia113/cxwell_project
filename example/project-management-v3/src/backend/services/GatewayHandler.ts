import { db } from '../database/connection.js';
import { WorkflowNode, ProcessContext } from '../types/workflow.js';

export class GatewayHandler {
  async handleExclusiveGateway(gateway: WorkflowNode, context: ProcessContext): Promise<string[]> {
    const gatewayConfig = gateway.config?.gatewayConfig || gateway.gatewayConfig;
    if (!gatewayConfig) throw new Error('排他网关配置缺失');
    const { conditions, defaultFlow } = gatewayConfig;

    for (const condition of conditions) {
      if (await this.evaluateExpression(condition.expression, context)) {
        return [condition.targetNode];
      }
    }
    if (defaultFlow) return [defaultFlow];
    throw new Error('排他网关无有效路径');
  }

  async handleParallelGateway(gateway: WorkflowNode): Promise<string[]> {
    const gatewayConfig = gateway.config?.gatewayConfig || gateway.gatewayConfig;
    if (!gatewayConfig) throw new Error('并行网关配置缺失');
    return gatewayConfig.conditions.map(c => c.targetNode);
  }

  async handleInclusiveGateway(gateway: WorkflowNode, context: ProcessContext): Promise<string[]> {
    const gatewayConfig = gateway.config?.gatewayConfig || gateway.gatewayConfig;
    if (!gatewayConfig) throw new Error('包容网关配置缺失');
    const { conditions, defaultFlow } = gatewayConfig;
    const selectedNodes: string[] = [];

    for (const condition of conditions) {
      if (await this.evaluateExpression(condition.expression, context)) {
        selectedNodes.push(condition.targetNode);
      }
    }
    if (selectedNodes.length === 0 && defaultFlow) selectedNodes.push(defaultFlow);
    return selectedNodes;
  }

  async evaluateExpression(expression: string, context: ProcessContext): Promise<boolean> {
    try {
      let processedExpr = expression.replace(/(\$\{.*?\})\s+IN\s+\((.*?)\)/g, (_, val, list) => {
        return `\${[${list}].includes(${val.replace(/^\$\{/, '').replace(/\}$/, '')})}`;
      });

      const finalExpr = processedExpr.replace(/\$\{(.*?)\}/g, (_, inner) => inner.trim());

      const sandbox = {
        formData: context.formData || {},
        variables: context.variables || {},
        initiator: context.initiator || {},
        process: context.process || {},
        action: context.variables?.action || '',
        Math, Date, Number, String
      };

      const evaluator = new Function(...Object.keys(sandbox), `return Boolean(${finalExpr})`);
      return Boolean(evaluator(...Object.values(sandbox)));
    } catch (error) {
      console.error('表达式评估失败:', error, '表达式:', expression);
      return false;
    }
  }

  async findNextNodes(definition: any, currentNodeId: string): Promise<string[]> {
    const nextNodes: string[] = [];
    if (definition.node_config?.edges) {
      for (const edge of definition.node_config.edges) {
        if (edge.source === currentNodeId) nextNodes.push(edge.target);
      }
    }
    return nextNodes;
  }

  async getGatewayDirection(gateway: WorkflowNode, definition: any): Promise<'diverging' | 'converging'> {
    let inDegree = 0, outDegree = 0;
    if (definition.node_config?.edges) {
      for (const edge of definition.node_config.edges) {
        if (edge.target === gateway.id) inDegree++;
        if (edge.source === gateway.id) outDegree++;
      }
    }
    return (inDegree > 1 || outDegree === 0) ? 'converging' : 'diverging';
  }

  async isJoinGatewayComplete(gatewayId: string, instanceId: string): Promise<boolean> {
    const pending = await db.query<any>(
      `SELECT 1 FROM workflow_executions WHERE instance_id = ? AND parent_id IS NOT NULL AND status = 'active' AND node_id = ?`,
      [instanceId, gatewayId]
    );
    return pending.length === 0;
  }
}

export const gatewayHandler = new GatewayHandler();