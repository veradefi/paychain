module.exports = {
    "extends": "airbnb-base",
    "plugins": [
        "import"
    ],
    "rules": {
        "indent": ["error", 4],
        'no-console': 'off',
        "arrow-body-style": ["off"],
        "import/no-named-as-default": 0,
        "import/no-named-as-default-member": 0,
        "no-underscore-dangle": 0,
    },
    "parserOptions": {
        "sourceType": "module"
    }
};
