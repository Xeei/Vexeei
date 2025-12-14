import * as models from '../models/map.model';
import type { NextFunction, Request, Response } from 'express';

export async function getUniversities(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const universities = await models.getUniversities();
		return res.status(200).json(universities);
	} catch (error) {
		return next(error);
	}
}

export async function getUniHexagons(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const hexagons = await models.getUniHexagons();
		return res.status(200).json(hexagons);
	} catch (error) {
		return next(error);
	}
}
