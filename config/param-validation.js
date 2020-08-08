import Joi from 'joi';

export default {
    createTransaction: {
        body: {
            to: Joi.required(),
            from: Joi.required(),
            amount: Joi.required()
        },
    },
};
