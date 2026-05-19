import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotIn, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test1234!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password!: string;

  @ApiProperty({ example: 'Misha Student' })
  @IsString()
  @MinLength(2)
  displayName!: string;

  @ApiProperty({ enum: [Role.TEACHER, Role.STUDENT], example: Role.STUDENT })
  @IsEnum(Role)
  @IsNotIn([Role.ADMIN], { message: 'Admin accounts cannot be registered via API' })
  role!: Role;
}
