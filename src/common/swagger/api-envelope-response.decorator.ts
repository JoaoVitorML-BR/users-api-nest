import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
    ApiExtraModels,
    ApiHideProperty,
    ApiProperty,
    ApiResponse,
    getSchemaPath,
} from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

type EnvelopeModel = Type<unknown>;

interface ApiEnvelopeResponseOptions {
    status: number;
    description: string;
    type?: EnvelopeModel;
    isArray?: boolean;
    metaType?: EnvelopeModel;
}

export class ErrorResponseDto {
    @ApiProperty({ example: HttpStatus.BAD_REQUEST })
    statusCode: number;

    @ApiProperty({ example: false })
    status: boolean;

    @ApiProperty({ example: 'BAD_REQUEST' })
    code: string;

    @ApiProperty({
        example: ['name should not be empty'],
        oneOf: [
            { type: 'string', example: 'Unauthorized' },
            {
                type: 'array',
                items: { type: 'string' },
                example: ['name should not be empty'],
            },
        ],
    })
    message: string | string[];

    @ApiHideProperty()
    data?: null;
}

export function ApiEnvelopeResponse(options: ApiEnvelopeResponseOptions) {
    const extraModels: EnvelopeModel[] = [];

    if (options.type) {
        extraModels.push(options.type);
    }

    if (options.metaType) {
        extraModels.push(options.metaType);
    }

    const properties: Record<string, SchemaObject | ReferenceObject> = {};

    if (options.type) {
        properties.data = options.isArray
            ? {
                type: 'array',
                items: { $ref: getSchemaPath(options.type) },
            }
            : { $ref: getSchemaPath(options.type) };
    } else {
        properties.data = {
            nullable: true,
            example: null,
        };
    }

    if (options.metaType) {
        properties.meta = { $ref: getSchemaPath(options.metaType) };
    }

    return applyDecorators(
        ...(extraModels.length > 0 ? [ApiExtraModels(...extraModels)] : []),
        ApiResponse({
            status: options.status,
            description: options.description,
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: options.status },
                    status: { type: 'boolean', example: true },
                    code: {
                        type: 'string',
                        example: options.status >= 200 && options.status < 300 ? 'SUCCESS' : 'ERROR',
                    },
                    message: {
                        type: 'string',
                        example: options.description,
                    },
                    ...properties,
                },
            },
        }),
    );
}

export function ApiErrorEnvelopeResponse(
    status: number,
    description: string,
    code: string,
    messageExample: string | string[],
) {
    return applyDecorators(
        ApiExtraModels(ErrorResponseDto),
        ApiResponse({
            status,
            description,
            schema: {
                allOf: [{ $ref: getSchemaPath(ErrorResponseDto) }],
                properties: {
                    statusCode: { example: status },
                    status: { example: false },
                    code: { example: code },
                    message: { example: messageExample },
                    data: {
                        nullable: true,
                        example: null,
                    },
                },
            },
        }),
    );
}