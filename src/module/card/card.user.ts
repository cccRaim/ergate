import { User } from '../../interface/user.interface';

export class CardUser implements User {
  private cookies = {};
  private netState = {};
  public username;
  public password;

  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  public setNetState(state) {
    this.netState = Object.assign({}, this.netState, state);
  }

  public getNetState() {
    return this.netState;
  }

  public setCookie(setCookies) {
    if (!setCookies) { return; }
    Object.assign(this.cookies, setCookies.map(item => item.match(/([^=]+)=([^;]*)/)).reduce((result, match) => {
      if (!match) { return result; }
      result[match[1]] = match[2];
      return result;
    }, {}));
  }

  public getCookieString() {
    const cookies = this.cookies;
    for (const key in cookies) {
      if (!cookies[key]) {
        delete cookies[key];
      }
    }
    return Object.keys(cookies).map(key => {
      return `${key}=${cookies[key]}`;
    }).join(';');
  }

}
