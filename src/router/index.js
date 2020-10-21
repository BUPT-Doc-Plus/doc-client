import Vue from 'vue'
import Router from 'vue-router'
import DocManager from '@/components/DocManager'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'DocManager',
      component: DocManager
    }
  ]
})
