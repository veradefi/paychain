import express from 'express';
import accountRoutes from './account.route';
import transactionRoutes from './transaction.route';
import currencyRoutes from './currency.route';
import { version } from '../../package.json';
import child_process from 'child_process';

const router = express.Router(); // eslint-disable-line new-cap

router.get('/', (req, res) => {
      const revision = child_process
        .execSync('git rev-parse --short HEAD')
        .toString().trim();

      const date = child_process
        .execSync('git log -1 --format=%cd')
        .toString().trim();
      res.send('API Version v' + version + ' commit ' + revision + ' at ' + date +' <a href="https://app.apiary.io/fpblockchain/editor">docs</a>') 
  }
);

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

router.get('/*', (req, res) =>
  res.status(404) 
     .send('Not Found')
);



export default router;
