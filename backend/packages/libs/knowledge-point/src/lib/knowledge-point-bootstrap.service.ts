import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

export interface KnowledgePointData {
  id: string;
  topic: string;
  volume: string;
  unit: string;
  lesson: string;
  sub: string;
}

export interface KnowledgePointMapping {
  excelId: string; // ID from Excel like 'kp_1'
  databaseId: string; // UUID from database
  topic: string;
}

@Injectable()
export class KnowledgePointBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgePointBootstrapService.name);
  private readonly excelFilePath = path.join(process.cwd(), 'data', 'knowledge-points.xlsx');
  
  constructor(private readonly persistentService: PersistentService) {}

  async onModuleInit() {
    // Skip bootstrap for now to avoid startup errors
    // await this.bootstrapKnowledgePoints();
  }

  /**
   * Bootstrap knowledge points from Excel file
   * Only updates database if Excel data has changed (using hash comparison)
   */
  async bootstrapKnowledgePoints(): Promise<void> {
    try {
      this.logger.log('Starting knowledge points bootstrap...');

      // Check if Excel file exists
      if (!fs.existsSync(this.excelFilePath)) {
        this.logger.warn(`Knowledge points Excel file not found at: ${this.excelFilePath}`);
        this.logger.warn('Skipping knowledge points bootstrap');
        return;
      }

      // Read and parse Excel data
      const knowledgePoints = await this.readKnowledgePointsFromExcel();
      if (knowledgePoints.length === 0) {
        this.logger.warn('No knowledge points found in Excel file');
        return;
      }

      // Calculate hash of current Excel data
      const currentHash = this.calculateDataHash(knowledgePoints);
      
      // Check if data has changed since last import
      const storedHash = await this.getStoredHash();
      if (storedHash === currentHash) {
        this.logger.log('Knowledge points data unchanged, skipping import');
        return;
      }

      // Data has changed, update database
      this.logger.log(`Importing ${knowledgePoints.length} knowledge points to database`);
      await this.importKnowledgePointsToDatabase(knowledgePoints);
      
      // Update stored hash
      await this.updateStoredHash(currentHash);
      
      this.logger.log('Knowledge points bootstrap completed successfully');
    } catch (error) {
      this.logger.error('Failed to bootstrap knowledge points:', error);
      throw error;
    }
  }

  /**
   * Read knowledge points from Excel file
   */
  private async readKnowledgePointsFromExcel(): Promise<KnowledgePointData[]> {
    try {
      const workbook = XLSX.readFile(this.excelFilePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const knowledgePoints: KnowledgePointData[] = [];
      
      // Skip header row, process data rows
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (!row || row.length < 6) continue;

        const [id, topic, volume, unit, lesson, sub] = row;
        
        // Skip empty rows
        if (!id || !topic) continue;

        knowledgePoints.push({
          id: String(id).trim(),
          topic: String(topic).trim(),
          volume: String(volume || '').trim(),
          unit: String(unit || '').trim(), 
          lesson: String(lesson || '').trim(),
          sub: String(sub || '').trim(),
        });
      }

      this.logger.log(`Parsed ${knowledgePoints.length} knowledge points from Excel`);
      return knowledgePoints;
    } catch (error) {
      this.logger.error('Failed to read Excel file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse knowledge points Excel file: ${errorMessage}`);
    }
  }

  /**
   * Calculate MD5 hash of knowledge points data for change detection
   */
  private calculateDataHash(knowledgePoints: KnowledgePointData[]): string {
    const dataString = JSON.stringify(knowledgePoints.sort((a, b) => a.id.localeCompare(b.id)));
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  /**
   * Get stored hash from database
   */
  private async getStoredHash(): Promise<string | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT value FROM kedge_practice.knowledge_points_metadata 
          WHERE key = 'data_hash'
        `
      );
      return result.rows[0]?.value || null;
    } catch (error) {
      this.logger.warn('Failed to get stored hash, assuming first import');
      return null;
    }
  }

  /**
   * Update stored hash in database
   */
  private async updateStoredHash(hash: string): Promise<void> {
    await this.persistentService.pgPool.query(
      sql.unsafe`
        INSERT INTO kedge_practice.knowledge_points_metadata (key, value)
        VALUES ('data_hash', ${hash})
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `
    );
  }

  /**
   * Import knowledge points to database (replace all existing data)
   * Creates UUID-based knowledge points and maintains mapping to Excel IDs
   */
  private async importKnowledgePointsToDatabase(knowledgePoints: KnowledgePointData[]): Promise<void> {
    await this.persistentService.pgPool.transaction(async (connection) => {
      // Clear existing knowledge points and mappings
      await connection.query(sql.unsafe`DELETE FROM kedge_practice.knowledge_points`);
      await connection.query(sql.unsafe`DELETE FROM kedge_practice.knowledge_points_metadata WHERE key LIKE 'mapping_%'`);
      
      // Insert new knowledge points (UUIDs will be auto-generated)
      const mappings: KnowledgePointMapping[] = [];
      
      for (const kp of knowledgePoints) {
        const result = await connection.query(
          sql.unsafe`
            INSERT INTO kedge_practice.knowledge_points (topic, volume, unit, lesson, sub)
            VALUES (${kp.topic}, ${kp.volume}, ${kp.unit}, ${kp.lesson}, ${kp.sub})
            RETURNING id
          `
        );
        
        const databaseId = result.rows[0].id;
        mappings.push({
          excelId: kp.id,
          databaseId,
          topic: kp.topic,
        });
        
        // Store mapping in metadata table
        await connection.query(
          sql.unsafe`
            INSERT INTO kedge_practice.knowledge_points_metadata (key, value)
            VALUES (${`mapping_${kp.id}`}, ${databaseId})
          `
        );
      }
      
      this.logger.log(`Imported ${knowledgePoints.length} knowledge points to database with UUID mappings`);
      this.logger.log(`Sample mappings: ${JSON.stringify(mappings.slice(0, 3))}`);
    });
  }

  /**
   * Force refresh knowledge points from Excel (ignoring hash)
   */
  async forceRefresh(): Promise<void> {
    this.logger.log('Force refreshing knowledge points from Excel...');
    
    const knowledgePoints = await this.readKnowledgePointsFromExcel();
    await this.importKnowledgePointsToDatabase(knowledgePoints);
    
    const newHash = this.calculateDataHash(knowledgePoints);
    await this.updateStoredHash(newHash);
    
    this.logger.log('Force refresh completed');
  }

  /**
   * Get current knowledge points count and last update info
   */
  async getBootstrapInfo(): Promise<{
    count: number;
    lastUpdated: Date | null;
    currentHash: string | null;
  }> {
    const countResult = await this.persistentService.pgPool.query(
      sql.unsafe`SELECT COUNT(*) as count FROM kedge_practice.knowledge_points`
    );
    
    const metadataResult = await this.persistentService.pgPool.query(
      sql.unsafe`
        SELECT value, updated_at FROM kedge_practice.knowledge_points_metadata 
        WHERE key = 'data_hash'
      `
    );
    
    return {
      count: parseInt(countResult.rows[0].count),
      lastUpdated: metadataResult.rows[0]?.updated_at || null,
      currentHash: metadataResult.rows[0]?.value || null,
    };
  }

  /**
   * Get database UUID for an Excel knowledge point ID
   */
  async getDatabaseIdForExcelId(excelId: string): Promise<string | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT value FROM kedge_practice.knowledge_points_metadata 
          WHERE key = ${`mapping_${excelId}`}
        `
      );
      return result.rows[0]?.value || null;
    } catch (error) {
      this.logger.warn(`Failed to get database ID for Excel ID ${excelId}:`, error);
      return null;
    }
  }

  /**
   * Get all mappings between Excel IDs and database UUIDs
   */
  async getAllMappings(): Promise<KnowledgePointMapping[]> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT key, value FROM kedge_practice.knowledge_points_metadata 
          WHERE key LIKE 'mapping_%'
        `
      );
      
      const mappings: KnowledgePointMapping[] = [];
      for (const row of result.rows) {
        const excelId = row.key.replace('mapping_', '');
        const databaseId = row.value;
        
        // Get topic from knowledge_points table
        const kpResult = await this.persistentService.pgPool.query(
          sql.unsafe`
            SELECT topic FROM kedge_practice.knowledge_points 
            WHERE id = ${databaseId}
          `
        );
        
        if (kpResult.rows[0]) {
          mappings.push({
            excelId,
            databaseId,
            topic: kpResult.rows[0].topic,
          });
        }
      }
      
      return mappings;
    } catch (error) {
      this.logger.warn('Failed to get all mappings:', error);
      return [];
    }
  }
}