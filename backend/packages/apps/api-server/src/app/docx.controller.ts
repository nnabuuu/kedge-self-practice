import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocxService, GptService } from '@kedge/quiz-parser';

interface MulterFile {
  buffer: Buffer;
  [key: string]: unknown;
}

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
