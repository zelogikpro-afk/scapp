import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: fr })
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd/MM/yyyy 'à' HH:mm")
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

export function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency === 'MAD' ? 'MAD' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

export function percentage(part: number, total: number) {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}
