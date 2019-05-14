export interface User {
  setNetState(state): void;
  getNetState(): object;
  setCookie(setCookies): void;
  getCookieString(): string;
}
