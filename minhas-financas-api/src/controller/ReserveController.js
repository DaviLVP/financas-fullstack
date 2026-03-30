const Reserve = require('../model/reserve');

module.exports = {
  // 1. CRIAR: Guarda ou investe uma parte do saldo
  async create(req, res) {
    try {
      const { description, amount, type, date } = req.body;

      if (!description || !amount || !type || !date) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: 'O valor deve ser maior que zero' });
      }

      const reserve = await Reserve.create({ description, amount, type, date });
      return res.status(201).json(reserve);
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao criar reserva', details: error.message });
    }
  },

  // 2. LISTAR: Busca todas as reservas
  async getAll(req, res) {
    try {
      const reserves = await Reserve.find().sort({ date: -1 });
      return res.status(200).json(reserves);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar reservas', details: error.message });
    }
  },

  // 3. RESUMO: Totais por tipo (guardado e investido)
  async getSummary(req, res) {
    try {
      const reserves = await Reserve.find();

      let totalGuardado = 0;
      let totalInvestido = 0;

      reserves.forEach(r => {
        if (r.type === 'guardado') totalGuardado += r.amount;
        else if (r.type === 'investido') totalInvestido += r.amount;
      });

      return res.status(200).json({
        totalGuardado: totalGuardado.toFixed(2),
        totalInvestido: totalInvestido.toFixed(2),
        totalReservas: (totalGuardado + totalInvestido).toFixed(2)
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao gerar resumo de reservas', details: error.message });
    }
  },

  // 4. DELETAR: Remove uma reserva (saque/resgate)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Reserve.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }

      return res.status(200).json({ message: 'Reserva removida com sucesso' });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao remover reserva', details: error.message });
    }
  }
};
