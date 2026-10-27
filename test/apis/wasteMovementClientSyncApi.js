import { BaseAPI } from './base-api.js'
import { randomUUID } from 'crypto'

/** Default tenant service used by client-sync UAT flows. */
export const DEFAULT_TENANT_SERVICE_NAME = 'waste-movement-external-api'

/**
 * Client for the DWT client-sync service (list/get/create/delete/rotate/purge clients and refresh cache).
 */
export class WasteMovementClientSyncAPI extends BaseAPI {
  /**
   * @param {boolean} [useProxyWhenAvailable=false] - When true, honours HTTP_PROXY.
   */
  constructor(useProxyWhenAvailable = false) {
    super(
      globalThis.testConfig.wasteMovementClientSyncApiBaseUrl,
      useProxyWhenAvailable
    )
  }

  /**
   * GET /clients/{tenantServiceName} — list all clients for a tenant service.
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async getClients(tenantServiceName = DEFAULT_TENANT_SERVICE_NAME) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.get(
      `/clients/${encodeURIComponent(tenantServiceName)}`,
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * GET /clients/{tenantServiceName}/{clientId} — get a single client.
   * @param {string} clientId - Cognito / software-provider client ID
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async getClient(clientId, tenantServiceName = DEFAULT_TENANT_SERVICE_NAME) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.get(
      `/clients/${encodeURIComponent(tenantServiceName)}/${encodeURIComponent(clientId)}`,
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * POST /clients/sync — refresh the clients database from the latest source.
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async syncClients() {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.post(
      '/clients/sync',
      undefined,
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * POST /clients/{tenantServiceName} — create a Cognito client and sync local cache.
   * @param {string} clientName - Display name for the new client
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async createClient(
    clientName,
    tenantServiceName = DEFAULT_TENANT_SERVICE_NAME
  ) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
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
      `/clients/${encodeURIComponent(tenantServiceName)}`,
      JSON.stringify({ clientName }),
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * DELETE /clients/{tenantServiceName}/{clientId} — delete Cognito client and local cache entry.
   * @param {string} clientId - Cognito / software-provider client ID
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async deleteClient(
    clientId,
    tenantServiceName = DEFAULT_TENANT_SERVICE_NAME
  ) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    const requestHeaders = {
      Authorization: `Basic ${base64Credentials}`,
      'x-cdp-request-id': randomUUID()
    }
    if (globalThis.testConfig.cdpDevApiKey != null) {
      requestHeaders['x-api-key'] = globalThis.testConfig.cdpDevApiKey
    }
    const { statusCode, headers, json } = await this.delete(
      `/clients/${encodeURIComponent(tenantServiceName)}/${encodeURIComponent(clientId)}`,
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * POST /clients/{tenantServiceName}/{clientId}/rotate — rotate Cognito client secret.
   * @param {string} clientId - Cognito / software-provider client ID
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async rotateClientSecret(
    clientId,
    tenantServiceName = DEFAULT_TENANT_SERVICE_NAME
  ) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
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
      `/clients/${encodeURIComponent(tenantServiceName)}/${encodeURIComponent(clientId)}/rotate`,
      undefined,
      requestHeaders
    )
    return { statusCode, headers, json }
  }

  /**
   * POST /clients/{tenantServiceName}/{clientId}/purge — remove the oldest secret when two exist.
   * @param {string} clientId - Cognito / software-provider client ID
   * @param {string} [tenantServiceName=DEFAULT_TENANT_SERVICE_NAME] - Tenant service name
   * @returns {Promise<import('./base-api.js').JsonResponse>}
   */
  async purgeClientSecret(
    clientId,
    tenantServiceName = DEFAULT_TENANT_SERVICE_NAME
  ) {
    const credentials = `${DEFAULT_TENANT_SERVICE_NAME}:${globalThis.testConfig.serviceAuthPassword}`
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
      `/clients/${encodeURIComponent(tenantServiceName)}/${encodeURIComponent(clientId)}/purge`,
      undefined,
      requestHeaders
    )
    return { statusCode, headers, json }
  }
}
