import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isRelogin } from '@/utils/request'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']

router.beforeEach((to, from, next) => {
  //进度条开始
  NProgress.start()
  /*******如果有令牌*******/
  if (getToken()) {
    //将目标网页的title存入store
    to.meta.title && store.dispatch('settings/setTitle', to.meta.title)
    /* has token:在有=令牌的情况下，访问登录页，就默认跳转到首页*/
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    }else if (whiteList.indexOf(to.path) !== -1) {
      /*******如果访问的地址在白名单里，直接放行*******/
      next()
    } else {
      /*******如果用户的角色为空*******/
      if (store.getters.roles.length === 0) {
        /******显示重新登录********/
        isRelogin.show = true
        // 判断当前用户是否已拉取完user_info信息----拉取用户信息，然后将其设置到store中
        store.dispatch('GetInfo').then(() => {
          /*******不显示重新登录*******/
          isRelogin.show = false
          /**************/
          store.dispatch('GenerateRoutes').then(accessRoutes => {
            // 根据roles权限生成可访问的路由表
            router.addRoutes(accessRoutes) // 动态添加可访问路由表
            next({ ...to, replace: true }) // hack方法 确保addRoutes已完成
          })
        }).catch(err => {
            store.dispatch('LogOut').then(() => {
              Message.error(err)
              next({ path: '/' })
            })
          })
      } else {
      /******如果用户的角色不为空就直接访问********/
        next()
      }
    }
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`) // 否则全部重定向到登录页
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
