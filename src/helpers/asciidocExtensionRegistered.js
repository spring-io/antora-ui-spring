'use strict'

module.exports = (requireRequest, { data }) => {
  const { componentVersion } = data.root.page
  if (!componentVersion || !componentVersion.asciidoc) return
  const cache = data.extensionCache || (data.extensionCache = {})
  let extension
  if (requireRequest in cache) {
    extension = cache[requireRequest]
  } else {
    try {
      extension = require.cache[require.resolve(requireRequest, { paths: require.main.paths })]
    } catch {}
    cache[requireRequest] = extension
  }
  if (!extension) return
  return componentVersion.asciidoc.extensions.includes(extension.exports)
}
