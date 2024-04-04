import element from 'ol-ext/util/element'
import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import md2html from 'mcutils/md/md2html'
import _T from 'mcutils/i18n/i18n';
import dialog from 'mcutils/dialog/dialog'
import MDEditor from 'mcutils/md/MDEditor'
import InputMedia from 'mcutils/control/InputMedia'
import ListTable from 'mcutils/api/ListTable';

import html from './profil-page.html'
import profilDlg from './profil-dialog.html'
import addMemberDlg from './addMember-dialog.html'
import './profil.css'

const content = document.querySelector('.connected')
const page = pages.add('profil', html, document.querySelector('.connected'))

organization.on('change', showOrganization)

/* Members */
const list = new ListTable({
  className: 'mc-user',
  target: page.querySelector('article.members div')
})
list.drawItem = (user, li) => {
  element.create('DIV', {
    className : 'mc-name',
    text: user.public_name,
    parent: li
  })
  const roleElt = element.create('DIV', {
    className : 'mc-role',
    parent: li
  })
  // Role
  if (organization.isOwner()) {
    // Owner can select role
    const roleSel = element.create('SELECT', {
      change: () => {
        const r = roleSel.value
        li.classList.add('loading')
        api.setOrganizationMember(organization.getId(), user.public_id, r, e => {
          if (!e.error) {
            user.role = r;
          } else {
            roleSel.value = user.role
            dialog.showAlert('Impossible de modifier le role')
          }
          li.classList.remove('loading')
        })
      },
      parent: roleElt
    });
    ['owner', 'editor', 'member'].forEach(o => {
      element.create('OPTION', {
        value: o,
        text: _T('organization:role_' + o),
        parent: roleSel
      })
    });
    roleSel.value = user.role
  } else {
    roleElt.innerText = _T('organization:role_' + user.role)
  }
}

// Add member
page.querySelector('button.addMember').addEventListener('click', () => {
  dialog.show({
    className: 'addMember',
    content: addMemberDlg, 
    buttons: { submit: _T('ajouter'), cancel: _T('cancel')},
    onButton: (b, inputs) => {
      if (b==='submit') {
        console.log(inputs)
      }
    }
  })
  const sel = dialog.getContentElement().querySelector('select');
  ['owner', 'editor', 'member'].forEach(o => {
    element.create('OPTION', {
      value: o,
      text: _T('organization:role_' + o),
      parent: sel
    })
  });
  sel.value = 'member'
})

// Display organization
function showOrganization() {
  page.dataset.user = organization.getUserRole()
  page.querySelector('[data-attr="organization_name"]').innerText = organization.getName()
  page.querySelector('[data-attr="organization_image"] img').src = organization.getImage()
  page.querySelector('[data-attr="organization_presentation"]').innerHTML = md2html(organization.getPresentation())
  content.querySelector('#organization .presentation').innerHTML = '';
  content.querySelectorAll('#organization span').forEach(sp => {
    sp.innerText= '';
  })
  // Get members
  list.clear()
  list.element.dataset.waiting = '';
  api.getOrganization(organization.getId(), e => {
    delete list.element.dataset.waiting;
    list.drawList(e.members)
    organization.get().organization_presentation = e.presentation;
    page.querySelector('[data-attr="organization_presentation"]').innerHTML = md2html(e.presentation)
    // general
    console.log('organization', e)
    const d = new Date(e.created_at)
    content.querySelector('#organization .date').innerText = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    content.querySelector('#organization .nbMembers').innerText = e.members.length
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
          upd.push([ 'image', inputs.logo.value ]);
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
  })
  // Media
  dialog.getContentElement().querySelector('.logo').value = organization.getImage()
  new InputMedia({
    input: dialog.getContentElement().querySelector('.logo'),
    fullpath: true,
    add: true
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
      console.log(o);
      organization.get()['organization_'+o.attribute] = o.value
      updateOrganization(upd)
    } else {
      dialog.showAlert('Impossible de mettre à jour...')
    }
  })
}
