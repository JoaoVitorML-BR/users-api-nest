import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from "typeorm";

@ApiTags('Health')
@Controller()
export class AppController {
    constructor(private dataSource: DataSource) { }

    @Get('health')
    @ApiOperation({ summary: 'Checks the basic availability of the API.' })
    @ApiOkResponse({
        description: 'Returns the API state within the global envelope..',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 200 },
                status: { type: 'boolean', example: true },
                code: { type: 'string', example: 'SUCCESS' },
                message: { type: 'string', example: 'Request successful' },
                data: { type: 'string', example: 'API is healthy' },
            },
        },
    })
    async checkHealth(): Promise<string> {
        try {
            if (!this.dataSource.isInitialized) {
                return 'API is not connected to database';
            }
            return 'API is healthy';
        } catch (error) {
            return 'API health check failed';
        }
    }
}