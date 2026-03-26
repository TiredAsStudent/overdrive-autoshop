const nodemailer = require("nodemailer");

//Configure the Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the connection immediately on server startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email Service Error: Check your Gmail App Password.", error);
  } else {
    console.log("Email Service is online and ready to send.");
  }
});

class EmailService {
  /**
   * Sends an HTML invitation email to the user.
   * @param {string} toEmail - The recipient's email address
   * @param {string} inviteLink - The unique, secure link
   * @param {string} role - The role of the user (e.g., 'STAFF', 'CUSTOMER')
   */
  static async sendInvitation(toEmail, inviteLink, role) {
    // Determine context based on the role
    const isCustomer = role === "CUSTOMER";
    const expirationText = isCustomer
      ? "This link does not expire."
      : "For security purposes, this link will expire in exactly 2 hours.";

    // The HTML Template for Overdrive Auto Shop
    const htmlTemplate = `
      <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
          
          <div style="background-color: #1a1a1a; padding: 35px 20px; text-align: center; border-bottom: 4px solid #facc15;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1.5px; text-transform: uppercase;">Overdrive</h1>
            <p style="color: #facc15; margin: 8px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Auto Shop</p>
          </div>
          
          <div style="padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px;">
            <h2 style="color: #1a1a1a; margin-top: 0; font-size: 24px;">Welcome!</h2>
            <p style="margin: 0 0 20px 0;">You have been invited to access the Overdrive system as a <strong style="color: #1a1a1a; background-color: #fef08a; padding: 3px 8px; border-radius: 4px;">${role}</strong>.</p>
            <p style="margin: 0 0 30px 0;">Please click the secure button below to activate your account and set up your password.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${inviteLink}" style="background-color: #facc15; color: #1a1a1a; padding: 16px 36px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                Activate My Account
              </a>
            </div>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #facc15; padding: 15px; border-radius: 0 6px 6px 0; margin-top: 30px;">
              <p style="font-size: 14px; color: #1a1a1a; font-weight: bold; margin: 0;">
                ⏳ ${expirationText}
              </p>
            </div>
          </div>
          
          <div style="background-color: #fafafa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #888888; margin: 0 0 10px 0; line-height: 1.5;">
              If you did not expect this invitation, please safely ignore this email.<br/>
              This is an automated message, please do not reply.
            </p>
            <p style="font-size: 12px; color: #aaaaaa; margin: 0;">
              &copy; ${new Date().getFullYear()} Overdrive Auto Shop. All rights reserved.
            </p>
          </div>
          
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Overdrive System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Invitation to Overdrive Auto Shop",
      html: htmlTemplate,
    };

    // Send the email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `Invitation sent to ${toEmail} [Message ID: ${info.messageId}]`,
      );
      return true;
    } catch (error) {
      console.error(`Failed to send email to ${toEmail}:`, error);
      throw new Error("Email dispatch failed.");
    }
  }
}

module.exports = EmailService;
