import { IsArray, IsNumber, IsObject, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluateRequest {
  @ApiProperty({ description: '员工 ID 列表' }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsNumber({}, { each: true })
  employeeIds: number[];
}

export class RankRequest {
  @ApiProperty({ description: '候选员工 ID 列表' }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsNumber({}, { each: true })
  employeeIds: number[];
  @ApiProperty({ description: '评分指标和权重' }) @IsObject()
  metrics: Record<string, number>;
  validateMetrics() {
    const total = Object.values(this.metrics).reduce((sum, v) => sum + v, 0);
    if (total < 0.99 || total > 1.01) throw new Error('权重之和必须为 1.0');
  }
}
