// 导入包 - require 方式
const koa = require('koa');
const Router = require('koa-router');
const mongoose = require('mongoose');
const bodyParser = require('koa-bodyparser');
const passport = require('koa-passport');
const path = require('path');
const static = require('koa-static');
//适配vue history的中间件
const { historyApiFallback } = require('koa2-connect-history-api-fallback');
const app = new koa();
const router = new Router();

const { multiRequireJs } = require('./config/util');
const { resBean, cros } = require('./middleware');

require('./models'); // 注册 models

app.use(resBean); // 统一接口返回格式
app.use(cros); // 允许跨域
app.use(historyApiFallback({ whiteList: ['/api'] })); // support vue history mode

// 托管静态文件
const staticPath = './static';
app.use(static(path.join(__dirname, staticPath)));

app.use(bodyParser()); // 需放较前位置，处理post请求，从 ctx.request.body 中获取请求内容

require('./config/passport')(passport); // 引入鉴权框架 https://segmentfault.com/a/1190000013060327
app.use(passport.initialize());
app.use(passport.session());

// 注册接口
multiRequireJs(path.join(__dirname, './routes'), { basename: true }).forEach(({ mod, name }) => {
    /**
     * 等价：
     * const users = require('./routes/user');
     * router.use('/api/user', users);
     */
    router.use(`/api/${name}`, mod);
});
// 处理身份校验失败；缺少 authorization 头、token 过期、token 无法查找到用户
router.get('/api/unauth', (ctx, next) => {
    ctx.fail({
        code: 1001,
    });
});

app.use(router.routes()).use(router.allowedMethods());

// 连接数据库
console.log('database connect...');
mongoose
    .connect(require('./config/key').mongoURL)
    .then(() => {
        console.log('database connect success');
        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`serve start at http://localhost:${port}/`);
        });
    })
    .catch(err => {
        console.log('database connect failed', err);
    });
