import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  type ClerkWebhookEvent,
  clerkWebhookEvents,
  validateClerkWebhook,
} from "@/config/clerk";
import { getEnvironmentConfig } from "@/config/environments";

/**
 * Clerk webhook handler for user lifecycle events
 * POST /api/webhooks/clerk
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("clerk-signature") || "";
    const payload = await request.text();

    // Validate webhook signature
    const config = getEnvironmentConfig();
    if (
      !validateClerkWebhook(
        payload,
        signature,
        config.CLERK_WEBHOOK_SECRET || "",
      )
    ) {
      console.error("Invalid Clerk webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    let event: { type: string; data: Record<string, unknown> };
    try {
      event = JSON.parse(payload);
    } catch (error) {
      console.error("Invalid JSON payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Validate event type
    const eventType = event.type as ClerkWebhookEvent;
    if (!clerkWebhookEvents.includes(eventType)) {
      console.warn(`Unhandled webhook event type: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    console.log(`Processing Clerk webhook: ${eventType}`, {
      eventId: event.data?.id,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (eventType) {
      case "user.created":
        await handleUserCreated(event.data);
        break;

      case "user.updated":
        await handleUserUpdated(event.data);
        break;

      case "user.deleted":
        await handleUserDeleted(event.data);
        break;

      case "session.created":
        await handleSessionCreated(event.data);
        break;

      case "session.ended":
        await handleSessionEnded(event.data);
        break;

      case "organization.created":
        await handleOrganizationCreated(event.data);
        break;

      case "organization.updated":
        await handleOrganizationUpdated(event.data);
        break;

      case "organization.deleted":
        await handleOrganizationDeleted(event.data);
        break;

      case "organizationMembership.created":
        await handleOrganizationMembershipCreated(event.data);
        break;

      case "organizationMembership.updated":
        await handleOrganizationMembershipUpdated(event.data);
        break;

      case "organizationMembership.deleted":
        await handleOrganizationMembershipDeleted(event.data);
        break;

      default:
        console.warn(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({
      received: true,
      eventType,
      eventId: event.data?.id,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Handle user created event
 */
async function handleUserCreated(userData: Record<string, unknown>) {
  try {
    console.log("Processing user.created event:", userData.id);

    // TODO: Implement user creation logic
    // - Create user record in database
    // - Set up default preferences
    // - Send welcome email
    // - Initialize user dashboard

    // Example implementation:
    // const user = await createUser({
    //   clerkId: userData.id,
    //   email: userData.email_addresses[0]?.email_address,
    //   firstName: userData.first_name,
    //   lastName: userData.last_name,
    //   imageUrl: userData.image_url,
    //   createdAt: new Date(userData.created_at),
    // });

    console.log("User created successfully:", userData.id);
  } catch (error) {
    console.error("Failed to handle user.created event:", error);
    throw error;
  }
}

/**
 * Handle user updated event
 */
async function handleUserUpdated(userData: Record<string, unknown>) {
  try {
    console.log("Processing user.updated event:", userData.id);

    // TODO: Implement user update logic
    // - Update user record in database
    // - Sync profile changes
    // - Update caching if applicable

    console.log("User updated successfully:", userData.id);
  } catch (error) {
    console.error("Failed to handle user.updated event:", error);
    throw error;
  }
}

/**
 * Handle user deleted event
 */
async function handleUserDeleted(userData: Record<string, unknown>) {
  try {
    console.log("Processing user.deleted event:", userData.id);

    // TODO: Implement user deletion logic
    // - Soft delete or hard delete user record
    // - Clean up associated data
    // - Handle data retention policies
    // - Notify relevant systems

    console.log("User deleted successfully:", userData.id);
  } catch (error) {
    console.error("Failed to handle user.deleted event:", error);
    throw error;
  }
}

/**
 * Handle session created event
 */
async function handleSessionCreated(sessionData: Record<string, unknown>) {
  try {
    console.log("Processing session.created event:", sessionData.id);

    // TODO: Implement session tracking
    // - Log user activity
    // - Update last seen timestamp
    // - Initialize session-specific data

    console.log("Session created successfully:", sessionData.id);
  } catch (error) {
    console.error("Failed to handle session.created event:", error);
    throw error;
  }
}

/**
 * Handle session ended event
 */
async function handleSessionEnded(sessionData: Record<string, unknown>) {
  try {
    console.log("Processing session.ended event:", sessionData.id);

    // TODO: Implement session cleanup
    // - Log session duration
    // - Clean up temporary data
    // - Update user statistics

    console.log("Session ended successfully:", sessionData.id);
  } catch (error) {
    console.error("Failed to handle session.ended event:", error);
    throw error;
  }
}

/**
 * Handle organization created event
 */
async function handleOrganizationCreated(orgData: Record<string, unknown>) {
  try {
    console.log("Processing organization.created event:", orgData.id);

    // TODO: Implement organization setup
    // - Create organization record
    // - Set up default settings
    // - Initialize billing if applicable

    console.log("Organization created successfully:", orgData.id);
  } catch (error) {
    console.error("Failed to handle organization.created event:", error);
    throw error;
  }
}

/**
 * Handle organization updated event
 */
async function handleOrganizationUpdated(orgData: Record<string, unknown>) {
  try {
    console.log("Processing organization.updated event:", orgData.id);

    // TODO: Implement organization update logic
    // - Update organization record
    // - Sync changes across systems

    console.log("Organization updated successfully:", orgData.id);
  } catch (error) {
    console.error("Failed to handle organization.updated event:", error);
    throw error;
  }
}

/**
 * Handle organization deleted event
 */
async function handleOrganizationDeleted(orgData: Record<string, unknown>) {
  try {
    console.log("Processing organization.deleted event:", orgData.id);

    // TODO: Implement organization cleanup
    // - Archive organization data
    // - Clean up resources
    // - Handle member transitions

    console.log("Organization deleted successfully:", orgData.id);
  } catch (error) {
    console.error("Failed to handle organization.deleted event:", error);
    throw error;
  }
}

/**
 * Handle organization membership created event
 */
async function handleOrganizationMembershipCreated(
  membershipData: Record<string, unknown>,
) {
  try {
    console.log(
      "Processing organizationMembership.created event:",
      membershipData.id,
    );

    // TODO: Implement membership setup
    // - Grant appropriate permissions
    // - Send welcome notification
    // - Initialize member-specific data

    console.log(
      "Organization membership created successfully:",
      membershipData.id,
    );
  } catch (error) {
    console.error(
      "Failed to handle organizationMembership.created event:",
      error,
    );
    throw error;
  }
}

/**
 * Handle organization membership updated event
 */
async function handleOrganizationMembershipUpdated(
  membershipData: Record<string, unknown>,
) {
  try {
    console.log(
      "Processing organizationMembership.updated event:",
      membershipData.id,
    );

    // TODO: Implement membership update logic
    // - Update permissions if role changed
    // - Sync membership data

    console.log(
      "Organization membership updated successfully:",
      membershipData.id,
    );
  } catch (error) {
    console.error(
      "Failed to handle organizationMembership.updated event:",
      error,
    );
    throw error;
  }
}

/**
 * Handle organization membership deleted event
 */
async function handleOrganizationMembershipDeleted(
  membershipData: Record<string, unknown>,
) {
  try {
    console.log(
      "Processing organizationMembership.deleted event:",
      membershipData.id,
    );

    // TODO: Implement membership cleanup
    // - Revoke permissions
    // - Clean up member-specific data
    // - Send farewell notification

    console.log(
      "Organization membership deleted successfully:",
      membershipData.id,
    );
  } catch (error) {
    console.error(
      "Failed to handle organizationMembership.deleted event:",
      error,
    );
    throw error;
  }
}
