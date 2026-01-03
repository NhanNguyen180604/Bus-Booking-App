import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(SeedService);

    // Check for --force flag
    const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');

    try {
        if (forceFlag) {
            await seedService.forceSeedAll();
        } else {
            await seedService.seedAll();
        }
        console.log('✅ Seeding completed successfully!');
        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        await app.close();
        process.exit(1);
    }
}

bootstrap();
