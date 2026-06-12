import { create } from 'zustand'
import type { Lead, Participant, Payment, Appointment, Task, Notification, CoachingPack, CoachingSession, PsychometricTest } from '../types'
import { supabase } from '../lib/supabase'
import { generateId } from '../lib/utils'

interface AppState {
  leads: Lead[]
  participants: Participant[]
  payments: Payment[]
  appointments: Appointment[]
  tasks: Task[]
  notifications: Notification[]
  coachingPacks: CoachingPack[]
  coachingSessions: CoachingSession[]
  tests: PsychometricTest[]
  searchQuery: string
  loading: boolean

  setSearchQuery: (q: string) => void
  unreadCount: () => number

  // Fetch
  fetchLeads: () => Promise<void>
  fetchParticipants: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchAppointments: () => Promise<void>
  fetchTasks: () => Promise<void>
  fetchNotifications: (userId: string) => Promise<void>
  fetchCoachingPacks: () => Promise<void>
  fetchCoachingSessions: () => Promise<void>
  fetchAll: (userId: string) => Promise<void>

  // Leads
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  addLeadNote: (leadId: string, content: string, authorId: string, authorName: string) => Promise<void>

  // Participants
  addParticipant: (p: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>

  // Payments
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>

  // Notifications
  markNotificationRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>

  // Tasks
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
}

// Map Supabase snake_case → camelCase
function mapLead(row: any): Lead {
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name,
    phone: row.phone, whatsapp: row.whatsapp, email: row.email,
    facebookName: row.facebook_name, instagram: row.instagram,
    source: row.source, campaign: row.campaign, adSet: row.ad_set,
    status: row.status, assignedTo: row.assigned_to,
    nextFollowUpDate: row.next_follow_up_date, tags: row.tags || [],
    notes: (row.lead_notes || []).map((n: any) => ({
      id: n.id, content: n.content, authorId: n.author_id,
      authorName: n.author_name, createdAt: n.created_at,
    })),
    followUps: (row.follow_ups || []).map((f: any) => ({
      id: f.id, type: f.type, outcome: f.outcome, notes: f.notes,
      date: f.date, authorId: f.author_id, authorName: f.author_name,
    })),
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapParticipant(row: any): Participant {
  return {
    id: row.id, leadId: row.lead_id, firstName: row.first_name, lastName: row.last_name,
    email: row.email, phone: row.phone, whatsapp: row.whatsapp,
    gender: row.gender, birthDate: row.birth_date, cin: row.cin,
    address: row.address, profession: row.profession, company: row.company,
    emergencyContact: row.emergency_contact, type: row.type,
    avatar: row.avatar_url, notes: row.notes || '', tags: row.tags || [],
    isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapPayment(row: any): Payment {
  return {
    id: row.id, participantId: row.participant_id, participantName: row.participant_name,
    programType: row.program_type, programName: row.program_name,
    totalAmount: row.total_amount, amountPaid: row.amount_paid,
    remainingAmount: row.remaining_amount, status: row.status, method: row.method,
    reference: row.reference, date: row.date, dueDate: row.due_date, notes: row.notes,
    installments: (row.installments || []).map((i: any) => ({
      id: i.id, paymentId: i.payment_id, amount: i.amount, date: i.date,
      method: i.method, reference: i.reference, status: i.status,
    })),
    createdAt: row.created_at,
  }
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id, title: row.title, participantId: row.participant_id,
    participantName: row.participant_name, coachId: row.coach_id,
    coachName: row.coach_name, programType: row.program_type,
    date: row.date, startTime: row.start_time, endTime: row.end_time,
    location: row.location, meetLink: row.meet_link, zoomLink: row.zoom_link,
    notes: row.notes, status: row.status, reminderSent: row.reminder_sent, color: row.color,
  }
}

function mapTask(row: any): Task {
  return {
    id: row.id, title: row.title, description: row.description,
    assignedTo: row.assigned_to, assignedToName: row.assigned_to_name,
    createdBy: row.created_by, priority: row.priority, status: row.status,
    dueDate: row.due_date, relatedTo: row.related_to, relatedType: row.related_type,
    isRecurring: row.is_recurring, tags: row.tags || [],
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function mapCoachingPack(row: any): CoachingPack {
  return {
    id: row.id, participantId: row.participant_id, name: row.name,
    totalSessions: row.total_sessions, usedSessions: row.used_sessions,
    price: row.price, discount: row.discount, amountPaid: row.amount_paid,
    purchaseDate: row.purchase_date, expirationDate: row.expiration_date,
    status: row.status, coachId: row.coach_id,
  }
}

function mapSession(row: any): CoachingSession {
  return {
    id: row.id, packId: row.pack_id, participantId: row.participant_id,
    coachId: row.coach_id, date: row.date, time: row.time,
    duration: row.duration, sessionNumber: row.session_number, status: row.status,
    summary: row.summary, objectives: row.objectives, homework: row.homework,
    privateNotes: row.private_notes, meetLink: row.meet_link, zoomLink: row.zoom_link,
    createdAt: row.created_at,
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  leads: [], participants: [], payments: [], appointments: [],
  tasks: [], notifications: [], coachingPacks: [], coachingSessions: [],
  tests: [], searchQuery: '', loading: false,

  setSearchQuery: (q) => set({ searchQuery: q }),
  unreadCount: () => get().notifications.filter(n => !n.isRead).length,

  fetchLeads: async () => {
    const { data } = await supabase
      .from('leads')
      .select('*, lead_notes(*), follow_ups(*)')
      .order('created_at', { ascending: false })
    if (data) set({ leads: data.map(mapLead) })
  },

  fetchParticipants: async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) set({ participants: data.map(mapParticipant) })
  },

  fetchPayments: async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, installments(*)')
      .order('created_at', { ascending: false })
    if (data) set({ payments: data.map(mapPayment) })
  },

  fetchAppointments: async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
    if (data) set({ appointments: data.map(mapAppointment) })
  },

  fetchTasks: async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) set({ tasks: data.map(mapTask) })
  },

  fetchNotifications: async (userId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) set({
      notifications: data.map((n: any) => ({
        id: n.id, userId: n.user_id, type: n.type,
        title: n.title, message: n.message, isRead: n.is_read,
        link: n.link, createdAt: n.created_at,
      }))
    })
  },

  fetchCoachingPacks: async () => {
    const { data } = await supabase.from('coaching_packs').select('*').order('created_at', { ascending: false })
    if (data) set({ coachingPacks: data.map(mapCoachingPack) })
  },

  fetchCoachingSessions: async () => {
    const { data } = await supabase.from('coaching_sessions').select('*').order('date', { ascending: false })
    if (data) set({ coachingSessions: data.map(mapSession) })
  },

  fetchAll: async (userId) => {
    set({ loading: true })
    await Promise.all([
      get().fetchLeads(),
      get().fetchParticipants(),
      get().fetchPayments(),
      get().fetchAppointments(),
      get().fetchTasks(),
      get().fetchNotifications(userId),
      get().fetchCoachingPacks(),
      get().fetchCoachingSessions(),
    ])
    set({ loading: false })
  },

  addLead: async (data) => {
    const { data: row } = await supabase.from('leads').insert({
      first_name: data.firstName, last_name: data.lastName,
      phone: data.phone, whatsapp: data.whatsapp, email: data.email,
      facebook_name: data.facebookName, source: data.source,
      campaign: data.campaign, ad_set: data.adSet,
      status: data.status, assigned_to: data.assignedTo, tags: data.tags,
    }).select('*, lead_notes(*), follow_ups(*)').single()
    if (row) set(s => ({ leads: [mapLead(row), ...s.leads] }))
  },

  updateLead: async (id, updates) => {
    const patch: any = {}
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.firstName !== undefined) patch.first_name = updates.firstName
    if (updates.lastName !== undefined) patch.last_name = updates.lastName
    if (updates.phone !== undefined) patch.phone = updates.phone
    if (updates.nextFollowUpDate !== undefined) patch.next_follow_up_date = updates.nextFollowUpDate
    if (updates.assignedTo !== undefined) patch.assigned_to = updates.assignedTo
    if (updates.tags !== undefined) patch.tags = updates.tags
    await supabase.from('leads').update(patch).eq('id', id)
    set(s => ({
      leads: s.leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)
    }))
  },

  deleteLead: async (id) => {
    await supabase.from('leads').delete().eq('id', id)
    set(s => ({ leads: s.leads.filter(l => l.id !== id) }))
  },

  addLeadNote: async (leadId, content, authorId, authorName) => {
    const { data } = await supabase.from('lead_notes').insert({
      lead_id: leadId, content, author_id: authorId, author_name: authorName,
    }).select().single()
    if (data) {
      set(s => ({
        leads: s.leads.map(l => l.id === leadId ? {
          ...l,
          notes: [...l.notes, { id: data.id, content, authorId, authorName, createdAt: data.created_at }],
          updatedAt: new Date().toISOString(),
        } : l)
      }))
    }
  },

  addParticipant: async (data) => {
    const { data: row } = await supabase.from('participants').insert({
      first_name: data.firstName, last_name: data.lastName,
      email: data.email, phone: data.phone, whatsapp: data.whatsapp,
      gender: data.gender, birth_date: data.birthDate, cin: data.cin,
      address: data.address, profession: data.profession, company: data.company,
      emergency_contact: data.emergencyContact, type: data.type,
      notes: data.notes, tags: data.tags, is_active: data.isActive,
      lead_id: data.leadId,
    }).select().single()
    if (row) set(s => ({ participants: [mapParticipant(row), ...s.participants] }))
  },

  updateParticipant: async (id, updates) => {
    const patch: any = {}
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.tags !== undefined) patch.tags = updates.tags
    if (updates.isActive !== undefined) patch.is_active = updates.isActive
    await supabase.from('participants').update(patch).eq('id', id)
    set(s => ({
      participants: s.participants.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    }))
  },

  addPayment: async (data) => {
    const { data: row } = await supabase.from('payments').insert({
      participant_id: data.participantId, participant_name: data.participantName,
      program_type: data.programType, program_name: data.programName,
      total_amount: data.totalAmount, amount_paid: data.amountPaid,
      status: data.status, method: data.method, reference: data.reference,
      date: data.date, due_date: data.dueDate, notes: data.notes,
    }).select('*, installments(*)').single()
    if (row) set(s => ({ payments: [mapPayment(row), ...s.payments] }))
  },

  updatePayment: async (id, updates) => {
    const patch: any = {}
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.amountPaid !== undefined) patch.amount_paid = updates.amountPaid
    await supabase.from('payments').update(patch).eq('id', id)
    set(s => ({
      payments: s.payments.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  },

  markNotificationRead: async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }))
  },

  markAllRead: async () => {
    const ids = get().notifications.filter(n => !n.isRead).map(n => n.id)
    if (ids.length > 0) await supabase.from('notifications').update({ is_read: true }).in('id', ids)
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })) }))
  },

  addTask: async (data) => {
    const { data: row } = await supabase.from('tasks').insert({
      title: data.title, description: data.description,
      assigned_to: data.assignedTo, assigned_to_name: data.assignedToName,
      created_by: data.createdBy, priority: data.priority, status: data.status,
      due_date: data.dueDate, is_recurring: data.isRecurring, tags: data.tags,
    }).select().single()
    if (row) set(s => ({ tasks: [mapTask(row), ...s.tasks] }))
  },

  updateTask: async (id, updates) => {
    const patch: any = {}
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.priority !== undefined) patch.priority = updates.priority
    await supabase.from('tasks').update(patch).eq('id', id)
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    }))
  },
}))
