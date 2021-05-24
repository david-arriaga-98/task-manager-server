import { Response, Request, NextFunction } from 'express';
import { SelectQueryBuilder } from 'typeorm';

export interface IPagination {
	from: any;
	to: any;
	perPage: any;
	total: number | any;
	totalPages: number;
	currentPage: number;
	prevPage?: number | null;
	nextPage?: number | null;
	data: Array<object | any> | any;
}

declare module 'typeorm' {
	export interface SelectQueryBuilder<Entity> {
		paginate(get_raw?: boolean, per_page?: number | null): Promise<IPagination>;
	}
}

export function pagination(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	SelectQueryBuilder.prototype.paginate = async function (
		get_raw?: boolean,
		per_page?: number | null
	): Promise<IPagination> {
		let current_page = getPage(req);
		if (!per_page) per_page = getPerPage(req);
		else per_page = getPerPage(req, per_page);
		return await paginate(this, current_page, per_page, get_raw);
	};
	next();
}

const paginate = async function (
	builder: SelectQueryBuilder<any>,
	page: number,
	per_page: number,
	get_raw?: boolean
): Promise<IPagination> {
	let skip = (page - 1) * per_page;

	let res;

	if (get_raw) res = await builder.skip(skip).take(per_page).getRawMany();
	else res = await builder.skip(skip).take(per_page).getMany();

	const count = res.length;
	const totalPages = count / per_page;

	return {
		from: skip <= count ? skip + 1 : null,
		to: count > skip + per_page ? skip + per_page : count,
		perPage: per_page,
		total: count,
		totalPages: Math.ceil(totalPages),
		currentPage: page,
		prevPage: page > 1 ? page - 1 : null,
		nextPage: count > skip + per_page ? page + 1 : null,
		data: res || []
	};
};

export function getPerPage(req: Request, defaultPerPage: number = 10) {
	return parseInt(req.query.per_page as string) || defaultPerPage;
}
export function getPage(req: Request, defaultPage: number = 1) {
	return parseInt(req.query.page as string) || defaultPage;
}
