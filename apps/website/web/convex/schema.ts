import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  applications: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    concentration: v.string(),
    department: v.string(),
    createdAt: v.number(),
  }),
});
