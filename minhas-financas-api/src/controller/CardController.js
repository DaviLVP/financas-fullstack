const Card = require('../model/card'); 

module.exports = {
  async create(req, res) {
    try {
      const { name, dueDay } = req.body;
      const newCard = await Card.create({ name, dueDay });
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
  }
};