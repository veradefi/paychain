import EventEmitter from 'events';
import { getTransactionCount, web3, transfer } from '../lib/web3';

class Slot {
    slot = {}; 

    constructor (nonce, params, success, error) {
        this.slot.transaction = this.generateTransaction(nonce, params);
        this.slot.params = params;
        this.slot.nonce = nonce;
        this.slot.successCallback = success;
        this.slot.errorCallback = error;
    };

    process () {
        return new Promise((resolve, reject) => {
            const shouldFail = this.slot.nonce % 2 == 0;
            console.log(shouldFail);
            if (shouldFail) {
                this.slot.transaction.nonce = "0x0";
            }

            return transfer(this.slot.transaction, "").then((receipt) => {
                console.log("receipt");
                this.slot.successCallback(receipt);
                return resolve(receipt);
            })
            .catch((error) => {
                console.log("error", error.toString());
                this.slot.errorCallback(error);
                return reject(error);
            });
        });
    };

    generateTransaction (nonce, params) {
        const txOptions = {
            nonce: web3.utils.toHex(nonce),
            gasLimit: web3.utils.toHex('210000'),
            gasPrice: web3.utils.toHex('3000000000'),
            from: params.from,
        };

        txOptions.to = params.contractAddress;
        txOptions.data = web3.eth.abi.encodeFunctionCall({
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'to',
            }, {
                type: 'uint256',
                name: 'tokens',
            }],
        }, [params.to, params.amount]);

        return txOptions;
    };
};

class TransactionManager extends EventEmitter {
    slots = {};
    testCount = 0;
    initSlot (fromAddress) {
        return new Promise((resolve, reject) => {
            getTransactionCount(fromAddress)
            .then((count) => {
                this.slots[fromAddress] = {};
                this.slots[fromAddress].nonce = count;
                this.slots[fromAddress].slots = new Array();

                resolve(this.slots[fromAddress]);
            });
        });
    }

    addToSlot (fromAddress, params, success, error) {
        const nonce = this.slots[fromAddress].nonce;
        this.slots[fromAddress].nonce++;
        const slot = new Slot(nonce, params, success, error);
        slot.process().then(() => {
            // remove slot element
            // this.slots[fromAddress].slots = ;
        })
        .catch((error) => {
            // remove slot element
            this.slots[fromAddress].nonce = nonce;
        })

        this.slots[fromAddress].slots.push(slot);
    }

    addTransaction (params, success, error) {
        if (!this.slots[params.from]) {
            this.initSlot(params.from).then(() => {
                this.addToSlot(params.from, params, success, error);
            });
        } else {
            this.addToSlot(params.from, params, success, error);
        }
    }
}

export default TransactionManager;
