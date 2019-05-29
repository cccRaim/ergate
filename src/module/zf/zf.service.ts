import { HttpService, Injectable } from '@nestjs/common';
import { hex2b64, b64tohex } from './rsa/base64';
import { ZfUser } from './zf.user';
import * as RSAKey from './rsa/rsa';
import * as FormData from 'form-data';
import * as querystring from 'querystring';

interface PublicKeyType {
  modulus: string;
  exponent: string;
}

@Injectable()
export class ZfService {
  private baseURL: string = 'http://www.gdjw.zjut.edu.cn/';
  private PUBLIC_KEY_URI: string = '/xtgl/login_getPublicKey.html';
  private KAPTCHA_URI: string = '/kaptcha';
  private LOGIN_URI: string = '/xtgl/login_slogin.html';
  private SCORE_URI: string = 'cjcx/cjcx_cxDgXscj.html?doType=query';
  private SCORE_DETAIL_URI: string = 'cjcx/cjcx_cxXsKccjList.html';
  private TIMETABLE_URI: string = 'kbcx/xskbcx_cxXsKb.html?gnmkdm=N2151';
  private EXAM_URI: string = '/kwgl/kscx_cxXsksxxIndex.html?doType=query&gnmkdm=N358105';
  private FREE_ROOM_URI: string = '/cdjy/cdjy_cxKxcdlb.html?doType=query&gnmkdm=N2155';

  private headers: object = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
    'Upgrade-Insecure-Requests': '1',
    'language': 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
    'Cache-Control': 'no-cache',
  };

  constructor(private readonly httpService: HttpService) {}

  public httpGet = (user: ZfUser, url: string, config: any = {}) => {
    return this.httpFetch('get', user, url, null, config);
  }

  public httpPost = (user: ZfUser, url: string, data: any = null, config: any = {}) => {
    return this.httpFetch('post', user, url, data, config);
  }

  public httpFetch = (type: string, user: ZfUser, url: string, data: any = null, config: any = {}) => {
    const headers = config.headers || {};
    const niceConfig = ({
      ...config,
      headers: {
        ...this.headers,
        ...headers,
        Cookie: user ? user.getCookieString() : null,
      },
    });
    if (!config.baseURL) {
      niceConfig.baseURL = this.baseURL;
    }
    const httpXHR = type === 'post' ? this.httpService.post(url, data, niceConfig) : this.httpService.get(url, niceConfig);
    return httpXHR.toPromise().then(response => {
      if (user) {
        user.setCookie(response.headers['set-cookie']);
      }
      return response.data;
    });
  }

  public login = async (user: ZfUser, retryCount = 1) => {
    // 获取加密密码的key
    const publicKey: PublicKeyType = await this.httpGet(user, `${this.PUBLIC_KEY_URI}?time=${new Date().getTime()}`);
    // 加密密码
    const encodePassword = this.getEncodePassword(publicKey, user.password);
    // 获取验证码图片
    const kaptchaResponse = await this.httpGet(user, this.KAPTCHA_URI, {
      responseType: 'arraybuffer',
    });
    const kaptchaBase64: string = kaptchaResponse.toString('base64');
    // 识别验证码图片
    const captcha = await this.getCaptcha(kaptchaBase64);

    // 登录
    const loginResponse = await this.httpPost(user, `${this.LOGIN_URI}`, querystring.stringify({
      yhm: user.username,
      mm: encodePassword,
      yzm: captcha,
    }));
    if (typeof loginResponse === 'string' && loginResponse.match('验证码输入错误！')) {
      if (retryCount > 0) {
        return await this.login(user, retryCount - 1);
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  public async getScore(user: ZfUser, year, term) {
    return this.httpPost(user, this.SCORE_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'queryModel.showCount': 150,
    }));
  }

  public async getScoreDetail(user: ZfUser, year, term) {
    return this.httpPost(user, this.SCORE_DETAIL_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'queryModel.showCount': 150,
    }));
  }

  public async getTimetable(user: ZfUser, year, term) {
    return this.httpPost(user, this.TIMETABLE_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'queryModel.showCount': 150,
    }));
  }

  public async getExam(user: ZfUser, year, term) {
    return this.httpPost(user, this.EXAM_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'ksmcdmb_id': '',
      'kch': '',
      'kc': '',
      'ksrq': '',
      'queryModel.showCount': 150,
    }));
  }

  public async getFreeRoom(user: ZfUser, { year, term, area, weekdays, weeks, lessons }) {
    return this.httpPost(user, this.FREE_ROOM_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'xqh_id': area, // 02 校区id
      'xqj': weekdays, // 1,2,3,4,5,6,7 星期几
      'zcd': weeks, // 262143 周次，所选的周的2的次方 之和
      'jcd': lessons, // 4095 节次，所选的节的2的次方 之和
      // 以下为默认字段
      'fwzt': 'cx',
      'jyfs': 0,
      '_search': false,
      'time': 1,
      'nd': new Date().getTime(),
      // 以下为置空字段
      'cdlb_id': '',
      'cdejlb_id': '',
      'qszws': '',
      'jszws': '',
      'cdmc': '',
      'qssd': '',
      'lh': '',
      'jssd': '',
      'qssj': '',
      'jssj': '',
      'cdjylx': '',

      'queryModel.showCount' : 1500,
    }));
  }

  getCaptcha(base64String) {
    const form = new FormData();
    form.append('img_base64', `data:image/jpeg;base64,${base64String}`);
    return this.httpPost(null, '/yzm', form, {
      baseURL: 'http://172.16.32.50',
      headers: form.getHeaders(),
      timeout: 5000,
    })
      .then(res => res.data);

  }

  private getEncodePassword({ modulus, exponent }: PublicKeyType, password): string {
    const rsaKey = new RSAKey();
    rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent));
    return hex2b64(rsaKey.encrypt(password));
  }
}
