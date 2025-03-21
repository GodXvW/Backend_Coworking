const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, text) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    let mailOptions = {
        from: `"Coworking Space" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to);
        console.log("Email sent with ID:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
    
};

module.exports = sendEmail;
