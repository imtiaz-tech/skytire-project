export const forgotPasswordEmailTemplate = (
  projectLogo: string,
  resetUrl: string,
  customerName: string,
): string => {
  return `
  <div style="font-family: Arial, sans-serif; background-color:#f5f6fa; padding:20px;">
    
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Use this link to get back to your Smart Ride.
    </div>

    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; padding:30px;">

      <!-- Logo -->
      <div style="text-align:center; margin-bottom:20px;">
        <img src="${projectLogo}" alt="Sky Tire" style="width:90px;" />
      </div>

      <!-- Greeting -->
      <p style="font-size:16px; color:#333; font-weight:700;">
        Hi ${customerName},
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6;">
        We received a request to reset the password for your Sky Tire account. No worries — it happens to the best of us.
      </p>

      <p style="font-size:15px; color:#555; line-height:1.6;">
        Click the button below to reset your password and get back to your Smart Ride.
      </p>

      <!-- Button -->
      <div style="text-align:center; margin:30px 0;">
        <a href="${resetUrl}"
          style="background-color:#184B99; color:#ffffff; padding:14px 28px;
          text-decoration:none; font-size:16px; border-radius:5px; display:inline-block;">
          Reset Password
        </a>
      </div>

      <p style="font-size:15px; color:#555;">
        This link will expire in <b>60 minutes</b> for your security.
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />

      <p style="font-size:15px; color:#333;"><b>Didn't request this?</b></p>
      <p style="font-size:15px; color:#555; line-height:1.6;">
        If you didn’t ask to reset your password, you can safely ignore this email.
        Your password will remain the same, and your account stays secure.
      </p>

      <p style="font-size:15px; color:#333;"><b>Need a hand?</b></p>
      <p style="font-size:15px; color:#555; line-height:1.6;">
        Our team is here to help you with fitment, orders, or technical issues.
        Just email us at <a href="mailto:info@skytire.com">info@skytire.com</a>
        or visit our support center.
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />

      <!-- Footer -->
      <p style="font-size:15px; color:#333; font-weight:700; margin:0;">
        The Sky Tire Team<br/>
        Smart Rides. Original Style.
      </p>

      <p style="font-size:15px; color:#333; margin-top:20px; font-weight:700;">
        Sky Tires & Wheels Inc.<br/>
        Sacramento, CA
      </p>

      <p style="font-size:15px; color:#999;">
        <a href="#">Privacy Policy</a> |
        <a href="#">Terms of Service</a> |
        <a href="#">Blogs</a>
      </p>

    </div>
  </div>
  `;
};