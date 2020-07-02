import { Router } from 'express';
import { getCustomRepository, getRepository } from 'typeorm';
import multer from 'multer';

import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import Category from '../models/Category';
//import AppError from '../errors/AppError';

import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

interface CategoryDTO {
  id: string;
  title: string,
  created_at: Date;
  updated_at: Date;
}

interface CompleteTransaction {
  id: string;
  title: string;
  value: number;
  category: CategoryDTO,
  created_at: Date;
  updated_at: Date;
}


const transactionsRouter = Router();
const upload = multer(uploadConfig);


transactionsRouter.get('/', async (request, response) => {

  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find();


  let result = {}
  if (transactions.length === 0) {
    result = { ...transactions };
  } else {
    const balance = await transactionsRepository.getBalance();

    const categoriesRepository = getRepository(Category)

    const completeTransactions: CompleteTransaction[] = []
    for (let transaction of transactions) {
      const category = await categoriesRepository.findOneOrFail({
        where: {
          id: transaction.category_id
        }
      })

      delete (transaction.category_id)

      const categoryDTO: CategoryDTO = {
        id: category.id,
        title: category.title,
        created_at: category.created_at,
        updated_at: category.updated_at
      }
      const completeTransaction: CompleteTransaction = {
        id: transaction.id,
        title: transaction.title,
        value: transaction.value,
        category: categoryDTO,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }

      completeTransactions.push(completeTransaction)
    }

    result = { "transactions": completeTransactions, balance };
  }

  return response.json(result);

});

transactionsRouter.post('/', async (request, response) => {

  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    category
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params

  const deleteTransactionService = new DeleteTransactionService()
  const deleteResponse = await deleteTransactionService.execute(id)


  return response.json(deleteResponse)

});

transactionsRouter.post(
  '/import',
  upload.single('transactions_file'),
  async (request, response) => {
  // TODO
  const importTransactionsService = new ImportTransactionsService()
  const transactions = await importTransactionsService.execute({
    transactionsFilename: request.file.filename
  })

  const transactionsRepository = getCustomRepository(TransactionsRepository);
  let result = {}
  if (transactions.length === 0) {
    result = { ...transactions };
  } else {
    const balance = await transactionsRepository.getBalance();

    const categoriesRepository = getRepository(Category)

    const completeTransactions: CompleteTransaction[] = []

    for (let transaction of transactions) {

      const category = await categoriesRepository.findOneOrFail({
        where: {
          id: transaction.category_id
        }
      })

      delete (transaction.category_id)

      const categoryDTO: CategoryDTO = {
        id: category.id,
        title: category.title,
        created_at: category.created_at,
        updated_at: category.updated_at
      }
      const completeTransaction: CompleteTransaction = {
        id: transaction.id,
        title: transaction.title,
        value: transaction.value,
        category: categoryDTO,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }

      completeTransactions.push(completeTransaction)
    }

    result = { "transactions": completeTransactions, balance };
  }

  return response.json(result);

});

export default transactionsRouter;
