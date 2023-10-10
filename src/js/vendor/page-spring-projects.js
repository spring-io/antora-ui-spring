/* eslint-disable no-undef */

;(function () {
  document.querySelectorAll('.anchor').forEach((el) => {
    const list = el.parentElement.querySelector('ul')
    el.addEventListener('click', function (e) {
      el.classList.toggle('active')
      list.classList.toggle('show')
    })
  })
})()
