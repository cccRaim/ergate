import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { Request } from '../../provider/request';

@Module({
  controllers: [CardController],
  providers: [
    CardService,
    { provide: Request, useValue: new Request('https://172.16.10.102', true) },
  ],
})
export class CardModule {}
