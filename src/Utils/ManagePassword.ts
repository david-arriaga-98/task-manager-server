import bcrypt from 'bcryptjs';

export const encryptPassword = async (password: string): Promise<string> => {
	try {
		const salts: string = await bcrypt.genSalt(5);
		return await bcrypt.hash(password, salts);
	} catch (error) {
		throw error;
	}
};

export const comparePassword = async (
	password: string,
	hash: string
): Promise<boolean> => {
	try {
		const result: boolean = await bcrypt.compare(password, hash);
		return result;
	} catch (error) {
		throw error;
	}
};
