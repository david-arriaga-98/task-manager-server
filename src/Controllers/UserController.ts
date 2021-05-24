import { Request, Response } from 'express';
import validator from 'validator';
import moment from 'moment';
import {
	errorResponse,
	IErrorResponse,
	ISuccessResponse,
	successResponse
} from '../Utils/Responses';
import { generateToken, ITokenData } from '../Utils/ManageToken';
import { validateIfIsAdmin, validateRoles } from '../Utils/Validations';
import { User } from '../Entity/User';
import { Franchise } from '../Entity/Franchise';
import { Group } from '../Entity/Group';
import { Task } from '../Entity/Task';

export default class UserController {
	// public async userDashboard(req: Request, res: Response) {
	// 	try {
	// 		const errResp: IErrorResponse = errorResponse();
	// 		const userCredentials: ITokenData = req.body.authData as ITokenData;

	// 		return res.status(errResp.code).json(errResp);
	// 	} catch (error) {
	// 		const serverError: IErrorResponse = errorResponse(
	// 			'Ha ocurrido un error',
	// 			500,
	// 			'error'
	// 		);
	// 		return res.status(serverError.code).json(serverError);
	// 	}
	// }

	// public async adminDashboard(req: Request, res: Response) {
	// 	try {
	// 		const errResp: IErrorResponse = errorResponse();
	// 		const userCredentials: ITokenData = req.body.authData as ITokenData;

	// 		if (validateIfIsAdmin(userCredentials)) {
	// 			// Informacion de los usuarios - totales, admins, miembros, cuantos sin franquicia
	// 			const users = await User.createQueryBuilder('users')
	// 				.select('COUNT(DISTINCT(users.id))', 'total')
	// 				.addSelect('SUM(IF(users.role = "USER", 1,0))', 'totalUsers')
	// 				.addSelect('SUM(IF(users.role = "ADMIN", 1,0))', 'totalAdmins')
	// 				.addSelect(
	// 					'SUM(IF(users.franchise IS NULL AND users.role = "USER", 1,0))',
	// 					'noFranchise'
	// 				)
	// 				.getRawMany();

	// 			const groups = await Group.createQueryBuilder('groups').getRawMany();

	// 			const tasks = await Task.createQueryBuilder('tasks').getRawMany();

	// 			console.log(users, groups, tasks);
	// 		}

	// 		return res.status(errResp.code).json(errResp);
	// 	} catch (error) {
	// 		const serverError: IErrorResponse = errorResponse(
	// 			'Ha ocurrido un error',
	// 			500,
	// 			'error'
	// 		);
	// 		return res.status(serverError.code).json(serverError);
	// 	}
	// }

	/** CLOSE */
	public async login(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();
			const { credential, password } = req.body;

			let valCrendential: boolean = !validator.isEmpty(credential);
			let valPassword: boolean = !validator.isEmpty(password);

			if (valCrendential && valPassword) {
				const user = await User.findOne({
					where: [{ email: credential }, { username: credential }],
					relations: ['franchise'],
					select: ['id', 'names', 'role', 'franchise', 'password']
				});

				if (user) {
					if (await user.comparePassword(password)) {
						const token: string = generateToken({
							id: user.id,
							names: user.names,
							role: user.role,
							username: user.username,
							franchise: user.franchise,
							iat: moment().unix(),
							exp: moment().add(30, 'minutes').unix()
						});
						const successResp: ISuccessResponse<object> = successResponse(
							{
								id: user.id,
								names: user.names,
								role: user.role,
								username: user.username,
								franchise:
									user.franchise === null
										? null
										: {
												id: user.franchise.id,
												name: user.franchise.name,
												socialReason: user.franchise.socialReason
										  },
								token
							},
							200,
							'El inicio de sesión, fue correcto'
						);
						return res.status(successResp.code).json(successResp);
					}
				}
				errResp.message = 'Usuario y/o contraseña incorrectos';
			} else {
				errResp.message = 'Verifique sus datos antes de enviarlos';
			}
			return res.status(errResp.code).json(errResp);
		} catch (error) {
			console.log(error);

			const response: IErrorResponse = errorResponse(
				'Ha ocurrido un error al validar tus datos',
				422,
				'bad request'
			);
			return res.status(response.code).json(response);
		}
	}

	/** CLOSE */
	public async register(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { names, email, username, password, passwordConfirm, role } =
				req.body;

			let valName: boolean =
				!validator.isEmpty(names) &&
				validator.isLength(names, { min: 3, max: 80 });
			let valUsername: boolean =
				!validator.isEmpty(username) &&
				validator.isLength(username, { min: 3, max: 20 });
			let valEmail: boolean =
				!validator.isEmpty(email) &&
				validator.isEmail(email) &&
				validator.isLength(email, { min: 5, max: 100 });
			let valPassword: boolean =
				!validator.isEmpty(password) &&
				validator.isLength(password, { min: 5, max: 90 });
			let valPasswordConf: boolean =
				!validator.isEmpty(passwordConfirm) &&
				validator.isLength(passwordConfirm, { min: 5, max: 90 }) &&
				password === passwordConfirm;

			let valRole: boolean = !validator.isEmpty(role);

			if (
				valName &&
				valEmail &&
				valPassword &&
				valPasswordConf &&
				valUsername &&
				valRole
			) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (validateIfIsAdmin(userCredentials)) {
					if (validateRoles(role)) {
						const user = await User.findOne({
							where: [{ email }, { username }]
						});

						if (!user) {
							let newUser = new User();
							newUser.names = names;
							newUser.username = username;
							newUser.email = email;
							newUser.password = await newUser.encryptPassword(password);
							newUser.role = role;
							newUser = await newUser.save();
							if (newUser) {
								const success = successResponse(
									undefined,
									undefined,
									'Usuario creado satisfactoriamente'
								);
								return res.status(success.code).json(success);
							} else {
								errResp.message = 'Ha ocurrido un error al crear este usuario';
							}
						} else {
							if (user.username === username) {
								errResp.message =
									'Ya existe alguien registrado con este usuario';
							} else {
								errResp.message =
									'Ya existe alguien registrado con este correo';
							}
						}
					} else {
						errResp.message = 'El rol indicado es inválido';
					}
				} else {
					errResp.message = 'Tu rol no te permite crear usuarios';
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
	public async registerAdmin(req: Request, res: Response): Promise<void> {
		try {
			const { superAdminKey } = req.body;
			let valKey =
				!validator.isEmpty(superAdminKey) &&
				validator.isHexadecimal(superAdminKey);

			if (valKey) {
				if (superAdminKey === '404D635166546A576E5A723475377821') {
					const user = await User.findOne({
						where: {
							email: 'bdaa9812@gmail.com'
						}
					});

					if (!user) {
						let newUser = new User();

						newUser.email = 'bdaa9812@gmail.com';
						newUser.names = 'David Arriaga Avilez';
						newUser.password = await newUser.encryptPassword('David9812');
						newUser.role = 'ADMIN';
						newUser.username = 'david-arriaga-9812';

						newUser = await newUser.save();

						if (newUser) {
							res.status(200).json({
								newUser
							});
							return;
						}
					}
				}
			}
			throw new Error('Error');
		} catch (error) {
			res.status(400).json({ error });
		}
	}

	/** CLOSE */
	public async whoami(req: Request, res: Response): Promise<Response> {
		try {
			const userCredentials: ITokenData = req.body.authData as ITokenData;

			const user = await User.findOne({
				where: {
					id: userCredentials.id
				},
				relations: ['franchise']
			});

			if (user) {
				const successResp: ISuccessResponse<object> = successResponse(
					{
						id: user.id,
						names: user.names,
						role: user.role,
						username: user.username,
						franchise:
							user.franchise === null
								? null
								: {
										id: user.franchise.id,
										name: user.franchise.name,
										socialReason: user.franchise.socialReason
								  }
					},
					200
				);
				return res.status(successResp.code).json(successResp);
			}
			const error = errorResponse('No autorizado', 401, 'unauthorize');
			return res.status(error.code).json(error);
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
	public async getAllUsers(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const userCredentials: ITokenData = req.body.authData as ITokenData;

			if (validateIfIsAdmin(userCredentials)) {
				const users = await User.createQueryBuilder('users')
					.leftJoinAndSelect('users.franchise', 'franchise')
					.orderBy('users.createdAt', 'DESC')
					.getMany();

				if (users) {
					const successResp = successResponse(users, 200);

					return res.status(successResp.code).json(successResp);
				}
				errResp.message = 'Ha ocurrido un error al tratar de obtener los datos';
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
	public async asignUserToFranchise(
		req: Request,
		res: Response
	): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { userId, franchiseId } = req.body;

			let valFranchise: boolean =
				!validator.isEmpty(franchiseId) && validator.isInt(franchiseId);
			let valUser: boolean =
				!validator.isEmpty(userId) && validator.isInt(userId);

			if (valUser && valFranchise) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;

				if (validateIfIsAdmin(userCredentials)) {
					const user = await User.findOne({
						where: {
							id: userId
						},
						relations: ['franchise']
					});

					if (user) {
						if (user.role === 'ADMIN') {
							errResp.message =
								'No se le puede asignar una franquisia a un administrador';
						} else {
							if (user.franchise === null) {
								const franchise = await Franchise.findOne({
									where: {
										id: franchiseId
									}
								});
								if (franchise) {
									user.franchise = franchise;
									const result = await user.save();
									if (result) {
										const success = successResponse(
											undefined,
											undefined,
											'Usuario asignado correctamente'
										);
										return res.status(success.code).json(success);
									}
									errResp.message =
										'Ha ocurrido un error al realizar esta operación';
								} else {
									errResp.message =
										'La franquicia a la cual se desea asociar este usuario, no existe';
								}
							} else {
								errResp.message = 'El usuario ya tiene una franquicia asociada';
							}
						}
					} else {
						errResp.message = 'El usuario no existe';
					}
				} else {
					errResp.message = 'Tu rol no te permite realizar esta operación';
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

	public async deleteUser(req: Request, res: Response): Promise<Response> {
		try {
			const errResp: IErrorResponse = errorResponse();

			const { id } = req.params;

			let valId = validator.isNumeric(id.toString());

			if (valId) {
				const userCredentials: ITokenData = req.body.authData as ITokenData;
				if (validateIfIsAdmin(userCredentials)) {
					const user = await User.findOne(id, {
						relations: ['franchise']
					});
					if (user) {
						if (user.franchise === null) {
							const result = await User.delete({ id: user.id });

							if (result) {
								const success = successResponse(
									undefined,
									200,
									'Usuario eliminado'
								);
								return res.status(success.code).json(success);
							}
							errResp.message = 'No se pudo eliminar este usuario';
						} else {
							errResp.message =
								'No se puede eliminar a un usuario que está asignado a una franquicia';
						}
					} else {
						errResp.message = 'El usuario no existe';
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
}
