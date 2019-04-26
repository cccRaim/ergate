import { HttpService, Injectable } from '@nestjs/common';
import { hex2b64, b64tohex } from './rsa/base64';
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

  public httpGet = (user, url: string, config: any = {}) => {
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
    return this.httpService.get(url, niceConfig).toPromise().then(response => {
      user && user.setCookie(response.headers['set-cookie']);
      return response.data;
    });
  }

  public httpPost = (user, url: string, data: any = null, config: any = {}) => {
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
    return this.httpService.post(url, data, niceConfig).toPromise().then(response => {
      user && user.setCookie(response.headers['set-cookie']);
      return response.data;
    });
  }

  public login = async (user, retryCount = 0) => {
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
      if (retryCount < 3) {
        return await this.login(user, retryCount + 1);
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  public async getScore(user, year, term) {
    return this.httpPost(user, this.SCORE_URI, querystring.stringify({
      'xnm': year,
      'xqm': term,
      'queryModel.showCount': 150,
    }));
  }

  getCaptcha(base64String) {
    const form = new FormData();
    form.append('img_base64', `data:image/jpeg;base64,${base64String}`);
    return this.httpPost(null, '/yzm', form, {
      baseURL: 'http://127.0.0.1:5000',
      headers: form.getHeaders(),
    })
      .then(res => res.data);

  }

  private getEncodePassword({ modulus, exponent }: PublicKeyType, password): string {
    const rsaKey = new RSAKey();
    rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent));
    return hex2b64(rsaKey.encrypt(password));
  }
}
