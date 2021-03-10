import Vue from 'vue'
import Router from 'vue-router'
import DocManager from '@/pages/DocManager'
import Login from '@/pages/Login'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'DocManager',
      component: DocManager
    },
    {
      path: '/login/',
      name: 'Login',
      component: Login,
      props: {
        inline: false
      }
    },
    {
      path: '/invite/:docId/:token',
      name: 'Invite',
      component: DocManager
    }
  ]
})
