import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { getCurrentUser } from '@/services/firebaseService';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard de navigation
router.beforeEach(async (to, from, next) => {
  const currentUser = await getCurrentUser();
  
  // Route nécessitant une authentification
  if (to.meta.requiresAuth && !currentUser) {
    next('/login');
  }
  // Route réservée aux invités (empêche un utilisateur connecté d'accéder à /login)
  else if (to.meta.requiresGuest && currentUser) {
    next('/home');
  }
  else {
    next();
  }
});

export default router
