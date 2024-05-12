const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 列规则
const schema = new Schema(
    {
        username: {
            unique: true,
            required: true,
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        permission: {
            type: Number,
        },
        avatar: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = schema;
