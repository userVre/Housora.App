import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  generatedModels: defineTable({
    ownerId: v.string(),
    taskId: v.string(),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_owner_task", ["ownerId", "taskId"]).index("by_owner", ["ownerId"]),
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
    removedAt: v.optional(v.number()),
    ownerId: v.string(),
    projectId: v.optional(v.string()),
    roomId: v.optional(v.string()),
    prompt: v.optional(v.string()),
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
  // Performance & pipeline: async jobs + caching
  aiJobs: defineTable({
    inputImage: v.optional(v.string()),
    ownerId: v.string(),
    type: v.union(v.literal("segment"), v.literal("edit"), v.literal("tripo")),
    status: v.union(v.literal("queued"), v.literal("running"), v.literal("success"), v.literal("failed")),
    requestId: v.string(),
    inputHash: v.string(),
    prompt: v.optional(v.string()),
    mode: v.optional(v.string()),
    progress: v.number(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    usageEventId: v.optional(v.string()),
    tripoTaskId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    roomId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_request", ["requestId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_hash", ["inputHash"]),
  segmentationCache: defineTable({
    ownerId: v.optional(v.string()),
    imageHash: v.string(),
    mode: v.string(),
    objects: v.any(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_owner_hash_mode", ["ownerId", "imageHash", "mode"])
    .index("by_hash_mode", ["imageHash", "mode"])
    .index("by_expires", ["expiresAt"]),
  generationCache: defineTable({
    ownerId: v.optional(v.string()),
    inputHash: v.string(),
    resultImage: v.string(),
    prompt: v.string(),
    modelVersion: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_owner_hash", ["ownerId", "inputHash"])
    .index("by_hash", ["inputHash"])
    .index("by_expires", ["expiresAt"]),
  // 2. Version history per image/project
  roomVersions: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    roomId: v.string(),
    image: v.string(),
    prompt: v.optional(v.string()),
    mode: v.optional(v.string()),
    parentVersionId: v.optional(v.string()),
    label: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_owner", ["ownerId"])
    .index("by_project", ["projectId"]),
  // 4. Multi-client / multi-room + RBAC + style libraries
  housoraClients: defineTable({
    ownerId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_name", ["ownerId", "name"]),
  housoraProjects: defineTable({
    ownerId: v.string(),
    clientId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    styleLibraryId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),
  housoraRooms: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    name: v.string(),
    type: v.string(),
    dimensions: v.optional(v.object({ w: v.number(), h: v.number(), ceiling: v.optional(v.number()) })),
    floorPlanUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_owner", ["ownerId"]),
  housoraStyleLibraries: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    name: v.string(),
    locked: v.boolean(),
    palette: v.optional(v.string()),
    materials: v.optional(v.array(v.object({ name: v.string(), url: v.optional(v.string()), color: v.optional(v.string()) }))),
    lockedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_owner", ["ownerId"]),
  projectMembers: defineTable({
    projectId: v.string(),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("designer"), v.literal("collaborator"), v.literal("client_viewer")),
    email: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),
  // 5. Collaboration
  comments: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    roomId: v.optional(v.string()),
    versionId: v.optional(v.string()),
    body: v.string(),
    xRatio: v.optional(v.number()),
    yRatio: v.optional(v.number()),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    resolved: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_version", ["versionId"])
    .index("by_room", ["roomId"]),
  approvals: defineTable({
    versionId: v.string(),
    projectId: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("changes_requested")),
    comment: v.optional(v.string()),
    actorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_version", ["versionId"])
    .index("by_project", ["projectId"]),
  shareLinks: defineTable({
    projectId: v.string(),
    token: v.string(),
    role: v.union(v.literal("viewer"), v.literal("client_viewer")),
    createdBy: v.string(),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_project", ["projectId"]),
  // 2 & New 2: Furniture catalog flexible source
  furnitureModels: defineTable({
    ownerId: v.string(),
    source: v.union(v.literal("sketchfab_ai_generated"), v.literal("retailer_catalog")),
    externalId: v.string(),
    name: v.string(),
    thumbnail: v.optional(v.string()),
    license: v.optional(v.string()),
    category: v.optional(v.string()),
    style: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_source", ["source"])
    .index("by_owner_external", ["ownerId", "externalId"]),
  // New 1: CubiCasa floor plan
  floorPlans: defineTable({
    ownerId: v.string(),
    projectId: v.string(),
    roomId: v.optional(v.string()),
    status: v.union(v.literal("queued"), v.literal("processing"), v.literal("success"), v.literal("failed")),
    cubiCasaJobId: v.optional(v.string()),
    walls: v.optional(v.any()),
    doors: v.optional(v.any()),
    windows: v.optional(v.any()),
    dimensions: v.optional(v.any()),
    planUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_owner", ["ownerId"])
    .index("by_job", ["cubiCasaJobId"]),
  // 3D generation request deduplication - prevents second paid task if response interrupted
  tripoRequests: defineTable({
    ownerId: v.string(),
    requestId: v.string(),
    taskId: v.string(),
    usageEventId: v.string(),
    createdAt: v.number(),
  })
    .index("by_owner_request", ["ownerId", "requestId"])
    .index("by_task", ["taskId"]),
  modelShares: defineTable({
    ownerId: v.string(),
    taskId: v.string(),
    storageId: v.id("_storage"),
    token: v.string(),
    revokedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_owner_task", ["ownerId", "taskId"])
    .index("by_owner", ["ownerId"]),
});
