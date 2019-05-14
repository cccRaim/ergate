import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { CardService } from './card.service';
import { CardUser } from './card.user';

@Controller('card')
export class CardController {

  constructor(private readonly cardService: CardService) {}
  @Get('balance')
  async balance(@Query('username') username, @Query('password') password) {
    const user = new CardUser(username, password);
    if (!await this.cardService.login(user)) {
      throw new HttpException('登录错误', 1);
    }
    return {
      code: 0,
      data: await this.cardService.getBalance(user),
    };
  }
  @Get('todayRecord')
  async todayRecord(@Query('username') username, @Query('password') password) {
    const user = new CardUser(username, password);
    if (!await this.cardService.login(user)) {
      throw new HttpException('登录错误', 1);
    }
    return {
      code: 0,
      data: await this.cardService.getTodayRecord(user),
    };
  }
  @Get('historyRecord')
  async historyRecord(@Query('username') username, @Query('password') password, @Query('year') year, @Query('month') month, ) {
    const user = new CardUser(username, password);
    if (!await this.cardService.login(user)) {
      throw new HttpException('登录错误', 1);
    }
    return {
      code: 0,
      data: await this.cardService.getHistoryRecord(user, year, month),
    };
  }
}
