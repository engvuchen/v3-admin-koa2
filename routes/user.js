const Router = require('koa-router');
const router = new Router();
// const mongoose = require('mongoose');
const passport = require('koa-passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const Model = require('../models').user;
// const UserRole = require('../models').user_role;

const {
    routerHandlers,
    enbcrypt,
    getRequiredFields,
    getMissRequiredField,
    getMongoObjectId,
    getQueryObj,
    // sleep,
} = require('../config/util');
const keys = require('../config/key');
const codemap = require('../config/errcode');

/**
 * @route GET /api/user/list
 * @desc 获取用户列表
 * @req { id, username, page, limit }
 * @res [{ id, username, avatar }]
 */
router.get('/list', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), async ctx => {
    let user = ctx.state.user;

    let { page, limit, ...others } = ctx.query || { page: 0, limit: 20 };
    if (others.id) {
        let objectId = getMongoObjectId(others.id);
        if (!objectId) return ctx.fail({ code: codemap.ID_ERR });
        others._id = objectId;
        delete others.id;
    }

    if (!user.permission) {
        if (!others.id) return ctx.fail({ code: codemap.NOT_ADMIN }); // 不是管理员，只能查自己的身份
        if (user._id !== others._id) return ctx.fail({ code: codemap.PERMISSIONS_NOT_MATCH });
    }

    let query = getQueryObj(['_id', 'username'], others);
    let list = (
        await Model.find(query)
            .skip(page * limit)
            .limit(limit)
    ).reduce((arr, curr) => {
        // 管理员还是需要配置角色
        // if (!curr.permission) {
        arr.push({
            id: curr._id,
            username: curr.username,
            avatar: curr.avatar || '',
        });
        // }
        return arr;
    }, []);
    ctx.success({ data: { total: await Model.countDocuments(query).exec(), list } });
});
/**
 * @route GET /api/user/info
 * @desc 获取自己的用户信息
 * @req {}
 * @res [{ id, username }]
 */
router.get('/info', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), async ctx => {
    let user = ctx.state.user;
    ctx.success({
        data: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
            ...(user.permission ? { permission: user.permission } : {}),
        },
    });
});

/**
 * @route POST /api/user/upd
 * @req { id, username, password, avatar }
 * @desc 修改用户信息（username、password、avatar，任一存在即可）。需 token
 */
router.post(
    '/upd',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let body = ctx.request.body || {};
        let { id, username, password, avatar } = body;
        if (!id) return ctx.fail({ msg: `缺少id` });

        let data = {
            ...(username && { username }),
            ...(password && { password }),
            ...(avatar && { avatar }),
        };
        if (!Object.keys(data).length) return ctx.fail({ codemap: codemap.MISS_FIELD, msg: `没有修改内容` });

        if (username) {
            let found = await Model.findOne({ username });
            if (found && found._id.toString() !== id) {
                return ctx.fail({ code: codemap.USER_REPEAT });
            }
        }
        if (password) {
            data.password = await enbcrypt(password);
        }

        await Model.updateOne({ _id: id }, data);

        ctx.success();
    }
);
/**
 * @route POST api/user/register
 * @req { username, password }
 * @res { username, id, token }
 * @desc 用户注册
 * @access public
 */
router.post('/register', async (ctx, next) => {
    const body = ctx.request.body; // 添加 bodyParser 之后，post 的请求体在 ctx.request.body 中

    let {
        username,
        password,
        avatar = 'https://engvu.oss-cn-shenzhen.aliyuncs.com/d7e82bf5d3fb86865659dc2a8a375265.webp',
    } = body || {};
    let req = {
        ...(username && { username }),
        ...(password && { password }),
        ...(avatar && { avatar }),
    };
    let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
    if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

    const found = await Model.findOne({ username: body.username });
    if (found) {
        // await sleep();
        return ctx.fail({ code: codemap.REPEAT });
    }

    const data = new Model({
        username,
        password: await enbcrypt(password), // password 加密
        avatar: avatar,
    });
    let res = await data.save();
    const payload = { id: res._id };
    const token = jwt.sign(payload, keys.secretOrKey, { expiresIn: keys.expiresIn }); // 1、token包含的内容 2、加密关键字 3、过期时间

    ctx.success({ data: { username: res.username, id: res._id, token: 'Bearer ' + token } });
});
/**
 * @route POST api/user/login
 * @req { username, password }
 * @res { token }
 * @desc 登录接口地址，返回token
 * @access public
 * 用户登录校验成功，返回 token（token存储了用户信息）
 */
router.post('/login', async (ctx, next) => {
    const body = ctx.request.body; // { username, password }

    let { username, password } = body;
    let req = {
        ...(username && { username }),
        ...(password && { password }),
    };
    let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
    if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

    const found = await Model.findOne({ username });
    if (!found) return ctx.fail({ code: codemap.DATA_NOT_EXIST });

    let result = await bcrypt.compareSync(password, found.password); // 密码比对
    if (!result) return ctx.fail({ code: codemap.USER_PASSWORD_ERR });

    const payload = { id: found._id };
    const token = jwt.sign(payload, keys.secretOrKey, { expiresIn: keys.expiresIn });

    ctx.success({ data: { token: 'Bearer ' + token } });
});
/**
 * @route POST /api/user/del
 * @req { id }
 * @desc 删除用户
 */
router.post(
    '/del',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { id } = body || {};
        if (!id) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少id` });

        let objectId = getMongoObjectId(body.id);
        if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

        let res = await Model.findOneAndDelete({ _id: objectId });
        if (!res) {
            return ctx.fail({ code: codemap.DATA_NOT_EXIST });
        }

        // 尝试删除 user_role 表中的关联记录
        let foundRes = await routerHandlers['user_role.list'].call(this, ctx, next, { user_id: objectId });
        let info = foundRes.data.list[0];
        if (info) {
            return await routerHandlers['user_role.del'].call(this, ctx, next, { id: info._id.toString() });
        }

        ctx.success();
    }
);

module.exports = router.routes();
