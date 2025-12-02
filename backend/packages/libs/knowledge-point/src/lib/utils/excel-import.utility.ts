import { CurriculumStandardImportRow } from '@kedge/models';

/**
 * Parse Excel file buffer and extract curriculum standard rows
 * Uses xlsx library for Node.js in-process parsing
 */
export async function parseExcelFile(
  buffer: Buffer
): Promise<CurriculumStandardImportRow[]> {
  // Dynamic import to avoid loading xlsx unless needed
  const XLSX = await import('xlsx');

  // Parse the buffer
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file has no sheets');
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('Cannot read worksheet');
  }

  // Convert to JSON (first row as headers)
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // Convert dates to strings
    defval: null, // Use null for empty cells
  });

  // Validate required columns exist
  if (jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }

  const firstRow = jsonData[0] as Record<string, unknown>;
  const requiredColumns = ['学段', '学科', '版本', '课程内容', '类型'];
  const missingColumns = requiredColumns.filter(
    (col) => !(col in firstRow)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(', ')}`
    );
  }

  // Map rows to CurriculumStandardImportRow format
  const rows: CurriculumStandardImportRow[] = jsonData.map((row: any) => {
    return {
      序号: row['序号'] ? parseInt(row['序号'], 10) : undefined,
      学段: row['学段'] || '',
      学科: row['学科'] || '',
      版本: row['版本'] || '',
      课程内容: row['课程内容'] || '',
      类型: row['类型'] || '',
      层级1: row['层级1'] || null,
      层级2: row['层级2'] || null,
      层级3: row['层级3'] || null,
    };
  });

  return rows;
}
