import { request, Agent, ProxyAgent } from 'undici'
import {
  logAllureRequest,
  logAllureResponse
} from '../support/helpers/allure-api-logger.js'

/**
 * @typedef {Object} JsonResponse
 * @property {number} statusCode - HTTP status code
 * @property {Object} headers - Response headers
 * @property {any} json - Parsed JSON response
 */

/**
 * @typedef {Object} TextResponse
 * @property {number} statusCode - HTTP status code
 * @property {Object} headers - Response headers
 * @property {string} body - Raw response body
 */

/**
 * Base API class that provides common HTTP methods
 */
export class BaseAPI {
  /**
   * @param {string} baseUrl - Base URL for all API requests
   */
  constructor(baseUrl, useProxyWhenAvailable = false) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {}
    this.useProxyWhenAvailable = useProxyWhenAvailable

    const baseOptions = {
      connections: 1, // Default: single connection to prevent OAuth2 endpoint overwhelming
      pipelining: 1, // Default: no pipelining to avoid head-of-line blocking during authentication
      headersTimeout: 30000, // Custom: 30s timeout for API headers (default is 5min)
      bodyTimeout: 30000, // Custom: 30s timeout for API response bodies (default is 5min)
      keepAliveTimeout: 10000, // Custom: 10s keep-alive (default is 4s)
      keepAliveMaxTimeout: 30000, // Custom: 30s max connection lifetime (default is 10min)
      connect: {
        timeout: 15000 // Custom: 15s connection establishment timeout (default is 10s)
      }
    }

    // Some API objects have to use the proxy in CDP in order to work with APIs from outside the CDP network.

    if (globalThis.testConfig?.httpProxy && this.useProxyWhenAvailable) {
      this.agent = new ProxyAgent({
        uri: globalThis.testConfig.httpProxy,
        ...baseOptions,
        // ZAP MITMs HTTPS and presents its own Root CA. Accept that only on
        // proxied calls (security-scan harness), not on direct Agent traffic.
        requestTls: {
          rejectUnauthorized: false
        }
      })
      this.usingProxy = true
    } else {
      this.agent = new Agent(baseOptions)
      this.usingProxy = false
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<JsonResponse>}
   */
  async get(endpoint, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // Log request to Allure
    await logAllureRequest(
      'GET',
      endpoint,
      url,
      requestHeaders,
      this.usingProxy
    )

    const response = await request(url, {
      method: 'GET',
      headers: requestHeaders,
      dispatcher: this.agent
    })

    const json = await response.body.json()

    // Log response to Allure
    await logAllureResponse(
      'GET',
      endpoint,
      response.statusCode,
      response.headers,
      json
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      json
    }
  }

  /**
   * Make a GET request and return the raw response body (for non-JSON endpoints).
   * @param {string} endpoint - API endpoint
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<TextResponse>}
   */
  async getText(endpoint, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    await logAllureRequest(
      'GET',
      endpoint,
      url,
      requestHeaders,
      this.usingProxy
    )

    const response = await request(url, {
      method: 'GET',
      headers: requestHeaders,
      dispatcher: this.agent
    })

    const body = await response.body.text()

    await logAllureResponse(
      'GET',
      endpoint,
      response.statusCode,
      response.headers,
      body
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body
    }
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {string} data - Request body data
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<JsonResponse>}
   */
  async post(endpoint, data, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const instanceHeaders = { ...this.defaultHeaders, ...headers }

    // Log request to Allure
    await logAllureRequest(
      'POST',
      endpoint,
      url,
      instanceHeaders,
      this.usingProxy,
      data
    )

    const response = await request(url, {
      method: 'POST',
      headers: instanceHeaders,
      body: data,
      dispatcher: this.agent
    })

    const bodyText = await response.body.text()
    let json = null
    if (bodyText) {
      json = JSON.parse(bodyText)
    }

    // Log response to Allure
    await logAllureResponse(
      'POST',
      endpoint,
      response.statusCode,
      response.headers,
      json
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      json
    }
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {string} data - Request body data
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<JsonResponse>}
   */
  async put(endpoint, data, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const instanceHeaders = { ...this.defaultHeaders, ...headers }
    instanceHeaders['Content-Type'] = 'application/json'

    // Log request to Allure
    await logAllureRequest(
      'PUT',
      endpoint,
      url,
      instanceHeaders,
      this.usingProxy,
      data
    )

    const response = await request(url, {
      method: 'PUT',
      headers: instanceHeaders,
      body: data,
      dispatcher: this.agent
    })

    const json = await response.body.json()

    // Log response to Allure
    await logAllureResponse(
      'PUT',
      endpoint,
      response.statusCode,
      response.headers,
      json
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      json
    }
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {string} data - Request body data
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<JsonResponse>}
   */
  async patch(endpoint, data, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const instanceHeaders = { ...this.defaultHeaders, ...headers }
    instanceHeaders['Content-Type'] = 'application/json'

    // Log request to Allure
    await logAllureRequest(
      'PATCH',
      endpoint,
      url,
      instanceHeaders,
      this.usingProxy,
      data
    )

    const response = await request(url, {
      method: 'PATCH',
      headers: instanceHeaders,
      body: data,
      dispatcher: this.agent
    })

    const json = await response.body.json()

    // Log response to Allure
    await logAllureResponse(
      'PATCH',
      endpoint,
      response.statusCode,
      response.headers
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      json
    }
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} [headers={}] - Additional headers
   * @returns {Promise<JsonResponse>}
   */
  async delete(endpoint, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // Log request to Allure
    await logAllureRequest(
      'DELETE',
      endpoint,
      url,
      requestHeaders,
      this.usingProxy
    )

    const response = await request(url, {
      method: 'DELETE',
      headers: requestHeaders,
      dispatcher: this.agent
    })

    const bodyText = await response.body.text()
    let json = null
    if (bodyText) {
      json = JSON.parse(bodyText)
    }

    // Log response to Allure
    await logAllureResponse(
      'DELETE',
      endpoint,
      response.statusCode,
      response.headers,
      json
    )

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      json
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Authentication token
   */
  setAuthToken(token) {
    this.defaultHeaders.Authorization = `Bearer ${token}`
  }

  /**
   * Build form data for OAuth token requests
   * @param {Object} data - Data to encode
   * @returns {string} URL-encoded form data
   */
  buildFormData(data) {
    return Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&')
  }

  /**
   * Close the agent and clean up connections
   */
  async close() {
    if (this.agent) {
      await this.agent.close()
    }
  }
}
