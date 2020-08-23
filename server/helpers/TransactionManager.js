import { getTransactionCount, signTransaction, web3 } from '../lib/web3';
import { decrypt } from '../helpers/crypto';

class Slot {
    params = {}; // eslint-disable-line
    transaction = {}; // eslint-disable-line
    pendingCallback = null; // eslint-disable-line
    successCallback = null; // eslint-disable-line
    errorCallback = null; // eslint-disable-line
    receiptTries = 0;
    constructor (params, pending, success, error) {
        this.params = params;
        this.pendingCallback = pending;
        this.successCallback = success;
        this.errorCallback = error;
    };

    getReceipt (transactionHash) {
        setTimeout(() => {
            web3.eth.getTransactionReceipt(transactionHash).then((receipt) => {
                this.receiptTries++;
                if (!receipt && this.receiptTries < 20) {
                    this.getReceipt(transactionHash);
                } else {
                    this.successCallback(receipt);
                }
            })
            .catch((error) => {
                // console.log(error);
                this.errorCallback(error);
            });
        }, 5000);
    };

    generateTransaction (nonce, params) {
        const txOptions = {
            nonce: web3.utils.toHex(nonce),
            gasLimit: web3.utils.toHex('6000000'),
            gasPrice: web3.utils.toHex('3000000000'),
            from: params.from,
        };

        txOptions.to = params.contractAddress;
        txOptions.data = web3.eth.abi.encodeFunctionCall({
            name: 'sendTransactions',
            type: 'function',
            inputs: [{
                type: 'address[]',
                name: 'recipients',
            }, {
                type: 'uint256[]',
                name: 'amounts',
            }],
        }, [params.addresses, params.amounts]);

        return txOptions;
    };
};

class TransactionManager {
    sending_queue = {};
    maxPending = 100;

    initSlot (fromAddress) {
        return new Promise((resolve, reject) => {
            getTransactionCount(fromAddress)
            .then((count) => {
                this.sending_queue[fromAddress] = {};
                this.sending_queue[fromAddress].fromAddress = fromAddress;
                this.sending_queue[fromAddress].slots = [];
                this.sending_queue[fromAddress].slotMaxPending = 250;
                this.sending_queue[fromAddress].nonce = count;
                // clearInterval(this.sending_queue[fromAddress].slotInterval);
                // this.sending_queue[fromAddress].slotInterval = setInterval(() => {
                //     this.processSlot(fromAddress);
                // }, 5000);

                resolve(this.sending_queue[fromAddress]);
            });
        });
    }

    addToSlot (fromAddress, params, pending, success, error) {
        const slot = new Slot(params, pending, success, error);
        this.sending_queue[fromAddress].slots.push(slot);

        // clearInterval(this.sending_queue[fromAddress].slotInterval);
        // this.sending_queue[fromAddress].slotInterval = setInterval(() => {
        //     this.processSlot(fromAddress);
        // }, 5000);

        // if (this.sending_queue[fromAddress].slots.length >= this.sending_queue[fromAddress].slotMaxPending) {
        //     this.processSlot(fromAddress);
        // }
        const _nonce = this.sending_queue[fromAddress].nonce++;
        console.log(_nonce);
        this.sendTransaction(slot, _nonce);

    }

    processSlot (fromAddress) {
        const queue = this.sending_queue[fromAddress];
        if (queue && queue.slots && queue.slots.length > 0) {
            this.sendBatchTransactions(queue);
        }
    }

    sendBatchTransactions (nonce, transactions, pendingCallback, successCallback, errorCallback, batchCallback) {
        // getTransactionCount(queue.fromAddress)
        // .then((nonce) => {
            const batch = new web3.BatchRequest();
            const chunk = transactions.length;
            const length = transactions.length;
            const transactionsChunks = [transactions];

            // for (let i = 0; i < length; i += chunk) {
            //     transactionsChunks.push( transactions.slice(i, i+chunk) );
            // }
            
            Promise.all(transactionsChunks.map((transactionsChunk, index) => {

                const _nonce      = parseInt(nonce + index);
                transactionsChunk = transactionsChunk.map(transaction => JSON.parse(transaction));

                const fromAccount = transactionsChunk[0].fromAcc;
                const addresses   = transactionsChunk.map(transaction => transaction.fromAcc.address);
                const amounts     = transactionsChunk.map(transaction => transaction.amount);

                // const params = {
                //     to: transaction.toAcc.address,
                //     from: transaction.fromAcc.address,
                //     privateKey: transaction.fromAcc.privateKey,
                //     amount: transaction.amount,
                //     contractAddress: transaction.currency.address,
                // };
                const params = {
                    contractAddress: process.env.CONTRACT_ADDRESS,
                    from: fromAccount.address,
                    privateKey: fromAccount.privateKey,
                    amounts: amounts,
                    addresses: addresses
                };

                const slot = new Slot(params, pendingCallback, successCallback, errorCallback);

                const slottransaction = slot.generateTransaction(_nonce, slot.params);
                const decryptedPrivKey = decrypt(params.privateKey);
                const signedTx = signTransaction(slottransaction, decryptedPrivKey);
                batch.add(web3.eth.sendSignedTransaction.request(signedTx, 'receipt', (err, transactionHash) => {
                    if (err) {
                        console.log("An error occurred" + err.toString());
                        // setTimeout(() => {
                        //     this.addToSlot(slot.params.from, slot.params, slot.pendingCallback, slot.successCallback, slot.errorCallback);
                        // }, 5000);
                        transactionsChunk.map(transaction => {
                            return slot.errorCallback(transaction, err, _nonce);
                        });

                        batchCallback(err.toString());
                        // return slot.errorCallback(transaction, err, _nonce);
                    } else {
                        // queue.nonce++;
                        console.log(transactionHash);

                        transactionsChunk.map(transaction => {
                            return slot.pendingCallback(transaction, transactionHash, _nonce);
                        });

                        batchCallback();
                        // return slot.pendingCallback(transaction, transactionHash, _nonce);
                        // return slot.getReceipt(transactionHash);
                    }
                }));
            }));

            batch.execute();
        // });
    }

    sendTransaction(slot, _nonce) {
        const transaction = slot.generateTransaction(_nonce, slot.params);
        console.log(transaction);
        const decryptedPrivKey = decrypt(slot.params.privateKey);
        const signedTx = signTransaction(transaction, decryptedPrivKey);
        
        web3.eth.sendSignedTransaction(signedTx, (err, transactionHash) => {
            if (err) {
                console.log("An error occurred" + err.toString());
                // setTimeout(() => {
                //     this.addToSlot(slot.params.from, slot.params, slot.pendingCallback, slot.successCallback, slot.errorCallback);
                // }, 5000);
                // return slot.errorCallback(err, _nonce);
            } else {
                return slot.pendingCallback(transactionHash, _nonce);
                // return slot.getReceipt(transactionHash);
            }
        });
    }

    addTransaction (params, pending, success, error) {
        if (!this.sending_queue[params.from]) {
            this.initSlot(params.from).then(() => {
                this.addToSlot(params.from, params, pending, success, error);
            });
        } else {
            this.addToSlot(params.from, params, pending, success, error);
        }
    }
}

export default TransactionManager;
