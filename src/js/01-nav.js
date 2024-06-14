/* eslint-disable no-undef */
;(function () {
  'use strict'

  var SECT_CLASS_RX = /^sect(\d)$/

  var navContainer = document.querySelector('.nav-container')
  var navToggle1 = document.querySelector('#nav-toggle-1')
  var navToggle2 = document.querySelector('#nav-toggle-2')
  var isNavOpen = window.localStorage && window.localStorage.getItem('sidebar') === 'open'
  if (navToggle1) {
    navToggle1.addEventListener('click', showNav)
  }
  if (navToggle2) {
    navToggle2.addEventListener('click', showNav)
  }
  var menuPanel
  if (navContainer) {
    navContainer.addEventListener('click', trapEvent)
    menuPanel = navContainer.querySelector('[data-panel=menu]')
  }
  if (!menuPanel) return
  var nav = navContainer.querySelector('.nav')

  var currentPageItem = menuPanel.querySelector('.is-current-page')
  var originalPageItem = currentPageItem
  if (currentPageItem) {
    activateCurrentPath(currentPageItem)
    scrollItemToMidpoint(menuPanel, currentPageItem.querySelector('.nav-link'))
  } else {
    menuPanel.scrollTop = 0
  }

  var currentActivePageItem = menuPanel.querySelector('.nav-item.is-current-page.is-active')
  if (currentActivePageItem && currentActivePageItem.querySelector('.nav-item-toggle')) {
    currentActivePageItem.querySelector('.nav-link').addEventListener('click', function (e) {
      currentActivePageItem.querySelector('.nav-item-toggle').click()
      e.preventDefault()
      return false
    })
  }

  find(menuPanel, '.nav-item-toggle').forEach(function (btn) {
    var li = btn.parentElement
    btn.addEventListener('click', toggleActive.bind(li))
    var navItemSpan = findNextElement(btn, '.nav-text')
    if (navItemSpan) {
      navItemSpan.style.cursor = 'pointer'
      navItemSpan.addEventListener('click', toggleActive.bind(li))
    }
  })

  var versionsToggle = document.querySelectorAll('.version-toggle')
  if (versionsToggle) {
    versionsToggle.forEach(function (el) {
      var container = el.parentElement.parentElement
      el.addEventListener('click', function () {
        container.classList.toggle('is-active')
      })
    })
  }

  document.querySelector('#browse-version').addEventListener('click', function () {
    MicroModal.show('modal-versions', {
      disableScroll: true,
    })
  })

  document.querySelector('#nav-collapse-toggle').addEventListener('click', function () {
    if (isNavOpen) {
      document.body.classList.add('nav-sm')
    } else {
      document.body.classList.remove('nav-sm')
    }
    window.localStorage && window.localStorage.setItem('sidebar', !isNavOpen ? 'open' : 'close')
    isNavOpen = !isNavOpen
  })

  function onHashChange () {
    var navLink
    var hash = window.location.hash
    if (hash) {
      if (hash.indexOf('%')) hash = decodeURIComponent(hash)
      navLink = menuPanel.querySelector('.nav-link[href="' + hash + '"]')
      if (!navLink) {
        var targetNode = document.getElementById(hash.slice(1))
        if (targetNode) {
          var current = targetNode
          var ceiling = document.querySelector('article.doc')
          while ((current = current.parentNode) && current !== ceiling) {
            var id = current.id
            // NOTE: look for section heading
            if (!id && (id = SECT_CLASS_RX.test(current.className))) id = (current.firstElementChild || {}).id
            if (id && (navLink = menuPanel.querySelector('.nav-link[href="#' + id + '"]'))) break
          }
        }
      }
    }
    var navItem
    if (navLink) {
      navItem = navLink.parentNode
    } else if (originalPageItem) {
      navLink = (navItem = originalPageItem).querySelector('.nav-link')
    } else {
      return
    }
    if (navItem === currentPageItem) return
    find(menuPanel, '.nav-item.is-active').forEach(function (el) {
      el.classList.remove('is-active', 'is-current-path', 'is-current-page')
    })
    navItem.classList.add('is-current-page')
    currentPageItem = navItem
    activateCurrentPath(navItem)
    scrollItemToMidpoint(menuPanel, navLink)
  }

  if (menuPanel.querySelector('.nav-link[href^="#"]')) {
    if (window.location.hash) onHashChange()
    window.addEventListener('hashchange', onHashChange)
  }

  function activateCurrentPath (navItem) {
    var ancestorClasses
    var ancestor = navItem.parentNode
    while (!(ancestorClasses = ancestor.classList).contains('nav-menu')) {
      if (ancestor.tagName === 'LI' && ancestorClasses.contains('nav-item')) {
        ancestorClasses.add('is-active', 'is-current-path')
      }
      ancestor = ancestor.parentNode
    }
    navItem.classList.add('is-active')
  }

  function toggleActive () {
    if (this.classList.toggle('is-active')) {
      var padding = parseFloat(window.getComputedStyle(this).marginTop)
      var rect = this.getBoundingClientRect()
      var menuPanelRect = menuPanel.getBoundingClientRect()
      var overflowY = (rect.bottom - menuPanelRect.top - menuPanelRect.height + padding).toFixed()
      if (overflowY > 0) menuPanel.scrollTop += Math.min((rect.top - menuPanelRect.top - padding).toFixed(), overflowY)
    }
  }

  function showNav (e) {
    if (navToggle1.classList.contains('is-active')) return hideNav(e)
    if (navToggle2.classList.contains('is-active')) return hideNav(e)
    trapEvent(e)
    var html = document.documentElement
    html.classList.add('is-clipped--nav')
    navToggle1.classList.add('is-active')
    navToggle2.classList.add('is-active')
    navContainer.classList.add('is-active')
    var bounds = nav.getBoundingClientRect()
    var expectedHeight = window.innerHeight - Math.round(bounds.top)
    if (Math.round(bounds.height) !== expectedHeight) nav.style.height = expectedHeight + 'px'
    html.addEventListener('click', hideNav)
  }

  function hideNav (e) {
    trapEvent(e)
    var html = document.documentElement
    html.classList.remove('is-clipped--nav')
    navToggle1.classList.remove('is-active')
    navToggle2.classList.remove('is-active')
    navContainer.classList.remove('is-active')
    html.removeEventListener('click', hideNav)
  }

  function trapEvent (e) {
    e.stopPropagation()
  }

  function scrollItemToMidpoint (panel, el) {
    var rect = panel.getBoundingClientRect()
    var effectiveHeight = rect.height
    var navStyle = window.getComputedStyle(nav)
    if (navStyle.position === 'sticky') effectiveHeight -= rect.top - parseFloat(navStyle.top)
    panel.scrollTop = Math.max(0, (el.getBoundingClientRect().height - effectiveHeight) * 0.5 + el.offsetTop)
  }

  function find (from, selector) {
    return [].slice.call(from.querySelectorAll(selector))
  }

  function findNextElement (from, selector) {
    var el = from.nextElementSibling
    return el && selector ? el[el.matches ? 'matches' : 'msMatchesSelector'](selector) && el : el
  }

  // Navbar width
  function setNavbarWidth (width) {
    document.documentElement.style.setProperty('--nav-width', `${width}px`)
    window.localStorage && window.localStorage.setItem('nav-width', `${width}`)
  }
  document.querySelector('.nav-resize').addEventListener('mousedown', (event) => {
    document.addEventListener('mousemove', resize, false)
    document.addEventListener(
      'mouseup',
      () => {
        document.removeEventListener('mousemove', resize, false)
      },
      false
    )
  })
  function resize (e) {
    let value = Math.max(250, e.x)
    value = Math.min(600, value)
    setNavbarWidth(value)
  }
})()
