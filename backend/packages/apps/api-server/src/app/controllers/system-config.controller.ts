import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard } from '@kedge/auth';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { z } from 'zod';
import { ZodValidationPipe } from 'nestjs-zod';

// Schema for system config value
const SystemConfigValueSchema = z.object({
  enabled: z.boolean(),
});

// Schema for update request
const UpdateSystemConfigSchema = z.object({
  value: SystemConfigValueSchema,
});

type UpdateSystemConfigDto = z.infer<typeof UpdateSystemConfigSchema>;

@ApiTags('System Configuration')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly persistentService: PersistentService) {}

  @Get(':key')
  @ApiOperation({ summary: 'Get system configuration by key' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfig(@Param('key') key: string) {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT key, value, description 
          FROM kedge_practice.system_config 
          WHERE key = ${key}
        `
      );

      if (result.rows.length === 0) {
        throw new HttpException('Configuration not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: {
          key: result.rows[0].key,
          value: result.rows[0].value,
          description: result.rows[0].description,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async updateConfig(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(UpdateSystemConfigSchema)) body: UpdateSystemConfigDto
  ) {
    try {
      // Check if config exists
      const existingResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT key FROM kedge_practice.system_config WHERE key = ${key}
        `
      );

      if (existingResult.rows.length === 0) {
        throw new HttpException('Configuration not found', HttpStatus.NOT_FOUND);
      }

      // Update configuration
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.system_config 
          SET value = ${JSON.stringify(body.value)}, updated_at = CURRENT_TIMESTAMP 
          WHERE key = ${key}
          RETURNING key, value, description, updated_at
        `
      );

      return {
        success: true,
        data: {
          key: result.rows[0].key,
          value: result.rows[0].value,
          description: result.rows[0].description,
          updatedAt: result.rows[0].updated_at,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all system configurations (Admin only)' })
  @ApiResponse({ status: 200, description: 'All configurations retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllConfigs() {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT key, value, description, updated_at 
          FROM kedge_practice.system_config 
          ORDER BY key
        `
      );

      return {
        success: true,
        data: result.rows.map((row: any) => ({
          key: row.key,
          value: row.value,
          description: row.description,
          updatedAt: row.updated_at,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve configurations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}