import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { auth } from '../firebase';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/NotificationsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/status-simulator',
    name: 'StatusSimulator',
    component: () => import('@/views/StatusSimulator.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/signalement/:id',
    name: 'SignalementDetail',
    component: () => import('@/views/SignalementDetailPage.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard d'authentification
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const user = auth.currentUser;

  if (requiresAuth && !user) {
    next('/login');
  } else if (to.path === '/login' && user) {
    next('/home');
  } else {
    next();
  }
});

export default router;
