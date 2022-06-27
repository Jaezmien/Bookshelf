<script setup lang="ts">
import { WatchStoryLastChild, WatchStoryProgress } from '@/composables/scrollwatcher';
import { FiMFormatType, FiMStoryType, FiMStoryFull } from '@/libs/FiMParser';
import { ref, computed, PropType, onMounted, watch, inject, onUnmounted, nextTick } from 'vue';
import { BookshelfChapterInfo } from '@/types';
import path from 'path';
import '@/components/CowLine/style.scss'
import CowLine from '@/components/CowLine'
import Modal from '@/components/Modal.vue';
import Info from './Info.vue';
import PageTransition from '@/transitions/PageTransition.vue';
import Navigation from './Navigation.vue';
import { Bookmark, delete_bookmark, save_bookmark } from '@/libs/Bookmark';
import { BookNotification } from '@/symbols';

const props = defineProps({
	filename: {
		type: String,
		requried: true,
		default: () => '',
	},
	story: {
		type: Object as PropType<FiMStoryType>,
		required: true
	},
	bookmark: {
		type: Object as PropType<Bookmark>,
		required: false,
	}
})
// const emits = defineEmits(['setBookmark'])

const currentChapter = ref(0)
const contentContainer = ref<HTMLElement>(document.createElement('div'))
const navContainer = ref<typeof Navigation | null>()
const create_notification = inject(BookNotification)!

const showChapterModal = ref(false) // Modal
const disableUserInput = ref(false) // So the UI doesn't mess up while its transitioning

// For the CSS
const pageTransition = ref('')
const showChapter = ref(true)
const isTransitioning = ref(false)

const chapters = computed(() => {
	if (props.story.Format === FiMFormatType.RAW) return undefined
	return Object.keys(props.story.Chapters)
})
const chapterInfo = computed((): BookshelfChapterInfo => {
	if (props.story.Format === FiMFormatType.RAW) {
		return {
			Name: undefined,
			Text: props.story.Text
		}
	}

	const chapterName = chapters.value![currentChapter.value]
	return {
		Name: chapterName,
		Text: props.story.Chapters[chapterName]
	}
})

const setChapterIndex = (index: number, onChapterSwap?: () => void) => {
	if (currentChapter.value === index) {
		onChapterSwap && onChapterSwap();
		return;
	}
	disableUserInput.value = true

	const navPosition = navContainer.value!.navPosition as HTMLElement
	const resetPosition = Math.round(navPosition.getBoundingClientRect().y) < 0

	const delta = index - currentChapter.value
	if (delta > 0) pageTransition.value = 'left'
	else pageTransition.value = 'right'

	// Fade out
	showChapter.value = false
	isTransitioning.value = true
	// Swap chapter
	setTimeout(() => {
		currentChapter.value = index
		if (resetPosition) navPosition.scrollIntoView()
		showChapter.value = true
		onChapterSwap && onChapterSwap()
	}, 250)
	// Fade in
	setTimeout(() => {
		disableUserInput.value = false
		isTransitioning.value = false
	}, 250 + 250);
}

// Reset story here
watch(() => props.story, () => {
	currentChapter.value = 0
	window.scrollTo({ top: 0, behavior: 'smooth' });
})

const loadedBookmark = ref(false)
onMounted(async () => {
	document.title = `${props.story.Format === FiMFormatType.RAW ? (path.basename(props.filename, path.extname(props.filename))) : props.story.Title} - Bookshelf`

	if (props.bookmark) {
		disableUserInput.value = true
		await (new Promise<void>((res, rej) => {
			setChapterIndex(props.bookmark!.chapterIndex, res)
		}));
		if (props.bookmark.elementIndex > -1) {
			await (new Promise<void>((res, rej) => {
				nextTick(() => {
					const el = contentContainer.value.children.item(props.bookmark!.elementIndex) as HTMLElement
					console.log(el);
					el.scrollIntoView()

					setTimeout(() => res(), 2000)
				})
			}));
		}
		disableUserInput.value = false
		loadedBookmark.value = true
	}
	else {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		setTimeout(() => {
			loadedBookmark.value = true
		}, 2000)
	}
})
onUnmounted(() => {
	document.title = 'Bookshelf'
})

const navStickyPadding = ref<number>(0)

// Bookmark
const bookmarkPosition = ref<number | null>(null)
if (props.bookmark) {
	if (props.bookmark.elementIndex > 0) {
		watch(currentChapter, (val) => {
			if (val !== props.bookmark!.chapterIndex) {
				bookmarkPosition.value = null
			}
			else {
				// what in the crisp fuck is this
				setTimeout(() => {
					const el = contentContainer.value.children.item(props.bookmark!.elementIndex) as HTMLElement
					bookmarkPosition.value = el.offsetTop
				}, 200)
			}
		}, { immediate: true })
	}

	const debounce = (await import('debounce')).default

	WatchStoryLastChild(contentContainer, debounce((el, i) => {
		if (!loadedBookmark.value) return
		if (el === null && i === null && currentChapter.value === 0) {
			delete_bookmark(props.bookmark!.uuid)
		}
		else {
			save_bookmark(props.bookmark!.uuid, currentChapter.value, i ?? -1)
		}
	}, 1000))
}
const { completion: chapterProgress } = WatchStoryProgress(contentContainer)
</script>

<template>
	<div id="story-container">
		<Info :story="story"
			  :filename="filename"></Info>

		<Navigation ref="navContainer"
					v-if="story.Format !== FiMFormatType.RAW"
					:filename="filename"
					:story="story"
					:chapters="chapters!"
					:currentChapter="currentChapter"
					:chapter-info="chapterInfo"
					:show-chapter="showChapter"
					:chapter-progress="chapterProgress"
					:is-transitioning="isTransitioning"
					@set-chapter-index="(i) => {
						if (disableUserInput) return;
						setChapterIndex(i);
					}"
					@show-chapter-modal="() => showChapterModal = true"
					@set-sticky="(val) => navStickyPadding = val || 0"></Navigation>

		<PageTransition :direction="pageTransition">
			<section id="story-content"
					 ref="contentContainer"
					 :style="{ '--bottom-padding': navStickyPadding + 'px' }"
					 v-show="showChapter">
				<cow-line v-for="text of chapterInfo.Text"
						  :content="text"
						  :config="undefined"></cow-line>
				<div id="story-bookmark"
					 v-if="bookmarkPosition !== null"
					 :style="{ '--position': bookmarkPosition + 'px' }"></div>
			</section>
		</PageTransition>
	</div>

	<Modal :active="showChapterModal"
		   @close="showChapterModal = false">
		<div id="chapter-selection">
			<p v-for="(name, index) of Object.keys((story as FiMStoryFull).Chapters)"
			   :class="{ current: index === currentChapter }"
			   @click="() => {
			   	if (currentChapter !== index) setChapterIndex(index)
			   	showChapterModal = false
			   }">
				{{ name }}
			</p>
		</div>
	</Modal>
</template>

<style lang="scss" scoped>
#story-container {
	z-index: 0;
	position: absolute;
}

#story-content {
	--bottom-padding: 0px;
	z-index: 10;

	padding-bottom: var(--bottom-padding);
	word-break: break-word;

	position: relative;

	#story-bookmark {
		--position: 0px;

		position: absolute;
		// top: var(--position);
		top: calc(var(--position) - 0.5rem);
		transform: translateY(-50%);
		border-radius: 9999px;
		left: 0;
		width: 100%;
		height: 4px;
		background-color: red;
	}
}

#chapter-selection {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	min-width: 40vw;
	max-height: 80vh;
	overflow-y: auto;

	p {
		text-align: center;
		margin: 0;

		padding: 1rem 2rem;
		transition: background 100ms ease-in-out;

		&:hover {
			background: transparentize(black, 0.8);
		}

		&.current {
			background: transparentize(white, 0.9);
		}
	}
}

// section {
// margin: 0 2rem;
// height: auto;
// }
</style>