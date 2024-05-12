const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport');

const Model = require('../models').role_resource;
const RoleResource = Model;

const {
    routerHandlers,
    getMissRequiredField,
    getRequiredFields,
    // getQueryObj,
    getMongoObjectId,
} = require('../config/util');
const codemap = require('../config/errcode');

/**
 * @route GET /api/role_resource/list
 * @req { role_id, resource_id, page, limit }
 * @desc 获取 role、resource 关联列表。依赖 RoleResource / getQueryObj
 */
const getListHandler = async (ctx, next, data) => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let params = data || ctx.request.body || ctx.query || { page: 0, limit: 20 };
    let { page, limit, ...others } = params;

    // todo 逗号连接的字符串 或 post 处理，role_id、resource_id 是数组，get 不好传

    let conditions = ['role_id', 'resource_id'].reduce((obj, key) => {
        let val = params[key];
        if (val === undefined || val === '') return obj;
        obj[key] = { $in: others[key] };
        return obj;
    }, {});

    let list = await RoleResource.find(conditions)
        .skip(page * limit)
        .limit(limit);

    let res = { data: { total: await Model.countDocuments(conditions).exec(), list } };
    ctx.success(res);
    return res;
};
routerHandlers['role_resource.list'] = getListHandler;
router.post('/list', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), getListHandler);
/**
 * @route POST /api/role_resource/modify
 * @req { role_id, resource_id }
 * @desc 新增、修改 用户权限
 */
router.post(
    '/modify',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { role_id, resource_id } = body || {};
        let req = {
            // ...(id && { id }),
            ...(role_id && { role_id }),
            ...(resource_id && { resource_id }),
        };
        let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
        if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

        let objectId = getMongoObjectId(role_id);
        if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

        let oriData = await Model.findOne({ role_id });
        // 数据不存在，则新增
        if (!oriData) {
            const data = new Model(req);
            await data.save();
        } else {
            await Model.updateOne(
                { _id: oriData._id },
                {
                    resource_id,
                }
            );
        }

        ctx.success();
    }
);

/**
 * @route POST /api/role_resource/del
 * @req { id }
 * @desc 删除 用户权限。依赖 RoleResource / getMongoObjectId
 */
const delHandler = async (ctx, next, data) => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let body = data || ctx.request.body;
    let { id } = body || {};
    if (!id) return ctx.fail({ msg: `缺少id` });

    let objectId = getMongoObjectId(body.id);
    if (!objectId) return ctx.fail({ code: codemap.ID_ERR });
    let res = await RoleResource.findOneAndDelete({ _id: objectId });
    if (!res) {
        return ctx.fail({ code: codemap.DATA_NOT_EXIST });
    }
    ctx.success();
};
routerHandlers['role_resource.del'] = delHandler;
router.post('/del', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), delHandler);

module.exports = router.routes();
