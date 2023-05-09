/* eslint-disable no-undef */

;(function () {
  'use strict'
  var MicroModal = require('micromodal')
  const config = document.getElementById('search-script').dataset
  const client = algoliasearch(config.appId, config.apiKey)

  const search = instantsearch({
    indexName: config.indexName,
    searchClient: client,
  })

  let lastRenderArgs

  const transformItems = (items) => {
    return items.map((item) => {
      const label = Object.keys(item.hierarchy).reduce((acc, key) => {
        if (item._highlightResult.hierarchy[key]) {
          return item._highlightResult.hierarchy[key]
        }
        return acc
      }, '')
      return {
        ...item,
        _highlightResult: {
          ...item._highlightResult,
          label: label,
        },
      }
    })
  }

  const infiniteHits = instantsearch.connectors.connectInfiniteHits((renderArgs, isFirstRender) => {
    const { hits, showMore, widgetParams } = renderArgs
    const { container } = widgetParams
    lastRenderArgs = renderArgs
    if (isFirstRender) {
      const sentinel = document.createElement('div')
      container.appendChild(document.createElement('ul'))
      container.appendChild(sentinel)
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !lastRenderArgs.isLastPage) {
            showMore()
          }
        })
      })
      observer.observe(sentinel)
      return
    }
    const _hits = transformItems(hits)

    if (hits.length === 0) {
      container.querySelector('ul').innerHTML = '<li class="no-result">No result</li>'
    } else {
      container.querySelector('ul').innerHTML = _hits
        .map((hit) => {
          let content = ''
          let breadcrumbs = ''

          if (hit.content) {
            content = `<p class="hit-description">
                ${instantsearch.snippet({ hit: hit, attribute: 'content' })}
              </p>`
          }

          if (hit.breadcrumbs) {
            breadcrumbs = `<div class="hit-breadcrumbs">
                ${hit.breadcrumbs
                  .map((chain) => {
                    const arr = chain.split('|')
                    return `<span>${arr[0]}</span>`
                  })
                  .join(' > ')}
              </div>`
          }

          return `<li>
              <a href="${hit.url}" class="ais-Hits-item">
                <div class="hit-name">
                  ${instantsearch.highlight({ hit: hit, attribute: 'label' })}
                </div>
                ${breadcrumbs}
                ${content}
              </a>
            </li>`
        })
        .join('')
    }
  })

  search.addWidgets([
    instantsearch.widgets.configure({
      facetFilters: [`version:${config.pageVersion}`],
      distinct: true,
    }),
    instantsearch.widgets.searchBox({
      container: '#searchbox',
      autofocus: true,
      showSubmit: false,
      showReset: true,
      placeholder: `Search in the current documentation ${config.pageVersion}`,
    }),
    infiniteHits({
      container: document.querySelector('#hits'),
    }),
  ])

  search.start()

  MicroModal.init()

  document.getElementById('search').addEventListener('click', () => {
    MicroModal.show('modal-1', {
      disableScroll: true,
    })
  })
})()
