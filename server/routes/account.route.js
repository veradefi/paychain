import express from 'express';
import accountCtrl from '../controllers/account.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/accounts - Create new account */
    .post(accountCtrl.create);

router.route('/:accountId')

    /** GET /api/accounts/:accountId - Get account */
    .get(accountCtrl.get);

/** Load account when API with accountId route parameter is hit */
router.param('accountId', accountCtrl.load);

export default router;
