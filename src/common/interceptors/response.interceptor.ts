import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    HttpStatus,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (
                    data &&
                    typeof data === 'object' &&
                    'statusCode' in data &&
                    'status' in data &&
                    'code' in data &&
                    'message' in data
                ) {
                    const response = context.switchToHttp().getResponse();
                    response.status((data as { statusCode: number }).statusCode);
                    if (!('data' in data)) {
                        return { ...data, data: null };
                    }
                    return data;
                }

                const statusCode = context.switchToHttp().getResponse().statusCode;

                // Mapping status codes to descriptive codes
                const codeMap = {
                    [HttpStatus.OK]: 'SUCCESS',
                    [HttpStatus.CREATED]: 'CREATED',
                    [HttpStatus.ACCEPTED]: 'ACCEPTED',
                    [HttpStatus.NO_CONTENT]: 'NO_CONTENT',
                };

                const code = codeMap[statusCode] || 'SUCCESS';

                return {
                    statusCode,
                    status: true,
                    code,
                    message: 'Request successful',
                    data,
                };
            }),
        );
    }
}