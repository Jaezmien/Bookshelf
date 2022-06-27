import { FiMStoryChapter } from '@/libs/FiMParser'

export type BookNotificationType = (msg: string, type?: number) => void

export interface BookshelfStoryConfig {
	imageFormatFile: string
	imageFormatText: string
	imageGIFIndex?: number[]
}

export interface BookshelfChapterInfo {
	Name?: string
	Text: string[] | FiMStoryChapter
}

export type BookshelfSort = 'Title' | 'Author' | 'Date Added' | 'Last Accessed'
export interface BookshelfSettings {
	Sort: BookshelfSort
}
