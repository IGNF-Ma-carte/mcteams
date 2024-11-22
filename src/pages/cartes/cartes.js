import ol_ext_element from 'ol-ext/util/element'
import api from 'mcutils/api/api'
import team from 'mcutils/api/team';
import pages from 'mcutils/charte/pages.js'
import ListCarte from 'mcutils/api/ListCarte'
import { getViewerURL, getEditorURL } from 'mcutils/api/serviceURL';
import { showCarte } from '../detail/detail';

import 'mcutils/api/ListCarte.responsive.css'

import html from './cartes-page.html'
import actionHtml from './actions-page.html'
import shareHtml from './share-dialog.html'
import './cartes.css'
import dialog from 'mcutils/dialog/dialog';

function showCartes(type, context) {
  const page = pages.add(type, html, document.querySelector('.connected'))
  page.querySelector('.breadcrumb li.page').classList.add(type)

  // Create carte list
  const list = new ListCarte(api, { 
    context: context,
    selection: true,
    search: true,
    check: context==='profile',
    permalink: false,
    target: page 
  });

  // Show page
  pages.on('change', p => {
    if (p.id === type) {
      if (p.from !== 'detail') {
        list.set('organization', team.getId())
        list.clear();
        list.search();
      } else {
        list.refresh()
      }
    }
  })
  // First show
  if (pages.getId() === type && team.getId()) {
    list.set('organization', team.getId())
    list.search();
  }

  // Actions on selected carte
  list.addAction({
    html: 'Voir', 
    title: 'Voir la carte',
    className: 'show',
    action: (item) => {
      window.open(getViewerURL(item), '_blank')
    },
  })
  list.addAction({
    html: 'Modifier', 
    title: 'Modifier la carte',
    className: 'edit',
    action: (item) => {
      window.open(getEditorURL(item), '_blank')
    },
  })
  list.addAction({
    html: 'Détail', 
    title: 'Voir les détails de la carte',
    className: 'detail',
    action: (item) => {
      showCarte(item, type)
    },
  })

  // Enable actions
  /*
  list.on('draw:item', e => {
    if (team.isOwner() || api.getMe().public_id === e.item.user_id) {
      e.element.dataset.user = team.getUserRole()
    }
  })
  */

  // Global actions
  const actionsDiv = ol_ext_element.create('DIV', {
    'data-role': 'actions',
    html: actionHtml,
    parent: list.element.querySelector('.mc-search')
  })

  // Disable button when no check
  list.on(['check', 'check:all', 'draw:list'], () => {
    const btn = actionsDiv.querySelectorAll('button.select')
    if (list.getChecked().length) {
        btn.forEach(b => b.classList.remove('button-disabled'))
    } else {
        btn.forEach(b => b.classList.add('button-disabled'))
    }
    // count
    actionsDiv.querySelector('.checked-maps .count').innerText = list.getChecked().length;
    actionsDiv.querySelector('.checked-maps input').checked = list.getChecked().length > 0;
  })
  // Button actions
  actionsDiv.querySelector('.checked-maps input').addEventListener('click', e => {
    if (e.currentTarget.checked) {
      list.checkAll(true);
    } else {
      list.checkAll(false);
    }
    elt.querySelector('.checked-maps .count').innerText = list.getChecked().length;
  })
  // Update theme
  actionsDiv.querySelector('button.edit-theme').addEventListener('click', (e) => {
    editTheme(list);
  });
  // Share maps
  actionsDiv.querySelector('button.edit-share').addEventListener('click', (e) => {
    editShare(list);
  });

  // Delete maps
  actionsDiv.querySelector('button.delete-maps').addEventListener('click', (e) => {
    deleteMapsDialog(list);
  });
}

showCartes('cartes', 'profile')

/* Actions */

/* Edit theme */
function editTheme(list){
  if (!list.getChecked().length){
    dialog.showAlert('Sélectionnez au moins une carte');
    return;
  }

  api.getThemes((themes) => {
    let content = ol_ext_element.create('DIV');
    ol_ext_element.create('P', {
      text: 'Sélectionnez le thème qui sera appliqué aux ' + list.getChecked().length + ' carte(s) sélectionnée(s) puis cliquez sur Enregitstrer',
      parent: content
    });

    let options = {};
    for(let i in themes){
      options[themes[i]['name']] = themes[i]['id'];
    }
    ol_ext_element.create('SELECT', {
      options: options,
      parent: content,
      className: 'theme'
    })

    dialog.show({
      title: "Gérer le thème",
      content: content,
      className: 'edit-theme',
      buttons: {submit : 'Valider', cancel: 'Annuler'},
      onButton: (b, inputs) => {
       if (b === 'submit') {
          updateMaps(list, 'theme_id', parseInt(inputs.theme.value))
        }
      }
    })
  })
}

/* Share maps */
function editShare(list){
  if (!list.getChecked().length){
    dialog.showAlert('Sélectionnez au moins une carte');
    return;
  }

  dialog.show({
    title: "Gérer la publication",
    content: shareHtml,
    className: 'edit-share',
    buttons: { submit : 'Valider', cancel: 'Annuler' },
    onButton: (b, inputs) => {
      if (b === 'submit') {
        updateMaps(list, 'share', inputs.share.value);
      }
    }
  })
  dialog.getContentElement().querySelector('span.count').innerText = list.getChecked().length;
}

/* Delete maps */
function deleteMapsDialog(list){
  if (!list.getChecked().length){
    dialog.showAlert('Sélectionnez au moins une carte');
    return;
  }

  dialog.show({
    title: 'Supprimer la sélection',
    content: 'Etes-vous sûr de vouloir supprimer définitivement ces '+ list.getChecked().length+' carte(s)',
    buttons: { submit: 'Valider', cancel: 'Annuler'},
    onButton: (b) => {
      if (b === 'submit') {
        updateMaps(list, 'delete');
      }
    }
  });
}

/* Update a list of maps 
 * @param {ListCarte} list 
 * @param {string} action action or attribute to update
 * @param {string} [value] 
 * @param {number} [max] 
 */
function updateMaps(list, action, value, maps, max){
  maps = maps || list.getChecked();
  if (maps.length) {
    max = max || maps.length;

    const map = maps.pop();
    dialog.show('Modification en cours...');
    dialog.setProgress(max - maps.length, max);
    
    if (action === 'delete') {
      api.deleteMap(map.edit_id, () => {
        updateMaps(list, action, value, maps, max)
      });
    } else {
      const data = {};
      data[action] = value;
      api.updateMap(map.edit_id, data, () => {
        updateMaps(list, action, value, maps, max);
      })
    }
  } else {
    dialog.hide();
    list.search();
  }
}


export default showCartes
