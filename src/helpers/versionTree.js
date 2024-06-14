'use strict'

module.exports = (components) => versionTree(components)

function versionTree (components) {
  return components.map((comp) => {
    return {
      ...comp,
      versions: splitVersions(comp.versions),
    }
  })
}

function splitVersions (versions) {
  const snapshot = versions.filter((v) => v.version.includes('SNAPSHOT'))
  const stable = versions.filter((v) => {
    const split = v.version.split('-')
    if (split.length === 1) return true
    return false
  })
  const preview = versions.filter((v) => !snapshot.includes(v) && !stable.includes(v))
  return {
    snapshot: snapshot.length > 0 ? snapshot : null,
    stable: stable.length > 0 ? stable : null,
    preview: preview.length > 0 ? preview : null,
  }
}
