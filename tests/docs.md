This folder contains stress tests for the application. 
- Test modules assumes you have already setup your application, deployed contract and have some valid addresses with balances.
- You can run testcases using command `npm run test`. This command uses `API_URL` and `TX_PER_SEC` variables from .env file.
- `API_URL` variable specifies the remote server url against which test cases will be run.
- `TX_PER_SEC` variable specifies number of transactions. E.g. TX_PER_SEC=100 means a total of 100 transactions will be sent to the server.
- To override any of these variables in .env, you can append their value before `npm run test` command. E.g. to override `API_URL` value of .env, you can execute `API_URL=http://newurl.com npm run test` and testcases will be run on http://newurl.com
- To override multiple .env vars, add them before `npm run test` command like this:
  `API_URL=http://newurl.com TX_PER_SEC=100 npm run test`
