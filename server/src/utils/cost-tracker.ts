import { Logger } from '@nestjs/common';

export class CostTracker {
  private readonly logger = new Logger(CostTracker.name);
  private static readonly INPUT_COST = 0.003 / 1000;
  private static readonly OUTPUT_COST = 0.015 / 1000;

  estimateCost(promptTokens: number, completionTokens: number): number {
    return Math.round((promptTokens * CostTracker.INPUT_COST + completionTokens * CostTracker.OUTPUT_COST) * 10000) / 10000;
  }

  logCost(cost: number, query: string = '') {
    if (query) {
      this.logger.log(`API成本 - 查询: ${query.substring(0, 50)}..., 成本: ¥${cost.toFixed(4)}`);
    } else {
      this.logger.log(`API成本 - ¥${cost.toFixed(4)}`);
    }
  }
}
