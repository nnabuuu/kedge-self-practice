import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { DocxService, GptService } from '@kedge/quiz-parser';

interface MulterFile {
  buffer: Buffer;
  [key: string]: unknown;
}

@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('docx')
export class DocxController {
  constructor(
    private readonly docxService: DocxService,
    private readonly gptService: GptService,
  ) {}

  @Post('extract-quiz')
  @UseInterceptors(FileInterceptor('file'))
  async extractQuiz(@UploadedFile() file: MulterFile) {
    const paragraphs = await this.docxService.extractAllHighlights(file.buffer);
    return this.gptService.extractQuizItems(paragraphs);
  }
}
