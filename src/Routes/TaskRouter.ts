import { Application } from 'express';
import TaskController from '../Controllers/TaskController';
import AuthMd from '../Middlewares/Auth';

export default class TaskRouter {
	private app: Application;
	private taskController: TaskController;
	private url: string;

	constructor(app: Application) {
		this.app = app;
		this.taskController = new TaskController();
		this.url = '/task';
		this.get();
		this.post();
		this.put();
		this.delete();
	}

	get(): void {
		this.app.get(this.url + '/', this.taskController.getAll);
		this.app.get(
			this.url + '/:taskId/users',
			AuthMd,
			this.taskController.getUsersInTask
		);
		this.app.get(this.url + '/my', AuthMd, this.taskController.getAllForUser);
		this.app.get(this.url + '/:id', this.taskController.getByID);
	}

	post(): void {
		this.app.post(this.url + '/', AuthMd, this.taskController.createTask);
		this.app.post(
			this.url + '/complete',
			AuthMd,
			this.taskController.completeTask
		);
		this.app.post(this.url + '/join', AuthMd, this.taskController.joinToTask);
	}

	put(): void {}

	delete(): void {}
}
