import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // app password
  },
});

export const sendVerificationEmail = async (toEmail, token) => {
  const verificationLink = `http://localhost:5000/api/auth/verify/${token}`; // adjust to your backend route

  await transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Click below to verify your email:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
  });
};
