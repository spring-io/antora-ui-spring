'use strict'

const { promises: fsp } = require('fs')
const { Transform } = require('stream')
const map = (transform) => new Transform({ objectMode: true, transform })
const vfs = require('vinyl-fs')

module.exports = (files) => () =>
  vfs.src(files, { allowEmpty: true }).pipe(map(({ path }, enc, next) => rm(path, next)))

function rm (path, cb) {
  return fsp.rm(path, { recursive: true }).then(cb).catch(cb)
}
