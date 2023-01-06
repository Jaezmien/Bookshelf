import { Buffer } from 'buffer'
import { FIMChapter, FIMChapterNode, FIMFormat, FIMStory } from 'fimfic-parser'
import { nanoid } from 'nanoid'
import { MD5 } from 'object-hash'
import { defineStore } from 'pinia'
import { useDatabaseStore } from './database'

interface IFileStore {
	stories: LocalStorageStory[]
}

interface LocalStorageStoryBase {
	ID: string
	Filename: string
	Created: number
	LastAccessed: number
}

export type LocalStorageStory =
	| ({
			Format: Extract<FIMFormat, 'NONE'>
	  } & LocalStorageStoryBase)
	| ({
			Format: Exclude<FIMFormat, 'NONE'>
			Title: string
			Author: string
	  } & LocalStorageStoryBase)

export interface IndexedDBStory {
	ID: string
	Content: string[] | FIMChapter[]
	ContentHash: string
}

export interface IndexedDBImage {
	Url: string
	Data: string
}

export const useFileStore = defineStore('files', {
	state() {
		return <IFileStore>{
			stories: [],
		}
	},

	getters: {
		cached_image: () => {
			return (url: string) => {
				return new Promise<string>((res, rej) => {
					const databaseStore = useDatabaseStore()
					if (!databaseStore.db) return res(url)

					const storyStore = databaseStore.db.transaction(['images'], 'readonly').objectStore('images')
					const req = storyStore.get(url) as IDBRequest<IndexedDBImage>

					req.onerror = (e) => rej(e)
					req.onsuccess = () => res(req.result.Data || url)
				})
			}
		},
	},

	actions: {
		load_stories() {
			if (!localStorage.getItem('stories')) localStorage.setItem('stories', JSON.stringify([]))
			this.stories = JSON.parse(localStorage.getItem('stories') || '[]')
		},

		load_file(uuid: string) {
			return new Promise<[LocalStorageStory, IndexedDBStory]>((res, rej) => {
				const databaseStore = useDatabaseStore()
				if (!databaseStore.db) return rej('fileStore.load_file was called while the database is null.')

				const index = this.stories.findIndex((story) => story.ID === uuid)
				if (index === -1) return rej(`The story uuid ${uuid} cannot be found.`)

				const storyStore = databaseStore.db.transaction(['stories'], 'readonly').objectStore('stories')
				const req = storyStore.get(uuid)

				req.onerror = (e) => rej(e)
				req.onsuccess = () => {
					this.stories[index].LastAccessed = Date.now()
					localStorage.setItem('stories', JSON.stringify(this.stories)) // Update last accessed

					res([this.stories[index], req.result])
				}
			})
		},

		/** This is for loading the **Story Information**, story content should be done using `load_file()`  */
		load_files() {
			return JSON.parse(localStorage.getItem('stories') || '[]') as LocalStorageStory[]
		},

		generate_data_for_story(filename: string, story: FIMStory): [LocalStorageStory, IndexedDBStory] {
			const databaseStore = useDatabaseStore()
			if (!databaseStore.db) throw 'fileStore.generate_data_for_story was called while the database is null.'

			const uuid = nanoid()
			const timestamp = Date.now()

			let local_storage: LocalStorageStory

			if (story.Format === 'NONE') {
				local_storage = {
					ID: uuid,
					Filename: filename,
					Created: timestamp,
					LastAccessed: timestamp,
					Format: story.Format,
				}
			} else {
				local_storage = {
					ID: uuid,
					Filename: filename,
					Created: timestamp,
					LastAccessed: timestamp,
					Format: story.Format,
					Title: story.Title,
					Author: story.Author,
				}
			}

			return [
				local_storage,
				{
					ID: uuid,
					Content: story.Content,
					ContentHash: MD5(story.Content),
				} as IndexedDBStory,
			]
		},
		convert_local_idb_to_fimstory(local: LocalStorageStory, idb: IndexedDBStory): FIMStory {
			if (local.Format === 'NONE') {
				return {
					Format: local.Format,
					Content: idb.Content as string[],
				}
			} else {
				return {
					Format: local.Format,
					Title: local.Title,
					Author: local.Author,
					Content: idb.Content as FIMChapter[],
				}
			}
		},
		get_html_images(chapter: FIMChapter) {
			const nodes = chapter.Contents.filter((c) => typeof c !== 'string')

			let urls: string[] = []
			while (nodes.length) {
				const node = nodes.shift()
				if (!node) continue

				const htmlNode = node as FIMChapterNode

				if (htmlNode.tag === 'img' && htmlNode.attributes?.src) {
					urls.push(htmlNode.attributes.src)
				}

				if (htmlNode.children) {
					nodes.push(...htmlNode.children.filter((c) => typeof c !== 'string'))
				}
			}

			return urls
		},

		add_file(filename: string, story: FIMStory) {
			return new Promise<[string, boolean]>(async (res, rej) => {
				const databaseStore = useDatabaseStore()
				if (!databaseStore.db) return rej('fileStore.add_file was called while the database is null.')

				let [local_info, db_content] = this.generate_data_for_story(filename, story)

				await this.cache_story_images(story).catch(console.error)

				const i = this.stories.findIndex((data) => data.ID === local_info.ID)
				if (i > -1) {
					const [, _db_content] = await this.load_file(local_info.ID)
					if (_db_content.ContentHash === db_content.ContentHash) return res([local_info.ID, true])

					const storyStore = databaseStore.db.transaction(['stories'], 'readwrite').objectStore('stories')
					const req = storyStore.put(db_content) // Update

					req.onsuccess = (e) => res([local_info.ID, true])
					req.onerror = rej
				} else {
					this.stories.unshift(local_info)
					localStorage.setItem('stories', JSON.stringify(this.stories))

					const dbTransc = databaseStore.db.transaction(['stories'], 'readwrite') // Create a transaction to the database
					dbTransc.onerror = rej
					// dbTransc.oncomplete = (e) => { }

					const storyStore = dbTransc.objectStore('stories')
					const transReq = storyStore.add(db_content) // Request a transaction to the objectstore
					transReq.onsuccess = (e) => res([local_info.ID, false])
					transReq.onerror = rej
				}
			})
		},
		remove_file(uuid: string) {
			return new Promise<void>((res, rej) => {
				const databaseStore = useDatabaseStore()
				if (!databaseStore.db) return rej('fileStore.remove_file was called while the database is null.')

				const storyStore = databaseStore.db.transaction(['stories'], 'readwrite').objectStore('stories')
				const req = storyStore.delete(uuid)

				req.onerror = (e) => rej(e)
				req.onsuccess = (e) => {
					this.stories = this.stories.filter((story) => story.ID !== uuid)
					localStorage.setItem('stories', JSON.stringify(this.stories))
					res()
				}
			})
		},

		cache_story_images(story: FIMStory) {
			return new Promise<void>(async (res, rej) => {
				if (story.Format === 'NONE') return res()

				for (const chapter of story.Content) {
					const nodes = chapter.Contents.filter((c) => typeof c !== 'string')

					for (const url of this.get_html_images(chapter)) {
						await this.cache_image(url).catch(rej)
					}
				}

				res()
			})
		},
		cache_image(url: string) {
			return new Promise<void>((res, rej) => {
				const databaseStore = useDatabaseStore()
				if (!databaseStore.db) return res()

				const existsRequest = databaseStore
					.db!.transaction(['images'], 'readwrite')
					.objectStore('images')
					.count(url)

				existsRequest.onsuccess = () => {
					if (existsRequest.result) return res()

					let h: Headers
					fetch(url)
						.then((r) => {
							h = r.headers
							return r.arrayBuffer()
						})
						.then((b) => {
							const image: IndexedDBImage = {
								Url: url,
								Data: `data:${h.get('content-type')};charset=utf-8;base64,${Buffer.from(b).toString(
									'base64'
								)}`,
							}

							const createRequest = databaseStore
								.db!.transaction(['images'], 'readwrite')
								.objectStore('images')
								.add(image)
							createRequest.onsuccess = () => res()
							createRequest.onerror = rej
						})
						.catch(rej)
				}
				existsRequest.onerror = rej
			})
		},
	},
})
