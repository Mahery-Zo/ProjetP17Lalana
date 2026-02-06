import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Import Ionicons */
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  add,
  locateOutline,
  hourglassOutline,
  funnelOutline,
  funnel,
  person,
  closeCircle,
  cameraOutline,
  statsChartOutline,
  alertCircle,
  notifications,
  notificationsOutline,
  arrowBack,
  checkmarkDone,
  refresh,
  list,
  settings,
  business,
  notificationsOff,
  trash,
  camera,
  close,
  images
} from 'ionicons/icons';

/* Register icons */
addIcons({
  'log-out-outline': logOutOutline,
  'add': add,
  'locate-outline': locateOutline,
  'hourglass-outline': hourglassOutline,
  'funnel-outline': funnelOutline,
  'funnel': funnel,
  'person': person,
  'close-circle': closeCircle,
  'camera-outline': cameraOutline,
  'stats-chart-outline': statsChartOutline,
  'alert-circle': alertCircle,
  'notifications': notifications,
  'notifications-outline': notificationsOutline,
  'arrow-back': arrowBack,
  'checkmark-done': checkmarkDone,
  'refresh': refresh,
  'list': list,
  'settings': settings,
  'business': business,
  'notifications-off': notificationsOff,
  'trash': trash,
  'camera': camera,
  'close': close,
  'images': images
});

import { auth, db } from './firebase';
import { NotificationService } from './services/notifications.service';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';

/* Theme variables */
import './theme/variables.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

router.isReady().then(() => {
  app.mount('#app');
  
  // Initialiser les notifications après le montage de l'app
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log('Utilisateur connecté, initialisation des notifications:', user.uid);
      try {
        await NotificationService.requestPermission();
        await NotificationService.initialize(user.uid);
      } catch (error) {
        console.error('Erreur initialisation notifications:', error);
      }
    } else {
      console.log('Utilisateur déconnecté, nettoyage des notifications');
      NotificationService.cleanup();
    }
  });
});
