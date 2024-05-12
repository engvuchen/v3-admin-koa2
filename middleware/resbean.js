/**
 * 统一接口返回格式： { code, msg data }
 *
 * 使用：
 * app.use(respBean)
 * ctx.success({ code, msg, data }, )
 */

const codemap = require('../config/errcode');

async function respBean(ctx, next) {
    ctx.success = function ({ code = 0, msg = '成功', data } = { code: 0, msg: '成功' }, status = 200) {
        ctx.status = status;
        // ctx.type = 'json';
        ctx.body = {
            code,
            msg,
            data,
        };
    };
    ctx.fail = function ({ code = -1, msg = '失败' } = { code: -1, msg: '失败' }, status = 200) {
        ctx.status = status;
        // ctx.type = 'json';
        ctx.body = {
            code,
            msg: codemap[code] || msg,
        };
    };
    await next();
}

module.exports = respBean;
