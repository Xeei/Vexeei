import express, { Router } from 'express';
import * as controller from '../controller/map.controller.js';

const router: Router = express.Router();

router.get('/uni', controller.getUniversities);
router.get('/uni/hex', controller.getUniHexagons);

export default router;
