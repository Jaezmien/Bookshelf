import { FIMChapterContents } from 'fimfic-parser'

export type BookNotificationType = (msg: string, type?: number) => void
export type BookImageLoadedType = (success: boolean) => void

export interface BookshelfStoryConfig {
	imageFormatFile: string
	imageFormatText: string
	imageGIFIndex?: number[]
}

export interface BookshelfChapterInfo {
	Name?: string
	Text: FIMChapterContents
}

export type BookshelfSort = 'Title' | 'Author' | 'Date Added' | 'Last Accessed'
export interface BookshelfSettings {
	Sort: BookshelfSort
}
