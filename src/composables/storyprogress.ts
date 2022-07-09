import { ref, computed, reactive, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import gsap from 'gsap'

export const WatchStoryProgress = (
	chapters: ComputedRef<string[] | undefined>,
	currentChapter: Ref<number>,
	chapterProgress: Ref<number>,
	transitioning: Ref<boolean>
) => {
	const tweenedStoryCompletion = ref(0)

	const storyCompletion = computed(() => {
		if (chapters.value === undefined) return 0
		return (currentChapter.value / chapters.value!.length) * 100
	})
	const individualChapterCount = computed(() => {
		if (chapters.value === undefined) return 0
		return (1 / chapters.value!.length) * 100
	})
	const overallStoryCompletion = computed(() => {
		if (chapters.value === undefined) return 0
		return storyCompletion.value + (chapterProgress.value / 100) * individualChapterCount.value
	})

	const gsapTemp = reactive({ value: 0 })
	watch(
		() => gsapTemp.value,
		(v) => (tweenedStoryCompletion.value = v)
	)
	watch(
		() => overallStoryCompletion.value,
		(v) => {
			if (transitioning.value) {
				tweenedStoryCompletion.value = v
			} else {
				gsap.to(gsapTemp, { duration: 0.25, value: v })
			}
		}
	)

	return tweenedStoryCompletion
}
