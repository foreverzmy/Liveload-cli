#!/usr/bin/env node --harmony-async-await

const http = require('http');
const Koa = require('koa');
const convert = require('koa-convert');
const statc = require('koa-static');
const path = require('path');
const fs = require('fs');
const socket = require('socket.io');

const app = new Koa();
const server = http.Server(app.callback());
const io = socket(server);

const root = process.cwd();

app
  .use(async(ctx, next) => {
    let file = ctx.path;
    if (file === '/') file = 'index.html';
    // 拦截请求html文件
    if (/\.html/.test(file) === true) {
      let absolute = path.join(root, file);
      let html = fs.readFileSync(absolute).toString();
      html = html.split('</head>');
      html = html.join(`
        <script src="/socket.io/socket.io.js"></script>
        <script>
          window.onload = function() {
            const socket = io();
            socket.on('reload', () => {
            window.location.reload();
            })
          }
        </script></head>`);
      ctx.body = html;
    } else { // 不是html文件则转到静态文件服务器
      await next();
    }
    createWatch(file);
  })
  // 将服务器设置为基本的静态文件服务器
  .use(convert(statc(root)));

server.listen('9000', () => {
  console.log('Server running at post 9000.')
});

let wathcers = {};

function createWatch(file) {
  let absolute = path.join(root, file);
  if (wathcers[absolute] === true) return;
  fs.exists(absolute, (exists) => {
    if (exists) {
      fs.watch(absolute, (e, filename) => {
        if (e === 'change') {
          console.log(e);
          io.sockets.emit('reload');
        }
      });
      wathcers[absolute] = true;
    } else {
      console.log(`${absolute} doesn't exist.`)
    }
  });
}