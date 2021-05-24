import jwt from 'jsonwebtoken';
import validator from 'validator';

const tokenKey = '0x4435527634364';

interface IFranchise {
	id: number;
	name: string;
	socialReason: string;
}

export interface ITokenData {
	id: number;
	names: string;
	username: string;
	role: string;
	franchise: IFranchise | null;
	iat: number;
	exp: number;
}

export const generateToken = (payload: ITokenData) => {
	try {
		const token: string = jwt.sign(payload, tokenKey);
		return token;
	} catch (error) {
		throw error;
	}
};

export const verifyToken = (token: string): ITokenData => {
	try {
		const clearToken: string = token.replace(' ', '');
		if (validator.isJWT(clearToken)) {
			const data: ITokenData = jwt.verify(clearToken, tokenKey) as ITokenData;
			return data;
		}
		throw new Error('The token is invalid');
	} catch (error) {
		throw error;
	}
};
