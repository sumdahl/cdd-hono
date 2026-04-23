export const verificationEmailTemplate = (
  name: string,
  verificationUrl: string,
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <tr>
              <td>
                <h2 style="margin: 0 0 16px; color: #111;">Hi ${name},</h2>
                <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
                  Thanks for signing up. Please verify your email address by clicking the button below.
                </p>
                <a href="${verificationUrl}"
                  style="display: inline-block; padding: 12px 24px; background-color: #000;
                         color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">
                  Verify Email
                </a>
                <p style="margin: 24px 0 0; color: #999; font-size: 14px;">
                  This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
