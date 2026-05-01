const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"Overdrive Auto Shop" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Overdrive Auto Shop - Password Reset Request",
    html: `
      <div style="background-color: #121212; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e1e1e; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
          
          <div style="background-color: #FACC15; padding: 24px; text-align: center;">
            <h1 style="color: #121212; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
              Overdrive Auto Shop
            </h1>
          </div>

          <div style="padding: 40px 32px;">
            <h2 style="color: #ffffff; font-size: 22px; margin-top: 0; margin-bottom: 24px;">Password Reset Request</h2>
            
            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hello,<br><br>
              We received a request to reset the password for your Overdrive Auto Shop account. If you did not make this request, you can safely ignore this email.
            </p>

            <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              To secure your account and set a new password, click the button below. <strong style="color: #FACC15;">This link will expire in 15 minutes.</strong>
            </p>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${resetLink}" style="display: inline-block; background-color: #FACC15; color: #121212; padding: 14px 32px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                Reset My Password
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #333333; margin-bottom: 24px;">

            <p style="color: #888888; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #FACC15; text-decoration: underline; word-break: break-all;">
                ${resetLink}
              </a>
            </p>
          </div>
          
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeInviteEmail = async (toEmail, firstName, role, inviteLink) => {
  const mailOptions = {
    from: `"Overdrive Auto Shop" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Welcome to Overdrive! Your ${role} Account Activation`,
    html: `
      <div style="background-color: #121212; padding: 40px 20px; font-family: sans-serif; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1e1e1e; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #FACC15; padding: 24px; text-align: center;">
            <h1 style="color: #121212; margin: 0;">OVERDRIVE AUTO SHOP</h1>
          </div>
          <div style="padding: 40px 32px;">
            <h2 style="color: #ffffff;">Welcome to the team, ${firstName}!</h2>
            <p style="color: #cccccc; line-height: 1.6;">
              An Admin has invited you to join the Overdrive Auto Shop as a <strong>${role}</strong>.
            </p>
            <p style="color: #cccccc; line-height: 1.6; margin-bottom: 32px;">
              For security purposes, you must activate your account and set your password within the next <strong>2 hours</strong>.
            </p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${inviteLink}" style="background-color: #FACC15; color: #121212; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 6px;">
                ACTIVATE MY ACCOUNT
              </a>
            </div>
            <hr style="border-top: 1px solid #333333;">
            <p style="color: #888888; font-size: 14px;">If the button doesn't work, copy this link: <br><a href="${inviteLink}" style="color: #FACC15;">${inviteLink}</a></p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeInviteEmail,
};
