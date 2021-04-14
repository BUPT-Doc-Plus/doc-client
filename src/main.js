// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUi from 'element-ui'
import VueClipboard from 'vue-clipboard2'
import 'element-ui/lib/theme-chalk/index.css'
import 'v-contextmenu/dist/index.css'
import API from './biz/API'
import Quill from 'quill'
import UserBlock from './util/UserBlock'

Quill.register(UserBlock)
Vue.use(ElementUi)
Vue.use(VueClipboard)
Vue.config.productionTip = () => {};

/* eslint-disable no-new */
(async () => {

  try {
    await API.currentUser();
  } catch (e) {
    localStorage.clear();
    console.error(e);
  }
  new Vue({
    el: '#app',
    router,
    components: {App},
    template: '<App/>'
  })
  
})()