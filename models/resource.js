const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 这里就是“功能集”
const schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        access: {
            type: Array,
            required: true,
        },
        cgi: {
            type: Array,
            required: true,
        },
    },
    {
        timestamps: true, // https://juejin.cn/post/7029514521819480095
    }
);

// module.exports = mongoose.model('resource', schema);
module.exports = schema;
