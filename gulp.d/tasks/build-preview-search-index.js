'use strict'

const Asciidoctor = require('@asciidoctor/core')()
const fs = require('fs')
const { promises: fsp } = fs
const ospath = require('path')
const yaml = require('js-yaml')

module.exports = (src, previewSrc, previewDest) => async function buildPreviewSearchIndex () {
  const adocFiles = await collectAdocFiles(previewSrc)
  const docs = []

  for (const adocPath of adocFiles) {
    const adocContents = await fsp.readFile(adocPath, 'utf8')
    const doc = Asciidoctor.load(adocContents, { safe: 'safe' })
    const title = doc.getDocumentTitle() || ospath.basename(adocPath, '.adoc')
    const html = doc.convert()
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    const pageModel = await loadPageModel(adocPath)
    let url = (pageModel && pageModel.url) || ''

    if (!url) {
      const rel = ospath.relative(previewSrc, adocPath).replace(/\\/g, '/')
      url = '/' + rel.replace(/\.adoc$/, '.html')
    }

    const titles = extractSectionTitles(doc, text, title)

    docs.push({ url, title, text, titles })
  }

  const jsDir = previewDest
  await fsp.mkdir(jsDir, { recursive: true })

  const indexJs = [
    'window.antoraLunr = window.antoraLunr || {};',
    'window.antoraLunr.docs = ' + JSON.stringify(docs, null, 2) + ';',
    '',
  ].join('\n')

  await fsp.writeFile(ospath.join(jsDir, 'search-index.js'), indexJs, 'utf8')
}

function extractSectionTitles (doc, fullText, defaultTitle) {
  const titles = []

  const sections = doc.findBy({ context: 'section' }) || []

  sections.forEach((sect) => {
    const title = sect.getTitle && sect.getTitle()
    const id = sect.getId && sect.getId()
    const html = sect.convert()
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    if (title || text) {
      titles.push({ id: id || null, title: title || defaultTitle, text })
    }
  })

  if (!titles.length) {
    titles.push({ id: null, title: defaultTitle, text: fullText })
  }

  return titles
}

async function collectAdocFiles (dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = ospath.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectAdocFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.adoc')) {
      files.push(fullPath)
    }
  }

  return files
}

async function loadPageModel (adocPath) {
  const ymlPath = adocPath + '.yml'
  try {
    const contents = await fsp.readFile(ymlPath, 'utf8')
    return yaml.load(contents)
  } catch (e) {
    return undefined
  }
}
