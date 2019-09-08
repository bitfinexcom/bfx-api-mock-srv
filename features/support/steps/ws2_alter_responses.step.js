'use strict'

const assert = require('assert')
const request = require('request')
const { Given, When, Then, After } = require('cucumber')

const CMD_URL = 'http://localhost:9996'

let lastKey = null
let lastValue = null

const reqResults = {
  err: null,
  res: null,
  body: null
}

const changeResponse = (keyString, data, cb) => {
  lastKey = keyString
  lastValue = data

  const key = encodeURIComponent(keyString)

  request({
    url: `${CMD_URL}/${key}`,
    method: 'POST',
    json: data
  }, (err, res, body) => {
    reqResults.err = err
    reqResults.res = res
    reqResults.body = body
    cb()
  })
}

const readResponse = (keyString, cb) => {
  lastKey = keyString
  const key = encodeURIComponent(keyString)

  request.get({ url: `${CMD_URL}/${key}` }, (err, res, body) => {
    reqResults.err = err
    reqResults.res = res
    reqResults.body = body

    try {
      lastValue = JSON.parse(body)
    } catch (e) {
      reqResults.err = e
    }

    cb()
  })
}

Given(/^I have a mock v2 ws server$/, function (cb) {
  this.startServer()
  cb()
})

After(function (_, cb) {
  this.stopServer().then(cb).catch(cb)
})

When(/^I change an existing response$/, function (cb) {
  changeResponse('connect.res', {
    packets: [{ custom: 'response' }]
  }, cb)
})

When(/^I change an unknown response$/, function (cb) {
  changeResponse('not.a.response.i.hope', {
    packets: [{ custom: 'response' }]
  }, cb)
})

When(/^I read an existing response$/, function (cb) {
  readResponse('connect.res', cb)
})

When(/^I read an unknown response$/, function (cb) {
  readResponse('not.a.response.i.hope', cb)
})

Then(/^the response is updated$/, function (cb) {
  assert(!reqResults.err)
  assert(reqResults.res)
  assert.strictEqual(reqResults.res.statusCode, 200)

  assert(lastKey)
  assert(lastValue)

  request.get({ url: `${CMD_URL}/${lastKey}` }, (err, res, body) => {
    if (err) return cb(err)
    assert(res)
    assert(body)

    let value

    try {
      value = JSON.parse(body)
    } catch (e) {
      return cb(new Error(`bad response json ${body}`))
    }

    assert.deepStrictEqual(value, { packets: [{ custom: 'response' }] })
    cb()
  })
})

Then(/^the server responds with an error$/, function (cb) {
  assert(reqResults.err || reqResults.res.statusCode !== 200)
  cb()
})

Then(/^the server responds with that response JSON$/, function (cb) {
  assert.deepStrictEqual(lastValue, {
    packets: [{
      event: 'info',
      version: 2
    }]
  })

  cb()
})
