import { ApiProperty } from '@nestjs/swagger';
export class EmployeeDto {
  @ApiProperty() id: number; @ApiProperty() name: string; @ApiProperty() age: number;
  @ApiProperty() email: string; @ApiProperty() phone: string; @ApiProperty() department: string;
  @ApiProperty() position: string; @ApiProperty() hireDate: string; @ApiProperty() salaryLevel: string;
  @ApiProperty() status: string;
}
