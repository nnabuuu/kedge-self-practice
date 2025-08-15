import { z } from 'zod';
import { DocxImageSchema } from './image.schema';

/**
 * Highlighted text block with color information
 */
export const HighlightedTextSchema = z.object({
  text: z.string(),
  color: z.string(),
});

export type HighlightedText = z.infer<typeof HighlightedTextSchema>;

/**
 * A paragraph block extracted from DOCX with highlighted text and images
 */
export const ParagraphBlockSchema = z.object({
  paragraph: z.string(),
  highlighted: z.array(HighlightedTextSchema),
  images: z.array(DocxImageSchema),
});

export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;