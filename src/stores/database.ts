import { defineStore } from 'pinia'

interface DatabaseStore {
	DISABLED: boolean
	DB_VERSION: number
	db: IDBDatabase | null
}

export const useDatabaseStore = defineStore('database', {
	state() {
		return <DatabaseStore>{
			DISABLED: false,

			DB_VERSION: 2,

			db: null,
		}
	},

	actions: {
		initialize_db() {
			return new Promise((res, rej) => {
				if (!indexedDB || this.DISABLED) {
					this.DISABLED = true
					return res(null)
				}

				if (this.db) return res(this.db)

				const dbreq = window.indexedDB.open('bookshelf', this.DB_VERSION)
				dbreq.onerror = (e: Event) => rej(e)
				dbreq.onsuccess = (e: Event) => {
					this.db = dbreq.result
					res(dbreq.result)
				}
				dbreq.onupgradeneeded = (e: IDBVersionChangeEvent) => {
					// @ts-ignore
					const db = e.target!.result! as IDBDatabase // i have no idea why e.target is result, does IDBVersionChangeEvent not implement it???

					const stories = db.createObjectStore('stories', { keyPath: 'ID' })
					stories.createIndex('Content', 'Content', { unique: false })
					stories.createIndex('ContentHash', 'ContentHash', { unique: true })

					const images = db.createObjectStore('images', { keyPath: 'Url' })
					images.createIndex('Data', 'Data', { unique: true })
				}
			})
		},
	},
})
