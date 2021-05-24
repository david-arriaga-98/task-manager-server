import { Application } from 'express';
import GroupController from '../Controllers/GroupController';
import AuthMD from '../Middlewares/Auth';

export default class GroupRouter {
	private app: Application;
	private groupController: GroupController;
	private url: string;

	constructor(app: Application) {
		this.app = app;
		this.groupController = new GroupController();
		this.url = '/group';
		this.get();
		this.post();
		this.put();
		this.delete();
	}

	get(): void {
		this.app.get(this.url + '/', AuthMD, this.groupController.getAll);
		this.app.get(
			this.url + '/getUsers/:id',
			AuthMD,
			this.groupController.getUsersFromGroup
		);
		this.app.get(this.url + '/my', AuthMD, this.groupController.getMyGroups);
		this.app.get(this.url + '/:id', AuthMD, this.groupController.getByID);
	}

	post(): void {
		this.app.post(this.url + '/', AuthMD, this.groupController.createGroup);
		this.app.post(
			this.url + '/assign/user',
			AuthMD,
			this.groupController.assignUserToGroup
		);
	}

	put(): void {}

	delete(): void {}
}
