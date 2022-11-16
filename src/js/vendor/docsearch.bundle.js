/*! docsearch 2.6.x | © Algolia | github.com/algolia/docsearch **/
;(function () {
  'use strict'

  activateSearch(require('docsearch.js/dist/cdn/docsearch.js'), document.getElementById('search-script').dataset)

  function activateSearch (docsearch, config) {
    var input = docsearch({
      appId: config.appId,
      apiKey: config.apiKey,
      indexName: config.indexName,
      inputSelector: config.inputSelector || '#search',
      autocompleteOptions: { hint: false, keyboardShortcuts: ['s'] },
      baseAlgoliaOptions: { hitsPerPage: parseInt(config.hitsPerPage, 10) || 20 },
    }).input
    var typeahead = input.data('aaAutocomplete')
    input.on('autocomplete:closed', function () {
      typeahead.setVal()
    })
    typeahead.setVal()
    if (input.attr('autofocus') != null) input.focus()
  }
})()
