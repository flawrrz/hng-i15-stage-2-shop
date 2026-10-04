import { createAdminClient } from "@/lib/supabase/server";
import { isEmailConfigured, sendEmail, escapeHtml } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

/**
 * Welcome email sent after someone joins the newsletter.
 * Returns silently when Gmail SMTP credentials are missing (local dev).
 */
async function sendNewsletterConfirmationEmail(email: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("Gmail SMTP not configured, skipping newsletter confirmation");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #111827; color: white; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700;">You're Subscribed!</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">Thanks for joining our newsletter.</p>
        </div>

        <div style="padding: 32px;">
          <p style="margin: 0 0 16px;">We'll send exclusive offers, new arrivals, and style inspiration straight to <strong>${escapeHtml(email)}</strong>.</p>
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0369a1;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0369a1;">
              <li style="margin-bottom: 4px;">Watch your inbox for weekly deals</li>
              <li>Unsubscribe any time from the link in any email</li>
            </ul>
          </div>
        </div>

        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Shop - Quality Products Delivered</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Thanks for subscribing to our newsletter",
    html,
  });

  console.log("Newsletter confirmation email sent to:", email);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;

    // The newsletter form fetches this route with Accept: application/json;
    // the plain no-JS <form> posts with an HTML Accept header. JS clients
    // get JSON back (fetch would otherwise follow our success redirect with
    // a POST, landing on a 404 from the home page and logging a scary error
    // even though the signup worked).
    const wantsJson = (request.headers.get("accept") || "").includes(
      "application/json"
    );

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Create admin client for database operations
    const adminClient = createAdminClient();

    // Check if email already exists
    const { data: existing } = await adminClient
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Email already subscribed" },
        { status: 400 }
      );
    }

    // Insert new subscriber
    const { error } = await adminClient
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      console.error("Newsletter signup error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    // Send the welcome email as best effort: a failed email must never
    // undo or block a successful subscription.
    try {
      await sendNewsletterConfirmationEmail(email);
    } catch (error) {
      console.error("Failed to send newsletter confirmation email:", error);
    }

    // Success: JSON clients get an explicit 200 (a redirect would be
    // followed by fetch as a POST and 404 on the home page); the no-JS form
    // still gets redirected to /?subscribed=true for the banner fallback.
    if (wantsJson) {
      return NextResponse.json({ ok: true });
    }
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("subscribed", "true");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}