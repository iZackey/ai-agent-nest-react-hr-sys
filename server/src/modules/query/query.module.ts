import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { AgentModule } from '../agent/agent.module';
import { ToolsModule } from '../tools/tools.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [AgentModule, ToolsModule, SessionModule],
  controllers: [QueryController],
})
export class QueryModule {}
