import { ITokenData } from './ManageToken';

export const validRoles: string[] = ['ADMIN', 'USER'];

export const validateRoles = (role: string) => {
	for (const rol of validRoles) {
		if (role === rol) return true;
	}
	return false;
};

export const validateIfIsAdmin = (userData: ITokenData): boolean => {
	if (
		userData === undefined ||
		userData === null ||
		userData.role === undefined
	) {
		throw new Error('The data is wrong');
	} else {
		return userData.role === 'ADMIN';
	}
};
