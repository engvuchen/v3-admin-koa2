const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

let routerHandlers = {};

// bcrypt 把密码变为 hash，存储到 数据库中
function enbcrypt(password) {
    //　https://www.npmjs.com/package/bcrypt
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    return hash;
}
/**
 * 批量导入文件夹中的 js 文件夹 - 仅第一层
 * @param {String} folderPath
 * @param {Object} options - {basename, skips}
 * @returns [ mod ] 或 [{ mode, basename }]
 */
function multiRequireJs(folderPath = '', { basename = false, skips = [] } = {}) {
    const files = fs.readdirSync(folderPath);

    const modules = files.reduce((list, file) => {
        const filePath = path.join(folderPath, file); // 获取文件的完整路径

        if (path.extname(filePath) !== '.js' || skips.includes(file)) return list;

        const mod = require(filePath);

        if (basename) {
            list.push({ mod, name: path.basename(file, '.js') });
        } else {
            list.push(mod);
        }

        return list;
    }, []);

    return modules;
}

// 获取 model 所有具有required = true的字段。使用：getRequiredFields(User.schema);
function getRequiredFields(schema) {
    const requiredFields = [];

    // console.log('schema', schema);

    // 遍历模型的所有字段
    Object.values(schema.paths).forEach(conf => {
        if (conf.isRequired) {
            requiredFields.push(conf.path);
        }
    });

    // schema.paths.forEach(path => {
    //     if (path.options.required) {
    //         requiredFields.push(path.name);
    //     }
    // });

    return requiredFields;
}
// 返回 req 中 schema 的缺失字段
function getMissRequiredField(requireFields, data) {
    return requireFields.find(key => data[key] === undefined);
}

/** id 转为 ObjectId */
function getMongoObjectId(id) {
    const mongoose = require('mongoose');
    let objectId;
    try {
        objectId = new mongoose.Types.ObjectId(id); // input must be a 24 character hex string, 12 byte Uint8Array, or an integer
    } catch (error) {}
    return objectId;
}
/**
 * 获取 find 的查询对象。默认 keys 中都需要支持模糊查询
 * @params {Array} keys
 * @params {Object} data { [key]: { $regex: val, $options: 'i' }, } //字符串 模糊查询
 */
function getQueryObj(keys = [], data) {
    let query = {};

    let result = keys.reduce((list, key) => {
        let val = data[key];
        if (val === undefined || val === '') return list;

        list.push({
            [key]: { $regex: val, $options: 'i' }, // 字符串 模糊查询
        });
        return list;
    }, []);

    if (result.length) {
        query.$and = result;
    }

    return query;
}

function sleep(delay = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delay);
    });
}

module.exports = {
    routerHandlers,
    enbcrypt,
    multiRequireJs,
    getRequiredFields,
    getMissRequiredField,
    getMongoObjectId,
    getQueryObj,
    sleep,
};
