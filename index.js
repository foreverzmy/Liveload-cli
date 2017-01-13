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

app
  .use(async(ctx, next) => {
    let file = ctx.path;
    await next();
    createWatch(file);
  })
  // 将服务器设置为基本的静态文件服务器
  .use(convert(statc(__dirname)));

server.listen('9000', () => {
  console.log('Server running at post 9000.')
});

let wathcers = {};

function createWatch(file) {
  if (file === '/') file = 'index.html';
  let absolute = path.join(__dirname, file);
  if (wathcers[absolute] === true) return;
  fs.watch(absolute, (e, filename) => {
    if (e === 'change') {
      console.log(e);
      io.sockets.emit('reload');
    }
  });
  wathcers[absolute] = true;
}