'use strict'

const octicons = require('@primer/octicons')
const ospath = require('path')
const fs = require('fs')

const icons = [
  'alert',
  'book',
  'chevron-down',
  'chevron-left',
  'copy',
  'flame',
  'fold',
  'home',
  'info',
  'law',
  'light-bulb',
  'moon',
  'question',
  'rocket',
  'search',
  'stop',
  'sun',
  'three-bars',
  'unfold',
  'x',
]

const pathRegex = /<svg .+?>(.*)<\/svg>/m

const preamble = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 208">
  <title>Octicons</title>
  <desc>Octicons by GitHub - https://primer.style/octicons/ - License: MIT</desc>
  <metadata
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:RDF>
      <cc:Work rdf:about="">
        <dc:title>@primer/octicons</dc:title>
        <dc:description>A scalable set of icons handcrafted with &lt;3 by GitHub</dc:description>
        <dc:format>image/svg+xml</dc:format>
        <dc:creator>
          <cc:Agent>
            <dc:title>GitHub</dc:title>
          </cc:Agent>
        </dc:creator>
        <dc:rights>
          <cc:Agent>
            <dc:title>Copyright (c) GitHub Inc.</dc:title>
          </cc:Agent>
        </dc:rights>
        <cc:license rdf:resource="https://opensource.org/licenses/MIT" />
        <dc:relation>https://primer.style/octicons/</dc:relation>
      </cc:Work>
    </rdf:RDF>
  </metadata>

`

function generateOcticons (cb) {
  let result = preamble
  let offset = 0
  for (const icon of icons) {
    const svg = octicons[icon].toSVG({ width: 16, height: 16 })
    const path = pathRegex.exec(svg)[1]
    result += `  <symbol id="icon-${icon}" viewBox="0 0 16 16">
        ${path}
  </symbol>
  <use href="#icon-${icon}" width="16" height="16" x="0" y="${offset}" />
  <view id="view-${icon}" viewBox="0 ${offset} 16 16" />

`
    offset += 16
  }
  result += '</svg>'
  const filename = ospath.join(__filename, '../../../src/img/octicons-16.svg')
  fs.writeFile(filename, result, cb)
  cb()
}

module.exports = () => generateOcticons
