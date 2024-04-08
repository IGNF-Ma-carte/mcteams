import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import md2html from 'mcutils/md/md2html';

import html from './detail-page.html'
import './detail.css'

const page = pages.add("detail", html, document.querySelector('.connected'))

function showCarte(carte, from) {
  pages.show('detail')
  // Title
  page.querySelector('.breadcrumb .cartes a').innerText = from
  page.querySelector('h1.carte').innerText = carte.title
  if (carte.valid) {
    delete page.dataset.invalid
  } else {
    page.dataset.invalid = '';
  }
  // iframe
  page.querySelector('iframe').src = carte.view_url
  console.log(carte)
  // Attributes
  page.querySelectorAll('[data-attr]').forEach(a => {
    const attr = a.dataset.attr;
    switch (a.tagName) {
      case 'DIV': {
        a.innerHTML = md2html(carte[attr] || '*Pas de description enregistrée*') 
        break;
      }
      case 'A': {
        a.innerText = a.href = carte[attr]
        break;
      }
      case 'IMG': {
        a.src = carte[attr]
        break;
      }
      case 'DATE': {
        a.innerText = (new Date(carte[attr])).toLocaleString()
        break;
      }
      case 'INPUT': {
        if (attr === 'share') {
          a.checked = carte[attr] === 'atlas'
        } else {
          a.checked = carte[attr]
        }
        break;
      }
      case 'SPAN': 
      default: {
        a.innerText = carte[attr]
        break;
      }
    }
  })
}

// First show
if (pages.getId() === 'detail') {
  pages.show('organization')
}

export { showCarte }