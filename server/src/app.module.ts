import { Module } from '@nestjs/common';
import { RoomsModule } from './rooms/rooms.module.js';
import { HealthController } from './health/health.controller.js';
import { WebController } from './web/web.controller.js';

@Module({
  imports: [RoomsModule],
  controllers: [HealthController, WebController],
})
export class AppModule {}
