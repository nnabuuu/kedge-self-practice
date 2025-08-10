import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import { env } from '../env';

export interface QuizImageFile {
  filename: string;
  data: Buffer;
}

@Injectable()
export class QuizStorageService {
  private readonly root = env().QUIZ_STORAGE_PATH;

  async saveImage(file: QuizImageFile): Promise<string> {
    await fs.mkdir(this.root, { recursive: true });
    const name = `${uuid()}-${file.filename}`;
    const filePath = join(this.root, name);
    await fs.writeFile(filePath, file.data);
    return filePath;
  }
}
