import { BaseAPI } from './base-api.js'
import { randomUUID } from 'crypto'

export class WasteMovementBackendAPI extends BaseAPI {
  /**
   * @param {boolean} [useProxyWhenAvailable=false] - When true, honours HTTP_PROXY.
   */
  constructor(useProxyWhenAvailable = false) {
    super(
      globalThis.testConfig.wasteMovementBackendApiBaseUrl,
      useProxyWhenAvailable
    )
  }

  /**
   * Bulk upload waste movements (backend service auth).
   * @param {string} bulkUploadId - Unique ID for the bulk upload
   * @param {Array<Object>} movements - Array of movement payloads (backend shape: with submittingOrganisation, no apiCode)
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async bulkUploadCreate(bulkUploadId, movements) {
    const credentials = `waste-organisation-backend:${globalThis.testConfig.serviceAuthPasswordWasteOrganisationBackend}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.post(
      `/bulk/${bulkUploadId}/movements/receive`,
      JSON.stringify(movements),
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * Bulk update waste movements (PUT). Idempotent: same bulkId returns NO_MOVEMENTS_UPDATED when already applied.
   * @param {string} bulkUploadId - Same ID used for the initial POST bulk upload
   * @param {Array<Object>} movements - Array of movement payloads (same shape as bulk upload create)
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async bulkUploadUpdate(bulkUploadId, movements) {
    const credentials = `waste-organisation-backend:${globalThis.testConfig.serviceAuthPasswordWasteOrganisationBackend}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.put(
      `/bulk/${bulkUploadId}/movements/receive`,
      JSON.stringify(movements),
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async retryAuditLog(requestBody) {
    // Create Basic Authorization header with base64 encoded credentials
    const credentials = `waste-movement-external-api:${globalThis.testConfig.serviceAuthPassword}`
    const base64Credentials = Buffer.from(credentials).toString('base64')

    // Set the correct headers for OAuth token requests
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'x-cdp-request-id': randomUUID()
    }

    // Only add the CDP Dev API key if it is set. This is only need for running locally.
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }

    const { statusCode, headers, json } = await this.post(
      '/movements/retry-audit-log',
      JSON.stringify(requestBody),
      requestHeaders
    )

    return {
      statusCode,
      headers,
      json
    }
  }

  /**
   * POST /production-approval-tests — run production approval scenarios (Bruno: Production Approval Tests).
   * @param {Array<{ scenarioId: string, wasteTrackingId: string }>} scenarios - Request body (JSON array)
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async runProductionApprovalTests(scenarios) {
    const password = globalThis.testConfig.authPasswordProductionApprovalTests
    const credentials = `production-approval-tests:${password}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'Content-Type': 'application/json',
      'x-cdp-request-id': randomUUID(),
      'x-dwt-client-id': globalThis.testConfig.cognitoClientId
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.post(
      '/production-approval-tests',
      JSON.stringify(scenarios),
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * QA-only GET by bulk ID (pre-prod). GET /qa-non-prod/movements?bulkId=…
   * @param {string} bulkId - Bulk upload id
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async qaRetrieveMovementsByBulkId(bulkId) {
    const params = new URLSearchParams()
    params.set('bulkId', bulkId)
    return this._qaNonProdMovementsGet(params)
  }

  /**
   * QA-only GET by waste tracking id (pre-prod). GET /qa-non-prod/movements?wasteTrackingId=…
   * @param {string} wasteTrackingId - Waste tracking id
   * @param {boolean} [includeHistory=false] - When true, adds includeHistory=true (all revisions)
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async qaRetrieveMovementsByWasteTrackingId(
    wasteTrackingId,
    includeHistory = false
  ) {
    const params = new URLSearchParams()
    params.set('wasteTrackingId', wasteTrackingId)
    if (includeHistory) {
      params.set('includeHistory', 'true')
    }
    return this._qaNonProdMovementsGet(params)
  }

  /**
   * @param {URLSearchParams} params - Query string for GET /qa-non-prod/movements
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async _qaNonProdMovementsGet(params) {
    const password = globalThis.testConfig.authPasswordQaNonProd
    const credentials = `qa-non-prod:${password}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const qs = params.toString()
    const endpoint = `/qa-non-prod/movements?${qs}`
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.get(
      endpoint,
      requestHeaders
    )
    return { statusCode, headers, json }
  }
}
