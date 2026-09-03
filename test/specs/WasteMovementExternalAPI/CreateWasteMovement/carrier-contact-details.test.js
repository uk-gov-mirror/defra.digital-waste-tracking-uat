import { describe, it, expect, beforeEach } from '@jest/globals'
import { generateBaseWasteReceiptData } from '../../../support/test-data-manager.js'
import { authenticateAndSetToken } from '../../../support/helpers/auth.js'
import { addAllureLink } from '../../../support/helpers/allure-api-logger.js'

describe('Carrier Contact Details Validation', () => {
  let wasteReceiptData

  beforeEach(async () => {
    await addAllureLink('/DWT-342', 'DWT-342', 'jira')
    wasteReceiptData = generateBaseWasteReceiptData()
    wasteReceiptData.carrier = {
      organisationName: 'Test Carrier Ltd',
      address: {
        fullAddress: '123 Test Street, Test City',
        postcode: 'TC1 2AB'
      },
      emailAddress: `test${Date.now()}@carrier.com`,
      phoneNumber: '01234567890',
      meansOfTransport: 'Road',
      registrationNumber: 'CBDL999999',
      vehicleRegistration: 'AB12 CDE'
    }

    // Authenticate and set the auth token
    await authenticateAndSetToken(
      globalThis.testConfig.cognitoClientId,
      globalThis.testConfig.cognitoClientSecret
    )
  })

  describe('Missing Carrier Details', () => {
    it('should reject waste movement when carrier details are missing @allure.label.tag:DWTA-378', async () => {
      await addAllureLink('/DWTA-378', 'DWTA-378', 'jira')
      delete wasteReceiptData.carrier

      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )

      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier',
              errorType: 'NotProvided',
              message: '"carrier" is required'
            }
          ]
        }
      })
    })
  })

  it(
    'should allow waste movement to be created when carrier has minimal required fields' +
      ' @allure.label.tag:DWT-342',
    async () => {
      wasteReceiptData.carrier = {
        organisationName: 'Test Carrier Ltd',
        meansOfTransport: 'Road',
        vehicleRegistration: 'AB12 CDE',
        registrationNumber: 'CBDL999999'
      }
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(201)
      expect(response.json).toHaveProperty('wasteTrackingId')
    }
  )

  it(
    'should not allow waste movement to be created when there is no carrier organisation name provided' +
      ' @allure.label.tag:DWT-342',
    async () => {
      delete wasteReceiptData.carrier.organisationName
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier.organisationName',
              errorType: 'NotProvided',
              message: '"carrier.organisationName" is required'
            }
          ]
        }
      })
    }
  )

  it(
    'should not allow waste movement to be created when there is no postcode supplied for the carrier organisation' +
      ' @allure.label.tag:DWT-342',
    async () => {
      delete wasteReceiptData.carrier.address.postcode
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier.address.postcode',
              errorType: 'NotProvided',
              message: '"carrier.address.postcode" is required'
            }
          ]
        }
      })
    }
  )

  describe('Valid Carrier Postcodes', () => {
    it('should allow waste movement to be created when the postcode is "D08 AC98" @allure.label.tag:DWT-342', async () => {
      wasteReceiptData.carrier.address.postcode = 'D08 AC98'
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(201)
      expect(response.json).toHaveProperty('wasteTrackingId')
    })

    it('should allow waste movement to be created when the postcode is "BS1 4XE" @allure.label.tag:DWT-342', async () => {
      wasteReceiptData.carrier.address.postcode = 'BS1 4XE'
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(201)
      expect(response.json).toHaveProperty('wasteTrackingId')
    })
  })

  describe('Invalid Carrier Postcodes', () => {
    it('should not allow waste movement to be created when the postcode is "xxx" @allure.label.tag:DWT-342', async () => {
      wasteReceiptData.carrier.address.postcode = 'xxx'
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier.address.postcode',
              errorType: 'InvalidFormat',
              message:
                '"carrier.address.postcode" must be in valid UK or Ireland format'
            }
          ]
        }
      })
    })

    it('should not allow waste movement to be created when the postcode is "BS14XE" (without spaces) @allure.label.tag:DWT-342', async () => {
      wasteReceiptData.carrier.address.postcode = 'BS14XE'
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier.address.postcode',
              errorType: 'InvalidFormat',
              message:
                '"carrier.address.postcode" must be in valid UK or Ireland format'
            }
          ]
        }
      })
    })
  })

  it(
    'should not allow waste movement to be created when an invalid email is supplied for the carrier organisation' +
      ' @allure.label.tag:DWT-342',
    async () => {
      wasteReceiptData.carrier.emailAddress = 'invalidtest@'
      const response =
        await globalThis.apis.wasteMovementExternalAPI.receiveMovement(
          wasteReceiptData
        )
      expect(response.statusCode).toBe(400)
      expect(response.json).toEqual({
        validation: {
          errors: [
            {
              key: 'carrier.emailAddress',
              errorType: 'InvalidFormat',
              message: '"carrier.emailAddress" must be a valid email'
            }
          ]
        }
      })
    }
  )
})
