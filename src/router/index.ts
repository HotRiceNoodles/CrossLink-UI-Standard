import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import appRoute from './routes'
import { REDIRECT_MAIN, NOT_FOUND_ROUTE } from './routes/base'
import createRouteGuard from './guard/userLoginInfo'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    appRoute,
    REDIRECT_MAIN,
    NOT_FOUND_ROUTE,
  ],
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

router.beforeEach(() => {
  NProgress.start()
})

router.afterEach(() => {
  NProgress.done()
})

createRouteGuard(router)

export default router
