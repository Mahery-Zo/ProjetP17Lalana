import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';


// Ajoute ces imports
import { getCurrentUser } from '@/services/firebaseService';

router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser();
  if (to.path !== '/login' && !user) {
    next('/login');  // Redirige non-auth vers login
  } else {
    next();
  }
});

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/home',
    component: () => import('@/views/HomePage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
