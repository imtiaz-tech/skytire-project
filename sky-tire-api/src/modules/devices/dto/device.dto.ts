import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
