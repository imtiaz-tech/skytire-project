export const forgotPasswordEmailTemplate = (
  projectLogo: string,
  resetUrl: string,
  projectName: string,
): string => {
  return `<div>
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 20px;">
        <div style="width: 100%; text-align: center;">
        <img style="width: 70px; display: inline-block" src="${projectLogo}" alt="${projectName}"/>
        </div>
        <h2 style="text-align: center; color: #184B99">Reset Password</h2>
        <p style="text-align: center"> Please click the button below to reset your password for ${projectName} account </p>
        <div style="text-align: center; margin: 20px 0">
         <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #184B99; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 4px;">Reset Password</a>
        </div>
        <p style="text-align: center"> If you have not performed this action, please ignore this email </p>
      </div>
    </div>
  </div>`;
};
