"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import { userRole } from "../schema";

/**
 * Create a user in Clerk first, then insert the Convex record.
 *
 * Requires the CLERK_SECRET_KEY environment variable to be set in the
 * Convex dashboard.
 *
 * The new user is automatically placed into the caller's tenant.
 */
export const createUserWithClerk = action({
  args: {
    username: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    password: v.string(),
    role: userRole,
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Verify caller is authenticated and resolve their tenant
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("غير مصرح: يرجى تسجيل الدخول");
    }

    // Look up the calling user to get their defaultTenantId
    const callerUser: any = await ctx.runQuery(
      api.users.queries.getCurrentUser,
      {}
    ).catch(() => null);

    // SUPERADMIN creates users inside the tenant they're viewing
    const defaultTenantId = callerUser?.role === "SUPERADMIN"
        ? (callerUser.viewingTenantId ?? callerUser.defaultTenantId ?? undefined)
        : (callerUser?.defaultTenantId ?? undefined);

    // 2. Get Clerk secret key from environment
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error(
        "CLERK_SECRET_KEY is not configured in Convex environment variables"
      );
    }

    // 3. Create user in Clerk via their Backend API
    const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: args.username,
        password: args.password,
        first_name: args.firstName,
        last_name: args.lastName || "",
        skip_password_checks: false,
      }),
    });

    if (!clerkResponse.ok) {
      const errorData = await clerkResponse.json().catch(() => null);
      const errors = errorData?.errors;
      if (errors && Array.isArray(errors) && errors.length > 0) {
        const firstError = errors[0];
        // Map common Clerk error codes to Arabic messages
        if (firstError.code === "form_identifier_exists") {
          throw new Error("اسم المستخدم مسجل بالفعل");
        }
        if (firstError.code === "form_password_pwned") {
          throw new Error(
            "كلمة المرور غير آمنة، يرجى اختيار كلمة مرور أخرى"
          );
        }
        if (firstError.code === "form_password_length_too_short") {
          throw new Error(
            "كلمة المرور قصيرة جداً، يجب أن تكون 8 أحرف على الأقل"
          );
        }
        throw new Error(
          firstError.long_message || firstError.message || "فشل في إنشاء الحساب"
        );
      }
      throw new Error(`فشل في إنشاء حساب Clerk: ${clerkResponse.status}`);
    }

    const clerkUser = await clerkResponse.json();
    const clerkUserId: string = clerkUser.id;

    // 4. Insert the user record in Convex via internal mutation
    //    Pass defaultTenantId so the new user gets placed into the caller's tenant
    try {
      const userId = await ctx.runMutation(
        internal.users.mutations.insertUser,
        {
          clerkUserId,
          username: args.username,
          firstName: args.firstName,
          lastName: args.lastName || "",
          role: args.role,
          defaultTenantId,
        }
      );
      return userId;
    } catch (convexError: unknown) {
      // If Convex insert fails, clean up the Clerk user
      try {
        await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${clerkSecretKey}` },
        });
      } catch {
        // Ignore cleanup errors
      }
      throw convexError;
    }
  },
});
