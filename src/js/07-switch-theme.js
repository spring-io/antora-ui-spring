/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
;(function () {
  'use strict'

  activateSwitch(document.getElementById('switch-theme-checkbox'))

  function activateSwitch (control) {
    if (!control) return
    control.checked = document.documentElement.classList.contains('dark-theme')
    control.addEventListener('change', onThemeChange.bind(control))
  }

  function onThemeChange () {
    document.documentElement.classList.toggle('dark-theme', this.checked)
    document.documentElement.setAttribute('data-theme', this.checked ? 'dark' : 'light')
    saveTheme(this.checked ? 'dark' : 'light')
    if (this.checked) {
      this.parentElement.classList.add('active')
    } else {
      this.parentElement.classList.remove('active')
    }
  }

  function saveTheme (theme) {
    window.localStorage && window.localStorage.setItem('theme', theme)
  }
})()
