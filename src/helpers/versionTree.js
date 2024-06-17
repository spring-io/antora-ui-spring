'use strict'

module.exports = (components) => versionTree(components)

function versionTree (components) {
  for (const [, component] of Object.entries(components)) {
    component.versionTree = splitVersions(component.versions)
  }
  return components
}

function splitVersions (versions) {
  const snapshot = versions.filter((v) => v.displayVersion.includes('SNAPSHOT'))
  const stable = versions.filter((v) => !v.displayVersion.includes('-'))
  const preview = versions.filter((v) => !snapshot.includes(v) && !stable.includes(v))
  return {
    snapshot: snapshot.length > 0 ? snapshot : null,
    stable: stable.length > 0 ? stable : null,
    preview: preview.length > 0 ? preview : null,
  }
}
