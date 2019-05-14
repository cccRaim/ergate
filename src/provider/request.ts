import { Injectable, Inject, HttpService } from '@nestjs/common';
import { User } from '../interface/user.interface';
import * as path from 'path';
import * as child_process from 'child_process';
import * as GBK from 'gbk.js';
import * as cheerio from 'cheerio';

interface IRequest {
  get(user: User, url: string, config: any): Promise<any>;
  post(user: User, url: string, data: any, config: any): Promise<any>;
}

@Injectable()
export class Request implements IRequest {
  constructor(private readonly baseURL: string = '') {}

  private headers: object = {
    'Host': '172.16.10.102',
    'Cache-Control': 'max-age=0',
    'Origin': 'https://172.16.10.102',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Referer': 'https://172.16.10.102/',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    // 'language': 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
    // 'Connection': 'keep-alive',
    // 'Accept-Encoding': 'gzip, deflate, br',
  };

  public get = (user: User, url: string, config: any = {}) => {
    return this.request('get', user, url, null, config);
  }

  public post = (
    user: User,
    url: string,
    data: any = null,
    config: any = {},
  ): Promise<any> => {
    return this.request('post', user, url, data, config);
  }

  public request = (
    type: string,
    user: User,
    url: string,
    data: any = null,
    config: any = {},
  ) => {
    if (user) {
      data = Object.assign({}, user.getNetState(), data);
    }
    if (!config.baseURL) {
      url = path.join(this.baseURL, url);
    }
    return new Promise((resolve, reject) => {
      let curl = `curl -x 127.0.0.1:8888 ${url} -k -D -`;
      if (type === 'post' && data && typeof data === 'object') {
        curl += ' -X POST -d "' +
          Object.keys(data)
            .map(key => `${GBK.URI.encodeURIComponent(key)}=${GBK.URI.encodeURIComponent(data[key])}`)
            .join('&') +
          '"';
      }
      curl += ' ' + Object.keys(this.headers)
        .map(key => {
          if (key === 'User-Agent') {
            return `-A "${this.headers[key]}"`;
          }
          return `-H "${key}: ${this.headers[key]}"`;
        })
        .join(' ');
      curl += ` -H "Cookie: ${user.getCookieString()}"`;
      child_process.exec(`${curl} | iconv -f gb2312 -t utf-8`, (err, stdout, stderr) => {
        const contentChunk = stdout.split('\r\n\r\n').filter(
          i => !i.match('Connection established') && !i.match('HTTP/1.1 100 Continue'),
        );
        const [ headerString, ...body ] = contentChunk;
        const setCookiesArray = headerString.match(/Set-Cookie: [^\n\r]+/g);
        if (setCookiesArray) {
          const setCookies = setCookiesArray.map(setCookie => {
            const [key, value] = setCookie.split(':');
            return value.trim();
          });
          if (user) {
            user.setCookie(setCookies);
          }
        }
        if (user) {
          const $ = cheerio.load(body.join(''));
          const netStateList = ['__LASTFOCUS', '__VIEWSTATE', '__EVENTTARGET', '__EVENTARGUMENT', '__EVENTVALIDATION'];
          const netState = netStateList.reduce((obj, key) => {
            const el = $(`input[type=hidden][name=${key}]`);
            if (el && el.attr('name')) {
              obj[el.attr('name')] = el.attr('value');
            }
            return obj;
          }, {});
          if (netState) {
            user.setNetState(netState);
          }
        }
        resolve(body.join(''));
      });
    });
  }
}
