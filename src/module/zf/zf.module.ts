import { HttpModule, Module } from '@nestjs/common';
import { ZfService } from './zf.service';
import { ZfController } from './zf.controller';

@Module({
  imports: [HttpModule.register({
    timeout: 15000,
    maxRedirects: 5,
    // proxy: {
    //   host: '127.0.0.1',
    //   port: 8888,
    // },
  })],
  controllers: [ZfController],
  providers: [ZfService],
})
export class ZfModule {
}
