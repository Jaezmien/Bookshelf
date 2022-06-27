export interface Bookmark {
	uuid: string
	chapterIndex: number
	elementIndex: number
}

let bookmarks: Bookmark[] | null = null
function get_store() {
	if (bookmarks !== null) return
	if (!localStorage.getItem('bookmark')) localStorage.setItem('bookmark', JSON.stringify([]))
	bookmarks = JSON.parse(localStorage.getItem('bookmark')!) as Bookmark[]
}

function create_bookmark(uuid: string, chapterIndex: number = 0, elementIndex: number = -1): Bookmark {
	return {
		uuid,
		chapterIndex,
		elementIndex,
	}
}

export function delete_bookmark(uuid: string) {
	get_store()

	const index = bookmarks!.findIndex((b) => b.uuid == uuid)
	if (index > -1) bookmarks!.splice(index, 1)

	localStorage.setItem('bookmark', JSON.stringify(bookmarks))
}

export function save_bookmark(uuid: string, chapterIndex: number, elementIndex: number) {
	get_store()

	const index = bookmarks!.findIndex((b) => b.uuid == uuid)
	if (index === -1) bookmarks!.push(create_bookmark(uuid, chapterIndex, elementIndex))
	else {
		bookmarks![index].chapterIndex = chapterIndex
		bookmarks![index].elementIndex = elementIndex
	}

	localStorage.setItem('bookmark', JSON.stringify(bookmarks))
}
export function load_bookmark(uuid: string) {
	get_store()

	const index = bookmarks!.findIndex((b) => b.uuid === uuid)
	if (index === -1) return create_bookmark(uuid)
	return bookmarks![index]
}
