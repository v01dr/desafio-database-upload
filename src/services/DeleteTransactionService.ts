import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface DeleteResponse {
  "ok": string;
}

class DeleteTransactionService {
  public async execute( id:string ): Promise<DeleteResponse> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne({
      where: {
        id
      }
    });

    if(transaction){
      await transactionsRepository.remove(transaction)
    } else{
      throw new AppError("Transaction not found")
    }

    return { ok: "Transaction deleted" }
  }
}

export default DeleteTransactionService;
