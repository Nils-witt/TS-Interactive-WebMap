import {ApiProvider, ApiProviderEventTypes} from "../dataProviders/ApiProvider.ts";


export class LoginController {
    private static instance: LoginController;

    private container: HTMLDivElement = document.createElement('div');

    private constructor() {

        this.setUpDiv();

        ApiProvider.getInstance().on(ApiProviderEventTypes.UNAUTHORIZED, () => {
            this.showLoginForm(true);
        });
        this.showLoginForm(false);
    }

    public static getInstance(): LoginController {
        if (!LoginController.instance) {
            LoginController.instance = new LoginController();
        }
        return LoginController.instance;
    }


    private setUpDiv(): void {
        this.container.classList.add('hidden')
        this.container.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'h-full', 'items-center', 'justify-center', 'bg-white', 'z-1001');

        document.body.appendChild(this.container);
        let label = document.createElement('label');
        label.textContent = 'Username:';
        let input = document.createElement('input');
        input.type = 'text';

        let labelPassword = document.createElement('label');
        labelPassword.textContent = 'Password:';
        let inputPassword = document.createElement('input');
        inputPassword.type = 'password';
        let button = document.createElement('button');
        button.textContent = 'Login';
        button.onclick = async () => {
            let username = input.value;
            let password = inputPassword.value;
            button.disabled = true; // Disable the button to prevent multiple clicks
            try {
                await ApiProvider.getInstance().login(username, password);
            } catch (error) {
                console.error("Login failed:", error);
                alert("Login failed. Please check your credentials.");
            }
        };
        this.container.appendChild(label);
        this.container.appendChild(input);

        this.container.appendChild(labelPassword);
        this.container.appendChild(inputPassword);

        this.container.appendChild(button);

        ApiProvider.getInstance().on(ApiProviderEventTypes.LOGIN_SUCCESS, () => {
            this.container.classList.add('hidden')
        });
        ApiProvider.getInstance().on(ApiProviderEventTypes.LOGIN_FAILURE, () => {
            button.disabled = false; // Re-enable the button on failure
        });
    }

    private showLoginForm(isShown: boolean): void {
        if (isShown) {
            this.container.classList.remove('hidden');
        } else {
            this.container.classList.add('hidden');
        }
    }
}