import httpStatus from 'http-status';
import db from '../../config/sequelize';

const Transaction = db.Transaction;

/**
 * Load transaction and append to req.
 */
function load(req, res, next, id) {
    Transaction.findById(id)
        .then((transaction) => {
            if (!transaction) {
                const e = new Error('Transaction does not exist');
                e.status = httpStatus.NOT_FOUND;
                return next(e);
            }
            req.transaction = transaction; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}

/**
 * Get transaction
 * @returns {Transaction}
 */
function get(req, res) {
    return res.json(req.transaction);
}

/**
 * Create new transaction
 * @returns {Transaction}
 */
function create(req, res, next) {
    const transaction = Transaction.build({
        balance: 0,
    });

    transaction.save()
        .then(savedTransaction => res.json(savedTransaction))
        .catch(e => next(e));
}


export default { load, get, create };
