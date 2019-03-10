import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ZfService } from './zf.service';
import { ZfGuard } from './zf.guard';

@UseGuards(ZfGuard)
@Controller('zf')
export class ZfController {
  constructor(private readonly zfService: ZfService) {}

  @Get('score')
  async score(@Query('username') username, @Query('password') password) {
    await this.zfService.init(username, password);
    await this.zfService.login();
    return 'score';
  }
}
