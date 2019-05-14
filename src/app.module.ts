import { HttpModule, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZfModule } from './zf/zf.module';
import { HttpExceptionFilter } from './middleware/http-exception.filter';
import { CardModule } from './card/card.module';

@Module({
  imports: [HttpModule, ZfModule, CardModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
