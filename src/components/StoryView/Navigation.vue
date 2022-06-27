<script setup lang="ts">
import { FiMStoryType, FiMFormatType } from '@/libs/FiMParser';
import { BookshelfChapterInfo } from '@/types';
import { inject, onMounted, onUnmounted, PropType, ref, nextTick, computed, reactive, watch } from 'vue';
import FadeTransition from '@/transitions/FadeTransition.vue';
import FeatherIcon from '../FeatherIcon.vue';
import gsap from "gsap";

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
	chapters: {
		type: Array as PropType<string[]>,
		required: true
	},
	currentChapter: {
		type: Number,
		required: true
	},
	chapterInfo: {
		type: Object as PropType<BookshelfChapterInfo>,
		required: true,
	},
	showChapter: {
		type: Boolean,
		default: false,
	},
	chapterProgress: {
		type: Number,
		default: 0,
	},
	isTransitioning: {
		type: Boolean,
		default: false
	},
})
const emits = defineEmits(['setChapterIndex', 'showChapterModal', 'setSticky'])

const nav = ref<HTMLDivElement | null>(null)
const navPosition = ref<HTMLDivElement | null>(null)
const navHeight = computed(() => nav.value!.clientHeight)
defineExpose({
	navPosition,
	navHeight,
})

const isChapterInRange = (index: number) => {
	return index > -1 && index < props.chapters.length
}

// Fancy CSS
const storyCompletion = computed(() => {
	return (props.currentChapter / props.chapters.length) * 100
});
const individualChapterCount = computed(() => {
	return (1 / props.chapters.length) * 100
})
const overallStoryCompletion = computed(() => {
	return storyCompletion.value + ((props.chapterProgress / 100) * individualChapterCount.value)
})
const tweenedStoryCompletion = reactive({
	value: 0,
})
watch(() => overallStoryCompletion.value, (v) => {
	if (props.isTransitioning) {
		tweenedStoryCompletion.value = v
	}
	else {
		gsap.to(tweenedStoryCompletion, { duration: 0.5, value: v })
	}
})

// Scrolling
const navSticky = ref(false)
const navPadding = ref<HTMLDivElement | null>(null)
function on_scroll() {
	if (Math.round(navPosition.value!.getBoundingClientRect().y) < 0) {
		navSticky.value = true
		emits('setSticky', navHeight.value)
		nextTick(() => navPadding.value!.style.height = navHeight.value + "px")
	}
	else {
		navSticky.value = false
		emits('setSticky', undefined)
	}
}
onMounted(() => {
	document.addEventListener('scroll', on_scroll)
	on_scroll()
})
onUnmounted(() => {
	document.removeEventListener('scroll', on_scroll)
})
</script>

<template>
	<div ref="navPosition"></div> <!-- what -->

	<div ref="navPadding"
		 v-if="navSticky"></div>

	<nav ref="nav"
		 :style="{ '--completion': tweenedStoryCompletion.value + '%' }"
		 :class="{ 'sticky': navSticky, 'no-sticky': chapters!.length === 1 }">
		<FadeTransition>
			<div v-show="isChapterInRange(currentChapter - 1)"
				 id="chapter-prev"
				 @click="$emit('setChapterIndex', currentChapter - 1)">
				<FeatherIcon :icon="'chevron-left'"></FeatherIcon>
			</div>
		</FadeTransition>

		<FadeTransition>
			<div id="chapter-name"
				 v-show="showChapter"
				 @dblclick="$emit('showChapterModal')">
				<h1>{{ chapterInfo.Name }}</h1>
			</div>
		</FadeTransition>

		<FadeTransition>
			<div v-show="isChapterInRange(currentChapter + 1)"
				 id="chapter-next"
				 @click="$emit('setChapterIndex', currentChapter + 1)">
				<FeatherIcon :icon="'chevron-right'"></FeatherIcon>
			</div>
		</FadeTransition>
	</nav>
</template>

<style lang="scss" scoped>
$BACKGROUND: #1f2229;

nav {
	--completion: 0%;
	$PROGRESS_DARK: darken($BACKGROUND, 5%);
	$PROGRESS_LIGHT: lighten($BACKGROUND, 5%);

	width: 100%;
	z-index: 20;

	background: linear-gradient(90deg, $PROGRESS_LIGHT var(--completion), $PROGRESS_DARK var(--completion));

	display: grid;
	grid-template-areas: "previous name next";
	grid-template-rows: auto;
	grid-template-columns: 1fr 4fr 1fr;
	place-items: center;


	&:not(.no-sticky) {
		&.sticky {
			position: fixed;
			bottom: 0;

			border-top-left-radius: 0.5rem;
			border-top-right-radius: 0.5rem;
		}
	}

	#chapter-prev {
		grid-area: previous;
	}

	#chapter-name {
		grid-area: name;
		width: 100%;
		height: 100%;

		display: grid;
		place-items: center;

		h1 {
			padding: 0 1rem;
			text-align: center;
		}
	}

	#chapter-next {
		grid-area: next;
	}

	#chapter-prev,
	#chapter-next {
		width: 100%;
		height: 100%;

		display: grid;
		place-items: center;

		cursor: pointer;

		transition: all 250ms ease-in-out;

		&:hover {
			background: transparentize(white, 0.9);
		}
	}
}
</style>