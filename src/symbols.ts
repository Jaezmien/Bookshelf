import { InjectionKey } from 'vue'
import { BookImageLoadedType, BookNotificationType, BookshelfSettings } from './types'

export const BookNotification: InjectionKey<BookNotificationType> = Symbol('book.notification')
export const BookSettings: InjectionKey<BookshelfSettings> = Symbol('book.settings')
export const SaveBookSettings: InjectionKey<() => void> = Symbol('book.settings.save')
export const BookImageLoaded: InjectionKey<BookImageLoadedType> = Symbol('book.image.loaded')
