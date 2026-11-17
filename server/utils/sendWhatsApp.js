const sendWhatsApp = async (mobile, pdfPath) => {
    try {

        console.log("=================================");
        console.log("Sending WhatsApp Bill");
        console.log("Customer:", mobile);
        console.log("Invoice:", pdfPath);
        console.log("=================================");

        return {
            success: true,
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            message: error.message,
        };

    }
};

module.exports = sendWhatsApp;