<script setup lang="ts">
import { FiMStoryType, FiMFormatType } from '@/libs/FiMParser';
import { PropType } from 'vue';

const props = defineProps({
	filename: {
		type: String,
		requried: true,
		default: () => '',
	},
	story: {
		type: Object as PropType<FiMStoryType>,
		required: true
	}
})
</script>

<template>
	<section v-if="story.Format !== FiMFormatType.RAW">
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