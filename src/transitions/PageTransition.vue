<script setup lang="ts">
defineProps({
	direction: {
		type: String,
		default: 'right',
		validator(val: any) {
			if (!val) return true
			return ['left', 'right'].includes(val)
		}
	}
})
</script>

<template>
	<Transition :name="'to-' + direction">
		<slot></slot>
	</Transition>
</template>

<style lang="scss" scoped>
.to-left-enter-active,
.to-right-enter-active,
.to-left-leave-active,
.to-right-leave-active {
	transition: all 250ms ease;
}

.to-left-enter-from {
	transform: translateX(20px);
	opacity: 0;
	transition: all 0ms linear; // Immediately translate the element, instead of easing it 250ms
}

.to-left-leave-to {
	transform: translateX(-20px);
	opacity: 0;
}

.to-right-enter-from {
	transform: translateX(-20px);
	opacity: 0;
	transition: all 0ms linear;
}

.to-right-leave-to {
	transform: translateX(20px);
	opacity: 0;
}
</style>