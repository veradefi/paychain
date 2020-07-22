import express from 'express';
import validate from 'express-validation';
import transactionCtrl from '../controllers/transaction.controller';
import paramValidation from '../../config/param-validation';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** POST /api/transactions - Create new transaction */
    .post(validate(paramValidation.createTransaction), transactionCtrl.create)
    /** GET /api/transactions - Search transactions */
    .get(transactionCtrl.search);

router.route('/stats')
    .get(transactionCtrl.stats)

router.route('/:transactionId')

    /** GET /api/transactions/:transactionId - Get transaction */
    .get(transactionCtrl.get);

/** Load transaction when API with transactionId route parameter is hit */
router.param('transactionId', transactionCtrl.load);

export default router;
