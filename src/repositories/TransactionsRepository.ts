import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {

  public async getBalance(): Promise<Balance> {
    // TODO
    let transactions: Transaction[]
    transactions = await super.find();

    const income = transactions.reduce((totalIncome, transaction) => {
      if (transaction.type === 'income') {
        totalIncome += transaction.value;
      }

      return totalIncome;
    }, 0);

    const outcome = transactions.reduce((totalOutcome, transaction) => {
      if (transaction.type === 'outcome') {
        totalOutcome += transaction.value;
      }

      return totalOutcome;
    }, 0);

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
