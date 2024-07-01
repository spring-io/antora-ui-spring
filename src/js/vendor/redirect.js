;(function () {
  'use strict'

  window.addEventListener('load', onChange)
  window.addEventListener('hashchange', onChange)

  function onChange () {
    const params = new URLSearchParams(window.location.search)
    const page = params.get('page') || ''
    const fragment = window.location.hash
    const pageAndFragment = page + (fragment.length === 1 ? '' : fragment)
    let foundForFragment
    let foundForPageAndFragment
    const candidates = document.querySelector('body ul')
    if (candidates) {
      for (const candidate of candidates.children) {
        const anchorElement = candidate.querySelector('a')
        if (anchorElement.text === pageAndFragment) foundForPageAndFragment = anchorElement.href
        if (anchorElement.text === fragment) foundForFragment = anchorElement.href
      }
    }
    window.location.replace(foundForPageAndFragment || foundForFragment || 'index.html')
  }
})()
