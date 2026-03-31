const Card = require('../model/card');
const Transaction = require('../model/transaction');

module.exports = {
  async create(req, res) {
    try {
      const { name, dueDay, closingDay, limit, accountId } = req.body;
      const newCard = await Card.create({ name, dueDay, closingDay: closingDay || undefined, limit: limit || 0, accountId: accountId || undefined });
      return res.status(201).json(newCard);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar cartão', details: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const cards = await Card.find();
      return res.status(200).json(cards);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar cartões', details: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, dueDay, closingDay, limit, accountId } = req.body;
      const card = await Card.findByIdAndUpdate(id, { name, dueDay, closingDay: closingDay || undefined, limit, accountId: accountId || undefined }, { new: true, runValidators: true });
      if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
      return res.status(200).json(card);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao atualizar cartão', details: error.message });
    }
  },

  async getFaturas(req, res) {
    try {
      const cards = await Card.find();
      const today = new Date();
      const todayDay = today.getDate();

      const faturas = await Promise.all(cards.map(async (card) => {
        const dueDay = card.dueDay;
        // Se não tem closingDay, usa dueDay como fallback (comportamento anterior)
        const closingDay = card.closingDay || dueDay;

        const isClosed = todayDay > closingDay;
        const isPaid = todayDay > dueDay;

        // Período da fatura atual: do dia closingDay+1 do mês passado até closingDay deste mês
        const periodStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1);
        const periodEnd   = new Date(today.getFullYear(), today.getMonth(), closingDay, 23, 59, 59);

        const transactions = await Transaction.find({
          cardId: card._id,
          type: 'expense',
          date: { $gte: periodStart, $lte: periodEnd }
        }).sort({ date: -1 });

        const totalFatura = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Próxima fatura: acumulando a partir do fechamento até o próximo fechamento
        let nextFatura = null;
        let nextPeriodEnd = periodEnd;
        if (isClosed) {
          const nextPeriodStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1);
          nextPeriodEnd         = new Date(today.getFullYear(), today.getMonth() + 1, closingDay, 23, 59, 59);

          const nextTransactions = await Transaction.find({
            cardId: card._id,
            type: 'expense',
            date: { $gte: nextPeriodStart, $lte: nextPeriodEnd }
          }).sort({ date: -1 });

          const totalNextFatura = nextTransactions.reduce((sum, t) => sum + t.amount, 0);

          nextFatura = {
            total: totalNextFatura.toFixed(2),
            periodStart: nextPeriodStart,
            periodEnd: nextPeriodEnd,
            transactions: nextTransactions
          };
        }

        // Períodos futuros: parcelas além do próximo período já exibido
        const futureRawTransactions = await Transaction.find({
          cardId: card._id,
          type: 'expense',
          date: { $gt: nextPeriodEnd }
        }).sort({ date: 1 });

        const futurePeriodMap = {};
        futureRawTransactions.forEach(t => {
          const tDate = new Date(t.date);
          const tDay  = tDate.getDate();
          let endYear  = tDate.getFullYear();
          let endMonth = tDate.getMonth(); // 0-indexed
          if (tDay > closingDay) {
            endMonth += 1;
            if (endMonth > 11) { endMonth = 0; endYear += 1; }
          }
          const key = `${endYear}-${String(endMonth).padStart(2, '0')}`;
          if (!futurePeriodMap[key]) {
            futurePeriodMap[key] = {
              periodStart: new Date(endYear, endMonth - 1, closingDay + 1),
              periodEnd:   new Date(endYear, endMonth, closingDay, 23, 59, 59),
              transactions: [],
              total: 0
            };
          }
          futurePeriodMap[key].transactions.push(t);
          futurePeriodMap[key].total += t.amount;
        });

        const futurePeriods = Object.entries(futurePeriodMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, p]) => ({ ...p, total: p.total.toFixed(2) }));

        return {
          ...card.toObject(),
          fatura: totalFatura.toFixed(2),
          isClosed,
          isPaid,
          periodStart,
          periodEnd,
          transactions,
          nextFatura,
          futurePeriods
        };
      }));

      return res.status(200).json(faturas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar faturas', details: error.message });
    }
  }
};