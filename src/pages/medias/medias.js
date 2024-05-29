import ol_ext_element from 'ol-ext/util/element'

import ListMedias from 'mcutils/api/ListMedias';
import pages from 'mcutils/charte/pages';
import api from 'mcutils/api/api';
import { addMediaDialog, updateMediaDialog } from 'mcutils/dialog/openMedia'
import team from 'mcutils/api/team'

import dialog from 'mcutils/dialog/dialog';
import dialogMessage from 'mcutils/dialog/dialogMessage';

import html from './medias-page.html'

import './medias.css'

const page = pages.add("medias", html, document.querySelector('.connected'))

let mediaSizeLimit;
let mediaSize = 0;
let curTeam = team.getId();

team.on('change', () => {
  if (team.getId() != curTeam) {
    curTeam = team.getId();
    mediaSizeLimit = team.getMediaSizeLimit();
    mediaSize = team.getMediasSize();
    updateProgressBar(mediaSize, mediaSizeLimit);
    list.showPage();
    list.updateFolders();
    console.log(team.getId())
  }
})

/**
 * Display quota
 * @param {number} current used (octet)
 * @param {number} max quota limit (octet)
 */
function updateProgressBar(current, max){
  const elt = page.querySelector('.used-space');
  elt.querySelector('[data-attr="medias_size"').innerText = Math.round(current*100/1024/1024)/100;
  elt.querySelector('[data-attr="medias_size_limit"').innerText = Math.round(max*100/1024/1024)/100;;
  elt.querySelector('.progress-bar-fill').style.width = (current / (max||1))*100 + "%";
}

const list = new ListMedias(api, {
  selection: true,
  search: true,
  check: true,
  limit: true,
  target: page
});

// ADD media
ol_ext_element.create('BUTTON', {
  html: '<i class="fa fa-plus-circle fa-fw"></i> Ajouter un média',
  className: 'button button-ghost',
  click: () => {
    addMediaDialog({
      callback: (e) => {
        mediaSize += e.item.size;
        updateProgressBar(mediaSize, mediaSizeLimit);
        list.updateFolders();
        if (list.get('folder') === e.item.folder){
          list.showPage();
        } else {
          list.setFolder(e.item.folder);
        }
      }
    }, list.get('folders'))
  },
  parent: list.getHeaderElement()
})

// MOVE media
ol_ext_element.create('BUTTON', {
  className: 'button button-ghost select button-disabled',
  html: '<i class="fa fa-folder fa-fw"></i> Changer de galerie...',
  click: () => {
    const sel = list.getChecked();
    if (!sel || !sel.length) {
      dialogMessage.showMessage('Sélectionnez des images à changer de dossier...')
      return;
    }
    list.getFolderDialog({
      prompt: 'Ecrire le nom de la galerie ou sélectionner dans la liste :'
    }, (folder) => {
      // Update media recursively
      const updateMedia = (e) => {
        if (e && e.error) {
          dialogMessage.showAlert('Une erreur est survenue !<br/>Impossible de changer de dossier...')
          list.updateFolders();
          list.showPage();
          return;
        }
        // Next selection
        const s = sel.pop()
        if (s) {
          console.log(s.folder, folder)
          if (s.folder !== folder) api.updateMediaFolder(s.id, folder, updateMedia);
          else updateMedia();
        } else {
          list.updateFolders();
          list.showPage();
        }
      }
      updateMedia();
    });
  },
  parent: list.getHeaderElement()
})

// DELETE media
ol_ext_element.create('BUTTON', {
  className: 'button button-accent select button-disabled',
  html: '<i class="fa fa-trash fa-fw"></i> Supprimer...', 
  click: () => {
    const sel = list.getChecked();
    const max = sel.length;
    
    if (!sel || !sel.length) {
      dialogMessage.showMessage('Sélectionnez des images à supprimer...')
      return;
    }
    // Delete media recursively
    const deleteMedia = (e) => {
      if (e && e.error) {
        dialog.hide();
        dialogMessage.showAlert('Une erreur est survenue !<br/>Impossible de supprimer une image...');
        list.showPage(list.get('currentPage'));
        return;
      }
      // Next selection
      const s = sel.pop()
      dialog.show('Suppression en cours...');
      dialog.setProgress(max - sel.length, max);
      if (s) {
        api.deleteMedia(s.id, deleteMedia);
        mediaSize -= s.size;
        updateProgressBar(mediaSize, mediaSizeLimit);
      } else {
        list.updateFolders((folders) => {
          dialog.hide();
          if (list.get('folder') && folders.indexOf(list.get('folder')) < 0){
            list.setFolder()
          } else {
            list.showPage(list.get('currentPage'));
          }
      }); 
      }
    }
    // Ask for delete
    dialogMessage.showAlert(
      'Êtes-vous sûr de vouloir supprimer <b>' + sel.length + '</b> image' + (sel.length > 1 ? 's ?':' ?')
      + '<br/>Une fois supprimées, les images ne s\'afficheront plus sur les cartes.'
      + '<br/><b class="accent">Cette action est irréversible.</b>',
      { ok: 'supprimer', cancel: 'annuler'},
      (b) => {
        if (b==='ok') {
          deleteMedia();
        }
        dialogMessage.close();
      } 
    )
    // Color button
    dialogMessage.element.querySelector('.ol-buttons input').className = 'button button-accent';
  },
  parent: list.getHeaderElement()
})

// UPDATE media
list.addAction({
  html: 'Modifier', 
  title: 'Modifier l\'image',
  className: 'edit',
  action: (item) => {
    updateMediaDialog({
      media: item,
      folders: list.get('folders'),
      callback: () => {
          list.search();
      }
    })
  },
})

// Activate button
function updateButtons() {
  const action = list.getChecked().length ? 'remove' : 'add'
  list.getHeaderElement().querySelectorAll('button.select').forEach(e => {
    e.classList[action]('button-disabled')
  })
}

list.on(['check', 'draw:list'], updateButtons)