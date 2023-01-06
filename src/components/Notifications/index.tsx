import { BookNotification } from '@/symbols';
import { App, h, reactive, TransitionGroup } from 'vue';

// Prevent prettier from deleting `h`
let _h = h

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export default {
	install: (app: App, options: any) => {

		interface INotification {
			message: string;
			type: number;
			id: number;
			timeout: NodeJS.Timeout
		}
		const state = reactive({
			notifications: [] as INotification[],
		})
		const NOTIFICATION_STATE = ['info','warning','error']
		
		// Register state
		const create_notification = (msg: string, type: number = 0) => {
			const id = rand(0, 2048)
		
			state.notifications.push({
				message: msg,
				type,
				id,
				timeout: setTimeout(() => delete_notification( id, true ), 5000),
			});
		}
		const delete_notification = (id: number, expire: boolean) => {
			const notification = state.notifications.find(notif => notif.id === id)
			if (!notification) return
			if (expire) clearTimeout( notification.timeout )
			state.notifications.splice( state.notifications.indexOf(notification), 1 )
		}
		app.config.globalProperties.$book_notification = create_notification
		app.provide(BookNotification, create_notification)

		// @ts-ignore
		if( import.meta.env.DEV ) {
			// @ts-ignore
			window.create_notification = create_notification
		}

		// Register component
		app.component('book-component', {
			render() {
				return (
					<div id="book-notifications">
						<TransitionGroup name="book-anim">
						{
								() => (state.notifications.map((msg, i) => {
									return (<div class={['book-notification-container', 'book-' + NOTIFICATION_STATE[msg.type]]} key={msg.id + msg.message} onClick={() => delete_notification(msg.id, false)}>
											{ msg.message }
											</div>)
								}))
						}
					</TransitionGroup>
					</div>
				)
			}

		})
	}
}