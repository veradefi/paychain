import express from 'express';
import transactionCtrl from '../controllers/transaction.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/transactions - Create new transaction */
    .post(transactionCtrl.create);

router.route('/:transactionId')

    /** GET /api/transactions/:transactionId - Get transaction */
    .get(transactionCtrl.get);

/** Load transaction when API with transactionId route parameter is hit */
router.param('transactionId', transactionCtrl.load);

export default router;
