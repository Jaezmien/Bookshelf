<script setup lang="ts">
import { CreateButtonLoader } from '@/composables/droploader';
import { FIMStory } from 'fimfic-parser';
import { onMounted, PropType, ref } from 'vue';
import Bookshelf from './Bookshelf.vue';
import StoryView from './StoryView/index.vue';

defineProps({
	story: {
		type: Object as PropType<FIMStory>,
		required: true,
	},
	filename: {
		type: String,
		required: true
	}
})
const emits = defineEmits(['book:reload', 'book:load-error'])

const bookRef = ref<HTMLDivElement>(document.createElement('div'))
const fileInputRef = ref<HTMLInputElement>(document.createElement('input'))

onMounted(() => {
	bookRef.value = document.querySelector('header > *') as HTMLDivElement
})

CreateButtonLoader(bookRef, fileInputRef, (f) => emits('book:reload', f), (e) => emits('book:load-error', e))
</script>

<template>
	<section id="drag-view">
		<header>
			<Bookshelf :clickable="true"></Bookshelf>
		</header>
		<StoryView v-if="story"
				   :story="story"
				   :filename="filename"></StoryView>
	</section>

	<input type="file"
		   ref="fileInputRef">
</template>

<style lang="scss" scoped>
header {
	padding: 1rem 0;
	background: transparentize(black, 0.8);
	border-bottom-left-radius: 1rem;
	border-bottom-right-radius: 1rem;
}

input[type="file"] {
	display: none;
}
</style>