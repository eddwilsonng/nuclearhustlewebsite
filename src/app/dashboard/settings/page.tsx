import { getAccountContext } from "@/lib/account";
import { isSubscribedToDigest } from "@/lib/email/subscription";
import { SettingsRow, SettingsSection } from "@/components/ui/Settings";
import { DashboardBody, DashboardPageHeader } from "@/components/dashboard/DashboardChrome";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { DeleteAccount } from "@/components/dashboard/DeleteAccount";
import { DigestToggle } from "@/components/dashboard/DigestToggle";

export const metadata = {
  title: "Settings - Nuclear Hustle",
};

export default async function SettingsPage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;

  const email = account.user.email ?? account.profile.email;
  const subscribed = email ? await isSubscribedToDigest(email) : false;
  const hasPassword = (account.user.identities ?? []).some((identity) => identity.provider === "email");
  const usesGoogle = (account.user.identities ?? []).some((identity) => identity.provider === "google");
  const isEmployer = account.role === "employer";

  return (
    <>
      <DashboardPageHeader title="Settings" description="Login, email and account controls." />
      <DashboardBody width="form">
        <SettingsSection title="Login">
          <SettingsRow
            label="Email"
            description={
              isEmployer && !account.emailVerified
                ? "Not confirmed yet. Listings go live once it is."
                : "Used to log in. Contact us to change it."
            }
          >
            <p className="font-sans text-sm text-ink break-all">{email}</p>
            {usesGoogle ? <p className="mt-1 font-sans text-sm text-secondary">Connected to Google</p> : null}
          </SettingsRow>
          <SettingsRow
            label={hasPassword ? "Change password" : "Add a password"}
            description={
              hasPassword
                ? "At least 8 characters."
                : "You log in with Google. A password lets you log in with your email too."
            }
          >
            <ChangePasswordForm hasPassword={hasPassword} />
          </SettingsRow>
        </SettingsSection>

        <div id="email" className="scroll-mt-24">
          <SettingsSection title="Email">
            <SettingsRow
              label="Monday jobs email"
              description="The roles that went live that week, grouped by region. One email a week."
            >
              <DigestToggle subscribed={subscribed} />
            </SettingsRow>
            {isEmployer ? (
              <SettingsRow
                label="Application emails"
                description="Each listing sends applications to the address set on that listing."
              >
                <p className="font-sans text-sm text-secondary">Change it when you edit a listing.</p>
              </SettingsRow>
            ) : (
              <SettingsRow
                label="Application confirmations"
                description="Sent each time you apply on Nuclear Hustle. These can't be turned off."
              >
                <p className="font-sans text-sm text-secondary">On</p>
              </SettingsRow>
            )}
          </SettingsSection>
        </div>

        <SettingsSection title="Delete account">
          <div className="py-5">
            <DeleteAccount role={isEmployer ? "employer" : "job_seeker"} />
          </div>
        </SettingsSection>
      </DashboardBody>
    </>
  );
}
