import { v } from "convex/values";

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
  // Define custom fields for the users table
  userFields: {
    isActive: v.optional(v.boolean()),
  },
};
