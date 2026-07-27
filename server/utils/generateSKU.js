const Product = require("../models/Product");

const generateSKU = async () => {
    const count = await Product.countDocuments();

    return `SF-${String(count + 1).padStart(6, "0")}`;
};

module.exports = generateSKU;