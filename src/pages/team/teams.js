import team from 'mcutils/api/team';
import pages from 'mcutils/charte/pages.js'
import dialog from 'mcutils/dialog/dialog'
import { getUrlParameter } from 'mcutils/control/url'
import api from 'mcutils/api/api'

import { showList } from '../home/home'

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

// Join a new teams 
function join() {
  // Get edit ID in search parameters
  const joinID = getUrlParameter('rejoindre');
  // Join ?
  if (joinID) {
    try {
      // Remove from history
      window.history.replaceState (null,null, 
        document.location.origin
        + document.location.pathname
        + document.location.hash
      );
    } catch(e) { /* */ }
    dialog.showWait('Rejoindre une équipe...')
    api.joinTeam(joinID, e => {
      if (e.error) {
        if (e.status === 208) {
          dialog.showMessage('Vous êtes déjà membre de cette équipe.')
        } else {
          dialog.showAlert('Impossible de rejoindre une équipe...')
        }
      } else {
        dialog.show({
          title: 'Rejoindre une équipe',
          content: 'Vous êtes maintenant membre de l\'équipe <b></b>.',
          buttons: { ok: 'ok' }
        })
        dialog.getContentElement().querySelector('b').innerText = e.name;
        team.set(e);
        showList();
        pages.show('equipe')
      }
    })
  }
  api.un('login', join);
}
if (api.isConnected()) {
  join();
} else {
  api.on('login', join);
}
