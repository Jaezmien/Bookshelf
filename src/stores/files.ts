import { FiMFormatType, FiMStoryChapters, FiMStoryType } from '@/libs/FiMParser'
import { defineStore } from 'pinia'
import { MD5 } from 'object-hash' // because crypto-browserify has not been updated, and a DefinitelyTyped repo does not exist. oof.

const FORCE_DISABLE_INDEXEDDB = false
const BOOKSHELF_DB_VERSION = 1

interface IFileStore {
	__failed_to_open_db: boolean
	db: IDBDatabase | null
	stories: LSData[]
}

interface LSDataPartial {
	Format: FiMFormatType.RAW
	Filename: string
	StoryUUID: string
	Timestamp: number
	LastAccessed: number
}
interface LSDataFull {
	Format: Exclude<FiMFormatType, FiMFormatType.RAW>
	Filename: string
	StoryUUID: string
	Timestamp: number
	Title: string
	Author: string
	LastAccessed: number
}
export type LSData = LSDataPartial | LSDataFull

export interface IDBStory {
	StoryUUID: string
	Content: string[] | FiMStoryChapters | null
	ContentHash: string
}

export const useFileStore = defineStore('files', {
	state() {
		return <IFileStore>{
			__failed_to_open_db: false,
			db: null,

			stories: [],
		}
	},

	getters: {
		browser_supports_indexeddb: (state) => {
			if (FORCE_DISABLE_INDEXEDDB) return false
			if (state.__failed_to_open_db) return false
			return !!window.indexedDB
		},
		idb_loaded: (state) => {
			return !!state.db
		},
	},

	actions: {
		open_database() {
			return new Promise((res, rej) => {
				if (this.db) return res(this.db)

				if (!localStorage.getItem('stories')) localStorage.setItem('stories', JSON.stringify([]))
				this.stories = JSON.parse(localStorage.getItem('stories') || '[]')

				const dbreq = window.indexedDB.open('bookshelf', BOOKSHELF_DB_VERSION)
				dbreq.onerror = (e: Event) => rej('Error while loading IDB.')
				dbreq.onsuccess = (e: Event) => {
					this.db = dbreq.result
					res(dbreq.result)
				}
				dbreq.onupgradeneeded = (e: IDBVersionChangeEvent) => {
					// @ts-ignore
					const db = e.target!.result! as IDBDatabase // i have no idea why e.target is result, does IDBVersionChangeEvent not implement it???

					const stories = db.createObjectStore('stories', { keyPath: 'StoryUUID' })
					stories.createIndex('Content', 'Content', { unique: false })
					stories.createIndex('ContentHash', 'ContentHash', { unique: false })
				}
			})
		},

		async load_file(uuid: string) {
			return new Promise<[LSData, IDBStory]>((res, rej) => {
				const storyStore = this.db!.transaction(['stories'], 'readonly').objectStore('stories')
				const req = storyStore.get(uuid)

				req.onerror = (e) => rej(e)
				req.onsuccess = (e) => {
					const index = this.stories.findIndex((story) => story.StoryUUID === uuid)
					this.stories[index].LastAccessed = Date.now()
					localStorage.setItem('stories', JSON.stringify(this.stories)) // Update last accessed

					res([this.stories[index], req.result])
				}
			})
		},
		/** This is for loading the **Story Information**, story content should be done using `load_file()`  */
		async load_files() {
			if (!this.idb_loaded) throw 'Tried to load files while IDB has not been loaded yet.'
			return JSON.parse(localStorage.getItem('stories') || '[]') as LSData[]
		},
		add_file(filename: string, FiMStory: FiMStoryType) {
			return new Promise<string>((res, rej) => {
				if (!this.idb_loaded) rej('Tried to add files while IDB has not been loaded yet.')

				let local: LSData
				let idb: IDBStory
				const timestamp = Date.now()

				if (FiMStory.Format === FiMFormatType.RAW) {
					const uuid = MD5(filename)

					local = {
						Format: FiMStory.Format,
						Filename: filename,
						StoryUUID: uuid,
						Timestamp: timestamp,
						LastAccessed: timestamp,
					} as LSDataPartial
					idb = {
						StoryUUID: uuid,
						Content: FiMStory.Text,
						ContentHash: MD5(FiMStory.Text),
					}
				} else {
					const uuid = MD5([FiMStory.Title, FiMStory.Author])

					local = {
						Format: FiMStory.Format,
						Filename: filename,
						Title: FiMStory.Title,
						Author: FiMStory.Author,
						StoryUUID: uuid,
						Timestamp: timestamp,
						LastAccessed: timestamp,
					} as LSDataFull
					idb = {
						StoryUUID: uuid,
						Content: FiMStory.Chapters,
						ContentHash: MD5(FiMStory.Chapters),
					}
				}

				const i = this.stories.findIndex((data) => data.StoryUUID === local.StoryUUID)
				if (i > -1) {
					this.load_file(local.StoryUUID)
						.then(([, _idb]) => {
							if (_idb.ContentHash === idb.ContentHash) return res(local.StoryUUID)

							const storyStore = this.db!.transaction(['stories'], 'readwrite').objectStore('stories')
							const req = storyStore.put(idb) // Update

							req.onsuccess = (e) => res(local.StoryUUID)
							req.onerror = (e) => rej(e)
						})
						.catch(rej)
				} else {
					// Add index and content
					this.stories.unshift(local)
					localStorage.setItem('stories', JSON.stringify(this.stories))

					const dbTransc = this.db!.transaction(['stories'], 'readwrite') // Create a transaction to the database
					dbTransc.onerror = (e) => rej(e)
					dbTransc.oncomplete = (e) => {
						// console.log('Transaction complete!')
					}

					const storyStore = dbTransc.objectStore('stories')
					const transReq = storyStore.add(idb) // Request a transaction to the objectstore
					transReq.onsuccess = (e) => res(local.StoryUUID)
					transReq.onerror = (e) => rej(e)
				}
			})
		},
		remove_file(uuid: string) {
			return new Promise<void>((res, rej) => {
				const storyStore = this.db!.transaction(['stories'], 'readwrite').objectStore('stories')
				const req = storyStore.delete(uuid)

				req.onerror = (e) => rej(e)
				req.onsuccess = (e) => {
					this.stories = this.stories.filter((story) => story.StoryUUID !== uuid)
					localStorage.setItem('stories', JSON.stringify(this.stories))
					res()
				}
			})
		},
	},
})
