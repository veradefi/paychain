import express from 'express';
import accountRoutes from './account.route';
import transactionRoutes from './transaction.route';
import currencyRoutes from './currency.route';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount account routes at /account
router.use('/accounts', accountRoutes);

// mount transaction routes at /transaction
router.use('/transactions', transactionRoutes);

// mount currency routes at /test
router.use('/currency', currencyRoutes);

export default router;
