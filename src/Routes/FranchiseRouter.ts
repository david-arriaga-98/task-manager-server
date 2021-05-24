import { Application } from 'express';
import FranchiseController from '../Controllers/FranchiseController';
import AuthMD from '../Middlewares/Auth';

export default class FranchiseRouter {
	private app: Application;
	private franchiseController: FranchiseController;
	private url: string;

	constructor(app: Application) {
		this.app = app;
		this.franchiseController = new FranchiseController();
		this.url = '/franchise';
		this.get();
		this.post();
		this.put();
		this.delete();
	}

	get(): void {
		this.app.get(this.url, AuthMD, this.franchiseController.getMyFranchise);
		this.app.get(
			this.url + '/all',
			AuthMD,
			this.franchiseController.getAllFranchise
		);
		this.app.get(
			this.url + '/:groupId/users',
			AuthMD,
			this.franchiseController.getUsersFromFranchise
		);
		this.app.get(
			this.url + '/users/:franchiseId',
			AuthMD,
			this.franchiseController.getUsersById
		);
		this.app.get(
			this.url + '/:id',
			AuthMD,
			this.franchiseController.getFranchiseById
		);
	}

	post(): void {
		this.app.post(this.url, AuthMD, this.franchiseController.createFranchise);
	}

	put(): void {}

	delete(): void {
		this.app.delete(
			this.url + '/:id',
			AuthMD,
			this.franchiseController.deleteFranchise
		);
	}
}
