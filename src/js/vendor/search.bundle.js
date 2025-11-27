/* eslint-disable no-undef */

;(function () {
  const isMac = () => navigator.platform.indexOf('Mac') > -1
  let initialized = false
  let index = null
  let store = {}
  let usingAntoraIndex = false
  let selected = null

  // Initialize Lunr index from the generated search-index.js
  const initSearch = () => {
    if (initialized) return
    if (typeof lunr === 'undefined' || typeof antoraLunr === 'undefined') return

    if (antoraLunr.index && antoraLunr.store) {
      // Main Antora site: use Antora's pre-built index, but map refs to documents
      index = lunr.Index.load(antoraLunr.index)
      store = (antoraLunr.store && antoraLunr.store.documents) || {}
      usingAntoraIndex = true
      initialized = true
      return
    }

    if (Array.isArray(antoraLunr.docs)) {
      // Preview: build a Lunr index from our docs array, ref=url
      const docs = antoraLunr.docs
      store = {}
      index = lunr(function () {
        this.ref('url')
        this.field('title')
        this.field('text')
        docs.forEach((doc) => {
          store[doc.url] = doc
          this.add(doc)
        })
      })
      usingAntoraIndex = false
      initialized = true
    }
  }

  const highlightText = (text, terms) => {
    if (!text || !terms || terms.length === 0) return text
    const escapedTerms = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const buildSnippet = (text, terms, radius = 100, maxLength = 200) => {
    if (!text) return ''
    if (!Array.isArray(terms) || terms.length === 0) return truncateText(text, maxLength)

    const lowerText = text.toLowerCase()
    const lowerTerms = terms.map((t) => (t || '').toLowerCase()).filter(Boolean)
    if (!lowerTerms.length) return truncateText(text, maxLength)

    let matchIndex = -1
    let matchLength = 0

    lowerTerms.forEach((term) => {
      const idx = lowerText.indexOf(term)
      if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
        matchIndex = idx
        matchLength = term.length
      }
    })

    if (matchIndex === -1) return truncateText(text, maxLength)

    const start = Math.max(0, matchIndex - radius)
    const end = Math.min(text.length, matchIndex + matchLength + radius)
    const snippet = text.substring(start, end)

    const prefix = start > 0 ? '… ' : ''
    const suffix = end < text.length ? ' …' : ''
    return `${prefix}${snippet}${suffix}`
  }

  const getDocFromResult = (result) => {
    if (usingAntoraIndex) {
      // Antora lunr-extension uses refs like '108-1'; the page document is keyed by the first segment
      const ref = String(result.ref)
      const pageId = ref.split('-')[0]
      return store[pageId]
    }

    // Preview: refs are URLs matching store[url]
    return store[result.ref]
  }

  const performSearch = (query) => {
    if (!index || !query.trim()) return []

    try {
      const searchTerms = query.trim().split(/\s+/)
      const results = index.search(query.trim() + '*')




      return results.map((result) => {
        const doc = getDocFromResult(result)

                return {
          ...doc,
          ref: result.ref,
          score: result.score,
          searchTerms: searchTerms,
        }
      })
    } catch (e) {
      // If wildcard search fails, try without wildcard
      try {
        const searchTerms = query.trim().split(/\s+/)
        const results = index.search(query.trim())


        return results.map((result) => {
          const doc = getDocFromResult(result)

                    return {
            ...doc,
            ref: result.ref,
            score: result.score,
            searchTerms: searchTerms,
          }
        })
      } catch (e2) {
        console.error('Search error:', e2)
        return []
      }
    }
  }

  const renderResults = (hits, container) => {
    selected = null

    if (hits.length === 0) {
      container.querySelector('ul').innerHTML = '<li class="no-result">No result</li>'
      document.querySelector('#counter').style.display = 'none'
      return
    }

    const nbHits = hits.length
    document.querySelector('#counter').innerHTML = `<strong>${nbHits}</strong> result${nbHits > 1 ? 's' : ''} found`
    document.querySelector('#counter').style.display = 'block'

    container.querySelector('ul').innerHTML = hits
      .map((hit) => {
                const titles = Array.isArray(hit.titles) ? hit.titles : []
        const searchTerms = Array.isArray(hit.searchTerms) ? hit.searchTerms : []

        const rawParentTitle = hit.title || 'Untitled'
        const parentTitle = highlightText(rawParentTitle, searchTerms)

        const lowerTerms = searchTerms.map((t) => t.toLowerCase())
        const matchesTerms = (t) => {
          if (!t || !lowerTerms.length) return false
          const raw = t.text || ''
          const snippet = buildSnippet(raw, searchTerms) || ''
          const haystack = `${t.title || ''} ${snippet}`.toLowerCase()
          if (!haystack.trim()) return false
          return lowerTerms.some((term) => term && haystack.includes(term))
        }

        // For Antora index, hit.ref is like '108-1' where the second segment is the section id
        let matchedChildId = null
        if (usingAntoraIndex && hit.ref) {
          const refStr = String(hit.ref)
          const parts = refStr.split('-')
          if (parts.length > 1) {
            const maybeId = parseInt(parts[1], 10)
            if (!isNaN(maybeId)) matchedChildId = maybeId
          }
        }

        let filteredTitles = titles.filter((t) => matchesTerms(t))

        if (!filteredTitles.length && matchedChildId != null) {
          const matched = titles.find((t) => t && t.id === matchedChildId)
          if (matched) filteredTitles = [matched]
        }

        const childrenHtml = filteredTitles.length
          ? `<ul class="hit-children">
              ${filteredTitles
                .map((t) => {
                  const childTitleText = t.title || rawParentTitle
                  const childTitle = highlightText(childTitleText, searchTerms)
                  const childUrl = t.id ? `${hit.url}#${t.id}` : hit.url
                  const childRawText = t.text || ''
                  const rawSnippet = buildSnippet(childRawText, searchTerms)
                  const childText = highlightText(rawSnippet, searchTerms)

                                    return `<li>
                    <a href="${childUrl}" class="ais-Hits-item">
                      <div class="hit-name">${childTitle}</div>
                      ${childText ? `<p class="hit-breadcrumbs">${childText}</p>` : ''}
                    </a>
                  </li>`
                })
                .join('')}
            </ul>`
          : ''

        return `<li>
            <a href="${hit.url}" class="ais-Hits-item hit-parent">
              <div class="hit-name">
                ${parentTitle}
              </div>
            </a>
            ${childrenHtml}
          </li>`
      })
      .join('')

    container.querySelectorAll('ul a').forEach((a) => {
      a.addEventListener('click', () => {
        MicroModal.close('modal-1')
      })
    })
  }

  const selectHit = (newSelected) => {
    const hits = document.querySelectorAll('#hits>ul>li>a')
    if (hits[selected]) {
      hits[selected].classList.remove('selected')
      selected = null
    }
    if (hits[newSelected]) {
      hits[newSelected].classList.add('selected')
      selected = newSelected
    }

    if (selected !== null && hits[selected]) {
      hits[selected].scrollIntoView({ block: 'nearest' })
    }
  }

  const openHit = (idx) => {
    const hits = document.querySelectorAll('#hits>ul>li>a')
    if (hits[idx]) {
      hits[idx].click()
      MicroModal.close('modal-1')
    }
  }

  const setupSearchUI = () => {
    const searchbox = document.querySelector('#searchbox')
    const hitsContainer = document.querySelector('#hits')

    if (!searchbox || !hitsContainer) return

    // Create search input
    const input = document.createElement('input')
    input.classList.add('ais-SearchBox-input')
    input.placeholder = 'Search documentation...'

    // Create close button
    const button = document.createElement('button')
    button.classList.add('ais-SearchBox-reset')
    button.innerHTML =
      '<svg class="ais-SearchBox-resetIcon" viewBox="0 0 20 20"' +
      ' width="10" height="10" aria-hidden="true"><path d="M8.114 10L.944 2.83 0 1.885' +
      ' 1.886 0l.943.943L10 8.113l7.17-7.17.944-.943L20 1.886l-.943.943-7.17 7.17 7.17' +
      ' 7.17.943.944L18.114 20l-.943-.943-7.17-7.17-7.17 7.17-.944.943L0 18.114l.943-.943' +
      'L8.113 10z"></path></svg>'

    // Create results list
    hitsContainer.appendChild(document.createElement('ul'))

    // Debounce search
    let debounceTimer
    input.addEventListener('input', (event) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const query = event.target.value
        if (query.trim()) {
          const results = performSearch(query)
          renderResults(results, hitsContainer)
        } else {
          hitsContainer.querySelector('ul').innerHTML = ''
          document.querySelector('#counter').style.display = 'none'
        }
      }, 150)
    })

    input.addEventListener('keydown', (event) => {
      const hits = document.querySelectorAll('#hits>ul>li>a')
      switch (event.keyCode) {
        case 40: // Down
          event.preventDefault()
          if (selected === null) {
            selectHit(0)
          } else if (selected < hits.length - 1) {
            selectHit(selected + 1)
          }
          break
        case 38: // Up
          event.preventDefault()
          if (selected === null) {
            selectHit(0)
          } else {
            selectHit(Math.max(selected - 1, 0))
          }
          break
        case 13: // Enter
          event.preventDefault()
          if (selected !== null) {
            openHit(selected)
          }
          break
        case 27: // Escape
          event.preventDefault()
          MicroModal.close('modal-1')
          break
      }
    })

    button.addEventListener('click', () => {
      MicroModal.close('modal-1')
    })

    searchbox.appendChild(input)
    searchbox.appendChild(button)
  }

  const open = () => {
    initSearch()
    if (!document.querySelector('#searchbox input')) {
      setupSearchUI()
    }
    selectHit(null)
    MicroModal.show('modal-1', {
      disableScroll: true,
      onShow: () => {
        const input = document.querySelector('#searchbox input')
        if (input) {
          input.focus()
          input.select()
        }
      },
    })
  }

  document.querySelectorAll('.search-button').forEach((element) => {
    element.addEventListener('click', () => {
      open()
    })
  })

  const command = isMac() ? 'cmd' : 'ctrl'
  const symbol = isMac() ? '⌘' : 'CTRL'

  document.querySelectorAll('.search-key').forEach((element) => {
    element.innerHTML = `${symbol} + k`
  })

  hotkeys(`${command}+k`, function (event, handler) {
    event.preventDefault()
    open()
  })
})()
