import httpStatus from 'http-status';
import db from '../../config/sequelize';

const Currency = db.Currency;

/**
 * Load currency and append to req.
 */
function load(req, res, next, id) {
    Currency.findById(id)
        .then((currency) => {
            if (!currency) {
                const e = new Error('Currency does not exist');
                e.status = httpStatus.NOT_FOUND;
                return next(e);
            }
            req.currency = currency; // eslint-disable-line no-param-reassign
            return next();
        })
        .catch(e => next(e));
}

/**
 * Get currency
 * @returns {Currency}
 */
function get(req, res) {
    return res.json(req.currency);
}

/**
 * Create new currency
 * @returns {Currency}
 */
function create(req, res, next) {
    const currency = Currency.build({
        full_name: req.body.full_name,
        short_name: req.body.short_name,
        symbol: req.body.symbol,
        address: req.body.address,
    });
    currency.save()
        .then(savedCurrency => res.json(savedCurrency))
        .catch(e => next(e));
}

/**
 * Update existing currency
 * @property {string} req.body.address - New address.
 * @returns {Currency}
 */
function update(req, res, next) {
    const currency = req.currency;
    currency.address = req.body.address;

    currency.save()
        .then(savedCurrency => res.json(savedCurrency))
        .catch(e => next(e));
}

function updateOrCreate(req, res, next){
    const query = req.body.query || {};
    const update = req.body.update;

    Currency.findOne({
        where: query,
    })
    .then((currency) => {
        if (currency) {
            return currency.updateAttributes(update)
            .then(savedCurrency => res.json(savedCurrency))
            .catch(e => next(e))
        } else {
            const upsert = {...query, ...update};
            Currency.create(upsert)
            .then(savedCurrency => res.json(savedCurrency))
            .catch(e => next(e))
        }
    })
};

export default { load, get, create, update, updateOrCreate };
