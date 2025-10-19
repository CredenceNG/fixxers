import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  getOrdersEligibleForReviewRequest,
  getOrdersWithExpiringReviewWindow,
} from "@/lib/utils/review-window";
import ReviewRequestEmail from "@/emails/review-request";
import ReviewExpiringEmail from "@/emails/review-expiring";
import { differenceInDays } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      reviewRequests: { sent: 0, failed: 0, errors: [] as string[] },
      expiringReminders: { sent: 0, failed: 0, errors: [] as string[] },
    };

    // 1. Send Review Request Emails (3 days after completion)
    try {
      const eligibleOrders = await getOrdersEligibleForReviewRequest();

      for (const order of eligibleOrders) {
        try {
          // Skip if client has no email
          if (!order.client.email) {
            results.reviewRequests.failed++;
            results.reviewRequests.errors.push(
              `Order ${order.id}: Client has no email`
            );
            continue;
          }

          // Get service name from either request or gig
          let serviceName = "your service";
          if (order.request) {
            serviceName = order.request.title;
          } else if (order.gig) {
            serviceName = order.gig.title;
          }

          // Calculate days remaining in review window (30 days from order completion)
          const daysRemaining =
            30 - differenceInDays(new Date(), order.updatedAt);

          const emailHtml = await render(
            ReviewRequestEmail({
              clientName: order.client.name || "Valued Customer",
              fixerName: order.fixer.name || "Service Provider",
              serviceName,
              orderId: order.id,
              reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review`,
              daysRemaining,
            })
          );

          await resend.emails.send({
            from: "Fixers <noreply@fixxers.com>",
            to: order.client.email,
            subject: `Share your experience with ${order.fixer.name}`,
            html: emailHtml,
          });

          results.reviewRequests.sent++;
        } catch (error) {
          results.reviewRequests.failed++;
          results.reviewRequests.errors.push(
            `Order ${order.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          console.error(
            `Failed to send review request for order ${order.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error processing review requests:", error);
      results.reviewRequests.errors.push(
        `Fetch error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // 2. Send Expiring Window Reminder Emails (27 days after completion)
    try {
      const expiringOrders = await getOrdersWithExpiringReviewWindow();

      for (const order of expiringOrders) {
        try {
          // Skip if client has no email
          if (!order.client.email) {
            results.expiringReminders.failed++;
            results.expiringReminders.errors.push(
              `Order ${order.id}: Client has no email`
            );
            continue;
          }

          // Get service name from either request or gig
          let serviceName = "your service";
          if (order.request) {
            serviceName = order.request.title;
          } else if (order.gig) {
            serviceName = order.gig.title;
          }

          // Calculate exact days remaining
          const daysRemaining =
            30 - differenceInDays(new Date(), order.updatedAt);

          const emailHtml = await render(
            ReviewExpiringEmail({
              clientName: order.client.name || "Valued Customer",
              fixerName: order.fixer.name || "Service Provider",
              serviceName,
              orderId: order.id,
              reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review`,
              daysRemaining,
            })
          );

          await resend.emails.send({
            from: "Fixers <noreply@fixxers.com>",
            to: order.client.email,
            subject: `Last chance to review ${order.fixer.name}`,
            html: emailHtml,
          });

          results.expiringReminders.sent++;
        } catch (error) {
          results.expiringReminders.failed++;
          results.expiringReminders.errors.push(
            `Order ${order.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          console.error(
            `Failed to send expiring reminder for order ${order.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error processing expiring reminders:", error);
      results.expiringReminders.errors.push(
        `Fetch error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Return summary
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalSent: results.reviewRequests.sent + results.expiringReminders.sent,
        totalFailed:
          results.reviewRequests.failed + results.expiringReminders.failed,
      },
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
