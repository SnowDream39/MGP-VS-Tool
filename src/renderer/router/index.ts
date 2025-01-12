import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@renderer/views/login/login.vue'
import Home from '@renderer/views/home/home.vue'
import Billboard from '@renderer/views/billboard/billboard.vue'

const routes = [
  // 精确匹配 #/login，指向Login页面
  { path: '/login', component: Login, exact: true },
  // 精确匹配 #/home，指向Home页面
  { path: '/home', component: Home, exact: true },
  // billboard，匹配不精确也就算了
  { path: '/billboard', component: Billboard },
  // 空hash，则跳转至Login页面
  { path: '', redirect: '/login' },
  // 未匹配，则跳转至Login页面
  { path: '/:pathMatch(.*)', redirect: '/login' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
