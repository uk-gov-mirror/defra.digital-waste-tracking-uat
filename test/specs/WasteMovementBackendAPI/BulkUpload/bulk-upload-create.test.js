import { describe, it, expect, beforeEach } from '@jest/globals'
import { randomUUID } from 'node:crypto'
import { generateBaseBulkUploadMovement } from '~/test/support/test-data-manager.js'
import { addAllureLink } from '~/test/support/helpers/allure-api-logger.js'

describe('Bulk Upload Create', () => {
  let movements

  beforeEach(async () => {
    await addAllureLink('/DWT-1495', 'DWT-1495', 'jira')
    await addAllureLink('/DWT-1413', 'DWT-1413', 'jira')
    await addAllureLink('/DWT-1702', 'DWT-1702', 'jira')
    movements = [
      generateBaseBulkUploadMovement(),
      generateBaseBulkUploadMovement()
    ]
  })

  describe('Waste movements created successfully', () => {
    it('should accept bulk upload of a single movement', async () => {
      const singleMovement = [generateBaseBulkUploadMovement()]
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          singleMovement
        )

      expect(response.statusCode).toBe(201)
      expect(response.json).toEqual({
        status: 'MOVEMENTS_CREATED',
        movements: [{ wasteTrackingId: expect.any(String) }]
      })
    })

    it('should return validation warnings on bulk create when a movement omits Disposal or Recovery Codes @allure.label.tag:DWTA-162', async () => {
      await addAllureLink('/DWTA-162', 'DWTA-162', 'jira')

      delete movements[1].wasteItems[0].disposalOrRecoveryCodes
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movements
        )

      expect(response.statusCode).toBe(201)
      expect(response.json).toEqual({
        status: 'MOVEMENTS_CREATED',
        movements: [
          { wasteTrackingId: expect.any(String) },
          {
            wasteTrackingId: expect.any(String),
            validation: {
              warnings: [
                {
                  key: 'wasteItems.0.disposalOrRecoveryCodes',
                  errorType: 'NotProvided',
                  message:
                    'wasteItems[0].disposalOrRecoveryCodes is required for proper waste tracking and compliance'
                }
              ]
            }
          }
        ]
      })
    })

    it('should accept bulk upload of two movements from base waste receipt data', async () => {
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movements
        )

      expect(response.statusCode).toBe(201)
      expect(response.json).toEqual({
        status: 'MOVEMENTS_CREATED',
        movements: [
          { wasteTrackingId: expect.any(String) },
          { wasteTrackingId: expect.any(String) }
        ]
      })
    })

    // TODO - The test below is currently failing on CDP since we bumped the version of UNIDICI from 7.10.0 to 8.10.0
    // This test has temporarirly been replaced with the test below, which uses a very small delay between requests.
    // it('should be idempotent when same bulkUploadId is used for concurrent requests', async () => {
    //   const bulkUploadId = randomUUID()
    //
    //   const [response1, response2] = await Promise.all([
    //     globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
    //       bulkUploadId,
    //       movements
    //     ),
    //     globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
    //       bulkUploadId,
    //       movements
    //     )
    //   ])
    //
    //   ;[response1, response2].forEach((response) => {
    //     expect([200, 201]).toContain(response.statusCode)
    //     expect(['MOVEMENTS_CREATED', 'MOVEMENTS_NOT_CREATED']).toContain(
    //       response.json.status
    //     )
    //     expect(response.json.movements).toHaveLength(2)
    //   })
    //   expect(
    //     new Set(response1.json.movements.map((m) => m.wasteTrackingId))
    //   ).toEqual(new Set(response2.json.movements.map((m) => m.wasteTrackingId)))
    //
    //   expect([response1.json.status, response2.json.status].sort()).toEqual(
    //     ['MOVEMENTS_CREATED', 'MOVEMENTS_NOT_CREATED'].sort()
    //   )
    // })

    it('should be idempotent when same bulkUploadId is used for pseudo concurrent requests', async () => {
      const bulkUploadId = randomUUID()

      const response1 =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movements
        )

      await new Promise((resolve) => setTimeout(resolve, 100)) // 100 milliseconds delay between requests

      const response2 =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movements
        )

      ;[response1, response2].forEach((response) => {
        expect([200, 201]).toContain(response.statusCode)
        expect(['MOVEMENTS_CREATED', 'MOVEMENTS_NOT_CREATED']).toContain(
          response.json.status
        )
        expect(response.json.movements).toHaveLength(2)
      })
      expect(
        new Set(response1.json.movements.map((m) => m.wasteTrackingId))
      ).toEqual(new Set(response2.json.movements.map((m) => m.wasteTrackingId)))

      expect([response1.json.status, response2.json.status].sort()).toEqual(
        ['MOVEMENTS_CREATED', 'MOVEMENTS_NOT_CREATED'].sort()
      )
    })
  })

  describe('Waste movements not created', () => {
    it('should reject bulk upload when array is empty', async () => {
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          []
        )

      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'BulkReceiveMovementRequest',
              errorType: 'OutOfRange',
              message:
                '"BulkReceiveMovementRequest" must contain at least 1 items'
            }
          ]
        }
      })
    })

    it('should reject bulk upload when one movement is missing a required field', async () => {
      const validMovement = generateBaseBulkUploadMovement()
      const movementMissingSubmittingOrganisation = {
        ...validMovement
      }
      delete movementMissingSubmittingOrganisation.submittingOrganisation

      const movementsWithInvalidItem = [
        validMovement,
        movementMissingSubmittingOrganisation
      ]
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movementsWithInvalidItem
        )

      expect(response.statusCode).toBe(400)
      expect(Array.isArray(response.json)).toBe(true)
      expect(response.json).toHaveLength(2)
      expect(response.json[1].validation.errors).toHaveLength(1)
      expect(response.json[1].validation.errors[0]).toMatchObject({
        errorType: 'NotProvided',
        key: '1',
        message: expect.stringContaining('submittingOrganisation')
      })
    })

    it('should reject bulk upload when multiple movements have validation errors with 1, 2, or 3 errors each', async () => {
      const validMovement = generateBaseBulkUploadMovement()
      const movementWithOneError = { ...generateBaseBulkUploadMovement() }
      delete movementWithOneError.submittingOrganisation

      const movementWithTwoErrors = { ...generateBaseBulkUploadMovement() }
      delete movementWithTwoErrors.submittingOrganisation
      delete movementWithTwoErrors.dateTimeReceived

      const movementWithThreeErrors = { ...generateBaseBulkUploadMovement() }
      delete movementWithThreeErrors.submittingOrganisation
      delete movementWithThreeErrors.dateTimeReceived
      delete movementWithThreeErrors.receiver

      const movementsWithMultipleInvalid = [
        movementWithOneError,
        movementWithTwoErrors,
        validMovement,
        movementWithThreeErrors
      ]
      const bulkUploadId = randomUUID()

      const response =
        await globalThis.apis.wasteMovementBackendAPI.bulkUploadCreate(
          bulkUploadId,
          movementsWithMultipleInvalid
        )

      expect(response.statusCode).toBe(400)
      expect(Array.isArray(response.json)).toBe(true)
      expect(response.json).toHaveLength(4)
      expect(response.json[0].validation.errors).toHaveLength(1)
      expect(response.json[1].validation.errors).toHaveLength(2)
      expect(response.json[2]).toEqual({})
      expect(response.json[3].validation.errors).toHaveLength(3)
    })
  })
})
