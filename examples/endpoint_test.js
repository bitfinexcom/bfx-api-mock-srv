'use strict'

process.env.DEBUG = 'bfx:*'

const assert = require('assert')
const { RESTv2 } = require('bfx-api-node-rest')
const { MockRESTv2Server } = require('../')

const FUNDING_OFFER = [
  41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
  null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0, 0.00207328
]

const srv = new MockRESTv2Server({ listen: true })
const rest = new RESTv2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: 'http://localhost:9999'
})

srv.setResponse('f_offers.fUSD', [FUNDING_OFFER])

rest.fundingOffers({ symbol: 'fUSD' }).then(([incomingFundingOffer]) => {
  assert.deepStrictEqual(incomingFundingOffer, FUNDING_OFFER)

  srv.close()

  return null
})
