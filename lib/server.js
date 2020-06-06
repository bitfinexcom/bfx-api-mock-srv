'use strict'

const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const { EventEmitter } = require('events')
const debug = require('debug')('bfx:api-mock-srv:server')

/**
 * Mock server base class, listens for commands to get/set responses
 *
 * @class
 * @memberof module:bfx-api-mock-srv
 * @augments EventEmitter
 *
 * @see {@link module:bfx-api-mock-srv.MockRESTv2Server|MockRESTv2Server}
 * @see {@link module:bfx-api-mock-srv.MockWSv2Server|MockWSv2Server}
 */
class MockServer extends EventEmitter {
  /**
   * @param {object} args - args
   * @param {number} [args.cmdPort=9998] - port to listen on for HTTP commands
   * @param {string} dataPath - path to JSON file with responses
   */
  constructor (args = {}, dataPath) {
    const { cmdPort = 9998 } = args

    super()

    this._cmdServer = express()
    this._cmdServer.use(bodyParser.json())
    this._cmdServerHTTP = null
    this._cmdPort = cmdPort
    this._responses = new Map()

    this._cmdServer.get('/:key', this._onGetResponse.bind(this))
    this._cmdServer.post('/:key', this._onSetResponse.bind(this))

    if (dataPath) {
      this._loadResponsesFromFile(dataPath)
    }
  }

  /**
   * Clears & resets the responses map with the contents of the specified file.
   * Responses are unmodified on failure.
   *
   * @param {string} path - path
   * @private
   */
  _loadResponsesFromFile (path) {
    let data

    try {
      const dataJSON = fs.readFileSync(path)
      data = JSON.parse(dataJSON)
    } catch (e) {
      debug('error loading data from path %s: %j', path, e)
      return
    }

    const keys = Object.keys(data)
    this._responses.clear()

    for (let i = 0; i < keys.length; i++) {
      this._responses.set(keys[i], data[keys[i]])
    }
  }

  /**
   * Starts the HTTP command server listening on the configured port. This is
   * a no-op if the server is already up.
   */
  listen () {
    if (this._cmdServerHTTP) return

    this._cmdServerHTTP = this._cmdServer.listen(this._cmdPort)
    debug('cmd server listening on port %d', this._cmdPort)
  }

  /**
   * Closes the command server if it is running, no-op if not.
   *
   * @returns {Promise} p
   */
  async close () {
    if (!this._cmdServerHTTP) {
      return
    }

    return new Promise((resolve, reject) => {
      this._cmdServerHTTP.close((err) => {
        if (err) return reject(err)

        this._cmdServerHTTP = null
        debug('cmd server closed')
        resolve()
      })
    })
  }

  /**
   * @private
   *
   * @param {express.Request} req - request
   * @param {express.Response} res - response
   */
  _onGetResponse (req, res) {
    const key = decodeURIComponent(req.params.key)
    const data = this.getResponse(key)

    if (!data) {
      res.status(404).json({ error: 'unknown key' })
      return
    }

    res.status(200).send(data)
  }

  /**
   * @private
   *
   * @param {express.Request} req - request
   * @param {express.Response} res - response
   */
  _onSetResponse (req, res) {
    const key = decodeURIComponent(req.params.key)
    const set = this.setResponse(key, req.body)

    if (!set) {
      res.status(404).json({ error: 'unknown key' })
      return
    }

    res.sendStatus(200)
    debug('updated response for key %s', key)
  }

  /**
   * Returns the configured server response for the given key
   *
   * @param {string} key - key
   * @returns {string} response - JSON
   */
  getResponse (key) {
    return this._responses.get(key)
  }

  /**
   * Sets the provided data as the server response for the given key.
   *
   * @param {string} key - key
   * @param {Array|object} data - data
   */
  setResponse (key, data) {
    this._responses.set(key, JSON.stringify(data))
  }
}

module.exports = MockServer
