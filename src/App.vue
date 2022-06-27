<script setup lang="ts">
import { RouterView } from 'vue-router';
import DragDrop from '@/views/drag.vue';
import { useFileStore } from './stores/files';
import FadeTransition from './transitions/FadeTransition.vue';
import { provide, reactive } from 'vue';
import { BookSettings, SaveBookSettings } from './symbols';
import { BookshelfSettings } from './types';

const files = useFileStore()

let settings = reactive<BookshelfSettings>({
	Sort: 'Last Accessed'
})
if (localStorage.getItem('settings')) settings = JSON.parse(localStorage.getItem('settings') || "{}")
else localStorage.setItem('settings', JSON.stringify(settings))
provide(BookSettings, settings)
provide(SaveBookSettings, () => {
	localStorage.setItem('settings', JSON.stringify(settings))
})
</script>

<template>
	<router-view v-if="files.browser_supports_indexeddb"
				 v-slot="{ Component }">
		<fade-transition mode="out-in">
			<component :is="Component"></component>
		</fade-transition>
	</router-view>
	<drag-drop v-else></drag-drop>

	<book-component></book-component>

	<div id="modal-teleport"></div>
</template>

<style lang="scss">
$BACKGROUND: #1f2229;
$TEXT: #eeeeee;

body,
html {
	margin: 0;
	padding: 0;
	font-family: 'Open Sans', sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;

	// scroll-behavior: smooth;
}

body {
	background: $BACKGROUND;
	color: darken($TEXT, 20);
}

#app {
	min-height: 100vh;
}

* {
	box-sizing: border-box;
}

button {
	border: none;
	padding: 0.5rem;
	border-radius: 0.25rem;
	font-weight: 600;
	cursor: pointer;

	background: none;
	border: $TEXT 0.1rem solid;
	color: $TEXT;

	transition: background 100ms ease-in-out, color 100ms ease-in-out;

	&:hover {
		background: $TEXT;
		color: $BACKGROUND;
	}
}
</style>
