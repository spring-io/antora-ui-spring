;(function () { /*! docsearch 2.6.x | © Algolia | github.com/algolia/docsearch */
  'use strict'

  var FORWARD_BACK_TYPE = 2
  var SEARCH_FILTER_ACTIVE_KEY = 'docs:search-filter-active'
  var SAVED_SEARCH_STATE_KEY = 'docs:saved-search-state'
  var SAVED_SEARCH_STATE_VERSION = '1'

  activateSearch(require('docsearch.js/dist/cdn/docsearch.js'), document.getElementById('search-script').dataset)

  function activateSearch (docsearch, config) {
    appendStylesheet(config.stylesheet)
    var baseAlgoliaOptions = {
      hitsPerPage: parseInt(config.pageSize, 10) || 20, // cannot exceed the hitsPerPage value defined on the index
    }
    var searchField = document.getElementById(config.searchFieldId || 'search')
    searchField.appendChild(Object.assign(document.createElement('div'), { className: 'algolia-autocomplete-results' }))
    var controller = docsearch({
      appId: config.appId,
      apiKey: config.apiKey,
      indexName: config.indexName,
      inputSelector: '#' + searchField.id + ' .query',
      autocompleteOptions: {
        autoselect: false,
        debug: true,
        hint: false,
        minLength: 2,
        appendTo: '#' + searchField.id + ' .algolia-autocomplete-results',
        autoWidth: false,
        templates: {
          footer:
            '<div class="ds-footer"><div class="ds-pagination">' +
            '<span class="ds-pagination--curr">Page 1</span>' +
            '<a href="#" class="ds-pagination--prev">Prev</a>' +
            '<a href="#" class="ds-pagination--next">Next</a></div>' +
            '<div class="algolia-docsearch-footer">' +
            'Search by <a class="algolia-docsearch-footer--logo" href="https://www.algolia.com/docsearch" ' +
            'target="_blank" rel="noopener">Algolia</a>' +
            '</div></div>',
        },
      },
      baseAlgoliaOptions: baseAlgoliaOptions,
    })
    var input = controller.input
    var typeahead = input.data('aaAutocomplete')
    var dropdown = typeahead.dropdown
    var menu = dropdown.$menu
    var dataset = dropdown.datasets[0]
    dataset.cache = false
    dataset.source = controller.getAutocompleteSource(undefined, processQuery.bind(typeahead, controller))
    delete dataset.templates.footer
    controller.queryDataCallback = processQueryData.bind(typeahead)
    typeahead.setVal() // clear value on page reload
    input.on('autocomplete:closed', clearSearch.bind(typeahead))
    input.on('autocomplete:cursorchanged autocomplete:cursorremoved', saveSearchState.bind(typeahead))
    input.on('autocomplete:selected', onSuggestionSelected.bind(typeahead))
    input.on('autocomplete:updated', onResultsUpdated.bind(typeahead))
    dropdown._ensureVisible = ensureVisible
    menu.off('mousedown.aa')
    menu.off('mouseenter.aa')
    menu.off('mouseleave.aa')
    var suggestionSelector = '.' + dropdown.cssClasses.prefix + dropdown.cssClasses.suggestion
    menu.on('mousedown.aa', suggestionSelector, onSuggestionMouseDown.bind(dropdown))
    typeahead.$facetFilterInput = input
      .closest('#' + searchField.id)
      .find('.filter input')
      .on('change', toggleFilter.bind(typeahead))
      .prop('checked', window.localStorage.getItem(SEARCH_FILTER_ACTIVE_KEY) !== 'false')
    menu.find('.ds-pagination--prev').on('click', paginate.bind(typeahead, -1)).css('visibility', 'hidden')
    menu.find('.ds-pagination--next').on('click', paginate.bind(typeahead, 1)).css('visibility', 'hidden')
    monitorCtrlKey.call(typeahead)
    searchField.addEventListener('click', confineEvent)
    document.documentElement.addEventListener('click', clearSearch.bind(typeahead))
    document.addEventListener('keydown', handleShortcuts.bind(typeahead))
    if (input.attr('autofocus') != null) input.focus()
    window.addEventListener('pageshow', reactivateSearch.bind(typeahead))
  }

  function reactivateSearch (e) {
    var navigation = window.performance.navigation || {}
    if ('type' in navigation) {
      if (navigation.type !== FORWARD_BACK_TYPE) {
        return
      } else if (e.persisted && !isClosed(this)) {
        this.$input.focus()
        this.$input.val(this.getVal())
        this.dropdown.datasets[0].page = this.dropdown.$menu.find('.ds-pagination--curr').data('page')
      } else if (window.sessionStorage.getItem('docs:restore-search-on-back') === 'true') {
        if (!window.matchMedia('(min-width: 1024px)').matches) document.querySelector('.navbar-burger').click()
        restoreSearch.call(this)
      }
    }
    window.sessionStorage.removeItem('docs:restore-search-on-back')
  }

  function appendStylesheet (href) {
    document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: href }))
  }

  function onResultsUpdated () {
    var dropdown = this.dropdown
    var restoring = dropdown.restoring
    delete dropdown.restoring
    if (isClosed(this)) return
    updatePagination.call(dropdown)
    if (restoring && restoring.query === this.getVal() && restoring.filter === this.$facetFilterInput.prop('checked')) {
      var cursor = restoring.cursor
      if (cursor) dropdown._moveCursor(cursor)
    } else {
      saveSearchState.call(this)
    }
  }

  function toggleFilter (e) {
    if ('restoring' in this.dropdown) return
    window.localStorage.setItem(SEARCH_FILTER_ACTIVE_KEY, e.target.checked)
    isClosed(this) ? this.$input.focus() : (this.dropdown.datasets[0].page = 0) || requery.call(this)
  }

  function confineEvent (e) {
    e.stopPropagation()
  }

  function ensureVisible (el) {
    var container = getScrollableResultsContainer(this)[0]
    if (container.scrollHeight === container.offsetHeight) return
    var delta
    var item = el[0]
    if ((delta = 15 + item.offsetTop + item.offsetHeight - (container.offsetHeight + container.scrollTop)) > 0) {
      container.scrollTop += delta
    }
    if ((delta = item.offsetTop - container.scrollTop) < 0) {
      container.scrollTop += delta
    }
  }

  function getScrollableResultsContainer (dropdown) {
    return dropdown.datasets[0].$el
  }

  function handleShortcuts (e) {
    var target = e.target || {}
    if (e.altKey || target.isContentEditable || 'disabled' in target) return
    if (e.ctrlKey && e.key === '<') return restoreSearch.call(this)
    if (e.ctrlKey ? e.key === '/' : e.key === 's') {
      this.$input.focus()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function isClosed (typeahead) {
    var query = typeahead.getVal()
    return !query || query !== typeahead.dropdown.datasets[0].query
  }

  function monitorCtrlKey () {
    this.$input.on('keydown', onCtrlKeyDown.bind(this))
    this.dropdown.$menu.on('keyup', onCtrlKeyUp.bind(this))
  }

  function onCtrlKeyDown (e) {
    if (e.key !== 'Control') return
    this.ctrlKeyDown = true
    var container = getScrollableResultsContainer(this.dropdown)
    var prevScrollTop = container.scrollTop()
    this.dropdown.getCurrentCursor().find('a').focus()
    container.scrollTop(prevScrollTop) // calling focus can cause the container to scroll, so restore it
  }

  function onCtrlKeyUp (e) {
    if (e.key !== 'Control') return
    delete this.ctrlKeyDown
    this.$input.focus()
  }

  function onSuggestionMouseDown (e) {
    var dropdown = this
    var suggestion = dropdown._getSuggestions().filter('#' + e.currentTarget.id)
    if (suggestion[0] === dropdown._getCursor()[0]) return
    dropdown._removeCursor()
    dropdown._setCursor(suggestion, false)
  }

  function onSuggestionSelected (e, suggestion, datasetNum, context) {
    if (!this.ctrlKeyDown) {
      if (context.selectionMethod === 'click') saveSearchState.call(this)
      window.sessionStorage.setItem('docs:restore-search-on-back', 'true')
    }
    e.isDefaultPrevented = function () {
      return true
    }
  }

  function paginate (delta, e) {
    e.preventDefault()
    var dataset = this.dropdown.datasets[0]
    dataset.page = (dataset.page || 0) + delta
    requery.call(this)
  }

  function updatePagination () {
    var result = this.datasets[0].result
    var page = result.page
    var menu = this.$menu
    menu
      .find('.ds-pagination--curr')
      .html(result.pages ? 'Page ' + (page + 1) + ' of ' + result.pages : 'No results')
      .data('page', page)
    menu.find('.ds-pagination--prev').css('visibility', page > 0 ? '' : 'hidden')
    menu.find('.ds-pagination--next').css('visibility', result.pages > page + 1 ? '' : 'hidden')
    getScrollableResultsContainer(this).scrollTop(0)
  }

  function requery (query) {
    this.$input.focus()
    query === undefined ? (query = this.input.getInputValue()) : this.input.setInputValue(query, true)
    this.input.setQuery(query)
    this.dropdown.update(query)
    this.dropdown.open()
  }

  function clearSearch () {
    this.isActivated = true // we can't rely on this state being correct
    this.setVal()
    delete this.ctrlKeyDown
    delete this.dropdown.datasets[0].result
  }

  function processQuery (controller, query) {
    var algoliaOptions = {}
    if (this.$facetFilterInput.prop('checked')) {
      algoliaOptions.facetFilters = [this.$facetFilterInput.data('facetFilter')]
    }
    var dataset = this.dropdown.datasets[0]
    var activeResult = dataset.result
    algoliaOptions.page = activeResult && activeResult.query !== query ? (dataset.page = 0) : dataset.page || 0
    controller.algoliaOptions = Object.keys(algoliaOptions).length
      ? Object.assign({}, controller.baseAlgoliaOptions, algoliaOptions)
      : controller.baseAlgoliaOptions
  }

  function processQueryData (data) {
    var result = data.results[0]
    this.dropdown.datasets[0].result = { page: result.page, pages: result.nbPages, query: result.query }
    result.hits = preserveHitOrder(result.hits)
  }

  // preserves the original order of results by qualifying unique occurrences of the same lvl0 and lvl1 values
  function preserveHitOrder (hits) {
    var prevLvl0
    var lvl0Qualifiers = {}
    var lvl1Qualifiers = {}
    return hits.map(function (hit) {
      var lvl0 = hit.hierarchy.lvl0
      var lvl1 = hit.hierarchy.lvl1
      var lvl0Qualifier = lvl0Qualifiers[lvl0]
      if (lvl0 !== prevLvl0) {
        lvl0Qualifiers[lvl0] = lvl0Qualifier == null ? (lvl0Qualifier = '') : (lvl0Qualifier += ' ')
        lvl1Qualifiers = {}
      }
      if (lvl0Qualifier) hit.hierarchy.lvl0 = lvl0 + lvl0Qualifier
      if (lvl1 in lvl1Qualifiers) {
        hit.hierarchy.lvl1 = lvl1 + (lvl1Qualifiers[lvl1] += ' ')
      } else {
        lvl1Qualifiers[lvl1] = ''
      }
      prevLvl0 = lvl0
      return hit
    })
  }

  function readSavedSearchState () {
    try {
      var state = window.localStorage.getItem(SAVED_SEARCH_STATE_KEY)
      if (state && (state = JSON.parse(state))._version.toString() === SAVED_SEARCH_STATE_VERSION) return state
    } catch (e) {
      window.localStorage.removeItem(SAVED_SEARCH_STATE_KEY)
    }
  }

  function restoreSearch () {
    var searchState = readSavedSearchState()
    if (!searchState) return
    this.dropdown.restoring = searchState
    this.$facetFilterInput.prop('checked', searchState.filter) // change event will be ignored
    var dataset = this.dropdown.datasets[0]
    dataset.page = searchState.page
    delete dataset.result
    requery.call(this, searchState.query) // cursor is restored by onResultsUpdated
  }

  function saveSearchState () {
    if (isClosed(this)) return
    window.localStorage.setItem(
      SAVED_SEARCH_STATE_KEY,
      JSON.stringify({
        _version: SAVED_SEARCH_STATE_VERSION,
        cursor: this.dropdown.getCurrentCursor().index() + 1,
        filter: this.$facetFilterInput.prop('checked'),
        page: this.dropdown.datasets[0].page,
        query: this.getVal(),
      })
    )
  }
})()
