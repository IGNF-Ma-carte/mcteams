import element from 'ol-ext/util/element'

import api from 'mcutils/api/api'
import team from 'mcutils/api/team';
import pages from 'mcutils/charte/pages.js'
import ListTable from 'mcutils/api/ListTable';
import UserInput from 'mcutils/api/UserInput'
import dialog from 'mcutils/dialog/dialog'
import _T from 'mcutils/i18n/i18n';
import helpDialog from 'mcutils/dialog/helpDialog'

import html from './profil-page.html'

const page = pages.add('profil', html, document.querySelector('.connected'))

/* Help */
helpDialog(page.querySelector('.member-link label'), _T('help:memberlinks'), 'Lien pour un membre')
helpDialog(page.querySelector('.editor-link label'), _T('help:memberlinks'), 'Lien pour un éditeur')
helpDialog(page.querySelector('.pattern-link label'), _T('help:memberlinks'), 'mailPattern')

/* Membre links */
const teamLinks = page.querySelector('.mc-links');

function updateLink(type, value) {
  // Disabled
  teamLinks.querySelector('.'+type+'-link a').setAttribute('aria-disabled', !value)
  // Text
  if (value) {
    value = document.location.origin
      + document.location.pathname
      + '?rejoindre=' + value
  } else {
    value = 'pas de lien'
  }
  teamLinks.querySelector('.'+type+'-link a').innerText = value
}

['member','editor'].forEach(t => {
  function updateLinks(e) {
    if (!e.error) {
      updateLink(t, e.value);
    }
    teamLinks.querySelector('.'+t+'-link').classList.remove('loading')
  }
  // Copy link on click
  teamLinks.querySelector('.'+t+'-link a').addEventListener('click', e => {
    e.preventDefault();
    try {
      navigator.clipboard.writeText(e.target.innerText);
      e.target.nextSibling.className = 'copy-info visible';
      setTimeout(() => { e.target.nextSibling.className = 'copy-info'; }, 800);
    } catch(e) {/* ok */}
  })

  teamLinks.querySelector('.'+t+'-link button.change').addEventListener('click', () => {
    teamLinks.querySelector('.'+t+'-link').classList.add('loading')
    api.setTeamLink(team.getId(), t, updateLinks)
  })
  teamLinks.querySelector('.'+t+'-link button.remove').addEventListener('click', () => {
    teamLinks.querySelector('.'+t+'-link').classList.add('loading')
    api.removeTeamLink(team.getId(), t, updateLinks);
  })
})
// Mail pattern
teamLinks.querySelector('.pattern-link button').addEventListener('click', () => {
  let value = teamLinks.querySelector('.pattern-link input').value;
  const endWith = (teamLinks.querySelector('.pattern-link select').value === 'endwith') && value;
  teamLinks.querySelector('.pattern-link').classList.add('loading')
  api.setTeam(team.getId(), 'mail_pattern', value + (endWith ? '$' : ''), e => {
    teamLinks.querySelector('.pattern-link').classList.remove('loading')
  })
})

// Update links on change
setTimeout(() => {
  team.on('change', () => {
    if (team.getUserRole() === 'owner') {
      teamLinks.classList.add('loading');
      api.getTeamLinks(team.getId(), e => {
        teamLinks.classList.remove('loading');
        updateLink('member', e.link_as_member);
        updateLink('editor', e.link_as_editor);
        teamLinks.querySelector('.pattern-link input').value = e.mail_pattern.replace(/\$$/,'') || ''
        if (/\$$/.test(e.mail_pattern)) {
          teamLinks.querySelector('.pattern-link select').value = 'endwith';
        } else {
          teamLinks.querySelector('.pattern-link select').value = 'match';
        }
      })
    }
  })
})

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
  if (user.active === false) {
    li.dataset.inactive = '';
  }
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
  element.create('DIV', { 
    className: 'role role_'+user.role, 
    title: _T('team:role_' + user.role),
    parent: li
  })
  if (team.isOwner()) {
    // Owner can select role
    const roleSel = element.create('SELECT', {
      change: () => {
        if (user.public_id === api.getMe().public_id) {
          dialog.showAlert(
            'Attention si vous n\'êtes plus propriétaire de cette équipe,<br/> vous ne pourrez plus y accéder ou l\'administrer...',
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
        text: _T('team:role_' + o),
        parent: roleSel
      })
    });
    roleSel.value = user.role
  } else {
    roleElt.innerText = _T('team:role_' + user.role)
  }

  // Delete button
  if (team.isOwner() || (api.getMe() && user.public_id === api.getMe().public_id)) {
    element.create('BUTTON', {
      className: 'delete',
      title: 'Retirer ce membre de l\'équipe',
      html: '<i class="fi-delete"></i>',
      click: () => {
        // Check user
        if (user.public_id === api.getMe().public_id) {
          dialog.show({
            className: 'alert',
            title: 'Quitter l\'équipe',
            content: 'Attention si vous quittez cette équipe,<br/> vous ne pourrez plus y accéder ou l\'administrer...',
            buttons: { ok: _T('ok'), submit: _T('cancel') },
            onButton: b => {
              if (b==='ok') removeMember(user, li)
              dialog.hide()
            }
        })
        } else {
          removeMember(user, li)
        }
        return;
      },
      parent: li
    })
  }
}

// Show member in the list sorted by roles
list.setMembers = function(members) {
  // Alphabetic order
  const sorter = {
    owner: 0,
    editor: 1,
    member: 2
  };
  (members || []).sort((a,b) => {
    // Sort by role
    const s = sorter[a.role] - sorter[b.role]
    if (s) return s;
    if (a.public_name < b.public_name) return -1;
    if (a.public_name > b.public_name) return 1;
    return 0
  })
  // Show team
  list.drawList(members)
}

/** Change member role */
function changeRole(user, r, li) {
  li.classList.add('loading')
  api.setTeamMemberRole(team.getId(), user.public_id, r, e => {
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
  api.removeTeamMember(team.getId(), user.public_id, e => {
    if (e.error) {
      dialog.showAlert('Impossible de supprimer le membre...')
    } else if (user.public_id === api.getMe().public_id) {
      pages.show();
      location.reload()
    }
    team.changed()
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
    api.addTeamMember(team.getId(), u.id, role, e => {
      if (!e.error || e.status === 400) {
        if (e.status === 400) errors.push(u)
        addMembers(members, role, errors)
      } else {
        dialog.showAlert('Impossible d\'ajouter un membre')
        team.changed()
      }
    }, refresh)
  } else {
    // No more member > refresh page
    team.changed()
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
          if (l.dataset.id) {
            members.push({ id: l.dataset.id, name: l.innerText })
          }
        })
        if (members.length) {
          dialog.showWait('enregistrement en cours...')
          addMembers(members, inputs.role.value)
        } else {
          dialog.getContentElement().querySelector('ul.mc-list').dataset.error = '';
        }
      }
    }
  })
  // New user
  const input = new UserInput(api, { target: dialog.getContentElement(), full: true } );
  input.searchInput.focus()
  // Result
  element.create('P', { text: 'Membres à ajouter :', parent: dialog.getContentElement() })
  const ul = element.create('UL', { className: 'mc-list', parent: dialog.getContentElement() })
  const nomember = element.create('LI', { className: 'nomember', text: 'aucun membre', parent: ul })
  input.on('select', e => {
    input.setUser(e.user.public_name)
    const isok = !ul.querySelector('[data-id="'+e.user.public_id+'"]')
    if (isok) {
      nomember.remove();
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
      text: _T('team:role_' + o),
      parent: sel
    })
  });
  sel.value = 'member'
})


export { page, list }
export { list as listMember }