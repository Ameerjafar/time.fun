import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

export const emailService = async (email: string) => {
  const numericOtp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOption = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP for login",
    text: `Your OTP is: ${numericOtp}`, 
  };

  try {
    const info = await transporter.sendMail(mailOption);
    return { success: true, info, otp: numericOtp };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email not sent");
  }
};
