;(function () { /*! docsearch 2.6.x | © Algolia | github.com/algolia/docsearch */
  'use strict'

  activateSearch(require('@docsearch/js'), document.getElementById('search-script').dataset)

  function activateSearch (docsearch, config) {
    var searchField = document.getElementById(config.searchFieldId || 'search')
    docsearch({
      container: searchField,
      appId: config.appId,
      indexName: config.indexName,
      apiKey: config.apiKey,
      searchParameters: { facetFilters: [`version:${config.pageVersion}`] },
    })
  }
})()
