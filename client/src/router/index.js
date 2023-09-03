import { createRouter, createWebHistory } from 'vue-router';
import Index from '@/views/index.vue';
import Settings from '@/views/settings.vue';
import NoteDetail from '@/views/notedetail.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Index
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: NoteDetail,
    props: true
  },
  // Other routes
];

const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL),
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
