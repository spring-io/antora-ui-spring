/* eslint-env mocha */
'use strict'

process.env.NODE_ENV = 'test'

const chai = require('chai')
const fsp = require('node:fs/promises')
const http = require('http')
const ospath = require('path')
const { once } = require('events')

chai.use(require('chai-fs'))
chai.use(require('chai-spies'))
// dirty-chai must be loaded after the other plugins
// see https://github.com/prodatakey/dirty-chai#plugin-assertions
chai.use(require('dirty-chai'))

const cleanDir = (dir, { create } = {}) =>
  fsp.rm(dir, { recursive: true, force: true }).then(() => (create ? fsp.mkdir(dir, { recursive: true }) : undefined))

const filterLines = (str, predicate) => str.split('\n').filter(predicate).join('\n')

const heredoc = (literals, ...vals) => {
  const str = literals
    .reduce((accum, chunk, idx) => {
      if (!idx) return [chunk]
      let val = vals[idx - 1]
      let match
      const last = accum[accum.length - 1]
      if (last.charAt(last.length - 1) === ' ' && (match = /\n( +)$/.exec(last))) {
        const indent = match[1]
        const valLines = val.split(/^/m)
        if (valLines.length > 1) val = valLines.map((l, i) => (i ? indent + l : l)).join('')
      }
      return accum.concat(val, chunk)
    }, undefined)
    .join('')
    .trimEnd()
  let lines = str.split(/^/m)
  if (lines[0] === '\n') lines = lines.slice(1)
  if (lines.length < 2) return str // discourage use of heredoc in this case
  const last = lines.pop()
  if (last != null) {
    lines.push(last[last.length - 1] === '\\' && last[last.length - 2] === ' ' ? last.slice(0, -2) + '\n' : last)
  }
  const indentRx = /^ +/
  const indentSize = Math.min(...lines.filter((l) => l.charAt() === ' ').map((l) => l.match(indentRx)[0].length))
  return (indentSize ? lines.map((l) => (l.charAt() === ' ' ? l.slice(indentSize) : l)) : lines).join('')
}

const startWebServer = (hostname, rootDir) => {
  const contentTypes = {}
  const handler = {
    delegate: (request, response) => {
      fsp.readFile(ospath.join(rootDir, request.url)).then(
        (content) => {
          const ext = ospath.extname(request.url)
          response.writeHead(200, { 'Content-Type': contentTypes[ext] || `application/${ext.slice(1)}` })
          response.end(content)
        },
        () => {
          response.writeHead(404, { 'Content-Type': 'text/html' })
          response.end('<!DOCTYPE html><html><body>Not Found</body></html>', 'utf8')
        }
      )
    },
  }
  const httpServer = http.createServer((request, response) => handler.delegate(request, response))
  return once(httpServer.listen(0), 'listening').then(() => {
    httpServer.shutdown = function () {
      return once(this.close() || this, 'close')
    }.bind(httpServer)
    httpServer.handler = function (h) {
      handler.delegate = h
    }
    return [httpServer, new URL(`http://${hostname}:${httpServer.address().port}`).toString().slice(0, -1)]
  })
}

// NOTE async keyword only needed on fn declaration if the function it calls does not always return a Promise
const trapAsyncError = (fn, ...args) =>
  fn(...args).then(
    (returnValue) => () => returnValue,
    (err) => () => {
      throw err
    }
  )

module.exports = { cleanDir, expect: chai.expect, filterLines, heredoc, spy: chai.spy, startWebServer, trapAsyncError }
