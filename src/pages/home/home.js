import element from 'ol-ext/util/element'
import organization from 'mcutils/api/organization';
import api from 'mcutils/api/api'
import _T from 'mcutils/i18n/i18n'
import pages from 'mcutils/charte/pages';

import html from './home-page.html'

import 'mcutils/api/ListTable.css'
import './home.css'

const page = pages.add('home', html, document.querySelector('.connected'));

const orgaList = page.querySelector('ul[data-role="organizations"]')

function showList() {
  orgaList.innerHTML = '';
  const orga = api.getMe().organizations;
  if (orga) {
    orga.forEach(o => {
      const li = element.create('LI', {
        className: o.organization_id === organization.getId() ? 'selected' : '',
        click: () => {
          organization.set(o);
          pages.show('organization');
        },
        parent: orgaList
      })
      element.create('IMG', {
        src: o.organization_image || '',
        parent: li
      })
      element.create('DIV', {
        text: o.organization_name,
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
if (!organization.getId() && pages.getId()) {
  pages.show();
}

/* DBUG */
window.organization = organization
/**/