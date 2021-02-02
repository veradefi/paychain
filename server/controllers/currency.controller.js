import httpStatus from 'http-status';
import db from '../../config/sequelize';
import APIError from '../helpers/APIError'

const Currency = db.Currency;

/**
 * Load currency and append to req.
 */
function load(req, res, next, id) {
    Currency.findById(id)
        .then((currency) => {
            if (!currency) {
                const e = new APIError('Currency does not exist');
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

    console.log(currency.toJSON())
    currency.save()
        .then(savedCurrency => res.status(201).json(savedCurrency))
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
        .then(savedCurrency => res.status(200).json(savedCurrency))
        .catch(e => next(e));
}

/**
 * Search transaction
 * @returns [Transaction]
 */
function search(req, res, next) {
    const offset = parseInt(req.query.offset) || 0;
    const limit  = parseInt(req.query.limit) || 50;

    Currency.findAll({ limit, offset})
        .then(currencies => res.json(currencies))
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
            return currency.updateAttributes(update, {
                hooks: false,
                validate: false,
            })
            .then(savedCurrency => res.status(200).json(savedCurrency))
            .catch(e => next(e))
        } else {
            const upsert = {...query, ...update};
            Currency.create(upsert)
            .then(savedCurrency => res.status(201).json(savedCurrency))
            .catch(e => next(e))
        }
    })
};

export default { load, get, create, update, updateOrCreate, search };
