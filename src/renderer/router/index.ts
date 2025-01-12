import { createRouter, createWebHashHistory } from 'vue-router'
import Menu from '@renderer/views/menu/menu.vue'
import Home from '@renderer/views/home/home.vue'
import Billboard from '@renderer/views/billboard/billboard.vue'
import Vocadb from '@renderer/views/vocadb/vocadb.vue'

const routes = [
  { path: '/menu', component: Menu, exact: true },
  { path: '/home', component: Home, exact: true },
  { path: '/billboard', component: Billboard },
  { path: '/vocadb', component: Vocadb },
  // 空hash，则跳转至Login页面
  { path: '', redirect: '/menu' },
  // 未匹配，则跳转至Login页面
  { path: '/:pathMatch(.*)', redirect: '/menu' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
