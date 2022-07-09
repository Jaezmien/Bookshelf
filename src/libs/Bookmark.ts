export interface Bookmark {
	uuid: string
	progress: number
	chapterIndex: number
	elementIndex: number
}

let bookmarks: Bookmark[] | null = null
function get_store() {
	if (bookmarks !== null) return bookmarks
	if (!localStorage.getItem('bookmark')) {
		bookmarks = []
		set_store()
	}
	bookmarks = JSON.parse(localStorage.getItem('bookmark')!) as Bookmark[]

	return bookmarks
}
function set_store() {
	localStorage.setItem('bookmark', JSON.stringify(bookmarks))
}

function create_bookmark(
	uuid: string,
	progress: number = 0,
	chapterIndex: number = 0,
	elementIndex: number = -1
): Bookmark {
	return {
		uuid,
		progress,
		chapterIndex,
		elementIndex,
	}
}

export function delete_bookmark(uuid: string) {
	const mark = get_store()

	const index = mark.findIndex((b) => b.uuid == uuid)
	if (index > -1) mark.splice(index, 1)

	set_store()
}

export function save_bookmark(uuid: string, progress: number, chapterIndex: number, elementIndex: number) {
	const mark = get_store()

	const index = mark.findIndex((b) => b.uuid == uuid)
	if (index === -1) mark.push(create_bookmark(uuid, progress, chapterIndex, elementIndex))
	else {
		mark[index].progress = progress
		mark[index].chapterIndex = chapterIndex
		mark[index].elementIndex = elementIndex
	}

	set_store()
}
export function load_bookmark(uuid: string) {
	const mark = get_store()

	const index = mark.findIndex((b) => b.uuid === uuid)
	if (index === -1) return create_bookmark(uuid)
	return mark[index]
}
