import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create reusable transporter object using Gmail service
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''), // Strip any spaces
    },
  });
};

/**
 * 1. Send Welcome Email with 3-digit Kuri Number and Login Password
 */
export const sendMemberWelcomeEmail = async ({
  email,
  name,
  groupName,
  kuriNumber,
  monthlyInstallment,
  loginPassword,
  isNewAccount,
  appUrl,
}) => {
  try {
    const loginLink = appUrl || process.env.APP_URL || 'http://localhost:3000';
    const mailOptions = {
      from: `"Kuri Management" <${process.env.EMAIL_USER || 'noreply@kuri.com'}>`,
      to: email,
      subject: `Welcome to "${groupName}" - Your Kuri #${kuriNumber} & Login Details`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 25px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px;">കുറി ഗ്രൂപ്പിലേക്ക് സ്വാഗതം!</h1>
              <p style="margin-top: 8px; opacity: 0.95; font-size: 15px;">Welcome to ${groupName}</p>
            </div>
            
            <div style="padding: 30px; color: #334155; line-height: 1.6;">
              <p style="font-size: 18px; font-weight: bold; margin-top: 0;">പ്രിയപ്പെട്ട ${name},</p>
              <p>നിങ്ങളെ <strong>"${groupName}"</strong> എന്ന കുറി ഗ്രൂപ്പിലേക്ക് വിജയകരമായി ആഡ് ചെയ്തിരിക്കുന്നു.</p>
              
              <!-- 3-Digit Kuri Number Badge -->
              <div style="background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; display: block; font-weight: 600;">നിങ്ങളുടെ യൂണീക് കുറി നമ്പർ (Kuri Number)</span>
                <span style="font-size: 42px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; display: inline-block; margin-top: 6px;">#${kuriNumber}</span>
              </div>

              <!-- App Login Credentials Section -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #166534; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                  🔐 നിങ്ങളുടെ ആപ്പ് ലോഗിൻ വിവരങ്ങൾ (App Login Details)
                </h3>
                <p style="font-size: 14px; color: #15803d; margin-bottom: 15px;">
                  കുറി ആപ്പിൽ ലോഗിൻ ചെയ്തു നിങ്ങളുടെ പെയ്മെന്റുകൾ സമർപ്പിക്കാനും നറുക്കെടുപ്പുകൾ കാണാനും താഴെ കാണുന്ന വിവരങ്ങൾ ഉപയോഗിക്കുക:
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #475569; width: 40%;"><strong>ഇമെയിൽ (Email):</strong></td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${email}</td>
                  </tr>
                  ${
                    loginPassword
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #475569;"><strong>പാസ്‌വേഡ് (Password):</strong></td>
                    <td style="padding: 6px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #4f46e5; background: #e0e7ff; padding: 4px 8px; border-radius: 6px; display: inline-block;">${loginPassword}</td>
                  </tr>
                  `
                      : `
                  <tr>
                    <td style="padding: 6px 0; color: #475569;"><strong>പാസ്‌വേഡ്:</strong></td>
                    <td style="padding: 6px 0; color: #0f172a;">നിങ്ങളുടെ നിലവിലെ അക്കൗണ്ട് പാസ്‌വേഡ് ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക.</td>
                  </tr>
                  `
                  }
                </table>

                <div style="text-align: center; margin-top: 20px;">
                  <a href="${loginLink}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
                    ആപ്പിൽ ലോഗിൻ ചെയ്യുക (Login to App) →
                  </a>
                </div>
              </div>

              <!-- Group Details -->
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b;">പ്രതിമാസ അടവ്:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #0f172a;">₹${monthlyInstallment.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b;">ഗ്രൂപ്പ് പേര്:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #0f172a;">${groupName}</td>
                </tr>
              </table>

              <p style="margin-top: 25px; font-size: 13px; color: #64748b; line-height: 1.5;">
                * ലോഗിൻ ചെയ്ത ശേഷം നിങ്ങളുടെ പ്രൊഫൈൽ സുരക്ഷിതമാക്കാൻ പാസ്‌വേഡ് മാറ്റാവുന്നതാണ്. ഓരോ മാസവും പെയ്മെന്റ് നടത്തിയ ശേഷം ആപ്പിൽ റിക്വസ്റ്റ് സമർപ്പിക്കുക.
              </p>
            </div>

            <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} Kuri Management App. All rights reserved.
            </div>
          </div>
        </div>
      `,
    };

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_email@gmail.com' &&
      process.env.EMAIL_PASS
    ) {
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(
        'EMAIL_USER is not set to your real Gmail address in .env (currently: %s). Simulated welcome email for: %s, Number: #%s, Password: %s',
        process.env.EMAIL_USER,
        email,
        kuriNumber,
        loginPassword
      );
      return { success: false, simulated: true, reason: 'EMAIL_USER not configured in .env' };
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 2. Send Winner Announcement Email
 */
export const sendWinnerNotificationEmail = async ({
  email,
  name,
  groupName,
  kuriNumber,
  month,
  prizeAmount,
}) => {
  try {
    const mailOptions = {
      from: `"Kuri Management" <${process.env.EMAIL_USER || 'noreply@kuri.com'}>`,
      to: email,
      subject: `🎉 അഭിനന്ദനങ്ങൾ! നിങ്ങൾ "${groupName}" കുറി വിജയിയായിരിക്കുന്നു (മാസം #${month})`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 25px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
              <h1 style="margin: 0; font-size: 26px;">അഭിനന്ദനങ്ങൾ!</h1>
              <p style="margin-top: 8px; opacity: 0.95; font-size: 16px;">നിങ്ങൾക്ക് ഈ മാസത്തെ കുറി ലഭിച്ചിരിക്കുന്നു</p>
            </div>
            
            <div style="padding: 30px; color: #334155; line-height: 1.6;">
              <p style="font-size: 18px; font-weight: bold;">പ്രിയപ്പെട്ട ${name},</p>
              <p>
                <strong>"${groupName}"</strong> ഗ്രൂപ്പിന്റെ <strong>മാസം #${month}</strong> ലെ നറുക്കെടുപ്പിൽ നിങ്ങളുടെ കുറി നമ്പർ 
                <strong style="color: #059669; font-size: 20px;">#${kuriNumber}</strong> വിജയിച്ചിരിക്കുന്നു!
              </p>
              
              <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                <span style="font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 1px; display: block;">സമ്മാനത്തുക</span>
                <span style="font-size: 38px; font-weight: 800; color: #047857;">₹${prizeAmount.toLocaleString('en-IN')}</span>
              </div>

              <p style="font-size: 15px; color: #334155;">
                കുറി തുക കൈപ്പറ്റുന്നതിനായി ദയവായി ഗ്രൂപ്പ് അഡ്മിനുമായി ഉടൻ ബന്ധപ്പെടുക. തുടർന്നും ബാക്കിയുള്ള മാസങ്ങളിലെ അടവുകൾ കൃത്യമായി അടക്കാൻ ശ്രദ്ധിക്കുക.
              </p>
            </div>

            <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} Kuri Management App. All rights reserved.
            </div>
          </div>
        </div>
      `,
    };

    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_email@gmail.com' &&
      process.env.EMAIL_PASS
    ) {
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log('Winner Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(
        'EMAIL_USER is not set to your real Gmail address in .env. Simulated winner email for: %s, Prize: %s',
        email,
        prizeAmount
      );
      return { success: false, simulated: true, reason: 'EMAIL_USER not configured in .env' };
    }
  } catch (error) {
    console.error('Error sending winner email:', error);
    return { success: false, error: error.message };
  }
};
