import { Controller, Get, HttpException, Query, UseGuards } from '@nestjs/common';
import { ZfService } from './zf.service';
import { ZfGuard } from './zf.guard';
import { ZfUser } from './zf.user';

@UseGuards(ZfGuard)
@Controller('zf')
export class ZfController {
  constructor(private readonly zfService: ZfService) {}

  @Get('score')
  async score(@Query('username') username, @Query('password') password, @Query('term') term, @Query('year') year, @Query('retry') retry = 1) {
    const user = new ZfUser(username, password);
    if (!await this.zfService.login(user, retry)) {
      throw new HttpException('登录错误', 1);
    }
    return {
      code: 0,
      data: await this.zfService.getScore(user, year, term),
    };
  }
}
