import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';

/**
 * Service responsible for bootstrapping knowledge points.
 * Previously loaded from Excel file, now managed via database migrations.
 * This service is kept for compatibility but no longer performs any bootstrap operations.
 */
@Injectable()
export class KnowledgePointBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgePointBootstrapService.name);

  constructor(private readonly persistentService: PersistentService) {}

  async onModuleInit() {
    // Knowledge points are now managed via database migrations
    // Excel file bootstrap is no longer needed
    this.logger.log('Knowledge points bootstrap from Excel is disabled - using database migrations instead');
    return;
  }

  /**
   * Get bootstrap information.
   * @deprecated Knowledge points are now managed via database migrations
   */
  async getBootstrapInfo(): Promise<{ 
    isAvailable: boolean; 
    path: string | null; 
    count: number; 
    lastUpdated: Date | null;
    currentHash: string | null;
  }> {
    return {
      isAvailable: false,
      path: null,
      count: 0,
      lastUpdated: null,
      currentHash: null
    };
  }

  /**
   * Force refresh knowledge points from Excel file.
   * @deprecated Knowledge points are now managed via database migrations
   */
  async forceRefresh(): Promise<void> {
    this.logger.warn('Force refresh called but Excel import is disabled. Knowledge points are managed via database migrations.');
    return;
  }

  /**
   * Refresh knowledge points from Excel file.
   * @deprecated Knowledge points are now managed via database migrations
   */
  async refreshKnowledgePoints(): Promise<{ message: string; imported: number }> {
    return {
      message: 'Knowledge points are now managed via database migrations. Excel import is disabled.',
      imported: 0
    };
  }
}