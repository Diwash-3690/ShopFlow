const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema(
    {
        shopName: {
            type: String,
            required: true,
            trim: true,
        },

        ownerName: {
            type: String,
            required: true,
            trim: true,
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        shopNumber: {
            type: String,
            default: "",
            trim: true,
        },

        location: {
            latitude: Number,
            longitude: Number,
            address: {
                type: String,
                default: "",
            },
        },

        isMobileVerified: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Owner", ownerSchema);