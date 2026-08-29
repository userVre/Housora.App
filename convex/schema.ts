import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable(v.any())
    .index("by_email", ["email"])
    .index("by_authId", ["authId"])
    .index("by_clerkId", ["clerkId"]),
  projects: defineTable(v.any()).index("by_userId", ["userId"]),
  uploads: defineTable(v.any())
    .index("by_userId", ["userId"])
    .index("by_storageId", ["storageId"]),
  generations: defineTable(v.any())
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),
  generationEvents: defineTable(v.any())
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"]),
  webhookEvents: defineTable(v.any()).index("by_provider_and_eventId", ["provider", "eventId"]),
  creditAccounts: defineTable({
    ownerId: v.string(),
    plan: v.string(),
    status: v.string(),
    subscriptionCredits: v.number(),
    monthlyAllowance: v.number(),
    periodStartedAt: v.number(),
    periodEndsAt: v.optional(v.number()),
    accessEndsAt: v.optional(v.number()),
    whopMembershipId: v.optional(v.string()),
    lastPaymentId: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_membership", ["whopMembershipId"])
    .index("by_payment", ["lastPaymentId"]),
  creditGrants: defineTable({
    ownerId: v.string(),
    sourceEventId: v.string(),
    paymentId: v.optional(v.string()),
    kind: v.string(),
    amount: v.number(),
    remaining: v.number(),
    expiresAt: v.number(),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_source_event", ["sourceEventId"])
    .index("by_payment", ["paymentId"]),
  creditTransactions: defineTable({
    ownerId: v.string(),
    eventId: v.string(),
    type: v.string(),
    description: v.string(),
    subscriptionDelta: v.number(),
    purchasedDelta: v.number(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_event", ["eventId"]),
  preferences: defineTable({
    ownerId: v.string(),
    studioName: v.string(),
    language: v.string(),
    timezone: v.string(),
    currency: v.string(),
    measurements: v.string(),
    defaultMode: v.string(),
    defaultQuality: v.string(),
    referenceFidelity: v.string(),
    confirmHighCost: v.boolean(),
    generationNotifications: v.boolean(),
    creditNotifications: v.boolean(),
    collaborationNotifications: v.boolean(),
    marketingEmails: v.boolean(),
    analyticsConsent: v.boolean(),
    replayConsent: v.boolean(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),
  savedDesigns: defineTable({
    ownerId: v.string(),
    designId: v.string(),
    title: v.string(),
    image: v.string(),
    mode: v.union(v.literal("Interior"), v.literal("Exterior"), v.literal("Garden")),
    savedAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_designId", ["ownerId", "designId"]),
  savedReferences: defineTable({
    ownerId: v.string(),
    title: v.string(),
    room: v.string(),
    style: v.string(),
    image: v.string(),
    prompt: v.string(),
    savedAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_title", ["ownerId", "title"]),
});
