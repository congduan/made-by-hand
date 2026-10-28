import { createRouter, createWebHistory } from 'vue-router'
import CraftView from '../views/CraftView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: CraftView },
    { path: '/origami', component: PlaceholderView, props: { name: '折纸' } },
    {
      path: '/papercraft',
      component: PlaceholderView,
      props: { name: '剪纸' },
    },
  ],
})
