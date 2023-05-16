/* eslint-disable no-undef */

;(function () {
  'use strict'
  const MicroModal = require('micromodal')
  const KeyboardJS = require('keyboardjs')
  const config = document.getElementById('search-script').dataset
  const client = algoliasearch(config.appId, config.apiKey)

  const search = instantsearch({
    indexName: config.indexName,
    searchClient: client,
  })

  let lastRenderArgs

  const isMac = () => navigator.platform.indexOf('Mac') > -1

  const transformItems = (items) => {
    return items.map((item) => {
      let label = Object.keys(item.hierarchy).reduce((acc, key) => {
        const highlight = item._highlightResult.hierarchy[key]
        if (highlight && highlight.matchLevel !== 'none') {
          return item._highlightResult.hierarchy[key]
        }
        return acc
      }, '')
      if (!label) {
        label = Object.keys(item.hierarchy).reduce((acc, key) => {
          const highlight = item._highlightResult.hierarchy[key]
          if (highlight) {
            return item._highlightResult.hierarchy[key]
          }
          return acc
        }, '')
      }
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
    if (container.querySelector('#showmore')) {
      container.removeChild(container.querySelector('#showmore'))
    }

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
      if (!lastRenderArgs.isLastPage) {
        const more = document.createElement('div')
        const link = document.createElement('a')
        more.setAttribute('id', 'showmore')
        link.addEventListener('click', () => {
          showMore()
          return false
        })
        link.innerHTML = 'Show more'
        more.appendChild(link)
        container.appendChild(more)
      }
    }
  })

  search.addWidgets([
    instantsearch.widgets.configure({
      facetFilters: [`version:${config.pageVersion}`],
      attributesToSnippet: ['content'],
      attributesToHighlight: ['hierarchy'],
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

  const open = () => {
    MicroModal.show('modal-1', {
      disableScroll: true,
    })
  }

  document.getElementById('search').addEventListener('click', () => {
    open()
  })

  const command = isMac() ? 'command' : 'ctrl'
  document.getElementById('search-key').innerHTML = `${isMac() ? '⌘' : 'CTRL'} + k`
  KeyboardJS.bind(`${command} > k`, () => {
    open()
  })
})()
