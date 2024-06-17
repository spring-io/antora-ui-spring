/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const versionTree = require('../src/helpers/versionTree.js')

describe('versionTree', () => {
  it('should return stable, preview and snapshot  versions', () => {
    const result = versionTree({
      test: {
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
    })

    const tree = result.test.versionTree
    expect(tree.stable.length).is.eql(2)
    expect(tree.stable[0].version).is.eql('2.0.0')
    expect(tree.stable[1].version).is.eql('1.0.0')

    expect(tree.preview.length).is.eql(2)
    expect(tree.preview[0].version).is.eql('1.0.0-RC1')
    expect(tree.preview[1].version).is.eql('1.0.0-RC2')

    expect(tree.snapshot.length).is.eql(2)
    expect(tree.snapshot[0].version).is.eql('3.0.1-SNAPSHOT')
    expect(tree.snapshot[1].version).is.eql('3.0.0-SNAPSHOT')
  })

  it('should return an empty structure', () => {
    const result = versionTree({
      test: {
        versions: [],
      },
    })
    const tree = result.test.versionTree
    expect(tree.stable).is.eql(null)
    expect(tree.preview).is.eql(null)
    expect(tree.snapshot).is.eql(null)
  })
})
