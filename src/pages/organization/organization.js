import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'

import html from './organization-page.html'
import './organization.css'

const content = document.querySelector('.connected')
const page = pages.add('organization', html, content)

// Update breadscrum and title
organization.on('change', () => {
  content.querySelectorAll('h1.orga').forEach(h => {
    h.innerText = organization.getName()
  })
  content.querySelectorAll('.breadcrumb li.current-orga a').forEach(a => {
    a.innerText = organization.getName()
  })
})