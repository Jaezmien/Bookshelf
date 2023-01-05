<script setup lang="ts">
import CowLine from '@/components/CowLine';
import '@/components/CowLine/style.scss';
import Modal from '@/components/Modal.vue';
import { WatchChapterProgress, WatchStoryLastChild } from '@/composables/scrollwatcher';
import { WatchStoryProgress } from '@/composables/storyprogress';
import { Bookmark, delete_bookmark, save_bookmark } from '@/libs/Bookmark';
import { useFileStore } from '@/stores/files';
import { BookNotification } from '@/symbols';
import PageTransition from '@/transitions/PageTransition.vue';
import { BookshelfChapterInfo } from '@/types';
import debounce from "debounce";
import { FIMStory } from 'fimfic-parser';
import path from 'path';
import { computed, inject, nextTick, onMounted, onUnmounted, PropType, provide, ref, watch } from 'vue';
import Info from './Info.vue';
import Navigation from './Navigation.vue';

const props = defineProps({
	filename: {
		type: String,
		requried: true,
		default: () => '',
	},
	story: {
		type: Object as PropType<FIMStory>,
		required: true
	},
	bookmark: {
		type: Object as PropType<Bookmark>,
		required: false,
	}
})
// const emits = defineEmits(['setBookmark'])

const fileStore = useFileStore()
const currentChapter = ref(0)
const contentContainer = ref<HTMLElement>(document.createElement('div'))
const navContainer = ref<typeof Navigation | null>()
const create_notification = inject(BookNotification)!

const loadedImages = ref(0);
const detectedImages = ref(0);

const showChapterModal = ref(false) // Modal
const disableUserInput = ref(false) // So the UI doesn't mess up while its transitioning

// For the CSS
const pageTransition = ref('')
const showChapter = ref(true)
const isTransitioning = ref(false)

const chapters = computed(() => {
	if (props.story.Format === 'NONE') return undefined
	return props.story.Content.map(c => c.Title)
})
const chapterInfo = computed((): BookshelfChapterInfo => {
	if (props.story.Format === 'NONE') {
		return {
			Name: undefined,
			Text: props.story.Content
		}
	}

	return {
		Name: props.story.Content[currentChapter.value].Title,
		Text: props.story.Content[currentChapter.value].Contents
	}
})

const setChapterIndex = (index: number, onChapterSwap?: () => void) => {
	if (currentChapter.value === index) {
		detectChapterImages(currentChapter.value);
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
		detectChapterImages(currentChapter.value);
		onChapterSwap && onChapterSwap()
	}, 250)
	// Fade in
	setTimeout(() => {
		disableUserInput.value = false
		isTransitioning.value = false
	}, 250 + 250);
}

// Required to load images immediately due to bookmark positioning
const detectChapterImages = (index: number) => {
	loadedImages.value = 0;
	if (props.story.Format !== 'HTML') return;

	detectedImages.value = fileStore.get_html_images(props.story.Content[index]).length;
}
const allImagesHaveLoaded = computed(() => {
	return props.story.Format === 'HTML' ? loadedImages.value === detectedImages.value : true
})
provide('imageHasLoaded', () => { loadedImages.value++ })

// Reset story here
watch(() => props.story, () => {
	currentChapter.value = 0
	window.scrollTo({ top: 0, behavior: 'smooth' });
	loadedImages.value = 0;
	detectChapterImages(currentChapter.value);
})

const loadedBookmark = ref(false)
onMounted(async () => {
	document.title = `${props.story.Format === 'NONE' ? (path.basename(props.filename, path.extname(props.filename))) : props.story.Title} - Bookshelf`

	if (props.bookmark) {
		disableUserInput.value = true
		await (new Promise<void>((res, rej) => {
			setChapterIndex(props.bookmark!.chapterIndex, res)
		}));
		await (new Promise<void>((res, rej) => {
			if (props.bookmark && props.bookmark.elementIndex <= 0) return res();

			nextTick(() => {
				const el = contentContainer.value.children.item(props.bookmark!.elementIndex) as HTMLElement
				el.scrollIntoView()

				setTimeout(() => res(), 2000)
			})
		}));
		disableUserInput.value = false
		loadedBookmark.value = true
	}
	else {
		detectChapterImages(currentChapter.value);

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
const bookmarkIndicator = ref<HTMLDivElement>(document.createElement("div"))
const { completion: chapterProgress } = WatchChapterProgress(contentContainer)
const storyProgress = WatchStoryProgress(chapters!, currentChapter, chapterProgress, isTransitioning)
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

	WatchStoryLastChild(contentContainer, debounce((el, i) => {
		if (!loadedBookmark.value) return
		if (!allImagesHaveLoaded.value) return;

		if (el === null && i === null && currentChapter.value === 0) {
			delete_bookmark(props.bookmark!.uuid)
		}
		else {
			save_bookmark(props.bookmark!.uuid, storyProgress.value, currentChapter.value, i ?? -1)
		}

		if (bookmarkIndicator.value) {
			bookmarkIndicator.value.classList.remove('active')
			setTimeout(() => {
				bookmarkIndicator.value.classList.add('active')
			}, 1);
		}
	}, 1000))
}
</script>

<template>
	<div id="story-container">
		<Info :story="story"
			  :filename="filename"></Info>

		<Navigation ref="navContainer"
					v-if="story.Format !== 'NONE'"
					:filename="filename"
					:story="story"
					:chapters="chapters!"
					:currentChapter="currentChapter"
					:chapter-info="chapterInfo"
					:show-chapter="showChapter"
					:story-progress="storyProgress"
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
			<p v-for="(name, index) of chapters"
			   :class="{ current: index === currentChapter }"
			   @click="() => {
			   	if (currentChapter !== index) setChapterIndex(index)
			   	showChapterModal = false
			   }"
			   v-html="name">
			</p>
		</div>
	</Modal>

	<div id="bookmark-indicator"
		 ref="bookmarkIndicator"></div>
</template>

<style lang="scss" scoped>
#story-container {
	z-index: 0;
	position: absolute;
	overflow-x: hidden;
}

#story-content {
	--bottom-padding: 0px;
	z-index: 10;

	padding-bottom: var(--bottom-padding);
	word-break: break-word;

	position: relative;

	> :not(#story-bookmark) {
		margin-left: 1.5rem;
		margin-right: 1.5rem;
	}

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

	user-select: none;

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

#bookmark-indicator {
	position: fixed;
	top: 0;
	right: 0;
	width: 1rem;
	height: 1rem;
	border-top: 1rem solid green;
	border-left: 1rem solid transparent;

	&.active {
		animation-name: pop;
		animation-duration: 500ms;
		animation-timing-function: ease-out;
		animation-fill-mode: forwards;
	}

	opacity: 0%;
}

@keyframes pop {
	0% {
		opacity: 100%;
	}

	100% {
		opacity: 0%;
	}
}
</style>