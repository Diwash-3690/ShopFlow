const jwt = require("jsonwebtoken");
const Owner = require("../models/Owner");
const bcrypt = require("bcryptjs");


// Register Owner
const registerOwner = async (req, res) => {
   
    try {

        const {
            shopName,
            ownerName,
            mobile,
            password,
            shopNumber,
            location
        } = req.body ??{};


        const existingOwner = await Owner.findOne({ mobile });

        if (existingOwner) {
            return res.status(400).json({
                success: false,
                message: "Owner already registered with this mobile number"
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const owner = await Owner.create({

            shopName,
            ownerName,
            mobile,
            password: hashedPassword,
            shopNumber,
            location

        });


        res.status(201).json({

            success: true,
            message: "Owner registered successfully",
            owner

        });


    } catch (error) {
        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};
const loginOwner = async (req, res) => {

    try {

        const { mobile, password } = req.body;


        const owner = await Owner.findOne({ mobile });


        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Owner not found"
            });
        }


        const isMatch = await bcrypt.compare(
            password,
            owner.password
        );


        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }


        const token = jwt.sign(
            {
                id: owner._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        res.json({

            success: true,
            message: "Login successful",

            token,

            owner: {
                id: owner._id,
                shopName: owner.shopName,
                ownerName: owner.ownerName,
                mobile: owner.mobile
            }

        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    registerOwner,
    loginOwner,
};