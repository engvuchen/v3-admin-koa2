const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
    {
        role_id: {
            type: String,
            required: true,
            unique: true,
        },
        resource_id: {
            type: Array,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// module.exports = mongoose.model('role', schema);
module.exports = schema;
