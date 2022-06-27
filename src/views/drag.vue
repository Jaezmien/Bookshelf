<script setup lang="ts">
import Bookshelf from '@/components/Bookshelf.vue';
import { inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { useFileStore } from '@/stores/files'
import { BookNotification } from '@/symbols'
import { CreateDropLoader, CreateButtonLoader, FileReaderResult, DropLoaderResult, load_file_as_text } from '@/composables/droploader';
import { FiMFormatType, FiMStoryRaw, FiMStoryType, ParseFiMStory } from '@/libs/FiMParser';
import DragStoryView from '@/components/DragStoryView.vue';

const fileStore = useFileStore()
const indexedDB = ref<Boolean>(fileStore.browser_supports_indexeddb)

const fileInputRef = ref<HTMLInputElement>(document.createElement('input'))
const buttonRef = ref<HTMLButtonElement>(document.createElement('button'))
const containerRef = ref<HTMLDivElement>(document.createElement('div'))

const isInMenu = ref<Boolean>(true)
const story = ref<FiMStoryType>()
const storyFilename = ref<string>()
const create_notification = inject(BookNotification, (m, t = 0) => { })

function load_story(files: DropLoaderResult[]) {

	if (files.length !== 1) return create_notification('Expected one story, got ' + files.length + '!', 2)
	const [filename, storyFile] = files[0]

	load_file_as_text(storyFile).then(
		async event => {
			story.value = await ParseFiMStory(filename, (event.target!.result) as string)
			storyFilename.value = filename
			isInMenu.value = false
		}
	).catch(error_load_story)

}

function error_load_story(err: any) {
	create_notification(err as string, 2)
}

const { isUserDragging } = CreateDropLoader(containerRef, load_story, error_load_story)
CreateButtonLoader(buttonRef, fileInputRef, load_story, error_load_story)
</script>

<template>
	<div id="no-indexeddb-page"
		 :class="{ 'centered': isInMenu, 'dragging': isUserDragging }"
		 ref="containerRef">

		<!-- Home -->
		<section v-if="isInMenu">
			<Bookshelf></Bookshelf>
			<p v-if="!indexedDB"
			   id="feature-warning">IndexedDB Feature Not Found!</p>
			<div id="story-import">
				<button ref="buttonRef">Load a story</button>
				<p>&nbsp;or drag it into this window!</p>
			</div>

			<input type="file"
				   ref="fileInputRef">
		</section>

		<!-- Viewer -->
		<DragStoryView v-else
					   :story="story!"
					   :filename="storyFilename!"
					   @book:reload="(f) => load_story(f)"
					   @book:load-error="(e) => error_load_story(e)"></DragStoryView>

		<!-- Drag and Drop Indicator -->
		<div id="story-drag-highlight">
			<p>Drop here!</p>
		</div>
	</div>
</template>

<style scoped lang="scss">
#no-indexeddb-page {
	min-height: 100vh;
}

.centered {
	display: grid;
	place-items: center;
	text-align: center;

	margin: 0 1rem;
}

#feature-warning {
	margin-top: 0rem;
	margin-bottom: 1rem;
	color: hsla(0, 100%, 50%, 0.50);
	font-style: italic;
	font-size: 0.9rem;
}

#story-import {
	* {
		display: inline-block;
		margin: 0;
	}
}

#story-drag-highlight {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;

	display: grid;
	place-items: center;

	background: white;
	color: black;
	font-size: 2rem;

	opacity: 0;
	transition: opacity 100ms ease-in-out
}

.dragging #story-drag-highlight {
	opacity: 0.4;
}

#drag-view {
	min-height: 100vh;
}

input[type="file"] {
	display: none;
}
</style>