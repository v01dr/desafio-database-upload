// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Transaction type not allowed');
    } else if (
      type === 'outcome' &&
      value > (await transactionsRepository.getBalance()).total
    ) {
      throw new AppError('Outcome value exceeds total amount');
    }

    const receivedCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    let category_id = '0';

    if (receivedCategory) {
      category_id = receivedCategory.id;
    } else {
      const savedCategory = await categoriesRepository.save({
        title: category,
      });
      category_id = savedCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    delete transaction.category_id;
    const result = { ...transaction };

    return result;
  }
}

export default CreateTransactionService;
