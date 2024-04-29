import _T from 'mcutils/i18n/i18n';
import element from 'ol-ext/util/element'
import api from 'mcutils/api/api'
import team from 'mcutils/api/organization';
import pages from 'mcutils/charte/pages.js'
import md2html from 'mcutils/md/md2html';
import dialog from 'mcutils/dialog/dialog'
import ListTable from 'mcutils/api/ListTable';
import { getEditorURL, getViewerURL } from 'mcutils/api/serviceURL';
import saveCarte from 'mcutils/dialog/saveCarte'
import { listMember } from '../profil/members'

import html from './detail-page.html'
import './detail.css'

const page = pages.add("detail", html, document.querySelector('.connected'))

let currentCarte;

// Update edit url
page.querySelector('button.new_id_edit').addEventListener('click', () => {
  api.updateMap(currentCarte.edit_id, { new_edit_id: true }, e => {
    if (!e.error) {
      currentCarte.edit_id = e.edit_id
      currentCarte.edit_url = getEditorURL(e)
      const link = page.querySelector('[data-attr="edit_url"]')
      link.innerText = link.href = currentCarte.edit_url
    }
  })
})

// Update carte author
page.querySelector('button.edit_author').addEventListener('click', () => {
  const content = element.create('DIV', {
    html: md2html(_T('help:change_author')),
  })
  // Filter item
  const filter = element.create('INPUT', {
    type: 'search',
    placehoder: 'rechercher...',
    on: {
      keyup: () => list.showPage(),
      input: () => list.showPage(),
    },
    parent: content
  })
  // Selection list
  const list = new ListTable({
    selection: true,
    target: content
  })
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
  }
  list.filterList = function(data) {
    const rex = new RegExp(filter.value || '.*', 'i') 
    const result = data.filter(d => d.role !== 'member' && rex.test(d.public_name))
    return result
  }
  // delay show
  let tout;
  list.showPage = function() {
    if (tout) clearTimeout(tout)
    tout = setTimeout(() => list.drawList(listMember.getItems()), 300)
  }
  list.showPage()
  // Double click = submit
  list.on('dblclick', () => {
    dialog.element.querySelector('.ol-buttons input[type="submit"]').click();
  })
  // Show dialog
  dialog.show({
    title: 'Changer l\'auteur de la carte',
    className: 'update-author',
    content: content,
    buttons: { submit: _T('ok'), cancel: _T('cancel') },
    onButton: b => {
      if (b !== 'submit') return;
      const user = list.getSelection()
      if (!user) return;
      dialog.close();
      page.querySelector('[data-attr="author"]').parentNode.classList.add('loading')
      api.updateMap(currentCarte.edit_id, { creator_id: user.public_id }, e => {
        if (!e.error) {
          page.querySelector('[data-attr="author"]').innerText = user.public_name
        }
        page.querySelector('[data-attr="author"]').parentNode.classList.remove('loading')
      })
    }
  })
});

// Direct update
['active', 'share'].forEach(att => {
  page.querySelector('[data-attr="'+att+'"]').addEventListener('change', e => {
    const value = (att==='active' ? 'checked' : 'value');
    const upd = {}
    upd[att] = e.target[value]
    // Loading
    let loading = e.target.parentNode;
    if (loading.tagName !== 'P') loading = loading.parentNode;
    loading.classList.add('loading')
    // Update
    api.updateMap(currentCarte.edit_id, upd, a => {
      loading.classList.remove('loading')
      if (a.error) {
        dialog.showAlert('Impossible de mettre à jour la carte...')
        e.target[value] = currentCarte[att]
      } else {
        currentCarte[att] = a[att]
      }
    })
  })
})

// Update attributes
page.querySelector('.actions button.edit').addEventListener('click', () => {
  saveCarte(Object.assign({}, currentCarte), e =>  {
    const updates = {
      title: e.title,
      description: e.description,
      theme: e.theme,
      theme_id: e.theme_id,
      img_url: e.img_url
    }
    api.updateMap(currentCarte.edit_id, updates, c => {
      if (c.error) {
        dialog.showAlert('Impossible de mettre à jour la carte...')
      } else {
        for (let i in updates) {
          currentCarte[i] = updates[i]
        }
        showCarte(currentCarte)
      }
    })
  })
})

// Open carte
page.querySelector('.actions button.edit-data').addEventListener('click', () => {
  window.open(getEditorURL(currentCarte), '_blank');
})

// Delete carte
page.querySelector('.actions button.delete').addEventListener('click', () => {
  dialog.showWait('Suppression en cours')
  api.deleteMap(currentCarte.edit_id, e => {
    if (e.error) {
      dialog.showAlert('Impossible de supprimer la carte')
    } else {
      dialog.hide();
      pages.show('cartes', true)
    }
  })
})

/* Show the carte informations
 * @param {Objet} carte
 * @param {string} from the page it comes from: atlas or cartes
 */
function showCarte(carte, from) {
  currentCarte = carte
  pages.show('detail')
  // Title
  page.querySelector('h1.carte').innerText = carte.title
  // Breadscrum
  if (from) page.querySelector('.breadcrumb .cartes a').innerText = from
  // Creator
  api.getMap(carte.view_id, e => {
    if (!e.error) {
      page.querySelector('[data-attr="author"]').innerText = e.author
    }
  })
  // valid
  if (carte.valid) {
    delete page.dataset.invalid
  } else {
    page.dataset.invalid = '';
  }
  // iframe
  page.querySelector('iframe').src = getViewerURL(carte);
  // Attributes
  page.querySelectorAll('[data-attr]').forEach(a => {
    const attr = a.dataset.attr;
    switch (a.tagName) {
      case 'DIV': {
        a.innerHTML = md2html(carte[attr] || '*Pas de description enregistrée*') 
        break;
      }
      case 'A': {
        a.innerText = a.href = carte[attr] || '';
        break;
      }
      case 'IMG': {
        a.src = carte[attr]
        break;
      }
      case 'DATE': {
        a.innerText = (new Date(carte[attr])).toLocaleString()
        break;
      }
      case 'INPUT': {
        // Input checkbox
        a.checked = carte[attr]
        break;
      }
      case 'SELECT': {
        a.value = carte[attr]
        break;
      }
      case 'SPAN': 
      default: {
        a.innerText = carte[attr] || ''
        break;
      }
    }
  })
  // Disable for editor
  page.querySelector('[data-attr="share"]').disabled = !team.isOwner()
  page.querySelector('[data-attr="active"]').disabled = !team.isOwner()
  page.querySelector('.actions button.delete').disabled = (carte.share !== 'private')
}

// First show > back to organization
if (/^detail$|^atlas$/.test(pages.getId())) {
  pages.show('equipes')
}

export { showCarte }