import { EMAIL_SANS } from './emailShell';

export function communityEmailFooter(utmMedium: string): string {
  const facebookUrl = `https://www.facebook.com/groups/1086918477294291?utm_source=email&utm_medium=${utmMedium}&utm_campaign=community`;
  const linkedinUrl = `https://www.linkedin.com/showcase/129954376?utm_source=email&utm_medium=${utmMedium}&utm_campaign=community`;

  return `
    <table role="presentation" style="width: 100%; margin: 32px 0; border: 1px solid #E7E5E4; border-collapse: collapse;">
      <tr>
        <td style="padding: 24px;">
          <p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.6; color: #292524; margin: 0 0 16px;">
            Join <strong>US Nuclear Jobs - via NuclearHustle.com</strong> on Facebook for a daily pick.
          </p>
          <table role="presentation" style="border-collapse: separate; border-spacing: 8px 0;">
            <tr>
              <td>
                <a href="${facebookUrl}" style="display: inline-block; min-height: 40px; padding: 0 16px; font-family: ${EMAIL_SANS}; font-size: 14px; font-weight: 600; line-height: 40px; color: #1C1917; background-color: #FDE047; border: 1px solid #FACC15; text-decoration: none; border-radius: 4px;">
                  Join Facebook group
                </a>
              </td>
              <td>
                <a href="${linkedinUrl}" style="display: inline-block; min-height: 40px; padding: 0 16px; font-family: ${EMAIL_SANS}; font-size: 14px; font-weight: 600; line-height: 40px; color: #1C1917; background-color: #FAFAF9; border: 1px solid #D6D3D1; text-decoration: none; border-radius: 4px;">
                  Follow on LinkedIn
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
