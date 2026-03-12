// API response DTO
export class ApiResponseDto<T, M = unknown> {
    statusCode: number;
    code?: string;
    status: boolean;
    message: string;
    data?: T | null;
    meta?: M;
}