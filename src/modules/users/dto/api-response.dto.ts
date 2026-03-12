import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// API response DTO
export class ApiResponseDto<T, M = unknown> {
    @ApiProperty({ example: 200 })
    statusCode: number;

    @ApiPropertyOptional({ example: 'SUCCESS' })
    code?: string;

    @ApiProperty({ example: true })
    status: boolean;

    @ApiProperty({ example: 'Request successful' })
    message: string;

    @ApiHideProperty()
    data?: T | null;

    @ApiHideProperty()
    meta?: M;
}