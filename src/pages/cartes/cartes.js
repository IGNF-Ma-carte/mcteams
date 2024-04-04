import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import ListCarte from 'mcutils/api/ListCarte'
import { getViewerURL, getEditorURL } from 'mcutils/api/serviceURL';

import 'mcutils/api/ListCarte.responsive.css'

import html from './cartes-page.html'
import './cartes.css'

const page = pages.add('cartes', html, document.querySelector('.connected'))

// Create carte list
const list = new ListCarte(api, { 
  context: 'profile',
  selection: true,
  search: true,
  permalink: false,
  target: page 
});

// Show 
pages.on('change', p => {
  if (p.id === 'cartes') {
    list.set('organization', organization.getId())
    list.clear();
    list.search();
  }
})
// First show
if (pages.getId() === 'cartes' && organization.getId()) {
  list.set('organization', organization.getId())
  list.search();
}

// Actions on selected carte
list.addAction({
  html: 'Voir', 
  title: 'Voir la carte',
  action: (item) => {
    window.open(getViewerURL(item), '_blank')
  },
})
list.addAction({
  html: 'Modifier', 
  title: 'Modifier la carte',
  className: 'edit',
  action: (item) => {
    window.open(getEditorURL(item), '_blank')
  },
})
list.addAction({
  html: 'Détail', 
  title: 'Voir les détails de la carte',
  action: (item) => {
    pages.show('details')
  },
})

// Enable actions
list.on('draw:item', e => {
  e.element.dataset.user = organization.getUserRole()
})