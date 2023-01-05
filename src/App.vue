<script setup lang="ts">
import DragDrop from '@/views/drag.vue';
import { RouterView } from 'vue-router';
import { useDatabaseStore } from './stores/database';
import FadeTransition from './transitions/FadeTransition.vue';

const databaseStore = useDatabaseStore()
</script>

<template>
	<template v-if="databaseStore.DISABLED === false">
		<router-view v-slot="{ Component }">
			<fade-transition mode="out-in">
				<component :is="Component"></component>
			</fade-transition>
		</router-view>
	</template>

	<template v-else-if="databaseStore.DISABLED === true">
		<drag-drop></drag-drop>
	</template>

	<book-component></book-component>
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
	// outline: 1px solid green;
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
