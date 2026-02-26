/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bevelingRates_mutations from "../bevelingRates/mutations.js";
import type * as bevelingRates_queries from "../bevelingRates/queries.js";
import type * as companyProfile_mutations from "../companyProfile/mutations.js";
import type * as companyProfile_queries from "../companyProfile/queries.js";
import type * as crons from "../crons.js";
import type * as customers_mutations from "../customers/mutations.js";
import type * as customers_queries from "../customers/queries.js";
import type * as cuttingRates_mutations from "../cuttingRates/mutations.js";
import type * as cuttingRates_queries from "../cuttingRates/queries.js";
import type * as dashboard_queries from "../dashboard/queries.js";
import type * as factory_mutations from "../factory/mutations.js";
import type * as factory_queries from "../factory/queries.js";
import type * as glassTypes_mutations from "../glassTypes/mutations.js";
import type * as glassTypes_queries from "../glassTypes/queries.js";
import type * as helpers_auth from "../helpers/auth.js";
import type * as helpers_dimensionUtils from "../helpers/dimensionUtils.js";
import type * as helpers_enums from "../helpers/enums.js";
import type * as helpers_idGenerator from "../helpers/idGenerator.js";
import type * as invoices_mutations from "../invoices/mutations.js";
import type * as invoices_queries from "../invoices/queries.js";
import type * as lib_bevelingFormulas from "../lib/bevelingFormulas.js";
import type * as lib_operationCalculation from "../lib/operationCalculation.js";
import type * as migrations_dropAllExceptUsers from "../migrations/dropAllExceptUsers.js";
import type * as migrations_importData from "../migrations/importData.js";
import type * as migrations_renameGlassTypeField from "../migrations/renameGlassTypeField.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as operationPrices_mutations from "../operationPrices/mutations.js";
import type * as operationPrices_queries from "../operationPrices/queries.js";
import type * as payments_mutations from "../payments/mutations.js";
import type * as payments_queries from "../payments/queries.js";
import type * as printJobs_internal from "../printJobs/internal.js";
import type * as printJobs_mutations from "../printJobs/mutations.js";
import type * as printJobs_queries from "../printJobs/queries.js";
import type * as users_actions from "../users/actions.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "bevelingRates/mutations": typeof bevelingRates_mutations;
  "bevelingRates/queries": typeof bevelingRates_queries;
  "companyProfile/mutations": typeof companyProfile_mutations;
  "companyProfile/queries": typeof companyProfile_queries;
  crons: typeof crons;
  "customers/mutations": typeof customers_mutations;
  "customers/queries": typeof customers_queries;
  "cuttingRates/mutations": typeof cuttingRates_mutations;
  "cuttingRates/queries": typeof cuttingRates_queries;
  "dashboard/queries": typeof dashboard_queries;
  "factory/mutations": typeof factory_mutations;
  "factory/queries": typeof factory_queries;
  "glassTypes/mutations": typeof glassTypes_mutations;
  "glassTypes/queries": typeof glassTypes_queries;
  "helpers/auth": typeof helpers_auth;
  "helpers/dimensionUtils": typeof helpers_dimensionUtils;
  "helpers/enums": typeof helpers_enums;
  "helpers/idGenerator": typeof helpers_idGenerator;
  "invoices/mutations": typeof invoices_mutations;
  "invoices/queries": typeof invoices_queries;
  "lib/bevelingFormulas": typeof lib_bevelingFormulas;
  "lib/operationCalculation": typeof lib_operationCalculation;
  "migrations/dropAllExceptUsers": typeof migrations_dropAllExceptUsers;
  "migrations/importData": typeof migrations_importData;
  "migrations/renameGlassTypeField": typeof migrations_renameGlassTypeField;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "operationPrices/mutations": typeof operationPrices_mutations;
  "operationPrices/queries": typeof operationPrices_queries;
  "payments/mutations": typeof payments_mutations;
  "payments/queries": typeof payments_queries;
  "printJobs/internal": typeof printJobs_internal;
  "printJobs/mutations": typeof printJobs_mutations;
  "printJobs/queries": typeof printJobs_queries;
  "users/actions": typeof users_actions;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
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
