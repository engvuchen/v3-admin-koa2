const Router = require('koa-router');
const router = new Router();
const passport = require('koa-passport');

const Model = require('../models').resource;
const Role = require('../models').role;
const RoleResource = require('../models').role_resource;
const Resource = require('../models').resource;

const {
    routerHandlers,
    getMissRequiredField,
    getRequiredFields,
    getMongoObjectId,
    getQueryObj,
} = require('../config/util');
const codemap = require('../config/errcode');

/**
 * @route GET /api/resource/list
 * @req { name, cgi, access, page, limit }
 * @desc 获取资源列表
 */
router.get('/list', passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }), async ctx => {
    let user = ctx.state.user;
    if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

    let { page, limit, ...others } = ctx.query || { page: 0, limit: 20 };
    let query = getQueryObj(['name', 'cgi', 'access'], others);
    let list = await Model.find(query)
        .skip(page * limit)
        .limit(limit);

    ctx.success({ data: { list, total: await Model.countDocuments(query).exec() } });
});
/**
 * @route GET /api/resource/self
 * @req { page, limit }
 * @res <Array> [{ id: '', name: '', resource: [ { id: '', name: '', access: [], cgi: [] } ], ... }, ...]
 * @desc 获取当前用户的资源 - 构造前端动态路由。结合多表才查出来结果，不会有 total
 */
router.get(
    '/self',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        // 用户绑定了多个角色 - 单条数据， role_id<Array>
        let userRoleRes = await routerHandlers['user_role.list'].call(this, ctx, next, { user_id: user._id });
        let userRole = userRoleRes?.data?.list?.[0]; // { user_id: '', role_id: ['', ...] }

        if (!userRole?.role_id?.length) {
            return ctx.success({ data: { total: 0, permission: user.permission || 0, list: [] } });
        }

        // 获取多个角色绑定的 资源 [ { role_id, resource_id: ['xx'] } ]
        let roleResourceList = await RoleResource.find({
            role_id: { $in: userRole.role_id },
        }); // [ { role_id: '', resource_id: ['', ...] } ]
        if (!roleResourceList.length) {
            return ctx.success({ data: { total: 0, list: [] } });
        }

        // ---- 以下查表是为了获取值的翻译
        // 获取角色翻译
        let roleIds = userRole?.role_id.map(str => getMongoObjectId(str));
        let roleMap = (
            await Role.find({
                _id: { $in: roleIds },
            })
        ).reduce((map, item) => {
            map[item._id] = item;
            return map;
        }, {});

        // 获取资源翻译
        let resourceIds = roleResourceList.reduce((arr, curr) => {
            arr.push(...curr.resource_id.map(str => getMongoObjectId(str)));
            return arr;
        }, []); // 获取 roleResource 表中的 resource_id。即角色所有绑定过的资源
        // [ { _id, name, access: [], cgi: [] }, ... ]
        let resourceMap = (
            await Resource.find({
                _id: { $in: resourceIds },
            })
        ).reduce((map, item) => {
            map[item._id] = item; // ...item 会让 item 的值变成 mongoose 的文档值
            return map;
        }, {});

        let list = [];
        roleResourceList.forEach(curr => {
            let { role_id: roleId, resource_id: resourceIds = [] } = curr;

            let resource = resourceIds.map(resId => {
                return resourceMap[resId];
            });

            list.push({
                id: roleId,
                name: roleMap[roleId].name,
                resource,
            });
        });
        // 角色ID、角色名、绑定的路由
        // [{ id: '', name: '', resource: [ { id: '', name: '', access: [], cgi: [] } ], ... }, ...]
        return ctx.success({
            data: { permission: user.permission || 0, list },
        });
    }
);

/**
 * @route POST /api/resource/modify
 * @req { id, name, access, cgi } 新增 - { name, access, cgi } 编辑 - { id, access, cgi }
 * @desc 新增、修改 资源
 */
router.post(
    '/modify',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { id, name, access = [], cgi = [] } = body || {};
        let req = {
            ...(id && { id }),
            ...(name && { name }),
            ...(access && { access }),
            ...(cgi && { cgi }),
        };
        let missField = getMissRequiredField(getRequiredFields(Model.schema), req);
        if (missField) return ctx.fail({ code: codemap.MISS_FIELD, msg: `缺少${missField}` });

        // 字段已存在，但数据库不报错，业务进行校验；新增、编辑、检查 name 是否被占用
        if (!id) {
            // 新增
            let oriData = await Model.findOne({ name });
            if (oriData) return ctx.fail({ code: codemap.REPEAT });

            const data = new Model(req);
            await data.save();
        } else {
            let objectId = getMongoObjectId(id);
            if (!objectId) return ctx.fail({ code: codemap.ID_ERR });

            let oriData = await Model.findOne({ _id: objectId }); // 字段已存在，但数据库不报错，业务进行校验；新增、编辑、检查 name 是否被占用
            if (!oriData) return ctx.fail({ code: codemap.DATA_NOT_EXIST });

            delete req.id;
            await Model.updateOne(
                { _id: objectId },
                {
                    access,
                    cgi,
                }
            );
        }
        ctx.success();
    }
);
/**
 * @route POST /api/resource/del
 * @req { id }
 * @desc 删除 资源
 */
router.post(
    '/del',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/unauth' }),
    async (ctx, next) => {
        let user = ctx.state.user;
        if (!user.permission) return ctx.fail({ code: codemap.NOT_ADMIN });

        let body = ctx.request.body;
        let { id } = body || {};
        if (!id) return ctx.fail({ msg: `缺少id` });

        let objectId = getMongoObjectId(body.id);
        if (!objectId) return ctx.fail({ code: codemap.ID_ERR });
        let res = await Model.findOneAndDelete({ _id: objectId });
        if (!res) {
            return ctx.fail({ code: codemap.DATA_NOT_EXIST });
        }
        ctx.success();
    }
);

module.exports = router.routes();
