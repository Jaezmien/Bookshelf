import { InjectionKey } from 'vue'
import type { Ref } from 'vue'
import { BookNotificationType, BookshelfSettings } from './types'

export const BookNotification: InjectionKey<BookNotificationType> = Symbol('book.notification')
export const BookSettings: InjectionKey<BookshelfSettings> = Symbol('book.settings')
export const SaveBookSettings: InjectionKey<() => void> = Symbol('book.settings.save')
