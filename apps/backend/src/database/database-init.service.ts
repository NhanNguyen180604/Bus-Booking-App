import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseInitService.name);

    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async onModuleInit() {
        await this.enablePgTrgmExtension();
    }

    private async enablePgTrgmExtension() {
        try {
            // Check if extension exists
            const result = await this.entityManager.query(
                `SELECT * FROM pg_extension WHERE extname = 'pg_trgm'`
            );

            if (result.length === 0) {
                // Create extension if it doesn't exist
                await this.entityManager.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
                this.logger.log('✓ pg_trgm extension enabled for fuzzy search');
            } else {
                this.logger.log('✓ pg_trgm extension already enabled');
            }

            // Optionally create GIN index on station names for better performance
            await this.entityManager.query(`
                CREATE INDEX IF NOT EXISTS station_name_trgm_idx 
                ON station 
                USING gin (name gin_trgm_ops)
            `);
            this.logger.log('✓ Trigram index created on station names');

        } catch (error) {
            this.logger.error('Failed to enable pg_trgm extension:', error);
            this.logger.warn('Fuzzy search may not work properly. Please enable pg_trgm extension manually.');
        }
    }
}
