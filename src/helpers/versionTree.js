'use strict'

module.exports = (components, page) => versionTree(components, page)

function versionTree (components, page) {
  const versionToUrl = {}
  if (page && page.versions) {
    page.versions.forEach((v) => {
      versionToUrl[v.displayVersion] = v.url
    })
  }
  for (const [, component] of Object.entries(components)) {
    const componentVersionToUrl = component &&
      page &&
      page.component &&
      component.name === page.component.name ? versionToUrl : {}
    component.versionTree = splitVersions(component.versions, componentVersionToUrl)
  }
  return components
}

function splitVersions (versions, versionToUrl) {
  const snapshot = versions.filter((v) => v.displayVersion.includes('SNAPSHOT')).map((v) => navVersion(v, versionToUrl))
  const stable = versions.filter((v) => !v.displayVersion.includes('-')).map((v) => navVersion(v, versionToUrl))
  const preview = versions.filter((v) => !v.displayVersion.includes('SNAPSHOT') &&
    v.displayVersion.includes('-')).map((v) => navVersion(v, versionToUrl))
  return {
    snapshot: snapshot.length > 0 ? snapshot : null,
    stable: stable.length > 0 ? stable : null,
    preview: preview.length > 0 ? preview : null,
  }
}

function navVersion (v, versionToUrl) {
  const navVersion =
    v.latest ? { latest: v.latest, url: v.url, displayVersion: v.displayVersion }
      : { url: v.url, displayVersion: v.displayVersion }
  if (versionToUrl[v.displayVersion]) {
    navVersion.url = versionToUrl[v.displayVersion]
  }
  return navVersion
}
