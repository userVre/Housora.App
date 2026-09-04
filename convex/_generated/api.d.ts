/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as collab from "../collab.js";
import type * as durableAi from "../durableAi.js";
import type * as credits from "../credits.js";
import type * as floorPlans from "../floorPlans.js";
import type * as furniture from "../furniture.js";
import type * as jobs from "../jobs.js";
import type * as jobsActions from "../jobsActions.js";
import type * as models from "../models.js";
import type * as preferences from "../preferences.js";
import type * as projects from "../projects.js";
import type * as roomVersions from "../roomVersions.js";
import type * as savedDesigns from "../savedDesigns.js";
import type * as savedReferences from "../savedReferences.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  collab: typeof collab;
  durableAi: typeof durableAi;
  credits: typeof credits;
  floorPlans: typeof floorPlans;
  furniture: typeof furniture;
  jobs: typeof jobs;
  jobsActions: typeof jobsActions;
  models: typeof models;
  preferences: typeof preferences;
  projects: typeof projects;
  roomVersions: typeof roomVersions;
  savedDesigns: typeof savedDesigns;
  savedReferences: typeof savedReferences;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
