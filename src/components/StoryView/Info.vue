<script setup lang="ts">
import { FIMStory } from 'fimfic-parser';
import { PropType } from 'vue';

defineProps({
	filename: {
		type: String,
		requried: true,
		default: () => '',
	},
	story: {
		type: Object as PropType<FIMStory>,
		required: true
	}
})
</script>

<template>
	<section v-if="story.Format !== 'NONE'">
		<h1 id="story-title">{{ story.Title }}</h1>
		<p id="story-author">by: {{ story.Author }}</p>
	</section>
	<section v-else>
		<h1 id="story-title">{{ filename }}</h1>
	</section>
</template>

<style lang="scss" scoped>
#story-title {
	font-size: 1.75rem;
	margin: 0;
	margin-top: 1rem;
}

hr {
	margin: 2rem 0;
}

section {
	margin: 0 1rem;
}
</style>