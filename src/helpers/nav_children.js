'use strict'

module.exports = (navigation, url) => findNavigation(navigation[0].items, url)

function findNavigation (items, url) {
  if (!items) return
  for (const item of items) {
    const r = findNavigation(item.items, url)
    if (r) return r
    if (item.url === url) return item.items
  }
}
