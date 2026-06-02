import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FORBIDDEN_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', ';', '--'];

export class QueryRequest {
  @ApiProperty({ description: '用户查询问题', example: '查询技术部的员工' })
  @IsString() @MinLength(1) @MaxLength(500)
  question: string;

  @ApiPropertyOptional({ description: '会话 ID' })
  @IsOptional() @IsString() @MinLength(32) @MaxLength(36)
  sessionId?: string;

  validateQuestion() {
    if (!this.question || !this.question.trim()) throw new Error('问题不能为空');
    const upper = this.question.toUpperCase();
    for (const kw of FORBIDDEN_KEYWORDS) {
      if (upper.includes(kw)) throw new Error('问题包含禁用关键字');
    }
    this.question = this.question.trim();
  }
}
