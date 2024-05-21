import element from 'ol-ext/util/element'
import team from 'mcutils/api/team';
import api from 'mcutils/api/api'
import _T from 'mcutils/i18n/i18n'
import pages from 'mcutils/charte/pages';
import dialog from 'mcutils/dialog/dialog'
import md2html from 'mcutils/md/md2html';
import helpDialog from 'mcutils/dialog/helpDialog';

import html from './home-page.html'
import createDlg from './create-dialog.html'

import 'mcutils/api/ListTable.css'
import './home.css'

const page = pages.add('home', html, document.querySelector('.connected'));

const teamList = page.querySelector('ul[data-role="teams"].teamList')
const joinList = page.querySelector('ul[data-role="teams"].joinTeam')

helpDialog(page.querySelector('.mc-list h2'), _T('help:joinList'), 'Rejoindre une équipe');

// Show user team list
function showList() {
  teamList.innerHTML = '';
  joinList.innerHTML = '';
  const me = api.getMe();
  const teams = me ? me.organizations : false;
  if (teams && teams.length) {
    // Sort teams by active / date
    teams.sort((a,b) => {
      if (!a.active && b.active) return -1;
      if (a.active && !b.active) return 1;
      if (a.updated_at.date < b.updated_at.date) return -1;
      if (a.updated_at.date > b.updated_at.date) return 1;
      return 0;
    })
    // List of teams
    teams.forEach(o => {
      const li = element.create('LI', {
        className: o.public_id === team.getId() ? 'selected' : '',
        title: (o.active === false) ? 'rejoindre l\'équipe' : 'sélectionnez cette équipe',
        'data-team': o.public_id,
        click: () => {
          if (o.active !== false) {
            // Show team
            team.set(o);
            pages.show('equipe');
          } else {
            dialog.showWait('Recherche de l\'invitation...')
            api.getTeam(o.public_id, team => {
              // Join the team
              const content = element.create('DIV')
              element.create('DIV', {
                html: 'Vous avez été invité à participer à l\'équipe <b></b> en tant que <i>' + _T('team:role_'+o.user_role) + '</i>.',
                parent: content
              })
              content.querySelector('b').innerText = o.name;
              // Team info
              if (o.profile_picture) {
                element.create('IMG', {
                  className: 'logo',
                  src: o.profile_picture,
                  parent: content
                })
              }
              element.create('DIV', {
                className: 'md',
                html: md2html(team.presentation),
                parent: content
              })
              // Dialog
              dialog.show({
                title: 'Rejoindre '+o.name,
                className: 'activate-member',
                content: content,
                buttons: { submit: 'Accepter', no: 'Refuser l\'inviation'},
                onButton: b => {
                  dialog.showWait('Opération en cours...')
                  if (b === 'submit') {
                    api.activateTeamMember(o.public_id, () => {
                      location.reload();
                    })
                  } else if (b === 'no') {
                    api.removeTeamMember(o.public_id, api.getMe().public_id, e => {
                      if (e.error) {
                        dialog.showAlert('Impossible de supprimer le membre...')
                      } else {
                        location.reload()
                      }
                    })
                  }
                }
              })
            })
          } 
        },
        parent: (o.active === false) ? joinList : teamList
      })
      element.create('IMG', {
        src: o.profile_picture || '',
        parent: li
      })
      element.create('p', {
        text: o.name,
        class: 'title',
        parent: li
      })
      element.create('DIV', {
        class: 'role role_'+o.user_role,
        title: _T('team:role_'+o.user_role),
        parent: li
      })
    });
  }
  if (!teamList.querySelector('li')) {
    teamList.parentNode.dataset.noInvit = '';
  }
  if (!teamList.querySelector('li')) {
    element.create('LI', {
      html: '<i>Vous n\'avez pas encore d\'équipe...</i>',
      parent: teamList
    })
  }
}

// Refresh team list
team.on('change', showList)
team.on('change', () => {
  if (!team.getId()) {
    pages.show();
  }
  // Back to teams pages
  if (/detail|atlas|cartes/.test(pages.getId())) {
    pages.show('equipe')
  }
})
api.on('me', showList)

// No team
if (!team.getId() && pages.getId() !== 'home') {
  pages.show();
}
pages.on('change', () => {
  if (!team.getId() && pages.getId() !== 'home') {
    pages.show();
  }
})

// Create team
page.querySelector('.create button').addEventListener('click', () => {
  dialog.show({
    title: 'Créer une équipe',
    className: 'create-team',
    content: createDlg,
    buttons: { submit: _T('ok'), cancel: _T('cancel')},
    onButton: (b, inputs) => {
      if (b === 'submit') {
        if (inputs.name.value) {
          dialog.showWait('Création en cours');
          api.newTeam({ 
            name: inputs.name.value 
          }, o => {
            if (o.error) {
              // Handle error
              if (o.status === 403) {
                dialog.showAlert('Vous n\'êtes pas autorisé à faire cette opération')
              } else if (o.status === 409) {
                dialog.showAlert('Impossible de créer l\'équipe :<br/>une équipe avec le même nom existe déjà...')
              } else {
                dialog.showAlert('Impossible de créer une équipe...')
              }
            } else {
              dialog.hide();
              team.set({
                public_id: o.public_id,
                name: o.name,
                profile_picture: o.profile_picture,
                user_role: "owner"
              });
              pages.show('profil');
              // Reload page
              location.reload();
            }
          })
        }
      }
    }
  })
})


export { showList }

/* DBUG */
window.team = team
/**/