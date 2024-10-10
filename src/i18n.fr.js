export default {
  "help:change_author": `*L'auteur de la carte voit la carte dans son espace de travail et pourra la modifier sans avoir le lien de modification.*`,
  "help:memberlinks": `# Ajouter des membres à une équipe
----
*Vous pouvez inviter des membres à participer à votre équipe en lui envoyant un lien.*

Il vous suffit de créer et d'envoyer un lien à vos amis pour leur permettre de se connecter à votre équipe.
Deux type de lien sont disponibles pour ajouter un **membre** (qui pourra voir les cartes publiques de l'équipe) ou un **éditeur** (qui pourra créer ou modifier des cartes au sein de l'équipe).
  `,
  "help:mailPattern": `# Motif pour le mail
----
*Ajouter un motif pour le mail afin de limiter les personnes pouvant s'inscrire.* 

Lorsque vous envoyez un lien pour inviter un membre à rejoindre votre équipe, vous pouvez définr un motif afin de limiter les inscriptions aux personnes ayant un mail contenant un motif spécifique. Ceci vous assure que si le lien parvient à une personne n'ayant pas ce type de mail, il ne pourra pas entrer dans votre équipe.
Par exemple, un motif du type \`@ign.fr\` limitera les membres dont le mail est du type \`xxx@ign.fr\`.
  `,
  "help:shareType": `# Partager vos carte dans une équipe
----
*Les cartes dans une équipe ne sont visibles que par les autres membres de l'équipe et seuls les éditeurs peuvent rédiger des cartes dans l'équipe.*

Une carte peut être publiée :
* **en privé** : seuls les **éditeurs** (via le lien de modfication) peuvent modifier la carte. Les propriétaires de l'équipe et l'auteur de la carte pourront accéder à la carte dans leur espace de publication.
* **dans l'équipe** : tous les **membres** de l'équipe peuvent voir la carte. Elle apparait dans l'atlas de l'équipe.
* **dans l'atlas** : lorsqu'une carte est publiée dans l'atlas, elle est visible **en dehors** de l'équipe. Elle n'apparait plus dans l'espace de publication de l'auteur, mais elle reste modifiable via le lien de modification.

⚠️ Attention : les cartes associées à une narration doivent avoir le même mode de publication, au risque de ne pas s'afficher correctement.
Seul le propriétaire peut modifier le mode de publication d'une carte (les éditeurs sont limités au mode privé).
`,
  "help:joinList": `# Rejoindre une équipe
----
Lorsque vous êtes invité à participer à une équipe vous devez valider l'invitation. 
Vous pouvez également refuser si vous n'êtes pas intéressé à participer.
  `,
  // SAVE
  saveTitle: "Enregistrer",
  save: "Enregistrer",
  saveAs: "Enregistre sous",
  cancel: "annuler"
}