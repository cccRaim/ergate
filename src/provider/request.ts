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
  constructor(private readonly baseURL: string = '', private readonly iconv: boolean = false, private readonly type: string = '') {}

  private headers: object = {
    'Cache-Control': 'max-age=0',
    // 'Origin': 'https://172.16.10.102',
    // 'Upgrade-Insecure-Requests': '1',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
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
    return this.curl(type, user, url, data, config);
  }

  public curl = (
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
    const headers = Object.assign({}, this.headers, config.headers);
    return new Promise((resolve, reject) => {
      let curl = `curl ${url} -k -D -`;
      if (type === 'post' && data && typeof data === 'object') {
        const encode = this.iconv ? GBK.URI.encodeURIComponent : encodeURIComponent;
        curl += ' -X POST -d "' +
          Object.keys(data)
            .map(key => `${encode(key)}=${encode(data[key])}`)
            .join('&') +
          '"';
      }
      curl += ' ' + Object.keys(headers)
        .map(key => {
          if (key === 'User-Agent') {
            return `-A "${headers[key]}"`;
          }
          return `-H "${key}: ${headers[key]}"`;
        })
        .join(' ');
      curl += ` -H "Cookie: ${user.getCookieString()}"`;
      if (this.iconv) {
        curl += ' | iconv -f gb2312 -t utf-8';
      }
      child_process.exec(`${curl}`, (err, stdout, stderr) => {
        const contentFragment = stdout.split('\r\n')
        let headerIndex = 0;
        let spliceIndex = 0;
        for (let i = 0; i < contentFragment.length; i++) {
          if (contentFragment[i].match(/^HTTP\/1\.1 \d+ \w+/)) {
            headerIndex = i;
          }
          if (!contentFragment[i] && contentFragment[i + 1] && !contentFragment[i + 1].match(/HTTP\/1.1 \d+ \w+/)) {
            spliceIndex = i;
            break;
          }
        }
        const headerString = contentFragment.slice(headerIndex, spliceIndex).join('\n');
        const body = contentFragment.slice(spliceIndex).join('');
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
          const $ = cheerio.load(body);
          const netStateList = [
            '__LASTFOCUS',
            '__VIEWSTATE',
            '__EVENTTARGET',
            '__EVENTARGUMENT',
            '__EVENTVALIDATION',
            '__VIEWSTATEGENERATOR',
          ];
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
        resolve(body);
      });
    });
  }
}
