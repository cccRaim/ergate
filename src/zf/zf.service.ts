import { HttpService, Injectable } from '@nestjs/common';
import { hex2b64, b64tohex } from './rsa/base64';
import RSAKey from './rsa/rsa';

@Injectable()
export class ZfService {
  username: string;
  password: string;
  baseURL: string;

  PUBLIC_KEY_URI: 'xtgl/login_getPublicKey.html';
  KAPTCHA_URI: 'kaptcha';
  LOGIN_URI: 'xtgl/login_slogin.html';

  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
    'Upgrade-Insecure-Requests': '1',
    language: 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    Connection: 'keep-alive',
    'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
    'Cache-Control': 'no-cache',
  };

  constructor(private readonly httpService: HttpService) {}

  init(username: string, password: string) {
    this.username = username;
    this.password = password;
    this.baseURL = this.getBaseURL();
  }

  getBaseURL(): string {
    return 'http://www.gdjw.zjut.edu.cn/';
  }

  async login() {
    this.httpService.get(this.PUBLIC_KEY_URI, {
      baseURL: this.baseURL,
    });
  }

  getCaptcha() {}

  getEncodePassword({ modulus, exponent }): string {
    const rsaKey = new RSAKey();
    rsaKey.setPublic(b64tohex(modulus), b64tohex(exponent));
    return hex2b64(rsaKey.encrypt(this.password));
  }
}
