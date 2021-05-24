import { Request, Response } from 'express';
import validator from 'validator';
import moment from 'moment';
import {
	errorResponse,
	IErrorResponse,
	ISuccessResponse,
	successResponse
} from '../Utils/Responses';
import { ITokenData } from '../Utils/ManageToken';
import { Group } from '../Entity/Group';
import { Task } from '../Entity/Task';
import { validateIfIsAdmin } from '../Utils/Validations';

export default class TaskController {
	public getAll(req: Request, res: Response) {}

	public async getAllForUser(req: Request, res: Response) {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;
			if (!validateIfIsAdmin(userCredentials)) {
				const tasks = await Task.createQueryBuilder('tasks')
					.innerJoin('tasks.users', 'users')
					.innerJoin('tasks.group', 'group')

					.select('tasks.id', 'id')
					.addSelect('tasks.name', 'name')
					.addSelect('tasks.description', 'description')
					.addSelect('tasks.status', 'status')
					.addSelect('tasks.endTask', 'endTask')
					.addSelect('group.id', 'groupId')
					.addSelect('group.name', 'groupName')

					.addSelect('tasks.createdAt', 'createdAt')
					.where('users.id = :userId')
					.setParameters({
						userId: userCredentials.id
					})
					.getRawMany();

				if (tasks) {
					const success = successResponse(tasks);
					return res.status(success.code).json(success);
				}
			} else {
				errResp.message = 'Solo usuarios pueden realizar esta petición';
			}

			return res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	}

	public getByID(req: Request, res: Response) {}

	public async getUsersInTask(req: Request, res: Response) {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { taskId } = req.params;

			let valId = validator.isInt(taskId.toString());

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;
				if (!validateIfIsAdmin(userCredentials)) {
					if (userCredentials.franchise) {
						const task = await Task.findOne(taskId, {
							relations: ['users']
						});

						if (task) {
							const success = successResponse(task.users);
							return res.status(success.code).json(success);
						}
					} else
						errResp.message =
							'Debes estar asignado a una tarea para poder obtener sus usuarios';
				} else {
					errResp.message = 'Solo usuarios pueden realizar esta petición';
				}
			} else {
				errResp.message = 'El identificador ingresado, es inválido';
			}
			return res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	}

	public completeTask = async (req: Request, res: Response) => {
		try {
			const errResp: IErrorResponse = errorResponse();
			const { taskId } = req.body;

			let valTaskId: boolean =
				!validator.isEmpty(taskId.toString()) &&
				validator.isInt(taskId.toString());

			if (valTaskId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				const task = await Task.createQueryBuilder('task')
					.leftJoinAndSelect('task.users', 'users')
					.where('task.id = :taskId')
					.andWhere('users.id = :userId')
					.setParameters({
						taskId,
						userId: userCredentials.id
					})
					.getOne();

				if (task) {
					if (task.status === 'COMPLETED') {
						errResp.message = 'Esta tarea ya se encuentra completada';
					} else {
						task.status = 'COMPLETED';
						const result = await task.save();
						if (result) {
							const success = successResponse(
								undefined,
								undefined,
								'Tarea completada correctamente'
							);
							return res.status(success.code).json(success);
						}
					}
				} else {
					errResp.message = 'No es posible completar esta tarea';
				}
			} else errResp.message = 'Ha ocurrido un error al validar tus datos';

			return res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	};
	/** Complete */
	public joinToTask = async (req: Request, res: Response) => {
		try {
			const errResp: IErrorResponse = errorResponse();
			const { taskId, groupId } = req.body;

			let valTaskId: boolean =
				!validator.isEmpty(taskId.toString()) &&
				validator.isInt(taskId.toString());
			let valGroupId: boolean =
				!validator.isEmpty(groupId.toString()) &&
				validator.isInt(groupId.toString());

			if (valTaskId && valGroupId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (userCredentials.franchise !== null) {
					const task = await Task.createQueryBuilder('task')
						.leftJoinAndSelect('task.users', 'taskUsers')
						.leftJoinAndSelect('task.group', 'group')
						.leftJoinAndSelect('group.users', 'groupUsers')
						.where('group.id = :groupId')
						.andWhere('task.id = :taskId')
						.andWhere('groupUsers.id = :userId')
						.setParameters({
							groupId,
							taskId,
							userId: userCredentials.id
						})
						.getOne();

					if (task) {
						task.users = [...task.users, task.group.users[0]];

						const result = await task.save();

						if (result) {
							const success = successResponse(
								undefined,
								undefined,
								'Te has unido correctamente a esta tarea'
							);
							return res.status(success.code).json(success);
						}
					}
				} else {
					if (userCredentials.role === 'ADMIN')
						errResp.message = 'Solo usuarios pueden crear tareas';
					else
						errResp.message =
							'Debes estar registrado en una franquicia para poder crear tareas dentro de un grupo';
				}
			} else errResp.message = 'Ha ocurrido un error al validar tus datos';

			return res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	};

	/** Complete */
	public async createTask(req: Request, res: Response) {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { name, description, endTaskDate, groupId } = req.body;

			let valName: boolean =
				!validator.isEmpty(name) &&
				validator.isLength(name, { min: 3, max: 80 });
			let valDescription: boolean =
				!validator.isEmpty(description) &&
				validator.isLength(description, { min: 3, max: 225 });
			let valGroupId: boolean =
				!validator.isEmpty(groupId.toString()) &&
				validator.isInt(groupId.toString());

			if (valName && valDescription && valGroupId) {
				const date = new Date(endTaskDate);

				if (date instanceof Date && !isNaN(date.getTime())) {
					const userCredentials: ITokenData = req.body.authData as ITokenData;

					if (userCredentials.franchise !== null) {
						const group = await Group.createQueryBuilder('group')
							.innerJoin('group.users', 'users')
							.where('users.id = :idUser')
							.andWhere('group.id = :idGroup')
							.setParameters({
								idUser: userCredentials.id,
								idGroup: groupId
							})
							.getOne();
						if (group) {
							const newTask = new Task();
							newTask.name = name;
							newTask.description = description;
							newTask.group = group;
							newTask.endTask = new Date(endTaskDate);
							newTask.status = 'DEFINED';

							const result = await newTask.save();

							if (result) {
								const success = successResponse(
									undefined,
									undefined,
									'Tarea creada satisfactoriamente'
								);
								return res.status(success.code).json(success);
							}
							errResp.message =
								'Ha ocurrido un error al momento de guardar esta tarea';
						} else {
							errResp.message = 'El grupo seleccionado, no existe';
						}
					} else {
						if (userCredentials.role === 'ADMIN')
							errResp.message = 'Solo usuarios pueden crear tareas';
						else
							errResp.message =
								'Debes estar registrado en una franquicia para poder crear tareas dentro de un grupo';
					}
				} else {
					errResp.message = 'La fecha ingresada, es inválida';
				}
			} else errResp.message = 'Ha ocurrido un error al validar tus datos';

			return res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	}
}
