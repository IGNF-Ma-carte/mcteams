import team from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'

import html from './teams-page.html'
import './teams.css'

const content = document.querySelector('.connected')
pages.add('equipe', html, content)

// Update breadscrum and title
team.on('change', () => {
  content.querySelectorAll('h1.orga').forEach(h => {
    h.innerText = team.getName()
  })
  content.querySelectorAll('.breadcrumb li.current-orga a').forEach(a => {
    a.innerText = team.getName()
  })
})