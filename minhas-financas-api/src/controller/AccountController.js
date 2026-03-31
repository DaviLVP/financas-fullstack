const Account = require('../model/account');
const Card = require('../model/card');
const Transaction = require('../model/transaction');

// Para cada cartão vinculado, soma os débitos de faturas cujo vencimento já passou
async function computeCardDebits(account, linkedCards) {
  const today = new Date();
  let totalDebits = 0;
  const pendingDebits = []; // faturas futuras (vencimento ainda não chegou)

  for (const card of linkedCards) {
    const closingDay = card.closingDay || card.dueDay;
    const dueDay = card.dueDay;

    // Ponto de partida: o mais recente entre criação da conta e criação do cartão
    const startDate = new Date(
      Math.max(new Date(account.createdAt).getTime(), new Date(card.createdAt).getTime())
    );

    let closingYear = startDate.getFullYear();
    let closingMonth = startDate.getMonth(); // 0-indexed

    while (true) {
      // Data de fechamento deste ciclo
      const closingDate = new Date(closingYear, closingMonth, closingDay, 23, 59, 59);

      // Data de vencimento: se closingDay > dueDay → vence no mês seguinte ao fechamento
      let dueYear = closingYear;
      let dueMonth = closingMonth;
      if (closingDay > dueDay) {
        dueMonth += 1;
        if (dueMonth > 11) { dueMonth = 0; dueYear += 1; }
      }
      const dueDate = new Date(dueYear, dueMonth, dueDay);

      // Se o vencimento está muito no futuro, para
      if (dueDate > new Date(today.getFullYear(), today.getMonth() + 2, 0)) break;

      // Período de faturamento deste ciclo
      const periodStart = new Date(closingYear, closingMonth - 1, closingDay + 1);
      const periodEnd   = new Date(closingYear, closingMonth, closingDay, 23, 59, 59);

      const faturaTransactions = await Transaction.find({
        cardId: card._id,
        type: 'expense',
        date: { $gte: periodStart, $lte: periodEnd }
      });
      const faturaTotal = faturaTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (faturaTotal > 0) {
        if (dueDate <= today) {
          // Vencimento já passou → débito efetivado
          totalDebits += faturaTotal;
        } else {
          // Vencimento futuro → débito pendente
          pendingDebits.push({
            cardName: card.name,
            dueDate,
            total: faturaTotal.toFixed(2)
          });
        }
      }

      closingMonth += 1;
      if (closingMonth > 11) { closingMonth = 0; closingYear += 1; }
    }
  }

  return { totalDebits, pendingDebits };
}

module.exports = {
  async create(req, res) {
    try {
      const { name, initialBalance } = req.body;
      const account = await Account.create({ name, initialBalance: initialBalance || 0 });
      return res.status(201).json(account);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar conta', details: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const accounts = await Account.find();
      const today = new Date();

      const result = await Promise.all(accounts.map(async (account) => {
        // Receitas vinculadas a esta conta
        const incomeTransactions = await Transaction.find({ accountId: account._id, type: 'income' });
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Cartões vinculados
        const linkedCards = await Card.find({ accountId: account._id });

        const { totalDebits, pendingDebits } = await computeCardDebits(account, linkedCards);

        const balance = account.initialBalance + totalIncome - totalDebits;
        const totalPending = pendingDebits.reduce((sum, p) => sum + Number(p.total), 0);

        return {
          ...account.toObject(),
          balance: balance.toFixed(2),
          totalIncome: totalIncome.toFixed(2),
          totalDebits: totalDebits.toFixed(2),
          pendingDebits,
          projectedBalance: (balance - totalPending).toFixed(2),
          linkedCards: linkedCards.map(c => ({ _id: c._id, name: c.name, dueDay: c.dueDay }))
        };
      }));

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar contas', details: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, initialBalance } = req.body;
      const account = await Account.findByIdAndUpdate(id, { name, initialBalance }, { new: true, runValidators: true });
      if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
      return res.status(200).json(account);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar conta', details: error.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const account = await Account.findByIdAndDelete(id);
      if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
      return res.status(200).json({ message: 'Conta removida com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover conta', details: error.message });
    }
  }
};
