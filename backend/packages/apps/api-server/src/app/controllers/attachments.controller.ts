import {
  Controller,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  Header,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnhancedQuizStorageService } from '@kedge/quiz';
import { JwtAuthGuard, JwtOrQueryGuard } from '@kedge/auth';

@ApiTags('attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly storageService: EnhancedQuizStorageService) {}

  @Get(':fileId')
  @ApiOperation({ summary: 'Retrieve attachment by file ID (simplified format)' })
  @ApiParam({ name: 'fileId', description: 'File ID with extension (e.g., uuid.png)' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Header('Cache-Control', 'public, max-age=3600')
  async getAttachment(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    try {
      // Parse fileId to extract UUID and extension
      const lastDotIndex = fileId.lastIndexOf('.');
      if (lastDotIndex === -1) {
        throw new HttpException('Invalid file ID format. Expected: uuid.extension', HttpStatus.BAD_REQUEST);
      }
      
      const uuid = fileId.substring(0, lastDotIndex);
      const extension = fileId.substring(lastDotIndex + 1);
      
      // Validate UUID format
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        throw new HttpException('Invalid UUID format', HttpStatus.BAD_REQUEST);
      }
      
      // Get attachment metadata and file
      const fileData = await this.storageService.getAttachmentByUuid(uuid, extension);
      
      // Determine content type from extension
      const contentType = this.getContentType(fileId);
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': fileData.buffer.length.toString(),
        'Content-Disposition': `inline; filename="${fileId}"`,
      });
      
      res.send(fileData.buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve attachment',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('quiz/:year/:month/:filename')
  @ApiOperation({ summary: 'Retrieve quiz attachment by path (public access)' })
  @ApiParam({ name: 'year', description: 'Year folder' })
  @ApiParam({ name: 'month', description: 'Month folder' })
  @ApiParam({ name: 'filename', description: 'File name' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Header('Cache-Control', 'public, max-age=3600')
  async getQuizAttachment(
    @Param('year') year: string,
    @Param('month') month: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Validate parameters
      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
        throw new HttpException('Invalid path parameters', HttpStatus.BAD_REQUEST);
      }

      const relativePath = `${year}/${month}/${filename}`;
      const fileBuffer = await this.storageService.getAttachment(relativePath);
      
      // Determine content type from filename
      const contentType = this.getContentType(filename);
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${filename}"`,
      });
      
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to retrieve attachment',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: 200, description: 'Storage statistics retrieved' })
  async getStorageStats() {
    return this.storageService.getStorageStats();
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}