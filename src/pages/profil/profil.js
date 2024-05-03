import _T from 'mcutils/i18n/i18n';
import api from 'mcutils/api/api'
import team from 'mcutils/api/team';
import md2html from 'mcutils/md/md2html'
import dialog from 'mcutils/dialog/dialog'
import MDEditor from 'mcutils/md/MDEditor'
import InputMedia from 'mcutils/control/InputMedia'
import { getTeamURL } from 'mcutils/api/serviceURL';

import { page, list } from './members'

import profilDlg from './profil-dialog.html'
import './profil.css'
import pages from 'mcutils/charte/pages';

const content = document.querySelector('.connected')

team.on('change', showTeam)

// Display team
function showTeam() {
  page.querySelector('[data-attr="name"]').innerText = team.getName()
  page.querySelector('[data-attr="profile_picture"] img').src = team.getImage()
  page.querySelector('[data-attr="cover_picture"] img').src = team.getCoverImage()
  page.querySelector('[data-attr="presentation"]').innerHTML =
  content.querySelector('#equipe .presentation').innerHTML = md2html(team.getPresentation());
  content.querySelectorAll('#equipe span').forEach(sp => {
    sp.innerText= '';
  })
  // Get members
  list.clear()
  list.element.dataset.waiting = '';
  api.getTeam(team.getId(), e => {
    delete list.element.dataset.waiting;
    if (e.error) return;
    // Alphabetic order
    const sorter = {
      owner: 0,
      editor: 1,
      member: 2
    };
    (e.members || []).sort((a,b) => {
      // Sort by role
      const s = sorter[a.role] - sorter[b.role]
      if (s) return s;
      if (a.public_name < b.public_name) return -1;
      if (a.public_name > b.public_name) return 1;
      return 0
    })
    // Show team
    list.drawList(e.members)
    team.get().presentation = e.presentation;
    page.querySelector('[data-attr="presentation"]').innerHTML = md2html(e.presentation)
    // general
    const d = new Date(e.created_at)
    content.querySelector('#equipe .date').innerText = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    content.querySelector('#equipe .nbMembers').innerText = e.nb_members
    content.querySelector('#equipe .presentation').innerHTML = md2html(e.presentation)
  })
}

// See online
page.querySelector('.onlineProfile').addEventListener('click', () => {
  window.open(getTeamURL(team), '_blank')
})

// Update 
page.querySelector('.editProfile').addEventListener('click', () => {
  if (!team.isOwner()) {
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
        if (inputs.name.value !== team.getName()) {
          upd.push([ 'name', inputs.name.value ]);
        }
        if (inputs.presentation.value !== team.getPresentation()) {
          upd.push([ 'presentation', inputs.presentation.value ]);
        }
        if (inputs.logo.value !== team.getImage()) {
          upd.push([ 'profile_picture', inputs.logo.value ]);
        }
        if (inputs.cover.value !== team.getCoverImage()) {
          upd.push([ 'cover_picture', inputs.cover.value ]);
        }
        updateTeam(upd)
      }
    }
  })
  // Name
  dialog.getContentElement().querySelector('.name').value = team.getName()
  // Presentation
  dialog.getContentElement().querySelector('.presentation').value = team.getPresentation()
  new MDEditor({
    input: dialog.getContentElement().querySelector('.presentation')
  });
  // Media
  ['logo', 'cover'].forEach(cl => {
    let input = dialog.getContentElement().querySelector('input.'+cl)
    input.value = (cl==='logo' ? team.getImage() : team.getCoverImage())
    new InputMedia({
      input: input,
      fullpath: true,
      add: true
    })
  })
})

// Update team attributes
function updateTeam(upd) {
  const v = upd.shift();
  // end
  if (!v) {
    dialog.hide();
    team.set(team.get())
    return;
  }
  // Set attributes
  api.setTeam(team.getId(), v[0], v[1], o => {
    if (!o.error) {
      team.get()[o.attribute] = o.value
      updateTeam(upd)
    } else {
      if (o.status === 403) {
        dialog.showAlert('Une équipe avec le même nom existe déjà...')
      } else {
        dialog.showAlert('Impossible de mettre à jour...')
      }
    }
  })
}

// Delete team
page.querySelector('.danger .delete').addEventListener('click', () => {
  dialog.showAlert(
    'Attention, cette opération est irréversible.<br/>'
    + 'Les données associées à cette équipe (carte, images, etc.) seront définitivement perdues.',
    { ok: 'Supprimer quand même', submit: _T('cancel') },
    b => {
      if (b==='ok') {
        dialog.showWait('Supression en cours...');
        api.deleteTeam(team.getId(), o => {
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