/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const versionTree = require('../src/helpers/versionTree.js')

describe('versionTree', () => {
  it('should return stable, preview and snapshot  versions', () => {
    const result = versionTree([
      {
        versions: [
          {
            version: '3.0.1-SNAPSHOT',
          },
          {
            version: '3.0.0-SNAPSHOT',
          },
          {
            version: '2.0.0',
          },
          {
            version: '1.0.0',
          },
          {
            version: '1.0.0-RC1',
          },
          {
            version: '1.0.0-RC2',
          },
        ],
      },
    ])

    expect(result[0].versions.stable.length).is.eql(2)
    expect(result[0].versions.stable[0].version).is.eql('2.0.0')
    expect(result[0].versions.stable[1].version).is.eql('1.0.0')

    expect(result[0].versions.preview.length).is.eql(2)
    expect(result[0].versions.preview[0].version).is.eql('1.0.0-RC1')
    expect(result[0].versions.preview[1].version).is.eql('1.0.0-RC2')

    expect(result[0].versions.snapshot.length).is.eql(2)
    expect(result[0].versions.snapshot[0].version).is.eql('3.0.1-SNAPSHOT')
    expect(result[0].versions.snapshot[1].version).is.eql('3.0.0-SNAPSHOT')
  })

  it('should return an empty structure', () => {
    const result = versionTree([
      {
        versions: [],
      },
    ])
    expect(result[0].versions.stable).is.eql(null)
    expect(result[0].versions.preview).is.eql(null)
    expect(result[0].versions.snapshot).is.eql(null)
  })
})
