import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Inbox } from 'lucide-react'
import { Badge, formatDate, Avatar, EmptyState } from './UI'

export default function TicketTable({ tickets, compact = false }) {
  if (!tickets.length)
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhum chamado encontrado"
        text="Tente ajustar os filtros ou abra um novo chamado."
      />
    )
  return (
    <div className="table-scroll">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>CHAMADO</th>
            <th>CATEGORIA</th>
            <th>PRIORIDADE</th>
            <th>STATUS</th>
            <th>ABERTURA</th>
            <th>RESPONSÁVEL</th>
            <th aria-label="Abrir" />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link to={`/chamados/${ticket.id}`} className="ticket-title-cell">
                  <span className="ticket-number">#{ticket.number}</span>
                  <strong>{ticket.title}</strong>
                </Link>
              </td>
              <td>
                <span className="category-text">
                  {
                    {
                      REDE: 'Rede',
                      HARDWARE: 'Hardware',
                      SOFTWARE: 'Software',
                      ACESSOS: 'Acessos',
                      OUTRO: 'Outro',
                    }[ticket.category]
                  }
                </span>
              </td>
              <td>
                <Badge value={ticket.priority} />
              </td>
              <td>
                <Badge value={ticket.status} />
              </td>
              <td className="date-cell">{formatDate(ticket.createdAt)}</td>
              <td>
                {ticket.assignee ? (
                  <div className="assignee-cell">
                    <Avatar name={ticket.assignee.name} size="xs" />
                    {ticket.assignee.name}
                  </div>
                ) : (
                  <span className="unassigned">Não atribuído</span>
                )}
              </td>
              <td>
                <Link
                  to={`/chamados/${ticket.id}`}
                  className="row-arrow"
                  aria-label={`Abrir ${ticket.number}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
