'use strict'

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

module.exports = (components) => {
  return Object.values(components)?.map((comp) => {
    return {
      ...comp,
      versions: splitVersions(comp.versions),
    }
  })
}
