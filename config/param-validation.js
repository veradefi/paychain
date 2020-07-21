import Joi from 'joi';

export default {
    createTransaction: {
        body: {
            to: Joi.number().integer().required(),
            from: Joi.number().integer().required(),
            amount: Joi.number().integer().required(),
            currency_id: Joi.number().integer().required(),
        },
    },
};
