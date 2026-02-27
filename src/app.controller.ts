import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";

@Controller()
export class AppController {
    constructor(private dataSource: DataSource) { }

    @Get('health')
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