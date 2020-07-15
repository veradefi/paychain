import express from 'express';
import testCtrl from '../controllers/test.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    /** GET /api/tests - Get testcases UI view */
    .get(testCtrl.index);

router.route('/start')

    /** POST /api/tests - Start testcases */
    .post(testCtrl.start);

router.route('/init')
  
    /** POST api/tests/init - Initialize testcases */
    .post(testCtrl.init);

export default router;
