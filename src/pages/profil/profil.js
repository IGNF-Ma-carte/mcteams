import _T from 'mcutils/i18n/i18n';
import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import md2html from 'mcutils/md/md2html'
import dialog from 'mcutils/dialog/dialog'
import MDEditor from 'mcutils/md/MDEditor'
import InputMedia from 'mcutils/control/InputMedia'

import { page, list } from './members'

import profilDlg from './profil-dialog.html'
import './profil.css'
import pages from 'mcutils/charte/pages';

const content = document.querySelector('.connected')

organization.on('change', showOrganization)

// Display organization
function showOrganization() {
  document.body.dataset.orgaRole = organization.getUserRole()
  page.querySelector('[data-attr="name"]').innerText = organization.getName()
  page.querySelector('[data-attr="profile_picture"] img').src = organization.getImage()
  page.querySelector('[data-attr="cover_picture"] img').src = organization.getCoverImage()
  page.querySelector('[data-attr="presentation"]').innerHTML =
  content.querySelector('#organization .presentation').innerHTML = md2html(organization.getPresentation());
  content.querySelectorAll('#organization span').forEach(sp => {
    sp.innerText= '';
  })
  // Get members
  list.clear()
  list.element.dataset.waiting = '';
  api.getOrganization(organization.getId(), e => {
    delete list.element.dataset.waiting;
    if (e.error) return;
    // Alphabetic order
    const sorter = {
      owner: 0,
      editor: 1,
      member: 2
    }
    e.members.sort((a,b) => {
      // Sort by role
      const s = sorter[a.role] - sorter[b.role]
      if (s) return s;
      if (a.public_name < b.public_name) return -1;
      if (a.public_name > b.public_name) return 1;
      return 0
    })
    // Show organization
    list.drawList(e.members)
    organization.get().presentation = e.presentation;
    page.querySelector('[data-attr="presentation"]').innerHTML = md2html(e.presentation)
    // general
    const d = new Date(e.created_at)
    content.querySelector('#organization .date').innerText = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    content.querySelector('#organization .nbMembers').innerText = e.nb_members
    content.querySelector('#organization .presentation').innerHTML = md2html(e.presentation)
  })
}

// Update 
page.querySelector('.editProfil').addEventListener('click', () => {
  if (!organization.isOwner()) {
    dialog.showAlert('Action non autorisée')
    return;
  }
  dialog.show({
    title: 'Modifier le profil',
    className: 'editProfil',
    content: profilDlg,
    buttons: { submit: _T('ok'), cancel: _T('cancel') },
    onButton: (b, inputs) => {
      if (b === 'submit') {
        dialog.showWait('Mise à jour...');
        const upd = [];
        if (inputs.name.value !== organization.getName()) {
          upd.push([ 'name', inputs.name.value ]);
        }
        if (inputs.presentation.value !== organization.getPresentation()) {
          upd.push([ 'presentation', inputs.presentation.value ]);
        }
        if (inputs.logo.value !== organization.getImage()) {
          upd.push([ 'profile_picture', inputs.logo.value ]);
        }
        if (inputs.cover.value !== organization.getCoverImage()) {
          upd.push([ 'cover_picture', inputs.cover.value ]);
        }
        updateOrganization(upd)
      }
    }
  })
  // Name
  dialog.getContentElement().querySelector('.name').value = organization.getName()
  // Presentation
  dialog.getContentElement().querySelector('.presentation').value = organization.getPresentation()
  new MDEditor({
    input: dialog.getContentElement().querySelector('.presentation')
  });
  // Media
  ['logo', 'cover'].forEach(cl => {
    let input = dialog.getContentElement().querySelector('input.'+cl)
    input.value = (cl==='logo' ? organization.getImage() : organization.getCoverImage())
    new InputMedia({
      input: input,
      fullpath: true,
      add: true
    })
  })
})

// Update organization attributes
function updateOrganization(upd) {
  const v = upd.shift();
  // end
  if (!v) {
    dialog.hide();
    organization.set(organization.get())
    return;
  }
  // Set attributes
  api.setOrganization(organization.getId(), v[0], v[1], o => {
    if (!o.error) {
      organization.get()[o.attribute] = o.value
      updateOrganization(upd)
    } else {
      if (o.status === 403) {
        dialog.showAlert('Une organisation avec le même nom existe déjà...')
      } else {
        dialog.showAlert('Impossible de mettre à jour...')
      }
    }
  })
}

// Delete Organization
page.querySelector('.danger .delete').addEventListener('click', () => {
  dialog.showAlert(
    'Attention, cette opération est irréversible.<br/>'
    + 'Les données associées à cette organisation (carte, images, etc.) seront définitvement perdues.',
    { ok: 'Supprimer quand même', submit: _T('cancel') },
    b => {
      if (b==='ok') {
        dialog.showWait('Supression en cours...');
        api.deleteOrganization(organization.getId(), o => {
          if (o.error) {
            dialog.showAlert('Opération impossible')
          } else {
            pages.show()
            location.reload()
          }
        })
      } else {
        dialog.hide()
      }
    }
  )
})