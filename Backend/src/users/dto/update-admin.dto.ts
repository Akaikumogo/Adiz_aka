import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
