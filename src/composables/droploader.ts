import type { Ref } from 'vue'
import { onMounted, onUnmounted, ref } from 'vue'

export type FileReaderResult = string | ArrayBuffer | null | undefined
type DropLoaderCallbackFail = (error: any) => void
type DropLoaderCallbackSuccess = (files: DropLoaderResult[]) => void
export type DropLoaderResult = [string, File]

export function load_file_as_text(file: File) {
	return new Promise<ProgressEvent<FileReader>>((res, rej) => {
		const reader = new FileReader()

		reader.onload = res
		reader.onerror = rej

		reader.readAsText(file)
	})
}

async function load_files(files: FileList | undefined): Promise<DropLoaderResult[]> {
	if (!files) throw 'Invalid file!'

	const result: [string, File][] = []
	for (let i = 0; i < files.length; i++) {
		const file = files.item(i)
		if (!file) throw 'Invalid file'
		if (!['text/plain', 'text/html'].includes(file.type)) throw 'Invalid file type: Expected a .txt or .html file.'
		result.push([file.name, file])
	}
	return result
}

export const CreateDropLoader = (
	container: Ref<HTMLDivElement>,
	callback: DropLoaderCallbackSuccess,
	error?: DropLoaderCallbackFail
) => {
	const isUserDragging = ref<Boolean>(false)

	function start_drag(event: DragEvent) {
		if (!event.dataTransfer) return
		if (!Object.values(event.dataTransfer.items).find((d) => d.kind === 'file')) return
		event.preventDefault()
		isUserDragging.value = true
	}
	function leave_drag(event: DragEvent) {
		event.preventDefault()
		isUserDragging.value = false
	}
	async function drop_drag(event: DragEvent) {
		if (!isUserDragging.value) return
		event.preventDefault()
		isUserDragging.value = false

		try {
			const result = await load_files(event.dataTransfer?.files)
			callback(result)
		} catch (err) {
			error && error(err)
		}
	}

	onMounted(() => {
		container.value.addEventListener('dragover', start_drag)
		container.value.addEventListener('dragleave', leave_drag)
		container.value.addEventListener('drop', drop_drag)
	})
	onUnmounted(() => {
		if (container.value) {
			container.value.removeEventListener('dragover', start_drag)
			container.value.removeEventListener('dragleave', leave_drag)
			container.value.removeEventListener('drop', drop_drag)
		}
	})

	return { isUserDragging }
}

export const CreateButtonLoader = (
	buttonEl: Ref<HTMLElement>,
	fileEl: Ref<HTMLInputElement>,
	callback: DropLoaderCallbackSuccess,
	error?: DropLoaderCallbackFail
) => {
	function btn_click(event: MouseEvent) {
		event.preventDefault()
		fileEl.value.click()
	}
	async function input_change(event: Event) {
		event.preventDefault()

		try {
			const result = await load_files((event.target! as HTMLInputElement).files || undefined)
			callback(result)
		} catch (err) {
			error && error(err)
		}
	}

	onMounted(() => {
		buttonEl.value.addEventListener('click', btn_click)
		fileEl.value.addEventListener('change', input_change)
	})
	onUnmounted(() => {
		if (buttonEl.value) {
			buttonEl.value.removeEventListener('click', btn_click)
		}
		if (fileEl.value) {
			fileEl.value.removeEventListener('change', input_change)
		}
	})
}
