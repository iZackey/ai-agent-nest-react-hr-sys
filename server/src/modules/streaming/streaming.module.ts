import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamingController } from './streaming.controller';
import { ToolsModule } from '../tools/tools.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [ConfigModule, ToolsModule, SessionModule],
  controllers: [StreamingController],
})
export class StreamingModule {}
