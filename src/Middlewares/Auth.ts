import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { errorResponse } from '../Utils/Responses';
import { ITokenData, verifyToken } from '../Utils/ManageToken';

export default (req: Request, res: Response, next: NextFunction) => {
	try {
		const error = errorResponse('No autorizado', 401, 'unauthorize');

		const token = req.headers.authorization?.split(' ');

		if (token === undefined || token.length === 0) {
			throw 'error';
		} else {
			if (token[0] === 'Bearer') {
				if (validator.isJWT(token[1])) {
					const data: ITokenData = verifyToken(token[1]);
					req.body.authData = data;
					next();
					return;
				}
			}
			error.message = 'El token ingresado no es correcto';
			res.status(error.code).json(error);
		}
	} catch (err) {
		const error = errorResponse('No autorizado', 401, 'unauthorize');
		res.status(error.code).json(error);
	}
};
