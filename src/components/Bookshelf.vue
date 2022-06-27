<script setup lang="ts">
import FeatherIcon from '@/components/FeatherIcon.vue'

defineProps({
	clickable: {
		type: Boolean,
		default: false
	}
})
defineEmits(['book:click'])
</script>

<template>
	<div id="bookshelf-logo">
		<div :class="{ clickable }"
			 @click="() => clickable && $emit('book:click')">
			<div>
				<FeatherIcon :icon="'book'"
							 :size="'3rem'"></FeatherIcon>
				<h1 id="header">Bookshelf</h1>
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped>
#bookshelf-logo {
	font-family: 'Roboto Slab', serif;
	text-align: center;

	display: grid;
	place-items: center;

	div {
		display: flex;
		flex-direction: row;
		place-items: center;

		padding: 0 1rem;

		#header {

			font-size: 3rem;
			margin: 0;
			margin-left: 0.5rem;

			@media screen and (max-width: 25rem) {
				font-size: 2rem;
			}
		}


	}
}

.clickable {
	cursor: pointer;
}
</style>