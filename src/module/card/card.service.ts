import { Injectable } from '@nestjs/common';
import { CardUser } from './card.user';
import * as cheerio from 'cheerio';
import { Request } from '../../provider/request';

@Injectable()
export class CardService {
  private BALANCE_URI: string = 'Cardholder/AccBalance.aspx';
  private TODAY_DETAIL_URI: string = 'Cardholder/QueryCurrDetailFrame.aspx';
  private HISTORY_QUERY_URI: string = 'Cardholder/Queryhistory.aspx';
  private HISTORY_DETAIL_FRAME_URI: string = 'Cardholder/QueryhistoryDetailFrame.aspx';
  private LOGIN_URI: string = '/';
  private INDEX_URI: string = '/';

  constructor(private readonly httpService: Request) {}

  public async login(user: CardUser) {
    const indexPage = await this.httpService.get(user, this.INDEX_URI);
    const $ = cheerio.load(indexPage);
    const list = $('TD[width="9"] img[id]').map(function(i, el) {
      return $(this).attr('src').replace('images/', '').replace('.gif', '');
    }).get();
    const verCode = list.join('');
    const data: string = await this.httpService.post(user, this.LOGIN_URI, {
      'UserLogin:txtUser': user.username,
      'UserLogin:txtPwd': user.password,
      'UserLogin:ddlPerson': '卡户',
      'UserLogin:txtSure': verCode,
      'UserLogin:ImageButton1.x': 40,
      'UserLogin:ImageButton1.y': 16,
    });
    return !!data.includes('/Cardholder/Cardholder.aspx');
  }

  public async getBalance(user: CardUser) {
    const document = await this.httpService.get(user, this.BALANCE_URI);
    const $ = cheerio.load(document, {
      xml: { normalizeWhitespace: true },
    });
    const balance = $('#lblOne0').text() || '';
    const name = $('#lblName0').text() || '';
    return {
      balance,
      name,
    };
  }

  public async getTodayRecord(user: CardUser) {
    const document = await this.httpService.get(user, this.TODAY_DETAIL_URI);
    const $ = cheerio.load(document, {
      xml: { normalizeWhitespace: true },
    });
    const records = $('#dgShow tr:not([class="dg_header"])').map((i, el) => {
      const [
        serialNo,
        posAccount,
        cardType,
        businessType,
        posName,
        posLocation,
        posEndPoint,
        businessAmount,
        businessTime,
        walletName,
        cardBalance,
      ] = $(el).find('td').map((index, td) => {
        return $(td).text();
      }).get();
      return {
        serialNo,
        posAccount,
        cardType,
        businessType,
        posName,
        posLocation,
        posEndPoint,
        businessAmount,
        businessTime,
        walletName,
        cardBalance,
      };
    }).get();
    return {
      records,
    };
  }

  public async getHistoryRecord(user: CardUser, year, month) {
    await this.httpService.get(user, this.HISTORY_QUERY_URI);
    await this.httpService.post(user, this.HISTORY_QUERY_URI, {
      'ddlYear': year,
      'ddlMonth': month,
      'txtMonth': month,
      'ImageButton1.x': 36,
      'ImageButton1.y': 13,
    });
    const document = await this.httpService.get(user, this.HISTORY_DETAIL_FRAME_URI);
    const $ = cheerio.load(document, {
      xml: { normalizeWhitespace: true },
    });
    const records = $('#dgShow tr:not([class="dg_header"])').map((i, el) => {
      const [
        serialNo,
        posAccount,
        cardType,
        businessType,
        posName,
        posLocation,
        posEndPoint,
        businessAmount,
        businessTime,
        walletName,
        cardBalance,
      ] = $(el).find('td').map((index, td) => {
        return $(td).text();
      }).get();
      return {
        serialNo,
        posAccount,
        cardType,
        businessType,
        posName,
        posLocation,
        posEndPoint,
        businessAmount,
        businessTime,
        walletName,
        cardBalance,
      };
    }).get();
    return {
      year,
      month,
      records,
    };
  }
}
