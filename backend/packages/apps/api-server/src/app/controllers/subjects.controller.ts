import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@kedge/auth';
import { subjectsConfigService } from '@kedge/configs/src/lib/subjects.config';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  @Get()
  @ApiOperation({ summary: 'Get all enabled subjects' })
  @ApiResponse({ status: 200, description: 'Returns list of enabled subjects' })
  async getSubjects(@Query('all') all?: string) {
    const subjects = all === 'true' 
      ? subjectsConfigService.getAllSubjects()
      : subjectsConfigService.getEnabledSubjects();
    
    return {
      success: true,
      data: subjects,
      count: subjects.length
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  @ApiResponse({ status: 200, description: 'Returns subject details' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getSubjectById(@Param('id') id: string) {
    const subject = subjectsConfigService.findSubjectById(id);
    
    if (!subject) {
      return {
        success: false,
        error: 'Subject not found'
      };
    }
    
    return {
      success: true,
      data: subject
    };
  }

  @Get(':id/enabled')
  @ApiOperation({ summary: 'Check if subject is enabled' })
  @ApiResponse({ status: 200, description: 'Returns enabled status' })
  async checkSubjectEnabled(@Param('id') id: string) {
    const enabled = subjectsConfigService.isSubjectEnabled(id);
    
    return {
      success: true,
      data: { enabled }
    };
  }

  @Get('config/reload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reload subjects configuration (admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration reloaded' })
  async reloadConfig() {
    subjectsConfigService.reloadConfig();
    
    return {
      success: true,
      message: 'Subjects configuration reloaded'
    };
  }
}