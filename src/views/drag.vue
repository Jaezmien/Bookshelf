<script setup lang="ts">
import Bookshelf from '@/components/Bookshelf.vue';
import DragStoryView from '@/components/DragStoryView.vue';
import { CreateButtonLoader, CreateDropLoader, DropLoaderResult, load_file_as_text } from '@/composables/droploader';
import { BookNotification } from '@/symbols';
import ParseFIMStory, { FIMStory } from "fimfic-parser";
import { inject, ref } from 'vue';

const fileInputRef = ref<HTMLInputElement>(document.createElement('input'))
const buttonRef = ref<HTMLButtonElement>(document.createElement('button'))
const containerRef = ref<HTMLDivElement>(document.createElement('div'))

const isInMenu = ref<Boolean>(true)
const story = ref<FIMStory>()
const storyFilename = ref<string>()
const create_notification = inject(BookNotification, (m, t = 0) => { })

function load_story(files: DropLoaderResult[]) {

	if (files.length !== 1) return create_notification('Expected one story, got ' + files.length + '!', 2)
	const [filename, storyFile] = files[0]

	load_file_as_text(storyFile).then(
		async event => {
			story.value = await ParseFIMStory((event.target!.result) as string)
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

#story-import {
	margin-top: 1rem;

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