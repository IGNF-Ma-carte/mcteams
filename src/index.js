import './mcversion'
import './i18n'
import charte from 'mcutils/charte/macarte'
import api from 'mcutils/api/api'
import 'mcutils/Carte'
import { connectDialog } from 'mcutils/charte/macarte';

// Pages
import './pages/home/home'
import './pages/team/teams'
import './pages/atlas/atlas'
import './pages/cartes/cartes'
import './pages/profil/profil'
import './pages/detail/detail'
/*
*/
import './index.css'

// 
charte.setApp('compte', 'Ma carte');

// Must be connected
if (!api.isConnected()) { connectDialog(); }
api.on(['error', 'disconnect'], () => { connectDialog(); })

/* DEBUG */
window.api = api;
/**/