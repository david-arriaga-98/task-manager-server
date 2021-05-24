export interface ISuccessResponse<T> {
	status: string;
	code: number;
	message?: string;
	data?: T;
}

export interface IErrorResponse {
	status: string;
	code: number;
	message: string;
}

export const successResponse = <T>(
	data?: T,
	code: number = 200,
	message: string = 'Proceso realizado satisfactoriamente'
): ISuccessResponse<T> => {
	return {
		status: 'success',
		code,
		data,
		message
	};
};

export const errorResponse = (
	message: string = 'Ha ocurrido un error al procesar su petición',
	code: number = 400,
	status: string = 'error'
): IErrorResponse => {
	return {
		status,
		code,
		message
	};
};
