import { Resend } from "resend";
import { render } from "@react-email/render";
import BadgeApprovalEmail from "@/emails/BadgeApprovalEmail";
import BadgeRejectionEmail from "@/emails/BadgeRejectionEmail";
import BadgeMoreInfoEmail from "@/emails/BadgeMoreInfoEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Fixers <noreply@fixxers.ng>";

interface BadgeApprovalEmailData {
  to: string;
  fixerName: string;
  badgeName: string;
  badgeIcon: string;
  expiresAt: Date;
  newTier: string;
  activeBadges: number;
  profileUrl: string;
}

interface BadgeRejectionEmailData {
  to: string;
  fixerName: string;
  badgeName: string;
  badgeIcon: string;
  rejectionReason: string;
  refundAmount?: number;
  supportUrl: string;
  badgesUrl: string;
}

interface BadgeMoreInfoEmailData {
  to: string;
  fixerName: string;
  badgeName: string;
  badgeIcon: string;
  adminNotes: string;
  requestUrl: string;
  supportUrl: string;
}

/**
 * Send badge approval email to fixer
 */
export async function sendBadgeApprovalEmail(data: BadgeApprovalEmailData) {
  try {
    const emailHtml = await render(
      BadgeApprovalEmail({
        fixerName: data.fixerName,
        badgeName: data.badgeName,
        badgeIcon: data.badgeIcon,
        expiresAt: data.expiresAt,
        newTier: data.newTier,
        activeBadges: data.activeBadges,
        profileUrl: data.profileUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `🎉 Your ${data.badgeName} badge has been approved!`,
      html: emailHtml,
    });

    console.log("Badge approval email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending badge approval email:", error);
    throw error;
  }
}

/**
 * Send badge rejection email to fixer
 */
export async function sendBadgeRejectionEmail(data: BadgeRejectionEmailData) {
  try {
    const emailHtml = await render(
      BadgeRejectionEmail({
        fixerName: data.fixerName,
        badgeName: data.badgeName,
        badgeIcon: data.badgeIcon,
        rejectionReason: data.rejectionReason,
        refundAmount: data.refundAmount,
        supportUrl: data.supportUrl,
        badgesUrl: data.badgesUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Update on your ${data.badgeName} badge request`,
      html: emailHtml,
    });

    console.log("Badge rejection email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending badge rejection email:", error);
    throw error;
  }
}

/**
 * Send more information request email to fixer
 */
export async function sendBadgeMoreInfoEmail(data: BadgeMoreInfoEmailData) {
  try {
    const emailHtml = await render(
      BadgeMoreInfoEmail({
        fixerName: data.fixerName,
        badgeName: data.badgeName,
        badgeIcon: data.badgeIcon,
        adminNotes: data.adminNotes,
        requestUrl: data.requestUrl,
        supportUrl: data.supportUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Additional information needed for your ${data.badgeName} badge`,
      html: emailHtml,
    });

    console.log("Badge more info email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending badge more info email:", error);
    throw error;
  }
}

/**
 * Send test email (for development/testing)
 */
export async function sendTestBadgeEmail(
  type: "approval" | "rejection" | "more-info",
  to: string
) {
  const testData = {
    to,
    fixerName: "Test User",
    badgeName: "Identity Verified",
    badgeIcon: "🆔",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    newTier: "BRONZE",
    activeBadges: 1,
    profileUrl: "https://fixxers.ng/profile/test",
    rejectionReason:
      "This is a test rejection. In a real scenario, this would explain why the request was not approved.",
    refundAmount: 2000,
    adminNotes:
      "This is a test note requesting more information. Please provide clearer documentation.",
    requestUrl: "https://fixxers.ng/fixer/badges/requests/test",
    supportUrl: "https://fixxers.ng/support",
    badgesUrl: "https://fixxers.ng/fixer/badges",
  };

  switch (type) {
    case "approval":
      return sendBadgeApprovalEmail(testData);
    case "rejection":
      return sendBadgeRejectionEmail(testData);
    case "more-info":
      return sendBadgeMoreInfoEmail(testData);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
