import element from 'ol-ext/util/element'
import api from 'mcutils/api/api'
import organization from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import _T from 'mcutils/i18n/i18n';

import html from './profil-page.html'
import './profil.css'

const page = pages.add('profil', html, document.querySelector('.connected'))

organization.on('change', () => {
  page.querySelector('[data-attr="organization_name"]').innerText = organization.getName()
  page.querySelector('[data-attr="organization_image"] img').src = organization.getImage()
  showMembers()
})

import ListTable from 'mcutils/api/ListTable';
const list = new ListTable({
  className: 'mc-user',
  target: page.querySelector('article')
})
list.drawItem = (user, li) => {
  console.log(user)
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
        api.setOrganizationMember(organization.getId(), user.public_id, r, e => {
          if (!e.error) {
            user.role = r;
          } else {
            roleSel.value = user.role
            console.error('Impossible de modifier le role')
          }
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

// Members
function showMembers() {
  list.clear()
  list.element.dataset.waiting = '';
  api.getOrganization(organization.getId(), e => {
    delete list.element.dataset.waiting;
    list.drawList(e.members)
  })
}
