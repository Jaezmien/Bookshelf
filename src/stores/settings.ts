import { defineStore } from 'pinia'

export type SettingSort = 'Title' | 'Author' | 'Date Added' | 'Last Accessed'
interface BookshelfSettings {
	Sort: SettingSort
}

export const useSettingStore = defineStore('settings', {
	state() {
		return <BookshelfSettings>{
			Sort: 'Title',
		}
	},

	getters: {
		sort_options: () => ['Title', 'Author', 'Date Added', 'Last Accessed'],
	},

	actions: {
		load_settings() {
			let settings = JSON.parse(localStorage.getItem('settings') || '{}')
			for (const [key, value] of Object.entries(settings)) {
				// @ts-ignore
				this[key] = value
			}
		},
		save_settings() {
			localStorage.setItem('settings', JSON.stringify(this.$state))
		},
	},
})
