import api from 'mcutils/api/api'
import team from 'mcutils/api/team';
import pages from 'mcutils/charte/pages.js'
import ListCarte from 'mcutils/api/ListCarte'
import { getViewerURL, getEditorURL } from 'mcutils/api/serviceURL';
import { showCarte } from '../detail/detail';

import 'mcutils/api/ListCarte.responsive.css'

import html from './cartes-page.html'
import './cartes.css'

function showCartes(type, context) {
  const page = pages.add(type, html, document.querySelector('.connected'))
  page.querySelector('.breadcrumb li.page').classList.add(type)

  // Create carte list
  const list = new ListCarte(api, { 
    context: context,
    selection: true,
    search: true,
    permalink: false,
    target: page 
  });

  // Show page
  pages.on('change', p => {
    if (p.id === type) {
      if (p.from !== 'detail') {
        list.set('organization', team.getId())
        list.clear();
        list.search();
      } else {
        list.refresh()
      }
    }
  })
  // First show
  if (pages.getId() === type && team.getId()) {
    list.set('organization', team.getId())
    list.search();
  }

  // Actions on selected carte
  list.addAction({
    html: 'Voir', 
    title: 'Voir la carte',
    className: 'show',
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
    className: 'detail',
    action: (item) => {
      showCarte(item, type)
    },
  })

  // Enable actions
  /*
  list.on('draw:item', e => {
    if (team.isOwner() || api.getMe().public_id === e.item.user_id) {
      e.element.dataset.user = team.getUserRole()
    }
  })
  */
}

showCartes('cartes', 'profile')

export default showCartes
