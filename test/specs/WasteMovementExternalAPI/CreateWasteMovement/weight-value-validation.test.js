import { describe, it, expect, beforeEach } from '@jest/globals'
import { generateBaseWasteReceiptData } from '../../../support/test-data-manager.js'
import { authenticateAndSetToken } from '../../../support/helpers/auth.js'
import { addAllureLink } from '../../../support/helpers/allure-api-logger.js'

// weight object appears in 'wasteItems' array and also in 'disposalOrRecoveryCodes' array
// Note: weight amount of 0 is considered a valid value
// Note: currently number and boolean fields in API are also accepting strings, devs to fix this - 15th Sep 2025
describe('Waste Weight value Validation', () => {
  let wasteReceiptData

  beforeEach(async () => {
    await addAllureLink('/DWT-332', 'DWT-332', 'jira')
    wasteReceiptData = generateBaseWasteReceiptData()

    // Authenticate and set the auth token
    await authenticateAndSetToken(
      globalThis.testConfig.cognitoClientId,
      globalThis.testConfig.cognitoClientSecret
    )
  })

  describe('Waste Weight value Validation for weight object in "wasteItems" array', () => {
    describe('Missing Weight Object', () => {
      it('should reject create movement submission when weight object is missing @allure.label.tag:DWTA-373', async () => {
        await addAllureLink('/DWTA-373', 'DWTA-373', 'jira')
        delete wasteReceiptData.wasteItems[0].weight

        const response =
          await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
            wasteReceiptData
          )

        expect(response.statusCode).toBe(400)
        expect(response.json).toEqual({
          validation: {
            errors: [
              {
                key: 'wasteItems.0.weight',
                errorType: 'NotProvided',
                message: '"wasteItems[0].weight" is required'
              }
            ]
          }
        })
      })
    })

    it(
      'should reject create movement submission when weight value is missing' +
        ' @allure.label.tag:DWT-332',
      async () => {
        delete wasteReceiptData.wasteItems[0].weight.amount

        const response =
          await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
            wasteReceiptData
          )

        expect(response.statusCode).toBe(400)
        expect(response.json).toEqual({
          validation: {
            errors: [
              {
                key: 'wasteItems.0.weight.amount',
                errorType: 'NotProvided',
                message: '"wasteItems[0].weight.amount" is required'
              }
            ]
          }
        })
      }
    )

    it('should reject create movement submission when weight amount is invalid', async () => {
      wasteReceiptData.wasteItems[0].weight.amount = -1

      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )

      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'wasteItems.0.weight.amount',
              errorType: 'OutOfRange',
              message: '"wasteItems[0].weight.amount" must be a positive number'
            }
          ]
        }
      })
    })
  })

  describe('Waste Weight value Validation for weight object in "disposalOrRecoveryCodes" array', () => {
    it(
      'should reject create movement submission when weight value is missing' +
        ' @allure.label.tag:DWT-332',
      async () => {
        delete wasteReceiptData.wasteItems[0].disposalOrRecoveryCodes[0].weight
          .amount

        const response =
          await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
            wasteReceiptData
          )

        expect(response.statusCode).toBe(400)
        expect(response.json).toEqual({
          validation: {
            errors: [
              {
                key: 'wasteItems.0.disposalOrRecoveryCodes.0.weight.amount',
                errorType: 'NotProvided',
                message:
                  '"wasteItems[0].disposalOrRecoveryCodes[0].weight.amount" is required'
              }
            ]
          }
        })
      }
    )

    it(
      'should reject create movement submission when weight amount is invalid' +
        ' @allure.label.tag:DWT-332',
      async () => {
        wasteReceiptData.wasteItems[0].disposalOrRecoveryCodes[0].weight.amount =
          -1

        const response =
          await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
            wasteReceiptData
          )

        expect(response.statusCode).toBe(400)
        expect(response.json).toEqual({
          validation: {
            errors: [
              {
                key: 'wasteItems.0.disposalOrRecoveryCodes.0.weight.amount',
                errorType: 'OutOfRange',
                message:
                  '"wasteItems[0].disposalOrRecoveryCodes[0].weight.amount" must be a positive number'
              }
            ]
          }
        })
      }
    )
  })
})
