import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';
import { QueryToolsService } from './query-tools.service';
import { EmployeeToolsService } from './employee-tools.service';
import { UtilityToolsService } from './utility-tools.service';
import { AnalysisToolsService } from './analysis-tools.service';
import { ToolRegistryService } from './tool-registry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeProject, EmployeeFeedback]),
  ],
  providers: [
    QueryToolsService,
    EmployeeToolsService,
    UtilityToolsService,
    AnalysisToolsService,
    ToolRegistryService,
  ],
  exports: [ToolRegistryService, AnalysisToolsService, QueryToolsService],
})
export class ToolsModule {}
