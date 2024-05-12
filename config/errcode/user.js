// 1101

const name2code = {
    USER_PASSWORD_ERR: 1101,
    USER_REPEAT: 1102,
};

const code2Zh = {
    1101: '密码错误',
    1102: '用户名重复',
};

const map = {
    ...name2code,
    ...code2Zh,
};

module.exports = map;
