const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        user_id: {
            required: true,
            unique: true,
            type: String,
        },
        role_id: {
            type: Array,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = schema;
