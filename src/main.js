// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUi from 'element-ui'
import contentmenu from 'v-contextmenu'
import 'element-ui/lib/theme-chalk/index.css'
import 'v-contextmenu/dist/index.css'

Vue.use(ElementUi)
Vue.use(contentmenu)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
