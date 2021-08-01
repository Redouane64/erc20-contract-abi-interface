import { config } from 'dotenv'
config()

import Web3 from 'web3'
import { Wallet } from 'ethers'

import { abi } from '../assets/Bridge.json'

const provider_uri = String(process.env.PROVIDER_URI)
const contract_address = String(process.env.CONTRACT_ADDRESS)
const mnemonic = String(process.env.MNEMONIC)


const web3 = new Web3()
const provider = new Web3.providers.WebsocketProvider(provider_uri)
web3.setProvider(provider)

const wallet = Wallet.fromMnemonic(mnemonic)
web3.eth.accounts.privateKeyToAccount(wallet.privateKey)

const contract = new web3.eth.Contract(<any>abi, contract_address, {
    from: wallet.address
});

test('Update Token Name', async () => {

    const method = contract.methods.updateTokenName('REDCOIN', 'Coin By Redouane S.')

    const gas = await web3.eth.estimateGas({ 
        from: wallet.address,
        to: contract_address,
        value: 0,
        data: method.encodeABI()
    });

    const signedTx = await web3.eth.accounts.signTransaction({
        from: wallet.address,
        to: contract_address,
        data: method.encodeABI(),
        gas
    }, wallet.privateKey)

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!)

    expect(receipt.status)
    expect(receipt.transactionHash)

}, 60000)