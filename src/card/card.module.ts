import { Module, HttpModule } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { Request } from '../provider/request';

@Module({
  imports: [HttpModule.register({
    timeout: 15000,
    maxRedirects: 5,
    // proxy: {
    //   host: '127.0.0.1',
    //   port: 8889,
    // },
  })],
  controllers: [CardController],
  providers: [
    CardService,
    { provide: Request, useValue: new Request('https://172.16.10.102') },
    ],
})
export class CardModule {}
