import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import IndexRoute from '@/views/index.vue'
import StoryRoute from '@/views/story.vue'
import { nextTick } from 'process'

const routes: RouteRecordRaw[] = [
	{
		path: '/story/:uuid([a-z0-9]+)',
		name: 'Story',
		component: StoryRoute,
	},
	{
		path: '/',
		name: 'Index',
		component: IndexRoute,
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})
export default router
