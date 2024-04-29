import team from 'mcutils/api/team';
import pages from 'mcutils/charte/pages.js'

import html from './teams-page.html'
import './teams.css'

const content = document.querySelector('.connected')
pages.add('equipe', html, content)

// Update breadscrum and title
team.on('change', () => {
  content.querySelectorAll('h1.team').forEach(h => {
    h.innerText = team.getName()
  })
  content.querySelectorAll('.breadcrumb li.current-team a').forEach(a => {
    a.innerText = team.getName()
  })
})