import { ApiProperty } from '@nestjs/swagger';
export class ResponseData<T = any> {
  @ApiProperty({ description: '状态码，0 表示成功' })
  code: number;
  @ApiProperty({ description: '响应数据' })
  data: T;
  @ApiProperty({ description: '响应消息' })
  msg: string;
  constructor(code: number, data: T, msg: string = 'success') {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }
}
