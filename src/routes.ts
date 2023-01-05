import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import IndexRoute from '@/views/index.vue'
import StoryRoute from '@/views/story.vue'

const routes: RouteRecordRaw[] = [
	{
		path: '/story/:id([A-Za-z0-9_-]+)',
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
