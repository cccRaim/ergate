import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZfModule } from './zf/zf.module';

@Module({
  imports: [HttpModule, ZfModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
