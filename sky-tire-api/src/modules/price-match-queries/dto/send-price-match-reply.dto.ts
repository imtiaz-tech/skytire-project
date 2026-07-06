import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendPriceMatchReplyDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsEmail()
  to?: string;
}
