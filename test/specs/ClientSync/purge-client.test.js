import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { addAllureLink } from '~/test/support/helpers/allure-api-logger.js'
import { DEFAULT_TENANT_SERVICE_NAME } from '~/test/apis/wasteMovementClientSyncApi.js'

describe('Purge the oldest client secret in DWT Client Sync Service', () => {
  let createdClientId

  beforeEach(async () => {
    await addAllureLink('/DWTSPI-45', 'DWTSPI-45', 'jira')
    createdClientId = undefined
  })

  afterEach(async () => {
    if (createdClientId) {
      await globalThis.apis.wasteMovementClientSyncAPI.deleteClient(
        createdClientId
      )
    }
  })

  describe('Valid secret purge', () => {
    it(
      'should remove the oldest secret and keep the newest one usable' +
        ' @allure.label.tag:DWTSPI-45 @Authentication',
      async () => {
        const clientName = `UAT_Purge_${Date.now()}`
        const { statusCode: createStatus, json: created } =
          await globalThis.apis.wasteMovementClientSyncAPI.createClient(
            clientName
          )

        expect(createStatus).toBe(200)
        createdClientId = created.clientId
        const originalSecret = created.clientSecret

        const { statusCode: rotateStatus, json: rotated } =
          await globalThis.apis.wasteMovementClientSyncAPI.rotateClientSecret(
            createdClientId
          )

        expect(rotateStatus).toBe(200)
        expect(rotated.clientSecret).not.toBe(originalSecret)

        const { statusCode: purgeStatus, json: purgeBody } =
          await globalThis.apis.wasteMovementClientSyncAPI.purgeClientSecret(
            createdClientId
          )

        expect(purgeStatus).toBe(204)
        expect(purgeBody).toBeNull()

        const { statusCode: newAuthStatus } =
          await globalThis.apis.cognitoOAuthApi.authenticate(
            createdClientId,
            rotated.clientSecret
          )
        expect(newAuthStatus).toBe(200)

        const { statusCode: oldAuthStatus } =
          await globalThis.apis.cognitoOAuthApi.authenticate(
            createdClientId,
            originalSecret
          )
        expect(oldAuthStatus).toBe(400)
      }
    )

    it(
      'should return 204 when the client has only one secret and leave that secret usable' +
        ' @allure.label.tag:DWTSPI-45 @Authentication',
      async () => {
        const { statusCode: createStatus, json: created } =
          await globalThis.apis.wasteMovementClientSyncAPI.createClient(
            `UAT_Purge_OneSecret_${Date.now()}`
          )

        expect(createStatus).toBe(200)
        createdClientId = created.clientId

        const { statusCode: purgeStatus, json: purgeBody } =
          await globalThis.apis.wasteMovementClientSyncAPI.purgeClientSecret(
            createdClientId
          )

        expect(purgeStatus).toBe(204)
        expect(purgeBody).toBeNull()

        const { statusCode: authStatus } =
          await globalThis.apis.cognitoOAuthApi.authenticate(
            createdClientId,
            created.clientSecret
          )
        expect(authStatus).toBe(200)
      }
    )
  })

  describe('Invalid secret purge', () => {
    it(
      'should return 404 when clientId is not found' +
        ' @allure.label.tag:DWTSPI-45',
      async () => {
        const clientId = 'unknownclientid123'
        const { statusCode, json } =
          await globalThis.apis.wasteMovementClientSyncAPI.purgeClientSecret(
            clientId
          )

        expect(statusCode).toBe(404)
        expect(json).toEqual({
          statusCode: 404,
          error: 'Not Found',
          message: `Client '${clientId}' not found for tenant service '${DEFAULT_TENANT_SERVICE_NAME}'`
        })
      }
    )

    it(
      'should return 400 when tenantServiceName does not match the required pattern' +
        ' @allure.label.tag:DWTSPI-45',
      async () => {
        const { statusCode, json } =
          await globalThis.apis.wasteMovementClientSyncAPI.purgeClientSecret(
            'my_client_id',
            'Not_A_Service'
          )

        expect(statusCode).toBe(400)
        expect(json).toEqual({
          statusCode: 400,
          error: 'Bad Request',
          message:
            '"tenantServiceName" with value "Not_A_Service" fails to match the required pattern: /^[a-z0-9-]+$/',
          validation: {
            source: 'params',
            keys: ['tenantServiceName']
          }
        })
      }
    )

    it(
      'should return 404 when tenantServiceName is not managed, but clientId is valid' +
        ' @allure.label.tag:DWTSPI-45',
      async () => {
        const { statusCode: createStatus, json: created } =
          await globalThis.apis.wasteMovementClientSyncAPI.createClient(
            `UAT_Purge_BadTenant_${Date.now()}`
          )

        expect(createStatus).toBe(200)
        createdClientId = created.clientId

        const unknownTenantServiceName = 'unknown-tenant-service'
        const { statusCode, json } =
          await globalThis.apis.wasteMovementClientSyncAPI.purgeClientSecret(
            createdClientId,
            unknownTenantServiceName
          )

        expect(statusCode).toBe(404)
        expect(json).toEqual({
          statusCode: 404,
          error: 'Not Found',
          message: `Tenant service '${unknownTenantServiceName}' is not managed by dwt-client-sync`
        })
      }
    )
  })
})
