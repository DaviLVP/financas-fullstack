const Card = require('../model/card');
const Transaction = require('../model/transaction');

module.exports = {
  async create(req, res) {
    try {
      const { name, dueDay, limit } = req.body;
      const newCard = await Card.create({ name, dueDay, limit: limit || 0 });
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
      const { name, dueDay, limit } = req.body;
      const card = await Card.findByIdAndUpdate(id, { name, dueDay, limit }, { new: true, runValidators: true });
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

        // Período de faturamento: antes do vencimento = fatura em aberto, após = acumulando próxima
        let periodStart, periodEnd, isPaid;
        if (todayDay <= dueDay) {
          // Fatura atual: do dia dueDay+1 do mês passado até dueDay deste mês
          periodStart = new Date(today.getFullYear(), today.getMonth() - 1, dueDay + 1);
          periodEnd   = new Date(today.getFullYear(), today.getMonth(), dueDay, 23, 59, 59);
          isPaid = false;
        } else {
          // Fatura fechada: acumulando próxima (dueDay+1 deste mês até dueDay do próximo)
          periodStart = new Date(today.getFullYear(), today.getMonth(), dueDay + 1);
          periodEnd   = new Date(today.getFullYear(), today.getMonth() + 1, dueDay, 23, 59, 59);
          isPaid = true;
        }

        const transactions = await Transaction.find({
          cardId: card._id,
          type: 'expense',
          date: { $gte: periodStart, $lte: periodEnd }
        }).sort({ date: -1 });

        const totalFatura = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          ...card.toObject(),
          fatura: totalFatura.toFixed(2),
          isPaid,
          periodStart,
          periodEnd,
          transactions
        };
      }));

      return res.status(200).json(faturas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar faturas', details: error.message });
    }
  }
};