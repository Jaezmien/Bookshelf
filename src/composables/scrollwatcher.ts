import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export const WatchStoryLastChild = (
	container: Ref<HTMLElement>,
	callback: (el: HTMLElement | null, index: number | null) => void
) => {
	function on_scroll(event: Event) {
		if (container.value.getBoundingClientRect().y > 0) return callback(null, null)

		const children = container.value.children
		for (let i = 0; i < children.length; i++) {
			const child = children.item(i) as HTMLElement
			if (!child) continue

			const rect = child.getBoundingClientRect()
			if (rect.y <= 0 && rect.y + rect.height >= 0) {
				callback(child, i)
				break
			}
		}
	}

	onMounted(() => {
		document.addEventListener('scroll', on_scroll)
	})
	onUnmounted(() => {
		document.removeEventListener('scroll', on_scroll)
	})
}

export const WatchStoryProgress = (container: Ref<HTMLElement>) => {
	const completion = ref(0)

	function on_scroll(event: Event) {
		if (container.value.getBoundingClientRect().y > 0) {
			completion.value = 0
			return
		}

		const rect = container.value.getBoundingClientRect()

		const yProgress = Math.abs(rect.y)
		const yAmount = container.value.clientHeight - window.innerHeight

		completion.value = Math.round((yProgress / yAmount) * 100)
	}

	onMounted(() => {
		document.addEventListener('scroll', on_scroll)
	})
	onUnmounted(() => {
		document.removeEventListener('scroll', on_scroll)
	})

	return { completion }
}
