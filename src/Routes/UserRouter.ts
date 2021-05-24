import { Application } from 'express';
import UserController from '../Controllers/UserController';
import AuthMd from '../Middlewares/Auth';

export default class UserRouter {
	private app: Application;
	private userController: UserController;
	private url: string;

	constructor(app: Application) {
		this.app = app;
		this.userController = new UserController();
		this.url = '/user';
		this.get();
		this.post();
		this.put();
		this.delete();
	}

	get(): void {
		// this.app.get(
		// 	this.url + '/adminDashboard',
		// 	AuthMd,
		// 	this.userController.adminDashboard
		// );
		// this.app.get(
		// 	this.url + '/userDashboard',
		// 	AuthMd,
		// 	this.userController.userDashboard
		// );
		this.app.get(this.url + '/whoami', AuthMd, this.userController.whoami);
		this.app.get(this.url, AuthMd, this.userController.getAllUsers);
	}

	post(): void {
		this.app.post(this.url + '/login', this.userController.login);
		this.app.post(this.url + '/register', AuthMd, this.userController.register);
		this.app.post(this.url + '/rmx64', this.userController.registerAdmin);
	}

	put(): void {
		this.app.put(
			this.url + '/assingtofranchise',
			AuthMd,
			this.userController.asignUserToFranchise
		);
	}

	delete(): void {
		this.app.delete(this.url + '/:id', AuthMd, this.userController.deleteUser);
	}
}
