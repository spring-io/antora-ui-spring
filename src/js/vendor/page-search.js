/* eslint-disable no-undef */

;(function () {
  const config = document.getElementById('page-search-script').dataset
  const client = algoliasearch(config.appId, config.apiKey)
  let selected = null

  const search = instantsearch({
    indexName: config.indexName,
    searchClient: client,
  })

  let lastRenderArgs

  const infiniteHits = instantsearch.connectors.connectInfiniteHits((renderArgs, isFirstRender) => {
    const { hits, showMore, widgetParams } = renderArgs
    const { container } = widgetParams
    lastRenderArgs = renderArgs
    selected = null
    if (isFirstRender) {
      const sentinel = document.createElement('div')
      container.appendChild(document.createElement('ul'))
      container.appendChild(sentinel)
      return
    }
    const _hits = [...hits]
    if (container.querySelector('#page-showmore')) {
      container.removeChild(container.querySelector('#page-showmore'))
    }
    if (container.querySelector('#page-nomore')) {
      container.removeChild(container.querySelector('#page-nomore'))
    }

    const nbHits = renderArgs.results.nbHits
    if (hits.length === 0) {
      container.querySelector('ul').innerHTML = '<li class="no-result">No result</li>'
      document.querySelector('#page-counter').style.display = 'none'
    } else {
      document.querySelector('#page-counter').innerHTML = `<strong>${nbHits}</strong> result${
        nbHits > 1 ? 's' : ''
      } found`
      document.querySelector('#page-counter').style.display = 'block'
      container.querySelector('ul').innerHTML = _hits
        .map((hit) => {
          let content = ''
          let breadcrumbs = ''
          let label = ''

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

          label = Object.keys(hit.hierarchy)
            .map((key, index) => {
              if (index > 0 && hit) {
                return instantsearch.highlight({ hit: hit, attribute: 'hierarchy.' + key })
              }
              return null
            })
            .filter((item) => !!item)
            .join(' - ')

          return `<li>
                <a href="${hit.url}" class="ais-Hits-item">
                  <div class="hit-name">
                    ${label}
                  </div>
                  ${breadcrumbs}
                  ${content}
                </a>
              </li>`
        })
        .join('')

      // container.querySelectorAll('ul a').forEach((a) => {
      //   a.addEventListener('click', () => {
      //     MicroModal.close('modal-1')
      //   })
      // })

      if (!lastRenderArgs.isLastPage) {
        const more = document.createElement('div')
        const link = document.createElement('a')
        more.setAttribute('id', 'page-showmore')
        link.addEventListener('click', () => {
          showMore()
          return false
        })
        link.innerHTML = 'Show more'
        more.appendChild(link)
        container.appendChild(more)
      } else {
        const noMore = document.createElement('div')
        noMore.setAttribute('id', 'page-nomore')
        noMore.innerHTML = 'No more result'
        container.appendChild(noMore)
      }
    }
  })

  const selectHit = (newSelected) => {
    const hits = document.querySelectorAll('#page-hits>ul>li>a')
    if (hits[selected]) {
      hits[selected].classList.remove('selected')
      selected = null
    }
    if (hits[newSelected]) {
      hits[newSelected].classList.add('selected')
      selected = newSelected
    }

    if (selected) {
      hits[selected].scrollIntoView()
    }
  }

  const openHit = (index) => {
    const hits = document.querySelectorAll('#page-hits>ul>li>a')
    if (hits[index]) {
      hits[index].click()
    }
  }

  const input = document.createElement('input')
  const renderSearchBox = (renderOptions, isFirstRender) => {
    const { query, refine, clear, isSearchStalled, widgetParams } = renderOptions
    if (isFirstRender) {
      input.classList.add('ais-SearchBox-input')
      input.placeholder = 'Search in all Spring Documentation'
      const loadingIndicator = document.createElement('span')
      loadingIndicator.textContent = 'Loading...'
      const button = document.createElement('button')
      button.classList.add('ais-SearchBox-reset')
      button.innerHTML =
        '<svg class="ais-SearchBox-resetIcon" viewBox="0 0 20 20"' +
        ' width="10" height="10" aria-hidden="true"><path d="M8.114 10L.944 2.83 0 1.885' +
        ' 1.886 0l.943.943L10 8.113l7.17-7.17.944-.943L20 1.886l-.943.943-7.17 7.17 7.17' +
        ' 7.17.943.944L18.114 20l-.943-.943-7.17-7.17-7.17 7.17-.944.943L0 18.114l.943-.943' +
        'L8.113 10z"></path></svg>'
      input.addEventListener('keydown', (event) => {
        switch (event.keyCode) {
          case 40: // Down
            event.preventDefault()
            if (selected === null) {
              selectHit(0)
            } else {
              selectHit(selected + 1)
            }
            break
          case 38: // Up
            event.preventDefault()
            if (selected === null) {
              selectHit(0)
            }
            selectHit(Math.max(selected - 1, 0))
            break
          case 13: // Enter
            event.preventDefault()
            if (selected !== null) {
              openHit(selected)
            }
            break
          case 9: // Tab
            event.preventDefault()
            break
        }
      })
      input.addEventListener('input', (event) => {
        refine(event.target.value)
      })
      button.addEventListener('click', () => {
        clear()
      })
      widgetParams.container.appendChild(input)
      widgetParams.container.appendChild(loadingIndicator)
      widgetParams.container.appendChild(button)
    }
    widgetParams.container.querySelector('input').value = query
    widgetParams.container.querySelector('span').hidden = !isSearchStalled
  }

  const searchBox = instantsearch.connectors.connectSearchBox(renderSearchBox)

  // selected
  search.addWidgets([
    instantsearch.widgets.configure({
      facetFilters: ['isLatestVersion:true'],
      attributesToSnippet: ['content'],
      attributesToHighlight: ['hierarchy'],
      distinct: true,
    }),
    searchBox({
      container: document.querySelector('#page-searchbox'),
    }),
    infiniteHits({
      container: document.querySelector('#page-hits'),
    }),
  ])

  search.start()
  input.focus()
})()
