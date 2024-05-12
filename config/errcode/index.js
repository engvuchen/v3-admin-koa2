const { multiRequireJs } = require('../util');

const name2code = {
    TOKEN_ERR: 1001,
    PERMISSIONS_NOT_MATCH: 1002,
    NOT_ADMIN: 1003,
    DATA_NOT_EXIST: 1004,
    REPEAT: 1005,
    MISS_FIELD: 1006, // 缺少字段，业务定制 msg
    ID_ERR: 1008,
};
const code2Zh = {
    1001: 'token 校验出错', // token 缺少、过期、不能找到匹配用户
    1002: '操作越权', // req 的 id 和 token id 不匹配
    1003: '非管理员',
    1004: '数据不存在', // id 在表中无记录
    1005: '数据重复 ',
    1006: '', // 缺少字段，业务定制，无默认翻译
    1008: 'ID格式错误',
};
const map = {
    ...name2code,
    ...code2Zh,
};

multiRequireJs(__dirname).forEach(obj => {
    Object.assign(map, obj);
});

module.exports = map;
