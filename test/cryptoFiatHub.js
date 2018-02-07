import chaiAsPromised from 'chai-as-promised'
import chai from 'chai'
import { BigNumber } from 'bignumber.js'
import { getFee, getOrderEtherValue, getOrderWeiValue } from '../scripts/cryptoFiatHelpers'
import { getWeiBalance } from '../scripts/helpers'

chai.use(chaiAsPromised)
    .use(require('chai-bignumber')(web3.BigNumber))
    .should()

const should = chai.should()
const expect = chai.expect()
const CryptoDollar = artifacts.require('CryptoDollar.sol')
const CryptoFiatHub = artifacts.require('CryptoFiatHub.sol')
const CryptoFiatStorageProxy = artifacts.require('CryptoFiatStorageProxy.sol')
const ProofRewards = artifacts.require('./ProofRewards.sol')
const Store = artifacts.require('./Store.sol')

contract('Cryptofiat Hub', (accounts) => {
  let store
  let cryptoDollar
  let cryptoFiatStorageProxy
  let cryptoFiatHub
  let proofRewards
  let wallet1 = accounts[0]
  let wallet2 = accounts[1]
  let amount = 1 * 10 ** 18

  beforeEach(async () => {
    store = await Store.deployed()
    cryptoDollar = await CryptoDollar.deployed()
    cryptoFiatHub = await CryptoFiatHub.deployed()
    proofRewards = await ProofRewards.deployed()
    cryptoFiatStorageProxy = await CryptoFiatStorageProxy.deployed()
  })

  describe('State variables', async () => {
    it('should set the initial blocknumber', async () => {
      let blockNumber = await cryptoFiatStorageProxy.getCreationBlockNumber(store.address)
      blockNumber.should.be.not.equal(0)
    })

    it('should set the Proof Token reference', async() => {
      let address = await cryptoFiatHub.proofToken.call()
      address.should.not.equal(0x0)
    })

    it('should set the CryptoDollar Token reference', async() => {
      let address = await cryptoFiatHub.cryptoDollar.call()
      address.should.not.equal(0x0)
    })

    it('should set the Store reference', async() => {
      let address = await cryptoFiatHub.store.call()
      address.should.not.equal(0x0)
    })
  })

  describe('Buying Tokens', async () => {
    let defaultOrder
    let exchangeRate

    before(async () => {
      defaultOrder = { from: wallet1, value: 1 * 10 ** 18 }
      exchangeRate = await cryptoFiatHub.exchangeRate.call()
    })

    it('should be able to buy CryptoDollar tokens', async() => {
      await cryptoFiatHub.buyCryptoDollar(defaultOrder).should.be.fulfilled
    })

    it('should increase the rewards contract balance by 0.5% of investment value', async () => {
      let initialBalance = await getWeiBalance(ProofRewards.address)
      let fee = getFee(defaultOrder.value, 0.005)
      let expectedPoolBalance = initialBalance + fee

      await cryptoFiatHub.buyCryptoDollar(defaultOrder)

      let balance = await getWeiBalance(ProofRewards.address)
      balance.should.be.bignumber.equal(expectedPoolBalance)
    })

    it('should increase the rewards current pool balance by 0.5% of investment value', async () => {
      let initialBalance = await proofRewards.currentPoolBalance()
      let fee = getFee(defaultOrder.value, 0.005)
      let expectedPoolBalance = initialBalance.plus(fee)

      await cryptoFiatHub.buyCryptoDollar(defaultOrder)

      let balance = await proofRewards.currentPoolBalance()
      balance.should.be.bignumber.equal(expectedPoolBalance)
    })

    it('should increase the total cryptodollar supply by 99% of invested value', async () => {
      let initialSupply = await cryptoDollar.totalSupply()
      let etherValue = await getOrderEtherValue(defaultOrder.value) //get the ether value of the order after fee
      let expectedIncrement = exchangeRate.times(etherValue)

      await cryptoFiatHub.buyCryptoDollar(defaultOrder)

      let supply = await cryptoDollar.totalSupply()
      let increment = supply.minus(initialSupply)
      increment.should.be.bignumber.equal(expectedIncrement)
    })

    it('should increment the buyer cryptoDollar token balance by 99% of invested value', async () => {
      let initialBalance = await cryptoDollar.balanceOf(wallet1)
      let etherValue = await getOrderEtherValue(defaultOrder.value)
      let expectedIncrement = exchangeRate.times(etherValue)

      await cryptoFiatHub.buyCryptoDollar(defaultOrder)

      let balance = await cryptoDollar.balanceOf(wallet1)
      let increment = balance.minus(initialBalance)
      increment.should.be.bignumber.equal(expectedIncrement)
    })

    it('should increment the buyer reserved ether balance by 99% of invested value', async () => {
      let initialReservedEther = await cryptoDollar.guaranteedEther(wallet1)
      let expectedIncrement = await getOrderWeiValue(defaultOrder.value)

      await cryptoFiatHub.buyCryptoDollar(defaultOrder)

      let reservedEther = await cryptoDollar.guaranteedEther(wallet1)
      let increment = reservedEther.minus(initialReservedEther)
      increment.should.be.bignumber.equal(expectedIncrement)
    })
  })

  describe('Selling Tokens', async () => {
    let params
    let exchangeRate
    let tokens

    before(async () => {
      params = { from: wallet1, gasPrice: 10 * 10 ** 9 }
      exchangeRate = await cryptoFiatHub.exchangeRate.call()
      tokens = 100
    })

    it('should be able to sell CryptoDollar tokens', async() => {
      await cryptoFiatHub.sellCryptoDollar(tokens, params).should.be.fulfilled
    })

    it('should decrease the total supply of cryptodollars', async() => {
      let initialSupply = await cryptoDollar.totalSupply()

      await cryptoFiatHub.sellCryptoDollar(tokens, params)

      let supply = await cryptoDollar.totalSupply()
      let increment = supply.minus(initialSupply)
      increment.should.be.bignumber.equal(-tokens)
    })

    it('should decrease the cryptodollar balance', async() => {
      let initialSupply = await cryptoDollar.balanceOf(wallet1)

      await cryptoFiatHub.sellCryptoDollar(tokens, params)

      let supply = await cryptoDollar.balanceOf(wallet1)
      let increment = supply.minus(initialSupply)
      increment.should.be.bignumber.equal(-tokens)
    })

    it('10(,00) CUSD Tokens should correctly increase investor ether balance (USD)', async() => {
      let initialBalance = web3.eth.getBalance(wallet1)
      let txn = await cryptoFiatHub.sellCryptoDollar(tokens, params)
      let balance = web3.eth.getBalance(wallet1)
      let txFee = params.gasPrice * txn.receipt.gasUsed
      let payment = web3.toWei(tokens / exchangeRate)

      let expectedIncrement = payment - txFee
      let increment = balance.minus(initialBalance)
      increment.should.be.bignumber.equal(expectedIncrement)
    })
  })

















    // it('should increase the rewards contract balance by 0.5% of investment value', async () => {
    //   let initialBalance = await getWeiBalance(ProofRewards.address)
    //   let fee = getFee(defaultOrder.value, 0.005)
    //   let expectedPoolBalance = initialBalance + fee

    //   await cryptoFiatHub.buyCryptoDollar(defaultOrder)

    //   let balance = await getWeiBalance(ProofRewards.address)
    //   balance.should.be.bignumber.equal(expectedPoolBalance)
    // })

    // it('should increase the rewards current pool balance by 0.5% of investment value', async () => {
    //   let initialBalance = await proofRewards.currentPoolBalance()
    //   let fee = getFee(defaultOrder.value, 0.005)
    //   let expectedPoolBalance = initialBalance.plus(fee)

    //   await cryptoFiatHub.buyCryptoDollar(defaultOrder)

    //   let balance = await proofRewards.currentPoolBalance()
    //   balance.should.be.bignumber.equal(expectedPoolBalance)
    // })

    // it('should increase the total cryptodollar supply by 99% of invested value', async () => {
    //   let initialSupply = await cryptoDollar.totalSupply()
    //   let etherValue = await getOrderEtherValue(defaultOrder.value) //get the ether value of the order after fee
    //   let expectedIncrement = exchangeRate.times(etherValue)

    //   await cryptoFiatHub.buyCryptoDollar(defaultOrder)

    //   let supply = await cryptoDollar.totalSupply()
    //   let increment = supply.minus(initialSupply)
    //   increment.should.be.bignumber.equal(expectedIncrement)
    // })

    // it('should increment the buyer cryptoDollar token balance by 99% of invested value', async () => {
    //   let initialBalance = await cryptoDollar.balanceOf(wallet1)
    //   let etherValue = await getOrderEtherValue(defaultOrder.value)
    //   let expectedIncrement = exchangeRate.times(etherValue)

    //   await cryptoFiatHub.buyCryptoDollar(defaultOrder)

    //   let balance = await cryptoDollar.balanceOf(wallet1)
    //   let increment = balance.minus(initialBalance)
    //   increment.should.be.bignumber.equal(expectedIncrement)
    // })

    // it('should increment the buyer reserved ether balance by 99% of invested value', async () => {
    //   let initialReservedEther = await cryptoDollar.guaranteedEther(wallet1)
    //   let expectedIncrement = await getOrderWeiValue(defaultOrder.value)

    //   await cryptoFiatHub.buyCryptoDollar(defaultOrder)

    //   let reservedEther = await cryptoDollar.guaranteedEther(wallet1)
    //   let increment = reservedEther.minus(initialReservedEther)
    //   increment.should.be.bignumber.equal(expectedIncrement)
    // })
})
