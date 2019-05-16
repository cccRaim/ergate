import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Request } from '../../provider/request';

@Module({
  controllers: [LibraryController],
  providers: [
    LibraryService,
    { provide: Request, useValue: new Request('http://210.32.205.60/') },
  ],
})
export class LibraryModule {}
