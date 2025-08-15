import { Injectable, Logger } from '@nestjs/common';
import { ParagraphBlock, DocxImage } from '@kedge/models';
import * as unzipper from 'unzipper';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class EnhancedDocxService {
  private readonly logger = new Logger(EnhancedDocxService.name);

  async extractAllHighlightsWithImages(file: Buffer): Promise<{
    paragraphs: ParagraphBlock[];
    allImages: DocxImage[];
  }> {
    // Dependencies imported at top of file

    const zip = await unzipper.Open.buffer(file);
    
    // Extract document content
    const docXmlEntry = zip.files.find((f: any) => f.path === 'word/document.xml');
    if (!docXmlEntry) throw new Error('document.xml not found in .docx');

    // Extract relationships to map image references
    const relsEntry = zip.files.find((f: any) => f.path === 'word/_rels/document.xml.rels');
    const relationships = new Map<string, string>();
    
    if (relsEntry) {
      const relsContent = await relsEntry.buffer();
      const relsParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
      });
      const relsJson = relsParser.parse(relsContent.toString());
      const rels = relsJson['Relationships']?.['Relationship'];
      
      if (rels) {
        const relArray = Array.isArray(rels) ? rels : [rels];
        for (const rel of relArray) {
          if (rel.Type?.includes('image')) {
            relationships.set(rel.Id, rel.Target);
          }
        }
      }
    }

    // Extract all images from word/media/
    const allImages: DocxImage[] = [];
    const mediaFiles = zip.files.filter((f: any) => f.path.startsWith('word/media/'));
    
    for (const mediaFile of mediaFiles) {
      try {
        const imageData = await mediaFile.buffer();
        let filename = mediaFile.path.split('/').pop() || 'unknown';
        
        // Detect image type from buffer if filename doesn't have an extension
        if (!filename.includes('.')) {
          const imageType = this.detectImageTypeFromBuffer(imageData);
          filename += imageType.ext;
        }
        
        // Get content type from filename (which now has an extension)
        const contentType = this.getContentTypeFromFilename(filename);
        
        allImages.push({
          id: mediaFile.path,
          filename,
          data: imageData,
          contentType,
        });
        
        this.logger.debug(`Extracted image: ${filename} (${contentType})`);
      } catch (error) {
        this.logger.warn(`Failed to extract image ${mediaFile.path}:`, error);
      }
    }

    // Parse document XML
    const content = await docXmlEntry.buffer();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
    });
    const json = parser.parse(content.toString());

    const result: ParagraphBlock[] = [];
    const body = json['w:document']?.['w:body'];
    if (!body) return { paragraphs: [], allImages };

    const paragraphs = Array.isArray(body['w:p']) ? body['w:p'] : body['w:p'] ? [body['w:p']] : [];

    for (const p of paragraphs) {
      if (!p || typeof p !== 'object') continue;

      const runs = Array.isArray(p['w:r']) ? p['w:r'] : p['w:r'] ? [p['w:r']] : [];
      const allText: string[] = [];
      const highlighted: { text: string; color: string }[] = [];
      const paragraphImages: DocxImage[] = [];

      for (const r of runs) {
        if (!r || typeof r !== 'object') continue;

        // Extract text
        const rawText = r['w:t'];
        const text =
          typeof rawText === 'object' && rawText['#text']
            ? rawText['#text']
            : typeof rawText === 'string'
            ? rawText
            : '';

        // Check for images in this run first
        const runImages: DocxImage[] = [];
        
        // Extract images from this run
        const drawing = r['w:drawing'];
        if (drawing) {
          const images = this.extractImagesFromDrawing(drawing, relationships, allImages);
          runImages.push(...images);
        }

        // Also check for inline pictures (older format)
        const pict = r['w:pict'];
        if (pict) {
          const images = this.extractImagesFromPict(pict, relationships, allImages);
          runImages.push(...images);
        }

        // Add text or image placeholder to the paragraph text
        if (runImages.length > 0) {
          // This run contains images - add placeholders
          for (let i = 0; i < runImages.length; i++) {
            const imageIndex = paragraphImages.length + i + 1; // 1-based indexing
            allText.push(`{{image:${imageIndex}}}`);
          }
          paragraphImages.push(...runImages);
        } else if (text) {
          // This run contains text - add it normally
          allText.push(text);
        }

        // Extract highlights from text (not from image placeholders)
        if (text) {
          const highlight =
            r['w:rPr']?.['w:highlight']?.val ||
            r['w:rPr']?.['w:highlight']?.['w:val'];

          if (highlight) {
            highlighted.push({ text, color: highlight });
          }
        }
      }

      result.push({
        paragraph: allText.join(''),
        highlighted,
        images: paragraphImages,
      });
    }

    return {
      paragraphs: result,
      allImages,
    };
  }

  private extractImagesFromDrawing(drawing: any, relationships: Map<string, string>, allImages: DocxImage[]): DocxImage[] {
    const images: DocxImage[] = [];
    
    try {
      // Navigate the drawing structure to find image references
      const inline = drawing['wp:inline'] || drawing['wp:anchor'];
      if (!inline) return images;

      const graphic = inline['a:graphic'];
      if (!graphic) return images;

      const graphicData = graphic['a:graphicData'];
      if (!graphicData) return images;

      const pic = graphicData['pic:pic'];
      if (!pic) return images;

      const blipFill = pic['pic:blipFill'];
      if (!blipFill) return images;

      const blip = blipFill['a:blip'];
      if (!blip) return images;

      const embedId = blip['r:embed'];
      if (!embedId) return images;

      // Find the corresponding image
      const imagePath = relationships.get(embedId);
      if (!imagePath) return images;

      const fullImagePath = `word/${imagePath}`;
      const image = allImages.find(img => img.id === fullImagePath);
      
      if (image) {
        // Try to extract dimensions if available
        const extent = inline['wp:extent'];
        if (extent) {
          const width = extent.cx ? Math.round(parseInt(extent.cx) / 9525) : undefined; // Convert EMUs to pixels
          const height = extent.cy ? Math.round(parseInt(extent.cy) / 9525) : undefined;
          
          images.push({
            ...image,
            width,
            height,
          });
        } else {
          images.push(image);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to extract image from drawing:', error);
    }

    return images;
  }

  private extractImagesFromPict(pict: any, relationships: Map<string, string>, allImages: DocxImage[]): DocxImage[] {
    const images: DocxImage[] = [];
    
    try {
      // Handle VML pictures (older Word format)
      const shape = pict['v:shape'] || pict['v:imagedata'];
      if (!shape) return images;

      const imageData = shape['v:imagedata'] || shape;
      if (!imageData) return images;

      const relId = imageData['r:id'] || imageData['o:relid'];
      if (!relId) return images;

      const imagePath = relationships.get(relId);
      if (!imagePath) return images;

      const fullImagePath = `word/${imagePath}`;
      const image = allImages.find(img => img.id === fullImagePath);
      
      if (image) {
        images.push(image);
      }
    } catch (error) {
      this.logger.warn('Failed to extract image from pict:', error);
    }

    return images;
  }

  private getContentTypeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'svg': 'image/svg+xml',
    };
    
    return mimeTypes[ext || ''] || 'image/png'; // Default to PNG instead of octet-stream
  }
  
  /**
   * Detect image type from buffer magic bytes
   */
  private detectImageTypeFromBuffer(buffer: Buffer): { ext: string; mime: string } {
    // Check magic bytes for common image formats
    if (buffer.length >= 4) {
      const header = buffer.slice(0, 4).toString('hex');
      
      // PNG
      if (header.startsWith('89504e47')) {
        return { ext: '.png', mime: 'image/png' };
      }
      
      // JPEG
      if (header.startsWith('ffd8ff')) {
        return { ext: '.jpg', mime: 'image/jpeg' };
      }
      
      // GIF
      if (header.startsWith('47494638')) {
        return { ext: '.gif', mime: 'image/gif' };
      }
      
      // WebP
      if (buffer.length >= 12) {
        const webpHeader = buffer.slice(0, 4).toString('ascii');
        const webpType = buffer.slice(8, 12).toString('ascii');
        if (webpHeader === 'RIFF' && webpType === 'WEBP') {
          return { ext: '.webp', mime: 'image/webp' };
        }
      }
      
      // BMP
      if (header.startsWith('424d')) {
        return { ext: '.bmp', mime: 'image/bmp' };
      }
    }
    
    // Default to PNG if unable to detect
    return { ext: '.png', mime: 'image/png' };
  }

  // Backward compatibility method
  async extractAllHighlights(file: Buffer): Promise<ParagraphBlock[]> {
    const result = await this.extractAllHighlightsWithImages(file);
    return result.paragraphs;
  }
}