import 'reflect-metadata';
import express, { Application } from 'express';
import App from './app';

class Main {
	private app: Application;

	constructor() {
		this.app = express();
		this.initializeApplication();
	}

	private initializeApplication() {
		new App(this.app);
	}

	public startApplication() {
		try {
			this.app.listen(this.app.get('PORT'), () => {
				console.log('Server on port:', this.app.get('PORT'));
			});
		} catch (error) {
			console.log('Server error:', error);
		}
	}
}

new Main().startApplication();
