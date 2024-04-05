import element from 'ol-ext/util/element'

import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import ListTable from 'mcutils/api/ListTable';
import UserInput from 'mcutils/api/UserInput'
import dialog from 'mcutils/dialog/dialog'
import _T from 'mcutils/i18n/i18n';

import html from './profil-page.html'

const page = pages.add('profil', html, document.querySelector('.connected'))

/* Members List */
const list = new ListTable({
  className: 'mc-user',
  target: page.querySelector('article.members div')
})

// List items
list.drawItem = (user, li) => {
  element.create('DIV', {
    className : 'mc-name',
    text: user.public_name,
    parent: li
  })
  if (user.profile_picture) {
    element.create('IMG', {
      src: user.profile_picture,
      parent: li
    })
  }
  // Role
  const roleElt = element.create('DIV', {
    className : 'mc-role',
    parent: li
  })
  // Owner can change member info
  element.create('DIV', { className: 'role role_'+user.role, parent: li })
  if (organization.isOwner()) {
    // Owner can select role
    const roleSel = element.create('SELECT', {
      change: () => {
        if (user.public_id === api.getMe().public_id) {
          dialog.showAlert(
            'Attention si vous n\'êtes plus propriétaire de cette organisation,<br/> vous ne pourrez plus y accéder ou l\'administrer...',
            { ok: _T('ok'), submit: _T('cancel') },
            b => {
              if (b==='ok') {
                changeRole(user, roleSel.value, li)
              } else {
                roleSel.value = 'owner';
              }
              dialog.hide()
            }
          )
        } else {
          changeRole(user, roleSel.value, li)
        }
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

  // Delete button
  if (organization.isOwner()) {
    element.create('BUTTON', {
      className: 'delete',
      title: 'Retirer ce membre de l\'organisation',
      html: '<i class="fi-delete"></i>',
      click: () => {
        // Check user
        if (user.public_id === api.getMe().public_id) {
          dialog.showAlert(
            'Attention si vous vous supprimez de cette organisation,<br/> vous ne pourrez plus y accéder ou l\'administrer...',
            { ok: _T('ok'), submit: _T('cancel') },
            b => {
              if (b==='ok') removeMember(user, li)
              dialog.hide()
            }
          )
        } else {
          removeMember(user, li)
        }
        return;
      },
      parent: li
    })
  }
}

/** Change member role */
function changeRole(user, r, li) {
  li.classList.add('loading')
  api.setOrganizationMember(organization.getId(), user.public_id, r, e => {
    if (!e.error) {
      user.role = r;
      li.querySelector('.role').className = 'role role_'+user.role;
      if (user.public_id === api.getMe().public_id) {
        pages.show();
        location.reload()
      }
    } else {
      dialog.showAlert('Impossible de modifier le role')
      li.querySelector('select').value = user.role
    }
    li.classList.remove('loading')
  })
}

/** Remove a member */
function removeMember(user, li) {
  if (li) li.classList.add('loading')
  api.removeOrganizationMember(organization.getId(), user.public_id, e => {
    if (e.error) {
      dialog.showAlert('Impossible de supprimer le membre...')
    } else if (user.public_id === api.getMe().public_id) {
      pages.show();
      location.reload()
    }
    organization.changed()
  })
}

/* Add a list of new members recursively
 */
function addMembers(members, role, errors) {
  // Get a refresh token at first
  const refresh = !errors;
  if (!errors) errors = [];
  // Next member
  const u = members.pop()
  if (u) {
    api.addOrganizationMember(organization.getId(), u.id, role, e => {
      if (!e.error || e.status === 400) {
        if (e.status === 400) errors.push(u)
        addMembers(members, role, errors)
      } else {
        dialog.showAlert('Impossible d\'ajouter un membre')
        organization.changed()
      }
    }, refresh)
  } else {
    // No more member > refresh page
    organization.changed()
    // Chek errors
    if (errors.length) {
      dialog.showAlert('Certains membres étaient déjà dans l\'oganisation et n\'ont pas étés ajoutés')
      const ul = element.create('UL', {
        parent: dialog.getContentElement()
      })
      errors.forEach(e => {
        element.create('LI', {
          text: e.name,
          parent: ul
        })
      })
    } else {
      dialog.hide()
    }
  }
}

// Add member
page.querySelector('button.addMember').addEventListener('click', () => {
  dialog.show({
    title: 'Ajouter un nouveau membre',
    className: 'addMember',
    content: ' ', 
    buttons: { submit: _T('ajouter'), cancel: _T('cancel')},
    onButton: (b, inputs) => {
      if (b==='submit') {
        const members = [];
        ul.querySelectorAll('li').forEach(l => {
          members.push({ id: l.dataset.id, name: l.innerText })
        })
        dialog.showWait('enregistrement en cours...')
        addMembers(members, inputs.role.value)
      }
    }
  })
  // New user
  const input = new UserInput(api, { target: dialog.getContentElement(), full: true } );
  // Result
  const ul = element.create('UL', { className: 'mc-list', parent: dialog.getContentElement() })
  input.on('select', e => {
    input.setUser(e.user.public_name)
    const isok = !ul.querySelector('[data-id="'+e.user.public_id+'"]')
    if (isok) {
      const li = element.create('LI', {
        text: e.user.public_name,
        'data-id': e.user.public_id,
        parent: ul
      })
      if (e.user.profile_picture) {
        element.create('IMG', { 
          src: e.user.profile_picture,
          parent: li
        })
      }
    }
  })
  // role
  element.create('LABEL', { 
    text: 'Rôle :',
    parent: dialog.getContentElement()
  })
  const sel = element.create('SELECT', {
    className: 'role',
    parent: dialog.getContentElement()
  });
  ['owner', 'editor', 'member'].forEach(o => {
    element.create('OPTION', {
      value: o,
      text: _T('organization:role_' + o),
      parent: sel
    })
  });
  sel.value = 'member'
})


export { page, list }