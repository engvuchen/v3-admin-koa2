const path = require('path');
const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport');

const Model = require('../models').user_role;
const UserRole = Model;

const {
    routerHandlers,
    getMissRequiredField,
    getRequiredFields,
    getMongoObjectId,
    // getQueryObj,
} = require('../config/util');

const codemap = require('../config/errcode');

/**
 * @route GET /api/user_role/list
 * @req { user_id<Array>, role_id<Array>, page, limit }
 * @desc 获取用户、权限关联列表
 */
const getListHandler = async (ctx, next, data) => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let params = data || ctx.request.body || ctx.query || { page: 0, limit: 20 };
    let { page, limit, ...others } = params;

    let conditions = ['user_id', 'role_id'].reduce((obj, key) => {
        let val = params[key];
        if (val === undefined || val === '') return obj;
        obj[key] = { $in: others[key] };
        return obj;
    }, {});

    let list = await UserRole.find(conditions)
        .skip(page * limit)
        .limit(limit);

    let res = { data: { total: await Model.countDocuments(conditions).exec(), list } };
    ctx.success(res);
    return res;
};
routerHandlers['user_role.list'] = getListHandler;
router.post('/list', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), getListHandler);

/**
 * @route POST /api/user_role/modify
 * @req { user_id, role_id } 新增、编辑 数据体相同
 * @desc 新增、修改 用户权限
 */
router.post(
    '/modify',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { user_id, role_id = [] } = body || {};
        let req = {
            // ...(id && { id }),
            ...(user_id && { user_id }),
            ...(role_id && { role_id }),
        };
        let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
        if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

        let objectId = getMongoObjectId(user_id);
        if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

        let oriData = await Model.findOne({ user_id });
        if (!oriData) {
            const data = new Model(req);
            await data.save();
        } else {
            await Model.updateOne(
                { user_id },
                {
                    role_id,
                }
            );
        }

        ctx.success();
    }
);

/**
 * @route POST /api/user_role/del
 * @req { id }
 * @desc 删除 用户权限。依赖 getMongoObjectId、UserRole
 */
const delHandler = async (ctx, next, data) => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let body = data || ctx.request.body;
    let { id } = body || {};
    if (!id) return ctx.fail({ msg: `缺少id` });

    let objectId = getMongoObjectId(body.id);
    if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

    let res = await UserRole.findOneAndDelete({ _id: objectId });
    if (!res) {
        return ctx.fail({ code: codemap.DATA_NOT_EXIST });
    }
    ctx.success();
};
routerHandlers['user_role.del'] = delHandler;
router.post('/del', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), delHandler);

module.exports = router.routes();
