import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test1234!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
