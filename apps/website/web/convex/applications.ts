import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitApplication = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    concentration: v.string(),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("applications", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getApplications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("applications")
      .order("desc")
      .collect();
  },
});
