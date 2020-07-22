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
 * Search transaction
 * @returns [Transaction]
 */
function search(req, res, next) {
    const offset = parseInt(req.query.offset) || 0;
    const limit  = parseInt(req.query.limit) || 50;
    Transaction.findAll({ limit, offset,
          include: [
              { model: db.Account, as: 'fromAcc'},
              { model: db.Account, as: 'toAcc'},
              { model: db.Currency, as: 'currency'}
          ]
        })
        .then(transactions => res.json(transactions))
        .catch(e => next(e));
}

/**
 * Create new transaction
 * @returns {Transaction}
 */
function create(req, res, next) {
    const transaction = Transaction.build({
        from: req.body.from,
        to: req.body.to,
        amount: req.body.amount,
        currency_id: req.body.currency_id,
    });

    transaction.status = 'initiated';
    transaction.save()
        .then(savedTransaction => res.json(savedTransaction))
        .catch(e => next(e));
}

function stats(req, res, next) {
    Transaction.findAll({
        group: ['status'],
        attributes: ['status', [db.sequelize.fn('COUNT', 'status'), 'statusCount']],
    })
    .then(transactions => res.json(transactions))
    .catch(e => next(e));
}


export default { load, get, create, search, stats };
