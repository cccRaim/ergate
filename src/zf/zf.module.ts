import { HttpModule, Module } from '@nestjs/common';
import { ZfService } from './zf.service';
import { ZfController } from './zf.controller';

@Module({
  imports: [HttpModule],
  controllers: [ZfController],
  providers: [ZfService],
})
export class ZfModule {
}
