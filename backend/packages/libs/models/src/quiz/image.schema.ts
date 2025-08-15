import { z } from 'zod';

/**
 * Image extracted from DOCX file with metadata
 */
export const DocxImageSchema = z.object({
  id: z.string(),
  filename: z.string(),
  data: z.instanceof(Buffer),
  contentType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type DocxImage = z.infer<typeof DocxImageSchema>;

/**
 * Processed image attachment stored in the system
 */
export const ImageAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string(),
  contentType: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  createdAt: z.date(),
});

export type ImageAttachment = z.infer<typeof ImageAttachmentSchema>;