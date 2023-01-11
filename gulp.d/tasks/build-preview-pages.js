'use strict'

const Asciidoctor = require('@asciidoctor/core')()
const fs = require('fs')
const { promises: fsp } = fs
const handlebars = require('handlebars')
const merge = require('merge-stream')
const ospath = require('path')
const path = ospath.posix
const requireFromString = require('require-from-string')
const { Transform } = require('stream')
const map = (transform = () => {}, flush = undefined) => new Transform({ objectMode: true, transform, flush })
const vfs = require('vinyl-fs')
const yaml = require('js-yaml')

const ASCIIDOC_ATTRIBUTES = { experimental: '', icons: 'font', sectanchors: '', 'source-highlighter': 'highlight.js' }

module.exports =
  (src, previewSrc, previewDest, sink = () => map()) =>
    (done) =>
      Promise.all([
        loadSampleUiModel(previewSrc),
        toPromise(
          merge(compileLayouts(src), registerPartials(src), registerHelpers(src), copyImages(previewSrc, previewDest))
        ),
      ])
        .then(([baseUiModel, { layouts }]) => {
          const extensions = ((baseUiModel.asciidoc || {}).extensions || []).map((request) => {
            ASCIIDOC_ATTRIBUTES[request.replace(/^@|\.js$/, '').replace(/[/]/g, '-') + '-loaded'] = ''
            const extension = require(request)
            extension.register.call(Asciidoctor.Extensions)
            return extension
          })
          const siteAsciiDocConfig = { extensions }
          for (const component of baseUiModel.site.components) {
            for (const version of component.versions || []) {
              version.asciidoc = siteAsciiDocConfig
            }
          }
          baseUiModel = { ...baseUiModel, env: process.env }
          delete baseUiModel.asciidoc
          return [baseUiModel, layouts]
        })
        .then(([baseUiModel, layouts]) =>
          vfs
            .src('**/*.adoc', { base: previewSrc, cwd: previewSrc })
            .pipe(map((file, enc, next) => loadUiModelForPage(file.path).then((page) => next(null, { file, page }))))
            .pipe(
              map(({ file, page = {} }, enc, next) => {
                const siteRootPath = path.relative(ospath.dirname(file.path), ospath.resolve(previewSrc))
                const uiModel = { ...baseUiModel }
                const sharedPageModel = page.component ? baseUiModel.shared[page.component.name][page.version] : {}
                uiModel.page = { ...uiModel.page, ...page, ...sharedPageModel }
                uiModel.siteRootPath = siteRootPath
                uiModel.siteRootUrl = path.join(siteRootPath, 'index.html')
                uiModel.uiRootPath = path.join(siteRootPath, '_')
                if (file.stem === '404') {
                  uiModel.page = { layout: '404', title: 'Page Not Found' }
                } else {
                  const doc = Asciidoctor.load(file.contents, { safe: 'safe', attributes: ASCIIDOC_ATTRIBUTES })
                  uiModel.page.attributes = Object.entries(doc.getAttributes())
                    .filter(([name, val]) => name.startsWith('page-'))
                    .reduce((accum, [name, val]) => {
                      accum[name.substr(5)] = val
                      return accum
                    }, {})
                  uiModel.page.layout = doc.getAttribute('page-layout', 'default')
                  if (doc.hasAttribute('docrole')) uiModel.page.role = doc.getAttribute('docrole')
                  uiModel.page.title = doc.getDocumentTitle()
                  uiModel.page.contents = Buffer.from(doc.convert())
                }
                file.extname = '.html'
                try {
                  file.contents = Buffer.from(layouts.get(uiModel.page.layout)(uiModel))
                  next(null, file)
                } catch (e) {
                  next(transformHandlebarsError(e, uiModel.page.layout))
                }
              })
            )
            .pipe(vfs.dest(previewDest))
            .on('error', done)
            .pipe(sink())
        )

function loadSampleUiModel (src) {
  return fsp.readFile(ospath.join(src, 'ui-model.yml'), 'utf8').then((contents) => yaml.load(contents))
}

function loadUiModelForPage (srcPath) {
  srcPath += '.yml'
  return fsp.readFile(srcPath).then(
    (contents) => yaml.load(contents),
    () => undefined
  )
}

function registerPartials (src) {
  return vfs.src('partials/*.hbs', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerPartial(file.stem, file.contents.toString())
      next()
    })
  )
}

function registerHelpers (src) {
  handlebars.registerHelper('relativize', relativize)
  handlebars.registerHelper('resolvePage', resolvePage)
  handlebars.registerHelper('resolvePageURL', resolvePageURL)
  return vfs.src('helpers/*.js', { base: src, cwd: src }).pipe(
    map((file, enc, next) => {
      handlebars.registerHelper(file.stem, requireFromString(file.contents.toString()))
      next()
    })
  )
}

function compileLayouts (src) {
  const layouts = new Map()
  return vfs.src('layouts/*.hbs', { base: src, cwd: src }).pipe(
    map(
      (file, enc, next) => {
        const srcName = path.join(src, file.relative)
        layouts.set(file.stem, handlebars.compile(file.contents.toString(), { preventIndent: true, srcName }))
        next()
      },
      function (done) {
        this.push({ layouts })
        done()
      }
    )
  )
}

function copyImages (src, dest) {
  return vfs
    .src('**/*.{png,svg}', { base: src, cwd: src })
    .pipe(vfs.dest(dest))
    .pipe(map((file, enc, next) => next()))
}

function relativize (to, { data: { root } }) {
  if (!to) return '#'
  if (to.charAt() !== '/') return to
  const from = root.page.url
  if (!from) return (root.site.path || '') + to
  let hash = ''
  const hashIdx = to.indexOf('#')
  if (~hashIdx) {
    hash = to.substr(hashIdx)
    to = to.substr(0, hashIdx)
  }
  return to === from
    ? hash || (to.charAt(to.length - 1) === '/' ? './' : path.basename(to))
    : (path.relative(path.dirname(from + '.'), to) || '.') + (to.charAt(to.length - 1) === '/' ? '/' + hash : hash)
}

function resolvePage (spec, context = {}) {
  if (spec) return { pub: { url: resolvePageURL(spec) } }
}

function resolvePageURL (spec, context = {}) {
  if (spec) return '/' + (spec = spec.split(':').pop()).slice(0, spec.lastIndexOf('.')) + '.html'
}

function transformHandlebarsError ({ message, stack }, layout) {
  const m = stack.match(/^ *at Object\.ret \[as (.+?)\]/m)
  const templatePath = `src/${m ? 'partials/' + m[1] : 'layouts/' + layout}.hbs`
  const err = new Error(`${message}${~message.indexOf('\n') ? '\n^ ' : ' '}in UI template ${templatePath}`)
  err.stack = [err.toString()].concat(stack.substr(message.length + 8)).join('\n')
  return err
}

function toPromise (stream) {
  return new Promise((resolve, reject, data = {}) =>
    stream
      .on('error', reject)
      .on('data', (chunk) => chunk.constructor === Object && Object.assign(data, chunk))
      .on('finish', () => resolve(data))
  )
}
