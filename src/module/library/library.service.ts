import { Injectable } from '@nestjs/common';
import { Request } from '../../provider/request';
import { LibraryUser } from './library.user';
import * as cheerio from 'cheerio';

@Injectable()
export class LibraryService {
  private LOGIN_URI = 'login.aspx';
  private HOME_URI = 'Default.aspx';
  private BORROW_URI = 'Borrowing.aspx';

  constructor(private readonly httpService: Request) {}

  public async login(user: LibraryUser) {
    await this.httpService.get(user, this.LOGIN_URI);
    const data: string = await this.httpService.post(user, this.LOGIN_URI, {
      'TextBox1': user.username,
      'TextBox2': user.password,
      'DropDownList1': 0,
      'ImageButton1.x': 40,
      'ImageButton1.y': 16,
    });

    return !!data.includes('/Default.aspx');
  }

  public async getInfo(user: LibraryUser) {
    const document = await this.httpService.get(user, this.HOME_URI);

    const $ = cheerio.load(document, {
      xml: { normalizeWhitespace: true },
    });

    return {
      borrowCount: $('#ctl00_ContentPlaceHolder1_LBnowborrow').text(),
      overdueCount: $('#ctl00_ContentPlaceHolder1_LBcq').text(),
      debetCount: $('#ctl00_ContentPlaceHolder1_LBqk').text(),
    };
  }

  public async getBorrow(user: LibraryUser, isNext = false) {
    const document = isNext ?
      await this.httpService.post(user, this.BORROW_URI, {
        ctl00$ScriptManager1: 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$GridView1',
        __EVENTTARGET: 'ctl00$ContentPlaceHolder1$GridView1',
        __EVENTARGUMENT: 'Page$Next',
        __VIEWSTATEENCRYPTED: '',
        ctl00_TreeView1_ExpandState: 'eennnnnnennnnnnnennnnnennnenn',
        ctl00_TreeView1_SelectedNode: '',
        ctl00_TreeView1_PopulateLog: '',
        __ASYNCPOST: 'true',
      }, {
        headers: {
          'Referer': 'http://210.32.205.60/Borrowing.aspx',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }) :
      await this.httpService.get(user, this.BORROW_URI);

    const $ = cheerio.load(document, {
      xml: { normalizeWhitespace: true },
    });
    const hasNext = !!$('input[src="pic/NextPage.png"]').get().length;
    const list =  $('#ctl00_ContentPlaceHolder1_GridView1 tr table:not([border="0"])').map((i, el) => {
      const title = $(el).find('tr a').text();
      const [
        collectionCode,
        collectionLocation,
        borrowDate,
        returnDate,
        renewTimes,
        status,
      ] = $(el).find('tr td span').map((index, span) => {
        return $(span).text();
      }).get();
      return {
        title,
        collectionCode,
        collectionLocation,
        borrowDate,
        returnDate,
        renewTimes,
        status,
      };
    }).get() || [];

    return hasNext ? list.concat((await this.getBorrow(user, true)) || []) : list;
  }

}
