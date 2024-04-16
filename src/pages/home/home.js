import element from 'ol-ext/util/element'
import organization from 'mcutils/api/organization';
import api from 'mcutils/api/api'
import _T from 'mcutils/i18n/i18n'
import pages from 'mcutils/charte/pages';
import dialog from 'mcutils/dialog/dialog'

import html from './home-page.html'
import createDlg from './create-dialog.html'

import 'mcutils/api/ListTable.css'
import './home.css'

const page = pages.add('home', html, document.querySelector('.connected'));

const orgaList = page.querySelector('ul[data-role="organizations"]')

// Show user organization list
function showList() {
  orgaList.innerHTML = '';
  const me = api.getMe();
  const orga = me ? me.organizations : false;
  if (orga) {
    orga.forEach(o => {
      const li = element.create('LI', {
        className: o.public_id === organization.getId() ? 'selected' : '',
        click: () => {
          console.log(o)
          organization.set(o);
          pages.show('organization');
        },
        parent: orgaList
      })
      element.create('IMG', {
        src: o.profile_picture || '',
        parent: li
      })
      element.create('DIV', {
        text: o.name,
        class: 'title',
        parent: li
      })
      element.create('DIV', {
        class: 'role role_'+o.user_role,
        title: _T('organization:role_'+o.user_role),
        parent: li
      })
    });
  }
}

// Refresh organizations list
organization.on('change', showList)
api.on('me', showList)

// No organization
if (!organization.getId() && pages.getId() !== 'home') {
  pages.show();
}
pages.on('change', () => {
  if (!organization.getId() && pages.getId() !== 'home') {
    pages.show();
  }
})

// Create orga
page.querySelector('.create button').addEventListener('click', () => {
  dialog.show({
    title: 'Créer une organisation',
    className: 'create-orga',
    content: createDlg,
    buttons: { submit: _T('ok'), cancel: _T('cancel')},
    onButton: (b, inputs) => {
      if (b === 'submit') {
        if (inputs.name.value) {
          dialog.showWait('Création en cours');
          api.newOrganization({ 
            name: inputs.name.value 
          }, o => {
            if (o.error) {
              // Handle error
              if (o.status === 403) {
                dialog.showAlert('Impossible de créer l\'organisation :<br/>une organisation avec le même nom existe déjà...')
              } else {
                dialog.showAlert('Impossible de créer une organisation...')
              }
            } else {
              dialog.hide();
              organization.set({
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

/* DBUG */
window.organization = organization
/**/