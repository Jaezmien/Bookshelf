<script setup lang="ts">
import FadeTransition from '@/transitions/FadeTransition.vue';

defineProps({
	active: {
		type: Boolean,
		default: false,
	}
})
defineEmits(['close'])
</script>

<template>
	<FadeTransition>
		<div id="modal"
			 v-if="active"
			 @click.self="$emit('close')">
			<div class="card">
				<slot />
			</div>
		</div>
	</FadeTransition>
</template>

<style lang="scss" scoped>
$BACKGROUND: #1f2229;

#modal {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;

	background: rgba(0, 0, 0, 0.2);

	display: grid;
	place-items: center;

	.card {
		margin: 0 1rem;

		border-radius: 0.5rem;

		background: lighten($BACKGROUND, 5%);

		box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.4);
	}
}
</style>

<style lang="scss">
body.modal-open {
	overflow: hidden;
}
</style>