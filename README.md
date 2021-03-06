# Ergate

## Description

工大爬虫项目，简称工蚁。使用nest.js的练手，估计不会涉及到视图层和数据库层。

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## 爬虫
- 正方教务
    - 成绩
    - 课表
    - 排考
    - 空教室

- 图书馆
    - 借阅查询/个人借阅查询
    - 图书查询
    - 图书详情查询

- 一卡通
    - 余额查询
    - 今日账单查询
    - 历史账单查询

## 架构
- 正方教务
    - 基本登录逻辑
    - 账号密码加密模块
    - 验证码识别结果获取
    - httpService注入和包装

- 图书馆
    - 基本登录逻辑
    - curl模块注入/viewstate状态包装

- 一卡通
    - 基本登录逻辑
    - curl模块注入/viewstate状态包装

