import { Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './services/api'
import './index.css'

// --- HEADER ---
const Header = ({ mesAtual }) => {
  const location = useLocation()
  const isReserves = location.pathname === '/reservas'

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <div className="brand-icon">💰</div>
        Minhas Finanças
      </Link>
      <nav className="header-nav">
        <Link to="/" className={`nav-link ${!isReserves ? 'nav-link-active' : ''}`}>Dashboard</Link>
        <Link to="/reservas" className={`nav-link ${isReserves ? 'nav-link-active' : ''}`}>Reservas</Link>
      </nav>
      {mesAtual && (
        <span className="header-date">📅 {mesAtual}</span>
      )}
    </header>
  )
}

// --- HELPERS ---
const fmt = (val) =>
  Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// --- MODAL RÁPIDO DE RESERVA ---
const QuickReserveModal = ({ saldoDisponivel, onClose, onSaved }) => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('guardado')
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Number(amount) > Number(saldoDisponivel)) {
      setError(`Valor maior que o saldo disponível (R$ ${fmt(saldoDisponivel)})`)
      return
    }
    setLoading(true)
    try {
      await api.post('/reserves', { description, amount: Number(amount), type, date })
      onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Alocar para Reserva</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="reserve-available-hint">
          <span>Saldo disponível</span>
          <strong>R$ {fmt(saldoDisponivel)}</strong>
        </div>

        <div className="type-toggle" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={`type-toggle-btn ${type === 'guardado' ? 'type-toggle-saved' : ''}`}
            onClick={() => setType('guardado')}
          >
            🏦 Guardar
          </button>
          <button
            type="button"
            className={`type-toggle-btn ${type === 'investido' ? 'type-toggle-invested' : ''}`}
            onClick={() => setType('investido')}
          >
            📊 Investir
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input
              type="text"
              className="form-input"
              placeholder={type === 'guardado' ? 'Ex: Reserva de emergência...' : 'Ex: Tesouro Direto, CDB...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              placeholder="0,00"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              required
            />
            {error && <span className="form-error">{error}</span>}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className={`btn ${type === 'guardado' ? 'btn-saved' : 'btn-invested'}`}
              disabled={loading}
            >
              {loading ? 'Salvando...' : type === 'guardado' ? '🏦 Guardar' : '📊 Investir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- DASHBOARD ---
const Dashboard = ({ summary, transactions, onDelete, onReserveSaved }) => {
  const navigate = useNavigate()
  const [showReserveModal, setShowReserveModal] = useState(false)

  return (
    <div className="page">
      {showReserveModal && (
        <QuickReserveModal
          saldoDisponivel={summary?.saldoDisponivel}
          onClose={() => setShowReserveModal(false)}
          onSaved={onReserveSaved}
        />
      )}

      <div className="page-title">
        <h1>Visão Geral</h1>
        <p>Acompanhe seus ganhos, gastos e saldo em tempo real.</p>
      </div>

      {/* Cards principais */}
      <div className="summary-grid">
        <div className="summary-card card-income">
          <div className="card-icon">📈</div>
          <span className="card-label">Ganhos Totais</span>
          <span className="card-value">R$ {fmt(summary?.receitaTotal)}</span>
          <span className="card-sub">Receitas acumuladas</span>
        </div>

        <div className="summary-card card-expense">
          <div className="card-icon">📉</div>
          <span className="card-label">Gastos do Mês</span>
          <span className="card-value">R$ {fmt(summary?.despesaDesteMes)}</span>
          <span className="card-sub">Despesas do mês atual</span>
        </div>

        <div className="summary-card card-balance">
          <div className="card-icon">💳</div>
          <span className="card-label">Saldo Disponível</span>
          <span className="card-value">R$ {fmt(summary?.saldoDisponivel ?? summary?.saldoGeral)}</span>
          <span className="card-sub">Saldo livre após reservas</span>
        </div>
      </div>

      {/* Faixa de Reservas */}
      {summary?.saldoDisponivel !== undefined && (
        <div className="reserve-strip">
          <div className="reserve-strip-info">
            <span className="reserve-strip-label">Em Reservas</span>
            <span className="reserve-strip-value">R$ {fmt(summary?.totalReservas)}</span>
            <span className="reserve-strip-sub">
              R$ {fmt(summary?.totalGuardado)} guardado · R$ {fmt(summary?.totalInvestido)} investido
            </span>
          </div>
          <div className="reserve-strip-actions">
            <button className="btn btn-alocar" onClick={() => setShowReserveModal(true)}>
              + Alocar para Reserva
            </button>
            <Link to="/reservas" className="btn btn-reserve-link">
              Ver Reservas →
            </Link>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="actions-bar">
        <button className="btn btn-income" onClick={() => navigate('/novo/income')}>
           Registrar Ganho
        </button>
        <button className="btn btn-expense" onClick={() => navigate('/novo/expense')}>
           Registrar Despesa
        </button>
      </div>

      {/* Tabela de Histórico */}
      <div className="table-section">
        <div className="table-header">
          <h3>Histórico de Transações</h3>
          <span className="badge">{transactions.length} registros</span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Nenhuma transação encontrada.<br />Comece registrando um ganho ou despesa.</p>
          </div>
        ) : (
          <table className="fin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 500 }}>{t.description}</td>
                  <td>
                    <span className={`type-badge ${t.type === 'income' ? 'type-income' : 'type-expense'}`}>
                      {t.type === 'income' ? '↑ Ganho' : '↓ Despesa'}
                    </span>
                  </td>
                  <td className={t.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {t.type === 'income' ? '+' : '−'} R$ {t.amount.toFixed(2)}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn btn-sm btn-icon-edit"
                        onClick={() => navigate(`/editar/${t._id}`)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-sm btn-icon-delete"
                        onClick={() => onDelete(t._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// --- PÁGINA DE RESERVAS ---
const ReservesPage = ({ summary, onSummaryRefresh }) => {
  const [reserves, setReserves] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('guardado')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const fetchReserves = async () => {
    try {
      const res = await api.get('/reserves')
      setReserves(res.data.reverse())
    } catch {}
  }

  useEffect(() => { fetchReserves() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/reserves', {
        description,
        amount: Number(amount),
        type,
        date,
      })
      setDescription('')
      setAmount('')
      setType('guardado')
      setDate(new Date().toISOString().split('T')[0])
      await fetchReserves()
      if (onSummaryRefresh) onSummaryRefresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja resgatar/remover esta reserva?')) return
    await api.delete(`/reserves/${id}`)
    await fetchReserves()
    if (onSummaryRefresh) onSummaryRefresh()
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>Reservas</h1>
        <p>Gerencie o que foi guardado e investido do seu saldo.</p>
      </div>

      {/* Cards de resumo de reservas */}
      <div className="summary-grid summary-grid-4">
        <div className="summary-card card-available">
          <div className="card-icon">✅</div>
          <span className="card-label">Saldo Disponível</span>
          <span className="card-value">R$ {fmt(summary?.saldoDisponivel)}</span>
          <span className="card-sub">Saldo geral menos reservas</span>
        </div>
        <div className="summary-card card-saved">
          <div className="card-icon">🏦</div>
          <span className="card-label">Total Guardado</span>
          <span className="card-value">R$ {fmt(summary?.totalGuardado)}</span>
          <span className="card-sub">Reserva de emergência</span>
        </div>
        <div className="summary-card card-invested">
          <div className="card-icon">📊</div>
          <span className="card-label">Total Investido</span>
          <span className="card-value">R$ {fmt(summary?.totalInvestido)}</span>
          <span className="card-sub">Aplicações e investimentos</span>
        </div>
        <div className="summary-card card-balance">
          <div className="card-icon">💰</div>
          <span className="card-label">Total em Reservas</span>
          <span className="card-value">R$ {fmt(summary?.totalReservas)}</span>
          <span className="card-sub">Guardado + Investido</span>
        </div>
      </div>

      <div className="reserves-layout">
        {/* Formulário de nova reserva */}
        <div className="reserve-form-card">
          <h3 className="section-title">Nova Reserva</h3>

          {/* Seletor de tipo */}
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'guardado' ? 'type-toggle-saved' : ''}`}
              onClick={() => setType('guardado')}
            >
              🏦 Guardar
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'investido' ? 'type-toggle-invested' : ''}`}
              onClick={() => setType('investido')}
            >
              📊 Investir
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'guardado' ? 'Ex: Reserva de emergência...' : 'Ex: Tesouro Direto, CDB...'}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn btn-full ${type === 'guardado' ? 'btn-saved' : 'btn-invested'}`}
              disabled={loading}
            >
              {loading ? 'Salvando...' : type === 'guardado' ? '🏦 Guardar Valor' : '📊 Registrar Investimento'}
            </button>
          </form>
        </div>

        {/* Lista de reservas */}
        <div className="table-section">
          <div className="table-header">
            <h3>Histórico de Reservas</h3>
            <span className="badge">{reserves.length} registros</span>
          </div>

          {reserves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏦</div>
              <p>Nenhuma reserva registrada ainda.<br />Comece guardando ou investindo parte do seu saldo.</p>
            </div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {reserves.map(r => (
                  <tr key={r._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {new Date(r.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.description}</td>
                    <td>
                      <span className={`type-badge ${r.type === 'guardado' ? 'type-saved' : 'type-invested'}`}>
                        {r.type === 'guardado' ? '🏦 Guardado' : '📊 Investido'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                      R$ {Number(r.amount).toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-icon-delete"
                        onClick={() => handleDelete(r._id)}
                        title="Resgatar / Remover"
                      >
                        🗑️ Resgatar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// --- MODAL DE NOVO CARTÃO ---
const NewCardModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/cards', { name, limit: Number(limit) || 0, dueDay: Number(dueDay) })
      onCreated(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">💳 Novo Cartão</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Cartão</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Nubank, Inter, Itaú..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dia de Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              className="form-input"
              placeholder="Ex: 10"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Limite (R$) <span className="form-label-hint">opcional</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0,00"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : '+ Criar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- PÁGINA DE FORMULÁRIO (CRIAR OU EDITAR) ---
const TransactionPage = ({ cards: initialCards, onSave, refreshCards }) => {
  const { id, type: urlType } = useParams()
  const navigate = useNavigate()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState(urlType || 'expense')
  const [installments, setInstallments] = useState(1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [cardId, setCardId] = useState('')
  const [cards, setCards] = useState(initialCards || [])
  const [showNewCard, setShowNewCard] = useState(false)
  const [editingCard, setEditingCard] = useState(null)

  useEffect(() => { setCards(initialCards || []) }, [initialCards])

  useEffect(() => {
    if (id) {
      api.get('/transactions').then(res => {
        const item = res.data.find(t => t._id === id)
        if (item) {
          setDescription(item.description)
          setAmount(item.amount)
          setType(item.type)
          setDate(new Date(item.date).toISOString().split('T')[0])
          setCardId(item.cardId?._id || item.cardId || '')
        }
      })
    }
  }, [id])

  const handleCardCreated = (newCard) => {
    const updated = [...cards, newCard]
    setCards(updated)
    setCardId(newCard._id)
    setShowNewCard(false)
    if (refreshCards) refreshCards()
  }

  const handleCardUpdated = (updatedCard) => {
    setCards(cards.map(c => c._id === updatedCard._id ? updatedCard : c))
    setEditingCard(null)
    if (refreshCards) refreshCards()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = {
      description,
      totalAmount: Number(amount),
      amount: Number(amount),
      type,
      date,
      installments: Number(installments),
      cardId: cardId || null,
    }
    if (id) await api.put(`/transactions/${id}`, data)
    else await api.post('/transactions', data)
    onSave()
    navigate('/')
  }

  const isExpense = type === 'expense'
  const title = id ? 'Editar Lançamento' : isExpense ? 'Nova Despesa' : 'Novo Ganho'
  const subtitle = id
    ? 'Atualize os dados do lançamento abaixo.'
    : isExpense
    ? 'Registre uma nova despesa no seu histórico.'
    : 'Registre um novo ganho no seu histórico.'

  return (
    <>
      {showNewCard && (
        <NewCardModal
          onClose={() => setShowNewCard(false)}
          onCreated={handleCardCreated}
        />
      )}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onUpdated={handleCardUpdated}
        />
      )}

      <div className="form-page">
        <Link to="/" className="form-back">← Voltar ao Dashboard</Link>

        <div className="form-card">
          <h2 className="form-title">{title}</h2>
          <p className="form-subtitle">{subtitle}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Salário, Aluguel, Supermercado..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            {isExpense && (
              <>
                {!id && (
                  <div className="form-group">
                    <label className="form-label">Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      className="form-input"
                      value={installments}
                      onChange={e => setInstallments(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Cartão de Crédito <span className="form-label-hint">opcional</span></label>

                  {cards.length > 0 ? (
                    <div className="card-selector">
                      <button
                        type="button"
                        className={`card-option ${cardId === '' ? 'card-option-selected' : ''}`}
                        onClick={() => setCardId('')}
                      >
                        <span className="card-option-icon">💵</span>
                        <span>Sem cartão</span>
                      </button>
                      {cards.map(c => (
                        <div key={c._id} className="card-option-wrapper">
                          <button
                            type="button"
                            className={`card-option ${cardId === c._id ? 'card-option-selected' : ''}`}
                            onClick={() => setCardId(c._id)}
                          >
                            <span className="card-option-icon">💳</span>
                            <span>{c.name}</span>
                            {c.limit > 0 && (
                              <span className="card-option-limit">
                                Limite: R$ {Number(c.limit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-edit-card"
                            onClick={() => setEditingCard(c)}
                            title="Editar cartão"
                          >✏️</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-cards-hint">Nenhum cartão cadastrado ainda.</p>
                  )}

                  <button
                    type="button"
                    className="btn-add-card"
                    onClick={() => setShowNewCard(true)}
                  >
                    + Adicionar novo cartão
                  </button>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <Link to="/" className="btn btn-ghost">Cancelar</Link>
              <button
                type="submit"
                className={`btn ${isExpense ? 'btn-expense' : 'btn-income'}`}
              >
                {id ? '💾 Salvar Alterações' : isExpense ? ' Registrar Despesa' : ' Registrar Ganho'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

const EditCardModal = ({ card, onClose, onUpdated }) => {
  const [name, setName] = useState(card.name)
  const [dueDay, setDueDay] = useState(card.dueDay)
  const [limit, setLimit] = useState(card.limit || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put(`/cards/${card._id}`, { name, dueDay: Number(dueDay), limit: Number(limit) || 0 })
      onUpdated(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">✏️ Editar Cartão</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Cartão</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Nubank, Inter, Itaú..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dia de Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              className="form-input"
              placeholder="Ex: 10"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Limite (R$) <span className="form-label-hint">opcional</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0,00"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- APP PRINCIPAL ---
export default function App() {
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [cards, setCards] = useState([])

  const fetchSummary = async () => {
    try {
      const res = await api.get('/transactions/summary')
      setSummary(res.data)
    } catch {}
  }

  const fetchData = async () => {
    try {
      const [resS, resT, resC] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
        api.get('/cards'),
      ])
      setSummary(resS.data)
      setTransactions(resT.data.reverse())
      setCards(resC.data)
    } catch {}
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este lançamento?')) {
      await api.delete(`/transactions/${id}`)
      fetchData()
    }
  }

  return (
    <>
      <Header mesAtual={summary?.mesAtual} />
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              summary={summary}
              transactions={transactions}
              onDelete={handleDelete}
              onReserveSaved={fetchSummary}
            />
          }
        />
        <Route
          path="/reservas"
          element={
            <ReservesPage
              summary={summary}
              onSummaryRefresh={fetchSummary}
            />
          }
        />
        <Route path="/novo/:type" element={<TransactionPage cards={cards} onSave={fetchData} refreshCards={fetchData} />} />
        <Route path="/editar/:id" element={<TransactionPage cards={cards} onSave={fetchData} refreshCards={fetchData} />} />
      </Routes>
    </>
  )
}
