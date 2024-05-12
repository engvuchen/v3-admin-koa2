const path = require('path');
const mongoose = require('mongoose');
const { multiRequireJs } = require('../config/util');

const models = {};

if (Object.keys(models).length === 0) {
    // 注册 model
    const list = multiRequireJs(path.join(__dirname, '../models'), { basename: true, skips: ['index.js'] });
    list.forEach(({ mod: schema, name }) => {
        models[name] = mongoose.model(name, schema);
    });
}

module.exports = models;
