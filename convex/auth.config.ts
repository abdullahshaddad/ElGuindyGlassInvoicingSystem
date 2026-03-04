const clerkDomain = process.env.CLERK_ISSUER_URL || "https://evolving-sheepdog-85.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkDomain,
      applicationID: "convex",
    },
  ],
};
