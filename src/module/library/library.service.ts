import { Injectable } from '@nestjs/common';
import { Request } from '../../provider/request';
import { LibraryUser } from './library.user';
import * as cheerio from 'cheerio';

@Injectable()
export class LibraryService {
  private LOGIN_URI = 'login.aspx';
  private HOME_URI = 'Default.aspx';
  private BORROW_URI = 'Borrowing.aspx';
  private SEARCH_URI = 'Search.aspx';
  private BOOK_URI = 'Book.aspx';

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

  public async getBookInfo(user: LibraryUser, id: string) {
    const document = await this.httpService.get(user, `${this.BOOK_URI}?id=${id}`);

    const $ = cheerio.load(document);

    const [
      title,
      series,
      author,
      ISBN,
      callNumber,
      callType,
      price,
      publishLocation,
      topic,
      type,
      publishDate,
      publisher,
    ] = $('#ctl00_ContentPlaceHolder1_DetailsView1 tr td span[id]').map((index, span) => {
      return $(span).text();
    }).get();

    const collections = $('#ctl00_ContentPlaceHolder1_GridView1 tr:not([align="center"])').map((index, tr) => {
      const [
        collectionLocation,
        barcode,
        collectionCode,
        borrowDate,
        returnDate,
        status,
      ] = $(tr).find('td').map((i, td) => {
        return $(td).text().replace(/\s+/g, ' ').trim();
      }).get();
      return {
        collectionLocation,
        barcode,
        collectionCode,
        borrowDate,
        returnDate,
        status,
      };
    }).get();

    const coverIframe = $('#ctl00_ContentPlaceHolder1_DuXiuImage').attr('src');

    return {
      id,
      coverIframe,
      title,
      series,
      author,
      ISBN,
      callNumber,
      callType,
      price,
      publishLocation,
      topic,
      type,
      publishDate,
      publisher,
      collections,
    };
  }

  public async search(user: LibraryUser, wd: string, page = null) {
    await this.httpService.get(user, this.SEARCH_URI);
    const postData: any = {
      ctl00$ContentPlaceHolder1$TBSerchWord: wd,
      __ASYNCPOST: true,
      __VIEWSTATEENCRYPTED: '',
    };

    const searchData = {
      'ctl00$ScriptManager1': 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$SearchButton',
      'ctl00$ContentPlaceHolder1$SearchButton.x': '23',
      'ctl00$ContentPlaceHolder1$SearchButton.y': '21',
    };

    const jumpData = {
      ctl00$ScriptManager1: 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$AspNetPager1',
      ctl00$ContentPlaceHolder1$AspNetPager1_input: page,
      __EVENTTARGET: 'ctl00$ContentPlaceHolder1$AspNetPager1',
    };

    if (page) {
      const initDocument = await this.httpService.post(user, this.SEARCH_URI, Object.assign({}, postData, searchData));
      const initData = {}
      initDocument.match(/\d+\|hiddenField\|([\w\W]*?)\|([\w\W]*?)\|/g).forEach(item => {
        const [id, hiddenField, key, value ] = item.split('|');
        initData[key] = value;
      })
      Object.assign(postData, initData, jumpData);
    } else {
      Object.assign(postData, searchData);
    }

    const document = (await this.httpService.post(user, this.SEARCH_URI, postData));

    const $ = cheerio.load(document);

    const total = +($('#ctl00_ContentPlaceHolder1_Label13').text().replace(/\D/g, '')) || 0;
    const totalPages = +$('select option').last().val() || 0;
    const currentPage = +$('#ctl00_ContentPlaceHolder1_AspNetPager1 span').text() || 1;

    const list =  $('#ctl00_ContentPlaceHolder1_GridView1 tr table:not([border="0"])').map((i, el) => {
      const title = $(el).find('tr a').text();
      const id = $(el).find('tr a').attr('href').replace(/\D/g, '');
      const [
        series,
        callNumber,
        author,
        publisher,
        publishDate,
        topic,
        language,
      ] = $(el).find('tr td span[id]').map((index, span) => {
        return $(span).text();
      }).get();
      return {
        id,
        title,
        series,
        callNumber,
        author,
        publisher,
        publishDate,
        topic,
        language,
      };
    }).get() || [];

    return {
      total,
      page: currentPage || 1,
      limit: 8,
      totalPages,
      list,
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

    const $ = cheerio.load(document);
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
