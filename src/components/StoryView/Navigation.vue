<script setup lang="ts">
import { FiMStoryType } from '@/libs/FiMParser';
import { BookshelfChapterInfo } from '@/types';
import { onMounted, onUnmounted, PropType, ref, nextTick, computed, reactive, watch } from 'vue';
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
	storyProgress: {
		type: Number,
		default: 0,
	}
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
		 :style="{ '--completion': storyProgress + '%' }"
		 :class="{ 'sticky': navSticky }">
		<FadeTransition>
			<div v-show="isChapterInRange(currentChapter - 1)"
				 id="chapter-prev"
				 @click="$emit('setChapterIndex', currentChapter - 1)">
				<FeatherIcon :icon="'chevron-left'"></FeatherIcon>
			</div>
		</FadeTransition>

		<FadeTransition>
			<div id="chapter-info"
				 v-show="showChapter">
				<div id="chapter-name"
					 @dblclick="$emit('showChapterModal')">
					<h3>{{ navSticky ? '&nbsp;' : chapterInfo.Name }}</h3>
				</div>
				<p id="chapter-index">
					{{ currentChapter }}
				</p>
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
	$PROGRESS_DARK: darken($BACKGROUND, 8%);
	$PROGRESS_LIGHT: lighten($BACKGROUND, 5%);

	width: 100%;
	z-index: 20;

	background: linear-gradient(90deg, $PROGRESS_LIGHT var(--completion), $PROGRESS_DARK var(--completion));

	display: grid;
	grid-template-areas: "previous info next";
	grid-template-rows: auto;
	grid-template-columns: 1fr 6fr 1fr;
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

	#chapter-info {
		grid-area: info;
		width: 100%;
		height: 100%;

		display: grid;
		place-items: center;

		position: relative;
		overflow: hidden;

		#chapter-name {
			padding: 1rem 1rem;

			>* {
				min-height: 1rem;
				margin: 0;
				text-align: center;
				user-select: none;
				cursor: pointer;
			}
		}

		#chapter-index {
			font-family: 'Kanit', sans-serif;

			margin: 0;
			position: absolute;
			left: 50%;
			bottom: 50%;
			transform: translateX(-50%) translateY(55%);
			font-size: 10rem;
			font-weight: 900;
			mix-blend-mode: lighten;

			-webkit-text-fill-color: #{transparent};
			-webkit-text-stroke-width: 0.2rem;
			-webkit-text-stroke-color: #{transparentize(white, 0.95)};
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