import './mcversion'
import './i18n'
import charte from 'mcutils/charte/macarte'
import api from 'mcutils/api/api'
import 'mcutils/Carte'
import { connectDialog } from 'mcutils/charte/macarte';

// Pages
import './pages/home/home'
import './pages/organization/organization'
import './pages/atlas/atlas'
import './pages/cartes/cartes'
import './pages/profil/profil'

import './index.css'

// 
charte.setApp('compte', 'Ma carte');

// Must be connected
if (!api.isConnected()) { connectDialog(); }
api.on(['error', 'disconnect'], () => { connectDialog(); })

/* DEBUG */
window.api = api;
/**/