import nodemailer from "nodemailer";

// Create the transporter used to send emails
const transporter = nodemailer.createTransport({
    port: 465,               // true for 465, false for other ports
    host: "smtp.gmail.com",
    auth: {
        user: 'iku.soen490@gmail.com',
        pass: 'capstone2022',
    },
    secure: true,
    tls: {
        rejectUnauthorized: false
    }
});

// Export the transporter
export default transporter;