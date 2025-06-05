/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as reactivation from "../reactivation.js";
import type * as tenantrole from "../tenantrole.js";
import type * as tenants from "../tenants.js";
import type * as tenants_updated from "../tenants_updated.js";
import type * as userStatus from "../userStatus.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  audit: typeof audit;
  auth: typeof auth;
  http: typeof http;
  invitations: typeof invitations;
  reactivation: typeof reactivation;
  tenantrole: typeof tenantrole;
  tenants: typeof tenants;
  tenants_updated: typeof tenants_updated;
  userStatus: typeof userStatus;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
