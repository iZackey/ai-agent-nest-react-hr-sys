import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamingController } from './streaming.controller';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [ConfigModule, ToolsModule],
  controllers: [StreamingController],
})
export class StreamingModule {}
