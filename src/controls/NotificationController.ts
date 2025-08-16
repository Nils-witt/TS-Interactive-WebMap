export type NotificationPriority = 'info' | 'warning' | 'error';

export class NotificationController {

    private static instance: NotificationController | null = null;

    private container: HTMLDivElement = document.createElement('div');

    private constructor() {
        this.container.classList.add('fixed', 'top-0', 'right-0', 'm-4', 'z-1000');
        document.body.appendChild(this.container);
    }


    public static getInstance(): NotificationController {
        if (!this.instance) {
            this.instance = new NotificationController();
        }
        return this.instance;
    }


    public showNotification(message: string, priority: NotificationPriority = "info"): void {

        let messageDiv = document.createElement('div');
        messageDiv.classList.add('text-white', 'px-4', 'py-2', 'rounded', 'mb-2');

        if (priority === 'info') {
            messageDiv.classList.add('bg-blue-500');
        } else if (priority === 'warning') {
            messageDiv.classList.add('bg-yellow-500');
        } else if (priority === 'error') {
            messageDiv.classList.add('bg-red-500');
        }

        messageDiv.textContent = message;
        this.container.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

}

