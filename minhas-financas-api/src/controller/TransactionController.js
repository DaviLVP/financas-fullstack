const Transaction = require('../model/transaction');
const Reserve = require('../model/reserve');

module.exports = {
  // 1. CRIAR: Salva novas transações (com lógica de parcelas)
  async create(req, res) {
    try {
      const { description, totalAmount, type, date, cardId, installments = 1 } = req.body;

      if (!description || !totalAmount || !type || !date) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      }

      const transactionsToSave = [];
      const installmentAmount = totalAmount / installments;
      const baseDate = new Date(date);

      for (let i = 1; i <= installments; i++) {
        const installmentDate = new Date(baseDate);
        // Ajusta o mês para cada parcela
        installmentDate.setMonth(baseDate.getMonth() + (i - 1));

        const installmentInfo = installments > 1 ? `${i}/${installments}` : null;
        const finalDescription = installments > 1 ? `${description} (${installmentInfo})` : description;

        transactionsToSave.push({
          description: finalDescription,
          amount: installmentAmount,
          type: type,
          date: installmentDate,
          cardId: cardId || null,
          installmentInfo: installmentInfo
        });
      }

      const createdTransactions = await Transaction.insertMany(transactionsToSave);
      return res.status(201).json(createdTransactions);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar transação', details: error.message });
    }
  },

  // 2. LISTAR: Busca todas as transações e traz os dados do cartão junto
  async getAll(req, res) {
    try {
      const transactions = await Transaction.find().populate('cardId').sort({ date: -1 });
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar', details: error.message });
    }
  },

  // 3. RESUMO: Cálculos de Saldo e Despesas Mensais
  async getSummary(req, res) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; 
      const currentYear = currentDate.getFullYear();

      const transactions = await Transaction.find();

      let totalIncome = 0;
      let totalExpense = 0;
      let currentMonthExpense = 0; 

      transactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else if (t.type === 'expense') {
          totalExpense += t.amount; 
          
          const tDate = new Date(t.date);
          if ((tDate.getMonth() + 1) === currentMonth && tDate.getFullYear() === currentYear) {
            currentMonthExpense += t.amount; 
          }
        }
      });

      const reserves = await Reserve.find();
      let totalGuardado = 0;
      let totalInvestido = 0;
      reserves.forEach(r => {
        if (r.type === 'guardado') totalGuardado += r.amount;
        else if (r.type === 'investido') totalInvestido += r.amount;
      });

      const saldoGeral = totalIncome - totalExpense;
      const totalReservas = totalGuardado + totalInvestido;

      return res.status(200).json({
        mesAtual: `${currentMonth}/${currentYear}`,
        receitaTotal: totalIncome.toFixed(2),
        despesaDesteMes: currentMonthExpense.toFixed(2),
        despesaTotal: totalExpense.toFixed(2),
        saldoGeral: saldoGeral.toFixed(2),
        saldoDisponivel: (saldoGeral - totalReservas).toFixed(2),
        totalGuardado: totalGuardado.toFixed(2),
        totalInvestido: totalInvestido.toFixed(2),
        totalReservas: totalReservas.toFixed(2)
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao gerar relatório', details: error.message });
    }
  },

  // 4. ATUALIZAR: Edita uma transação específica
  async update(req, res) {
    try {
      const { id } = req.params;
      const { description, amount, type, date, cardId } = req.body;

      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        { description, amount, type, date, cardId },
        { new: true } // Para retornar o documento já atualizado
      );

      if (!updatedTransaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      return res.status(200).json(updatedTransaction);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar transação', details: error.message });
    }
  },

  // 5. DELETAR: Remove uma transação do banco
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedTransaction = await Transaction.findByIdAndDelete(id);

      if (!deletedTransaction) {
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      return res.status(200).json({ message: 'Transação deletada com sucesso' });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao deletar transação', details: error.message });
    }
  }
};