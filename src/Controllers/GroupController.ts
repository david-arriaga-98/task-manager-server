import { Request, Response } from 'express';
import validator from 'validator';
import {
	errorResponse,
	IErrorResponse,
	ISuccessResponse,
	successResponse
} from '../Utils/Responses';
import { ITokenData } from '../Utils/ManageToken';
import { validateIfIsAdmin } from '../Utils/Validations';
import { Group } from '../Entity/Group';
import { Franchise } from '../Entity/Franchise';
import { User } from '../Entity/User';
import { Task } from '../Entity/Task';

export default class GroupController {
	public async getAll(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;

			if (validateIfIsAdmin(userCredentials)) {
				const groups = await Group.createQueryBuilder('groups')
					.innerJoin('groups.tasks', 'tasks')
					.innerJoin('groups.users', 'users')
					.innerJoin('groups.franchise', 'franchise')
					.select('groups.id', 'id')
					.addSelect('groups.name', 'name')
					.addSelect('groups.description', 'description')
					.addSelect('COUNT(DISTINCT(tasks.id))', 'totalTasks')
					.addSelect('COUNT(DISTINCT(users.id))', 'totalUsers')
					.addSelect('franchise.name', 'franchiseName')
					.addSelect('groups.createdAt', 'createdAt')
					.groupBy('groups.id')
					.getRawMany();

				if (groups) {
					const success = successResponse(groups);
					return res.status(success.code).json(success);
				}
			} else {
				errResp.message = 'Tu rol no te permite realizar esta operación';
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

	public async getUsersFromGroup(
		req: Request,
		res: Response
	): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { id } = req.params;

			let valId = validator.isNumeric(id.toString());

			if (valId) {
				// const group = await Group.createQueryBuilder('group')
				// 	.leftJoinAndSelect('group.users', 'users')
				// 	.where('group.id = :groupId')
				// 	.setParameters({
				// 		id
				// 	})
				// 	.getOne();
				// if (group) {
				// 	const success: ISuccessResponse<any> = successResponse(group, 201);
				// 	return res.status(success.code).json(success);
				// }
			} else {
				errResp.message = 'Ha ocurrido un error al validar el id';
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

	/** COMPLETE */
	public async assignUserToGroup(
		req: Request,
		res: Response
	): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { userId, groupId } = req.body;

			let valUserId: boolean =
				validator.isInt(userId.toString()) && typeof userId === 'number';
			let valGroupId: boolean =
				validator.isInt(groupId.toString()) && typeof groupId === 'number';

			if (valUserId && valGroupId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				const group = await Group.createQueryBuilder('group')
					.innerJoinAndSelect('group.groupOwner', 'owner')
					.innerJoinAndSelect('group.users', 'users')
					.whereInIds(groupId)
					.andWhere('owner.id = :userId')
					.setParameters({
						userId: userCredentials.id
					})
					.getOne();

				if (group) {
					if (group.groupOwner.id === userId) {
						errResp.message = 'No puedes autoasignarte a un grupo';
					} else {
						const user = await User.findOne(userId, {
							relations: ['franchise']
						});

						if (user) {
							if (user.role === 'ADMIN') {
								errResp.message =
									'No puedes asociar un administrador a este grupo';
							} else {
								group.users = [...group.users, user];
								const result = await group.save();
								if (result) {
									const success = successResponse(
										undefined,
										undefined,
										'Usuario asignado correctamente'
									);
									return res.status(success.code).json(success);
								}
								errResp.message = 'Ha ocurrido un error';
							}
						} else errResp.message = 'El usuario que deseas asignar, no existe';
					}
				} else
					errResp.message =
						'El grupo al que deseas asociar este usuario, no existe';
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

	/** COMPLETE */
	public async getByID(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { id } = req.params;

			let valId = validator.isNumeric(id.toString());

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				const group = await Group.createQueryBuilder('group')
					.leftJoin('group.franchise', 'franchise')
					.leftJoin('group.tasks', 'tasks')
					.select('group.id', 'id')
					.addSelect('group.name', 'name')
					.addSelect('group.description', 'description')
					.addSelect('group.createdAt', 'createdAt')
					.addSelect('franchise.id', 'franchiseId')
					.addSelect('franchise.name', 'franchiseName')
					.addSelect('COUNT(DISTINCT(tasks.id))', 'totalTasks')
					.where('group.id = :id')
					.setParameters({ id })
					.andWhere('franchise.id = :franchiseID', {
						franchiseID: userCredentials.franchise?.id
					})
					.getRawOne();

				const totalOfElements = await Task.createQueryBuilder('tasks')
					.leftJoin('tasks.group', 'group')
					.select("SUM(IF(tasks.status = 'COMPLETED', 1, 0))", 'completedTasks')
					.addSelect(
						"SUM(IF(tasks.endTask > :currentDate AND tasks.status = 'DEFINED', 1, 0))",
						'pendingTasks'
					)
					.addSelect(
						"SUM(IF(tasks.endTask < :currentDate AND tasks.status = 'DEFINED', 1, 0))",
						'delayedTasks'
					)
					.where('group.id = :id')
					.setParameters({ id, currentDate: new Date() })
					.getRawOne();

				if (group.id && totalOfElements) {
					const tasks = await Task.createQueryBuilder('task')
						.leftJoin('task.group', 'group')
						.leftJoin('task.users', 'users')
						.select('task.id', 'id')
						.addSelect('task.name', 'name')
						.addSelect('task.description', 'description')
						.addSelect('task.status', 'status')
						.addSelect('task.createdAt', 'createdAt')
						.addSelect('task.endTask', 'endTask')
						.addSelect('COUNT(DISTINCT(users.id))', 'users')
						.addSelect('SUM(IF(users.id = :userId, 1, 0))', 'isJoinInTask')
						.where('group.id = :groupId')
						.setParameters({ groupId: group.id, userId: userCredentials.id })
						.orderBy('task.createdAt', 'DESC')
						.groupBy('task.id')
						.getRawMany();
					if (tasks) {
						const success = successResponse({
							...group,
							...totalOfElements,
							tasks
						});
						return res.status(success.code).json(success);
					}
				}
				errResp.message = 'No se pudieron obtener los datos';
			} else {
				errResp.message = 'Ha ocurrido un error al validar el id';
			}
			return res.status(errResp.code).json(errResp);
		} catch (error) {
			console.log(error);

			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	}

	/** COMPLETE */
	public async createGroup(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { name, description } = req.body;

			let valName: boolean =
				!validator.isEmpty(name) &&
				validator.isLength(name, { min: 3, max: 80 });
			let valDescription: boolean =
				!validator.isEmpty(description) &&
				validator.isLength(description, { min: 3, max: 225 });

			if (valName && valDescription) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (userCredentials.franchise !== null) {
					const user = await User.findOne(userCredentials.id);

					if (user) {
						const franchiseSelected = await Franchise.findOne(
							userCredentials.franchise.id
						);
						if (franchiseSelected) {
							let group = new Group();
							group.name = name;
							group.description = description;
							group.franchise = franchiseSelected;
							group.groupOwner = user;

							group = await group.save();

							if (group) {
								group.users = [user];
								const result = await group.save();

								if (result) {
									const success = successResponse(
										undefined,
										undefined,
										'Grupo creado satisfactoriamente'
									);
									return res.status(success.code).json(success);
								}
							}
							errResp.message = 'Ha ocurrido un error al crear un grupo';
						} else errResp.message = 'La franquicia seleccionada, no existe';
					} else errResp.message = 'El usuario seleccionado, no existe';
				} else {
					if (userCredentials.role === 'ADMIN')
						errResp.message = 'Solo usuarios pueden crear grupos';
					else
						errResp.message =
							'Debes estar registrado en una franquicia para poder crear un grupo';
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

	/** COMPLETE */
	public async getMyGroups(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;

			if (!validateIfIsAdmin(userCredentials)) {
				const myGroups = await Group.createQueryBuilder('group')
					.leftJoin('group.users', 'users')
					.leftJoin('group.groupOwner', 'groupOwner')
					.select('group.id', 'id')
					.addSelect('group.name', 'name')
					.addSelect('group.description', 'description')
					.addSelect('group.createdAt', 'createdAt')
					.addSelect('groupOwner.id', 'ownerId')
					.addSelect('groupOwner.names', 'ownerName')
					.where('users.id = :userId', { userId: userCredentials.id })
					.orderBy('group.createdAt', 'DESC')
					.groupBy('id')
					.getRawMany();
				if (myGroups) {
					const success = successResponse(myGroups);
					return res.status(success.code).json(success);
				}
			} else {
				errResp.message = 'Solo usuarios pueden realizar esta operación';
			}

			errResp.message = 'Ha ocurrido un error';
			return res.status(errResp.code).json(errResp);
		} catch (error) {
			console.log(error);

			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			return res.status(serverError.code).json(serverError);
		}
	}
}
