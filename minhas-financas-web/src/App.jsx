import { Routes, Route, useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './services/api'
import './index.css'

// --- HEADER ---
const Header = ({ mesAtual }) => {
  const location = useLocation()
  const path = location.pathname

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <div className="brand-icon">💰</div>
        Minhas Finanças
      </Link>
      <nav className="header-nav">
        <Link to="/" className={`nav-link ${path === '/' ? 'nav-link-active' : ''}`}>Dashboard</Link>
        <Link to="/reservas" className={`nav-link ${path === '/reservas' ? 'nav-link-active' : ''}`}>Reservas</Link>
        <Link to="/cartoes" className={`nav-link ${path === '/cartoes' ? 'nav-link-active' : ''}`}>Cartões</Link>
        <Link to="/contas" className={`nav-link ${path === '/contas' ? 'nav-link-active' : ''}`}>Contas</Link>
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
const Dashboard = ({ summary, transactions, onDelete, onReserveSaved, totalFatura }) => {
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
          <span className="card-label">Ganhos do Mês</span>
          <span className="card-value">R$ {fmt(summary?.receitaMes)}</span>
          <span className="card-sub">Receitas de {summary?.mesAtual}</span>
        </div>

        <div className="summary-card card-expense">
          <div className="card-icon">📉</div>
          <span className="card-label">Gastos do Mês</span>
          <span className="card-value">R$ {fmt(summary?.despesaDesteMes)}</span>
          <span className="card-sub">Despesas de {summary?.mesAtual}</span>
        </div>

        <div className="summary-card card-balance">
          <div className="card-icon">🏦</div>
          <span className="card-label">Saldo Disponível</span>
          <span className="card-value">R$ {fmt(summary?.saldoDisponivel ?? summary?.saldoGeral)}</span>
          <span className="card-sub">Saldo livre após reservas</span>
        </div>

        <div className="summary-card card-fatura">
          <div className="card-icon">💳</div>
          <span className="card-label">Fatura Total</span>
          <span className="card-value">R$ {fmt(totalFatura)}</span>
          <span className="card-sub">Soma das faturas em aberto</span>
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
                <th>Pagamento</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td className="td-date">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ fontWeight: 500 }}>{t.description}</td>
                  <td>
                    <span className={`type-badge ${t.type === 'income' ? 'type-income' : 'type-expense'}`}>
                      {t.type === 'income' ? '↑ Ganho' : '↓ Despesa'}
                    </span>
                  </td>
                  <td>
                    {t.type === 'income' ? (
                      <span className="pagamento-badge pagamento-entrada">Entrada</span>
                    ) : t.cardId ? (
                      <span className="pagamento-badge pagamento-cartao">💳 {t.cardId.name}</span>
                    ) : (
                      <span className="pagamento-badge pagamento-dinheiro">💵 Dinheiro</span>
                    )}
                  </td>
                  <td className={t.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {t.type === 'income' ? '+' : '−'} R$ {fmt(t.amount)}
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
const NewCardModal = ({ onClose, onCreated, accounts = [] }) => {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?._id || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/cards', {
        name,
        limit: Number(limit) || 0,
        dueDay: Number(dueDay),
        closingDay: closingDay ? Number(closingDay) : undefined,
        accountId: accountId || undefined
      })
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
            <label className="form-label">Conta responsável</label>
            {accounts.length === 0 ? (
              <p className="no-cards-hint">Nenhuma conta cadastrada. Crie uma conta antes de adicionar cartões.</p>
            ) : (
              <select className="form-input" value={accountId} onChange={e => setAccountId(e.target.value)} required>
                <option value="">Selecione uma conta</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>
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
            <label className="form-label">Dia de Fechamento <span className="form-label-hint">opcional</span></label>
            <input
              type="number"
              min="1"
              max="31"
              className="form-input"
              placeholder="Ex: 25"
              value={closingDay}
              onChange={e => setClosingDay(e.target.value)}
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
            <button type="submit" className="btn btn-primary" disabled={loading || accounts.length === 0}>
              {loading ? 'Salvando...' : '+ Criar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// --- PÁGINA DE FORMULÁRIO (CRIAR OU EDITAR) ---
const TransactionPage = ({ cards: initialCards, accounts: initialAccounts, onSave, refreshCards }) => {
  const { id, type: urlType } = useParams()
  const navigate = useNavigate()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState(urlType || 'expense')
  const [installments, setInstallments] = useState(1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [cardId, setCardId] = useState('')
  const [accountId, setAccountId] = useState('')
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
          setAccountId(item.accountId || '')
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
      accountId: accountId || null,
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

            {!isExpense && initialAccounts && initialAccounts.length > 0 && (
              <div className="form-group">
                <label className="form-label">Conta de destino</label>
                <select className="form-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  <option value="">Selecione uma conta</option>
                  {initialAccounts.map(a => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

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

// --- PÁGINA DE CARTÕES ---
const CartoesPage = ({ faturas, onRefresh, accounts = [] }) => {
  const [showNewCard, setShowNewCard] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [expandedFuture, setExpandedFuture] = useState(new Set())

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')

  const toggleFuture = (id) => {
    setExpandedFuture(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fmtMonth = (d) => new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const handleCardCreated = async () => {
    setShowNewCard(false)
    onRefresh()
  }

  const handleCardUpdated = () => {
    setEditingCard(null)
    onRefresh()
  }

  const handleCardDelete = async (id, name) => {
    if (!window.confirm(`Deseja excluir o cartão "${name}"? As transações vinculadas não serão removidas.`)) return
    await api.delete(`/cards/${id}`)
    onRefresh()
  }

  const totalFatura = faturas.reduce((sum, f) => sum + Number(f.fatura), 0)

  return (
    <div className="page">
      {showNewCard && (
        <NewCardModal onClose={() => setShowNewCard(false)} onCreated={handleCardCreated} accounts={accounts} />
      )}
      {editingCard && (
        <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} onUpdated={handleCardUpdated} accounts={accounts} />
      )}

      <div className="page-title">
        <h1>Cartões de Crédito</h1>
        <p>Acompanhe a fatura de cada cartão no período atual.</p>
      </div>

      <div className="cartoes-summary-bar">
        <span className="cartoes-summary-label">Fatura Total em Aberto</span>
        <span className="cartoes-summary-value">R$ {fmt(totalFatura)}</span>
        <button className="btn btn-primary" onClick={() => setShowNewCard(true)}>+ Novo Cartão</button>
      </div>

      {faturas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>Nenhum cartão cadastrado ainda.<br />Adicione um cartão para acompanhar suas faturas.</p>
        </div>
      ) : (
        <div className="cartoes-grid">
          {faturas.map(f => (
            <div key={f._id} className={`cartao-card ${f.isPaid ? 'cartao-paid' : ''}`}>
              <div className="cartao-header">
                <div className="cartao-title-row">
                  <span className="cartao-icon">💳</span>
                  <div>
                    <h3 className="cartao-name">{f.name}</h3>
                    {f.limit > 0 && (
                      <span className="cartao-limit">Limite: R$ {fmt(f.limit)}</span>
                    )}
                    {f.accountId && (() => {
                      const acc = accounts.find(a => a._id === f.accountId)
                      return acc ? <span className="cartao-account-badge">🏦 {acc.name}</span> : null
                    })()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-edit-card" onClick={() => setEditingCard(f)} title="Editar cartão">✏️</button>
                  <button className="btn-edit-card" onClick={() => handleCardDelete(f._id, f.name)} title="Excluir cartão">🗑️</button>
                </div>
              </div>

              <div className="cartao-fatura-section">
                <div className="cartao-fatura-valor">
                  <span className="cartao-fatura-label">
                    {f.isClosed ? 'Fatura fechada' : 'Fatura em aberto'}
                  </span>
                  <span className="cartao-fatura-amount">R$ {fmt(f.fatura)}</span>
                </div>
                <div className={`cartao-due-badge ${f.isPaid ? 'due-paid' : 'due-pending'}`}>
                  {f.isPaid
                    ? `✓ Venceu dia ${f.dueDay}`
                    : `Vence dia ${f.dueDay}`}
                </div>
              </div>

              <div className="cartao-period">
                Período: {fmtDate(f.periodStart)} a {fmtDate(f.periodEnd)}
                {f.closingDay && (
                  <span className="cartao-closing-day"> · Fecha dia {f.closingDay}</span>
                )}
              </div>

              {f.transactions.length > 0 ? (
                <div className="cartao-transactions">
                  <table className="fin-table fin-table-sm">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.transactions.map(t => (
                        <tr key={t._id}>
                          <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                          <td>{t.description}</td>
                          <td className="amount-expense">R$ {fmt(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="cartao-empty">Nenhuma despesa neste período.</p>
              )}

              {f.nextFatura && (
                <div className="cartao-next-fatura">
                  <div className="cartao-next-fatura-header">
                    <span className="cartao-next-fatura-label">Próxima fatura</span>
                    <span className="cartao-next-fatura-amount">R$ {fmt(f.nextFatura.total)}</span>
                  </div>
                  <div className="cartao-period">
                    Período: {fmtDate(f.nextFatura.periodStart)} a {fmtDate(f.nextFatura.periodEnd)}
                  </div>
                  {f.nextFatura.transactions.length > 0 ? (
                    <div className="cartao-transactions">
                      <table className="fin-table fin-table-sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {f.nextFatura.transactions.map(t => (
                            <tr key={t._id}>
                              <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td>{t.description}</td>
                              <td className="amount-expense">R$ {fmt(t.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="cartao-empty">Nenhuma despesa neste período.</p>
                  )}
                </div>
              )}

              {f.futurePeriods && f.futurePeriods.length > 0 && (
                <div className="cartao-future">
                  <button
                    className="cartao-future-toggle"
                    onClick={() => toggleFuture(f._id)}
                  >
                    {expandedFuture.has(f._id)
                      ? '▲ Ocultar meses futuros'
                      : `▼ Ver ${f.futurePeriods.length} ${f.futurePeriods.length === 1 ? 'mês futuro' : 'meses futuros'} (parcelas)`}
                  </button>
                  {expandedFuture.has(f._id) && f.futurePeriods.map((p, i) => (
                    <div key={i} className="cartao-future-period">
                      <div className="cartao-next-fatura-header">
                        <span className="cartao-next-fatura-label">{fmtMonth(p.periodEnd)}</span>
                        <span className="cartao-next-fatura-amount">R$ {fmt(p.total)}</span>
                      </div>
                      <div className="cartao-period">
                        Período: {fmtDate(p.periodStart)} a {fmtDate(p.periodEnd)}
                      </div>
                      <div className="cartao-transactions">
                        <table className="fin-table fin-table-sm">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Descrição</th>
                              <th>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.transactions.map(t => (
                              <tr key={t._id}>
                                <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td>{t.description}</td>
                                <td className="amount-expense">R$ {fmt(t.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EditCardModal = ({ card, onClose, onUpdated, accounts = [] }) => {
  const [name, setName] = useState(card.name)
  const [dueDay, setDueDay] = useState(card.dueDay)
  const [closingDay, setClosingDay] = useState(card.closingDay || '')
  const [limit, setLimit] = useState(card.limit || '')
  const [accountId, setAccountId] = useState(card.accountId || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put(`/cards/${card._id}`, {
        name,
        dueDay: Number(dueDay),
        closingDay: closingDay ? Number(closingDay) : undefined,
        limit: Number(limit) || 0,
        accountId: accountId || undefined
      })
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
            <label className="form-label">Dia de Fechamento <span className="form-label-hint">opcional</span></label>
            <input
              type="number"
              min="1"
              max="31"
              className="form-input"
              placeholder="Ex: 25"
              value={closingDay}
              onChange={e => setClosingDay(e.target.value)}
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
          <div className="form-group">
            <label className="form-label">Conta responsável</label>
            <select className="form-input" value={accountId} onChange={e => setAccountId(e.target.value)} required>
              <option value="">Selecione uma conta</option>
              {accounts.map(a => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
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

// --- PÁGINA DE CONTAS ---
const ContasPage = ({ accounts, onRefresh }) => {
  const [showNew, setShowNew] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [name, setName] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [addCard, setAddCard] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardClosingDay, setCardClosingDay] = useState('')
  const [cardDueDay, setCardDueDay] = useState('')
  const [cardLimit, setCardLimit] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setInitialBalance('')
    setAddCard(false)
    setCardName('')
    setCardClosingDay('')
    setCardDueDay('')
    setCardLimit('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/accounts', { name, initialBalance: Number(initialBalance) || 0 })
      if (addCard && cardName && cardDueDay) {
        await api.post('/cards', {
          name: cardName,
          dueDay: Number(cardDueDay),
          closingDay: cardClosingDay ? Number(cardClosingDay) : undefined,
          limit: Number(cardLimit) || 0,
          accountId: res.data._id
        })
      }
      resetForm()
      setShowNew(false)
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/accounts/${editingAccount._id}`, {
        name: editingAccount.name,
        initialBalance: Number(editingAccount.initialBalance) || 0
      })
      setEditingAccount(null)
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover esta conta?')) return
    await api.delete(`/accounts/${id}`)
    onRefresh()
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="page">
      <div className="page-title">
        <h1>Contas</h1>
        <p>Gerencie suas contas bancárias e acompanhe o saldo com débito automático das faturas.</p>
      </div>

      <div className="cartoes-summary-bar">
        <span className="cartoes-summary-label">Total em Contas</span>
        <span className="cartoes-summary-value">
          R$ {fmt(accounts.reduce((s, a) => s + Number(a.balance), 0))}
        </span>
        <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>
          {showNew ? 'Cancelar' : '+ Nova Conta'}
        </button>
      </div>

      {showNew && (
        <form className="conta-form" onSubmit={handleCreate}>
          <h4 className="conta-form-section-title">Dados da Conta</h4>
          <div className="form-group">
            <label className="form-label">Nome da Conta</label>
            <input className="form-input" placeholder="Ex: Nubank, Itaú, Bradesco..." value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Saldo Inicial (R$)</label>
            <input className="form-input" type="number" step="0.01" placeholder="0,00" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
          </div>

          <label className="conta-toggle-card">
            <input type="checkbox" checked={addCard} onChange={e => setAddCard(e.target.checked)} />
            Adicionar cartão de crédito a esta conta
          </label>

          {addCard && (
            <>
              <h4 className="conta-form-section-title" style={{ marginTop: 16 }}>Dados do Cartão</h4>
              <div className="form-group">
                <label className="form-label">Nome do Cartão</label>
                <input className="form-input" placeholder="Ex: Nubank Gold, Itaú Platinum..." value={cardName} onChange={e => setCardName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Dia de Fechamento <span className="form-label-hint">opcional</span></label>
                <input className="form-input" type="number" min="1" max="31" placeholder="Ex: 25" value={cardClosingDay} onChange={e => setCardClosingDay(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Dia de Vencimento</label>
                <input className="form-input" type="number" min="1" max="31" placeholder="Ex: 5" value={cardDueDay} onChange={e => setCardDueDay(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Limite (R$) <span className="form-label-hint">opcional</span></label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="0,00" value={cardLimit} onChange={e => setCardLimit(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setShowNew(false); resetForm() }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : addCard ? 'Criar Conta e Cartão' : 'Criar Conta'}</button>
          </div>
        </form>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <p>Nenhuma conta cadastrada ainda.<br />Adicione uma conta para acompanhar seu saldo.</p>
        </div>
      ) : (
        <div className="cartoes-grid">
          {accounts.map(a => (
            <div key={a._id} className="cartao-card">
              {editingAccount?._id === a._id ? (
                <form onSubmit={handleUpdate}>
                  <div className="form-group">
                    <label className="form-label">Nome</label>
                    <input className="form-input" value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Saldo Inicial (R$)</label>
                    <input className="form-input" type="number" step="0.01" value={editingAccount.initialBalance} onChange={e => setEditingAccount({ ...editingAccount, initialBalance: e.target.value })} />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setEditingAccount(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>Salvar</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="cartao-header">
                    <div className="cartao-title-row">
                      <span className="cartao-icon">🏦</span>
                      <h3 className="cartao-name">{a.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-edit-card" onClick={() => setEditingAccount(a)} title="Editar">✏️</button>
                      <button className="btn-edit-card" onClick={() => handleDelete(a._id)} title="Remover">🗑️</button>
                    </div>
                  </div>

                  <div className="cartao-fatura-section">
                    <div className="cartao-fatura-valor">
                      <span className="cartao-fatura-label">Saldo atual</span>
                      <span className="cartao-fatura-amount" style={{ color: Number(a.balance) >= 0 ? 'var(--income-dark)' : 'var(--expense-dark)' }}>
                        R$ {fmt(a.balance)}
                      </span>
                    </div>
                    {Number(a.projectedBalance) !== Number(a.balance) && (
                      <div className="cartao-due-badge due-pending">
                        Projetado: R$ {fmt(a.projectedBalance)}
                      </div>
                    )}
                  </div>

                  <div className="cartao-period">
                    Saldo inicial: R$ {fmt(a.initialBalance)} · Receitas: R$ {fmt(a.totalIncome)} · Débitos: R$ {fmt(a.totalDebits)}
                  </div>

                  {a.linkedCards.length > 0 && (
                    <div className="conta-cards-list">
                      <span className="cartao-next-fatura-label">Cartões vinculados</span>
                      {a.linkedCards.map(c => (
                        <span key={c._id} className="conta-card-badge">💳 {c.name} · vence dia {c.dueDay}</span>
                      ))}
                    </div>
                  )}

                  {a.pendingDebits.length > 0 && (
                    <div className="cartao-next-fatura">
                      <div className="cartao-next-fatura-header">
                        <span className="cartao-next-fatura-label">Débitos pendentes</span>
                        <span className="cartao-next-fatura-amount" style={{ color: 'var(--expense-dark)' }}>
                          - R$ {fmt(a.pendingDebits.reduce((s, p) => s + Number(p.total), 0))}
                        </span>
                      </div>
                      {a.pendingDebits.map((p, i) => (
                        <div key={i} className="cartao-period">
                          💳 {p.cardName} · vence {fmtDate(p.dueDate)} · R$ {fmt(p.total)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- APP PRINCIPAL ---
export default function App() {
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [cards, setCards] = useState([])
  const [faturas, setFaturas] = useState([])
  const [accounts, setAccounts] = useState([])

  const fetchSummary = async () => {
    try {
      const res = await api.get('/transactions/summary')
      setSummary(res.data)
    } catch {}
  }

  const fetchData = async () => {
    try {
      const [resS, resT, resC, resF, resA] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
        api.get('/cards'),
        api.get('/cards/faturas'),
        api.get('/accounts'),
      ])
      setSummary(resS.data)
      setTransactions(resT.data.reverse())
      setCards(resC.data)
      setFaturas(resF.data)
      setAccounts(resA.data)
    } catch {}
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este lançamento?')) {
      await api.delete(`/transactions/${id}`)
      fetchData()
    }
  }

  const totalFatura = faturas.reduce((sum, f) => sum + Number(f.fatura), 0)

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
              totalFatura={totalFatura}
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
        <Route
          path="/cartoes"
          element={<CartoesPage faturas={faturas} onRefresh={fetchData} accounts={accounts} />}
        />
        <Route
          path="/contas"
          element={<ContasPage accounts={accounts} onRefresh={fetchData} />}
        />
        <Route path="/novo/:type" element={<TransactionPage cards={cards} accounts={accounts} onSave={fetchData} refreshCards={fetchData} />} />
        <Route path="/editar/:id" element={<TransactionPage cards={cards} accounts={accounts} onSave={fetchData} refreshCards={fetchData} />} />
      </Routes>
    </>
  )
}
