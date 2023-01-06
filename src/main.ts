import App from './App.vue'

import { createApp } from 'vue'
const app = createApp(App)

// Notifications
import Notifications from '@/components/Notifications'
import '@/components/Notifications/style.scss'
app.use(Notifications)

// PWA
import { registerSW } from 'virtual:pwa-register'
registerSW({
	onNeedRefresh() {},
	onOfflineReady() {},
})

import router from './routes'
app.use(router)

import { createPinia } from 'pinia'
import { useDatabaseStore } from './stores/database'
import { useSettingStore } from './stores/settings'
app.use(createPinia())

useSettingStore().load_settings()
await useDatabaseStore()
	.initialize_db()
	.catch((err) => {
		if (err === null) return

		console.error(err)
		app.config.globalProperties.$book_notification('An error has occured while trying to initialize IndexedDB', 2)
	})

app.mount('#app')
