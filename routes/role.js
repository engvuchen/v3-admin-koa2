const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport');

const Model = require('../models').role;
// const RoleResource = require('../models').role_resource;

const {
    routerHandlers,
    getMissRequiredField,
    getRequiredFields,
    getMongoObjectId,
    getQueryObj,
} = require('../config/util');
const codemap = require('../config/errcode');

/**
 * @route GET /api/role/list
 * @req { name, page, limit }
 * @desc 获取角色列表
 */
router.get('/list', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), async ctx => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let { page, limit, ...others } = ctx.query || { page: 0, limit: 20 };
    let query = getQueryObj(['name'], others);
    let list = await Model.find(query)
        .skip(page * limit)
        .limit(limit);
    ctx.success({ data: { total: await Model.countDocuments(query).exec(), list } });
});
/**
 * @route POST /api/role/modify
 * @req { id, name }
 * @desc 新增、修改 角色
 */
router.post(
    '/modify',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { id, name } = body || {};
        let req = {
            ...(name && { name }),
            ...(id && { id }),
        };
        let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
        if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

        if (!id) {
            // 新增
            let oriData = await Model.findOne({ name }); // 字段已存在，但数据库不报错，业务进行校验；新增、编辑、检查 name 是否被占用
            if (oriData) return ctx.fail({ code: codemap.REPEAT });

            const data = new Model(req);
            let res = await data.save();
            ctx.success({ data: { id: res._id } });
        } else {
            let objectId = getMongoObjectId(body.id);
            if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

            await Model.updateOne(
                { _id: getMongoObjectId(objectId) },
                {
                    name,
                }
            );
            ctx.success({ data: { id: body.id } });
        }
    }
);
/**
 * @route POST /api/role/del
 * @req { id }
 * @desc 删除 角色
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

        // 尝试删除 role_resource 表中的关联记录
        let foundRes = await routerHandlers['role_resource.list'].call(this, ctx, next, { role_id: [objectId] });
        let info = foundRes.data.list[0];
        if (info) {
            return await routerHandlers['role_resource.del'].call(this, ctx, next, { id: info._id.toString() });
        }

        ctx.success();
    }
);

module.exports = router.routes();
