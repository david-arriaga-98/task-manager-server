import { Request, Response } from 'express';
import {
	errorResponse,
	IErrorResponse,
	ISuccessResponse,
	successResponse
} from '../Utils/Responses';
import validator from 'validator';
import { ITokenData } from '../Utils/ManageToken';
import { validateIfIsAdmin } from '../Utils/Validations';
import { Franchise } from '../Entity/Franchise';
import { User } from '../Entity/User';
import { Group } from '../Entity/Group';

export default class GroupController {
	/** CLOSE */
	public async createFranchise(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { name, socialReason } = req.body;

			let valName: boolean =
				!validator.isEmpty(name) &&
				validator.isLength(name, { min: 5, max: 100 });
			let valSocialReason: boolean =
				!validator.isEmpty(socialReason) &&
				validator.isLength(socialReason, { min: 3, max: 220 });

			if (valName && valSocialReason) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (validateIfIsAdmin(userCredentials)) {
					let franchise = new Franchise();

					franchise.name = name;
					franchise.socialReason = socialReason;

					franchise = await franchise.save();

					if (franchise) {
						const success: ISuccessResponse<undefined> = successResponse(
							undefined,
							201,
							'Franquicia creada correctamente'
						);
						return res.status(success.code).json(success);
					}
				} else {
					errResp.message = 'Tu rol no te permite crear franquicias';
				}
			} else {
				errResp.message = 'Ha ocurrido un error al validar tus datos';
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

	/** CLOSE */
	public async getMyFranchise(req: Request, res: Response) {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;

			const user = await User.findOne(userCredentials.id, {
				relations: ['franchise']
			});

			if (user) {
				const success: ISuccessResponse<object> = successResponse(
					user.franchise,
					201
				);
				res.status(success.code).json(success);
				return;
			}

			res.status(errResp.code).json(errResp);
		} catch (error) {
			const serverError: IErrorResponse = errorResponse(
				'Ha ocurrido un error',
				500,
				'error'
			);
			res.status(serverError.code).json(serverError);
		}
	}

	public async deleteFranchise(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { id } = req.params;

			let valId = validator.isNumeric(id);

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;
				if (validateIfIsAdmin(userCredentials)) {
					const franchise = await Franchise.createQueryBuilder('franchise')
						.leftJoin('franchise.users', 'users')
						.leftJoin('franchise.groups', 'groups')
						.select('franchise.id', 'id')
						.addSelect('COUNT(DISTINCT(users.id))', 'users')
						.addSelect('COUNT(DISTINCT(groups.id))', 'groups')
						.groupBy('id')
						.where('franchise.id = :id', { id })
						.getRawOne();

					if (franchise) {
						if (franchise.users == 0 && franchise.groups == 0) {
							const result = await Franchise.delete({ id: franchise.id });

							if (result) {
								const success = successResponse(
									undefined,
									201,
									'Franquicia eliminada'
								);
								return res.status(success.code).json(success);
							}
							errResp.message = 'Esta franquicia no se pudo eliminar';
						} else {
							errResp.message = 'Esta franquicia tiene usuarios y grupos';
						}
					} else {
						errResp.message = 'Esta franquicia no existe';
					}
				} else {
					errResp.message = 'Tu rol no te permite realizar esta operación';
				}
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

	/** CLOSE */
	public async getAllFranchise(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;

			if (validateIfIsAdmin(userCredentials)) {
				const franchises = await Franchise.createQueryBuilder('franchise')
					.leftJoin('franchise.users', 'users')
					.leftJoin('franchise.groups', 'groups')
					.select('franchise.id', 'id')
					.addSelect('franchise.name', 'name')
					.addSelect('franchise.socialReason', 'socialReason')
					.addSelect('franchise.createdAt', 'createdAt')
					.addSelect('CAST(COUNT(DISTINCT(users.id)) as UNSIGNED) as users')
					.addSelect('COUNT(DISTINCT(groups.id)) as groups')
					.orderBy('franchise.createdAt', 'DESC')
					.groupBy('id')
					.getRawMany();

				if (franchises) {
					const success = successResponse(franchises, 201);
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

	/** CLOSE */
	public async getFranchiseById(
		req: Request,
		res: Response
	): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { id } = req.params;

			let valId = validator.isNumeric(id);

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;
				if (validateIfIsAdmin(userCredentials)) {
					const franchise = await Franchise.findOne(id);

					if (franchise) {
						const success: ISuccessResponse<Franchise> = successResponse(
							franchise,
							201
						);
						return res.status(success.code).json(success);
					}
					errResp.message = 'Esta franquicia no existe';
				} else {
					errResp.message = 'Tu rol no te permite realizar esta operación';
				}
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

	/** CLOSE */
	public async getUsersById(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { franchiseId } = req.params;

			let valId = validator.isInt(franchiseId);

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (validateIfIsAdmin(userCredentials)) {
					const result = await Franchise.findOne(franchiseId, {
						relations: ['users'],
						order: {
							createdAt: 'DESC'
						}
					});

					if (result) {
						const success = successResponse(result.users);
						return res.status(success.code).json(success);
					}
					errResp.message = 'Esta franquicia no existe';
				} else {
					errResp.message = 'Tu rol no te permite realizar esta operación';
				}
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

	/** CLOSE */
	public async getUsersFromFranchise(
		req: Request,
		res: Response
	): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { groupId } = req.params;

			let valId = validator.isInt(groupId);

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;
				if (!validateIfIsAdmin(userCredentials)) {
					if (userCredentials.franchise) {
						const users = await User.createQueryBuilder('users')
							.leftJoin('users.franchise', 'franchise')
							.leftJoin('users.groups', 'groups')
							.select('users.id', 'id')
							.addSelect('users.names', 'names')
							.addSelect('users.username', 'username')
							.addSelect('users.createdAt', 'createdAt')
							.addSelect('SUM(IF(groups.id = :groupId, 1, 0))', 'isJoinInGroup')
							.where('franchise.id = :franchiseId')
							.setParameters({
								franchiseId: userCredentials.franchise.id,
								groupId
							})
							.groupBy('users.id')
							.getRawMany();

						if (users) {
							const success: ISuccessResponse<any> = successResponse(
								users,
								200
							);
							return res.status(success.code).json(success);
						}
					} else
						errResp.message =
							'Debes estar asignado a una franquicia para poder obtener sus usuarios';
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
}
