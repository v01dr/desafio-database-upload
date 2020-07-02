import { getCustomRepository, AdvancedConsoleLogger, getRepository, PromiseUtils } from 'typeorm';

import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

/**
interface TransactionDTO {
  title: string;
  type: string;
  value: number;
  category: string;
}
 */

interface CategoryDTO {
  title: string;
}

interface Request {
  transactionsFilename: string;
}


class ImportTransactionsService {
  async execute({ transactionsFilename }: Request): Promise<Transaction[]> {
    // TODO
    const transactions: Transaction[] = []

    const transactionsFilePath = path.join(
      uploadConfig.directory,
      transactionsFilename,
    );

    const transactionsFileExists = await fs.promises.stat(
      transactionsFilePath,
    );


    if (transactionsFileExists) {


      const transactionsBuffer: Buffer = await fs.promises.readFile(transactionsFilePath)
      await fs.promises.unlink(transactionsFilePath);
      let transactionsStrArray: string[] = transactionsBuffer.toString().split('\n')


      //Remove the firt line, a column description one
      transactionsStrArray.splice(0, 1)

      //Remove the empty element
      transactionsStrArray = transactionsStrArray.filter(t => t!='')

      let total = 0
      const transactionsRepository = getCustomRepository(TransactionsRepository);

      //Iterate through Transaction Array in string format
      await Promise.all(transactionsStrArray.map(async (transaction) => {

        const title = transaction.split(',')[0].trim()
        const type = transaction.split(',')[1].trim()
        const value = Number(transaction.split(',')[2].trim())
        const category = transaction.split(',')[3].trim()

        const categoriesRepository = getRepository(Category)

        if (type != 'income' && type != 'outcome') {
          throw new AppError('Transaction type not allowed')
        } else {
          //Check if the transaction type asks for sum or subtraction from the total
          total = (type === 'income')? (total + value) : (total - value) //(await transactionsRepository.getBalance()).total

          if (
            type === 'outcome' &&
            value > total
          ) {
            throw new AppError('Outcome value exceeds total amount.');
          }
        }

        //const data = await Promise.all([promise1, promise2])
        const receivedCategory = (await Promise.all([categoriesRepository.findOne({
          where: {
            title: category
          }
        })]))[0]

        let category_id = '0'

        console.log("Categoria recebida: " + receivedCategory?.id + '->' + Date.now() + "___" + receivedCategory?.title)
        if (receivedCategory) {
          category_id = receivedCategory.id
          console.log("Não vou salvar: " + category_id + '->' + Date.now() + "___" + category)
        } else {
          const savedCategory =  (await Promise.all([categoriesRepository.save({ title: category })]))[0]

          category_id = savedCategory.id
          console.log("Salvei: " + category_id + '->' + Date.now() + "___" + savedCategory.title)
          setTimeout(() => {}, 5000)
        }


        const newTransaction = transactionsRepository.create({
          title,
          value,
          type,
          category_id
        })

        transactions.push(newTransaction)

      }))

      //Save all transaction in a batch way
      await transactionsRepository.save(transactions);

    }
    else {
      throw new AppError('Upload failed')
    }

    return transactions
  }
}

export default ImportTransactionsService;
