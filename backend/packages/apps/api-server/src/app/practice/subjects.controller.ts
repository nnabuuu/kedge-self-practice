import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard, AdminGuard, TeacherGuard } from '@kedge/auth';
import { 
  CreateSubjectRequest, 
  UpdateSubjectRequest 
} from '@kedge/models';
import { SubjectService } from '@kedge/practice';

@Controller('api/practice/subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async getAllSubjects(@Query('includeInactive') includeInactive?: string) {
    try {
      const subjects = await this.subjectService.findAll(
        includeInactive === 'true'
      );
      
      return {
        success: true,
        data: subjects,
        message: 'Subjects retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve subjects',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async searchSubjects(@Query('q') query: string) {
    try {
      const subjects = await this.subjectService.search(query || '');
      
      return {
        success: true,
        data: subjects,
        message: 'Search completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Search failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getSubjectById(@Param('id') id: string) {
    try {
      const subject = await this.subjectService.findById(id);
      
      if (!subject) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: subject,
        message: 'Subject retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/stats')
  async getSubjectStats(@Param('id') id: string) {
    try {
      const stats = await this.subjectService.getSubjectStats(id);
      
      if (!stats) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: stats,
        message: 'Subject statistics retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve subject statistics',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createSubject(@Body() createSubjectDto: CreateSubjectRequest) {
    try {
      const subject = await this.subjectService.create(createSubjectDto);
      
      return {
        success: true,
        data: subject,
        message: 'Subject created successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectRequest
  ) {
    try {
      const subject = await this.subjectService.update(id, updateSubjectDto);
      
      if (!subject) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: subject,
        message: 'Subject updated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deactivateSubject(@Param('id') id: string) {
    try {
      const subject = await this.subjectService.deactivate(id);
      
      if (!subject) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: subject,
        message: 'Subject deactivated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to deactivate subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async activateSubject(@Param('id') id: string) {
    try {
      const subject = await this.subjectService.activate(id);
      
      if (!subject) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: subject,
        message: 'Subject activated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to activate subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteSubject(@Param('id') id: string) {
    try {
      const success = await this.subjectService.delete(id);
      
      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        message: 'Subject deleted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete subject',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}