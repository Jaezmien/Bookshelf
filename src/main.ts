import App from './App.vue'

import { createApp } from 'vue'
const app = createApp(App)

// Custom
import Notifications from '@/components/Notifications'
import '@/components/Notifications/style.scss'
app.use(Notifications)

import { registerSW } from 'virtual:pwa-register'

registerSW({
	onNeedRefresh() {},
	onOfflineReady() {},
})
// Custom

import router from './routes'
app.use(router)

import { createPinia } from 'pinia'
app.use(createPinia())

app.mount('#app')
