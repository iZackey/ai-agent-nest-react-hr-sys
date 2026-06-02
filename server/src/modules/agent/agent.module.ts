import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentService } from './agent.service';
import { SessionModule } from '../session/session.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [ConfigModule, SessionModule, ToolsModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
