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
                let statusCode = context.switchToHttp().getResponse().statusCode;
                let message = 'Request successful';
                let code = 'SUCCESS';
                let status = true;
                let responseData;

                const codeMap = {
                    [HttpStatus.OK]: 'SUCCESS',
                    [HttpStatus.CREATED]: 'CREATED',
                    [HttpStatus.ACCEPTED]: 'ACCEPTED',
                    [HttpStatus.NO_CONTENT]: 'NO_CONTENT',
                };

                if (data && typeof data === 'object') {
                    if ('statusCode' in data && typeof data.statusCode === 'number') {
                        statusCode = data.statusCode;
                    }
                    if ('message' in data && typeof data.message === 'string') {
                        message = data.message;
                    }
                    if ('code' in data && typeof data.code === 'string') {
                        code = data.code;
                    } else {
                        code = codeMap[statusCode] || 'SUCCESS';
                    }
                    if ('status' in data && typeof data.status === 'boolean') {
                        status = data.status;
                    }
                    // does not have data property but has other properties, consider them as data
                    responseData = data.data ? data.data : (() => {
                        const { statusCode: _sc, message: _m, code: _c, status: _s, ...usefulData } = data;
                        return Object.keys(usefulData).length > 0 ? usefulData : null;
                    })();
                } else {
                    responseData = data;
                }

                return {
                    statusCode,
                    status,
                    code,
                    message,
                    data: responseData,
                };
            })
        );
    }
}