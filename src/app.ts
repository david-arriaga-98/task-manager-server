import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import UserRouter from './Routes/UserRouter';
import GroupRouter from './Routes/GroupRouter';
import FranchiseRouter from './Routes/FranchiseRouter';
import { errorResponse, IErrorResponse } from './Utils/Responses';
import { connect } from './Config/typeorm';
import { pagination } from './Utils/Pagination';
import TaskRouter from './Routes/TaskRouter';
import { User } from './Entity/User';
import { getConnection } from 'typeorm';

class App {
	private app: Application;

	constructor(app: Application) {
		this.app = app;
		this.initializeConfiguration();
		this.initializeMiddlewares();
		this.initializeRoutes();
	}

	initializeConfiguration() {
		this.app.set('PORT', process.env.PORT || 3002);
		connect();
	}

	initializeMiddlewares(): void {
		this.app.use(cors());
		this.app.use(morgan('dev'));
		this.app.use(express.urlencoded({ extended: false }));
		this.app.use(express.json());
		this.app.use(pagination);
	}

	initializeRoutes(): void {
		new UserRouter(this.app);
		new GroupRouter(this.app);
		new FranchiseRouter(this.app);
		new TaskRouter(this.app);

		const notFoundError: IErrorResponse = errorResponse(
			'Ruta no válida',
			404,
			'notFound'
		);

		this.app.use((req, res) => {
			res.status(notFoundError.code).json(notFoundError);
		});
	}
}

export default App;
