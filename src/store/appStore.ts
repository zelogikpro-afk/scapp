import { create } from 'zustand'
import type { Lead, Participant, Payment, Appointment, Task, Notification, CoachingPack, CoachingSession, PsychometricTest } from '../types'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { generateId } from '../lib/utils'

interface AppState {
  leads: Lead[]
  profiles: { id: string; name: string; role: string }[]
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
  userRole: string | null

  setSearchQuery: (q: string) => void
  unreadCount: () => number

  // Fetch
  fetchProfiles: () => Promise<void>
  fetchLeads: () => Promise<void>
  fetchParticipants: () => Promise<void>
  fetchPayments: () => Promise<void>
  fetchAppointments: (role?: string) => Promise<void>
  fetchTasks: () => Promise<void>
  fetchNotifications: (userId: string) => Promise<void>
  fetchCoachingPacks: () => Promise<void>
  fetchCoachingSessions: () => Promise<void>
  fetchAll: (userId: string, role?: string) => Promise<void>

  // Leads
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>) => Promise<void>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  addLeadNote: (leadId: string, content: string, authorId: string, authorName: string) => Promise<void>

  // Participants
  addParticipant: (p: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>
  deleteParticipant: (id: string) => Promise<void>
  convertLeadToParticipant: (lead: Lead) => Promise<Participant | null>

  // Payments
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>

  // Notifications
  markNotificationRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>

  // Tasks
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // Coaching
  addCoachingPack: (p: Omit<CoachingPack, 'id'>) => Promise<void>
  updateCoachingPack: (id: string, updates: Partial<CoachingPack>) => Promise<void>
  deleteCoachingPack: (id: string) => Promise<void>
  addCoachingSession: (s: Omit<CoachingSession, 'id' | 'createdAt'>) => Promise<void>
  updateCoachingSession: (id: string, updates: Partial<CoachingSession>) => Promise<void>
  deleteCoachingSession: (id: string) => Promise<void>

  // Appointments
  addAppointment: (a: Omit<Appointment, 'id'>) => Promise<void>
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>

  // Tests
  addTest: (t: Omit<PsychometricTest, 'id' | 'createdAt'>) => Promise<void>
  deleteTest: (id: string) => Promise<void>
  fetchTests: () => Promise<void>
}

// Map Supabase snake_case → camelCase
function mapLead(row: any): Lead {
  return {
    id: row.id, firstName: row.first_name, lastName: row.last_name,
    phone: row.phone, whatsapp: row.whatsapp, email: row.email,
    facebookName: row.facebook_name, instagram: row.instagram,
    source: row.source, campaign: row.campaign, adSet: row.ad_set,
    city: row.city, profession: row.profession,
    programInterest: row.program_interest, interestLevel: row.interest_level,
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
    assignedToName: row.assigned_to_name,
    lastTouchedBy: row.last_touched_by,
    lastTouchedAt: row.last_touched_at,
    horairePreference: row.horaire_preference,
    delaiAction: row.delai_action,
    metaLeadId: row.meta_lead_id,
    programTag: row.program_tag,
    childName: row.child_name,
    childAge: row.child_age,
    childSchool: row.child_school,
    childLevel: row.child_level,
    genre: row.genre, dateNaissance: row.date_naissance,
    adresse: row.adresse, cin: row.cin,
    modaliteParticipation: row.modalite_participation,
    modalitePaiement: row.modalite_paiement,
    montantVerse: row.montant_verse, prixFormation: row.prix_formation,
    dateVersement2: row.date_versement_2, dateVersement3: row.date_versement_3,
    inscriptionId: row.inscription_id,
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
    reference: row.reference, promotionId: row.promotion_id,
  }
}

function mapPayment(row: any): Payment {
  return {
    id: row.id, participantId: row.participant_id, participantName: row.participant_name,
    programType: row.program_type, programName: row.program_name,
    session: row.notes || undefined,
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
  const [name, weeklySlot] = (row.name as string).split('\n')
  return {
    id: row.id, participantId: row.participant_id, name, weeklySlot,
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
  leads: [], profiles: [], participants: [], payments: [], appointments: [],
  tasks: [], notifications: [], coachingPacks: [], coachingSessions: [],
  tests: [], searchQuery: '', loading: false, userRole: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  unreadCount: () => get().notifications.filter(n => !n.isRead).length,

  fetchProfiles: async () => {
    const { data } = await supabase.from('profiles').select('id, name, role').eq('is_active', true)
    if (data) set({ profiles: data })
  },

  fetchLeads: async () => {
    const { data } = await supabase
      .from('leads')
      .select('*, lead_notes(*), follow_ups(*)')
      .order('created_at', { ascending: false })
    if (data) set({ leads: data.map(mapLead) })
  },

  fetchParticipants: async () => {
    const { data } = await supabaseAdmin
      .from('participants')
      .select('*')
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

  fetchAppointments: async (_role?: string) => {
    const { data } = await supabaseAdmin
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
    const [{ data }, { data: ovData }] = await Promise.all([
      supabaseAdmin.from('coaching_packs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('app_settings').select('value').eq('key', 'pack_overrides').single(),
    ])
    const overrides: Record<string, any> = ovData?.value ? JSON.parse(ovData.value) : {}
    if (data) set({ coachingPacks: data.map(row => {
      const pack = mapCoachingPack(row)
      const ov = overrides[pack.id]
      if (!ov) return pack
      const merged = { ...pack, ...ov }
      if (ov.name) {
        const [name, weeklySlot] = (ov.name as string).split('\n')
        merged.name = name
        merged.weeklySlot = weeklySlot
      }
      return merged
    }) })
  },

  fetchCoachingSessions: async () => {
    const { data } = await supabaseAdmin.from('coaching_sessions').select('*').order('date', { ascending: false })
    if (data) set({ coachingSessions: data.map(mapSession) })
  },

  fetchAll: async (userId, role?) => {
    set({ loading: true, userRole: role ?? null })
    await Promise.all([
      get().fetchProfiles(),
      get().fetchLeads(),
      get().fetchParticipants(),
      get().fetchPayments(),
      get().fetchAppointments(role),
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
      city: data.city, profession: data.profession,
      program_interest: data.programInterest, interest_level: data.interestLevel,
      next_follow_up_date: data.nextFollowUpDate,
      horaire_preference: (data as any).horairePreference,
      delai_action: (data as any).delaiAction,
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
    if (updates.assignedToName !== undefined) patch.assigned_to_name = updates.assignedToName
    if (updates.tags !== undefined) patch.tags = updates.tags
    if (updates.lastTouchedBy !== undefined) {
      patch.last_touched_by = updates.lastTouchedBy
      patch.last_touched_at = new Date().toISOString()
    }
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
    const now = new Date().toISOString()
    const { data } = await supabase.from('lead_notes').insert({
      lead_id: leadId, content, author_id: authorId, author_name: authorName,
    }).select().single()
    if (data) {
      await supabase.from('leads').update({ last_touched_by: authorName, last_touched_at: now }).eq('id', leadId)
      set(s => ({
        leads: s.leads.map(l => l.id === leadId ? {
          ...l,
          notes: [...l.notes, { id: data.id, content, authorId, authorName, createdAt: data.created_at }],
          lastTouchedBy: authorName, lastTouchedAt: now,
          updatedAt: now,
        } : l)
      }))
    }
  },

  addParticipant: async (data) => {
    const { data: row, error: insertError } = await supabaseAdmin.from('participants').insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      gender: data.gender || null,
      birth_date: data.birthDate || null,
      cin: data.cin || null,
      address: data.address || null,
      profession: data.profession || null,
      company: data.company || null,
      emergency_contact: data.emergencyContact || null,
      type: data.type,
      notes: data.notes || '',
      tags: data.tags || [],
      is_active: data.isActive ?? true,
      lead_id: data.leadId || null,
    }).select().single()
    if (insertError) {
      console.error('❌ addParticipant error:', insertError)
      throw new Error(insertError.message)
    }
    if (row) set(s => ({ participants: [mapParticipant(row), ...s.participants] }))
  },

  updateParticipant: async (id, updates) => {
    const patch: any = {}
    if (updates.firstName !== undefined) patch.first_name = updates.firstName
    if (updates.lastName !== undefined) patch.last_name = updates.lastName
    if (updates.email !== undefined) patch.email = updates.email
    if (updates.phone !== undefined) patch.phone = updates.phone
    if (updates.whatsapp !== undefined) patch.whatsapp = updates.whatsapp
    if (updates.gender !== undefined) patch.gender = updates.gender
    if (updates.birthDate !== undefined) patch.birth_date = updates.birthDate
    if (updates.cin !== undefined) patch.cin = updates.cin
    if (updates.address !== undefined) patch.address = updates.address
    if (updates.profession !== undefined) patch.profession = updates.profession
    if (updates.company !== undefined) patch.company = updates.company
    if (updates.emergencyContact !== undefined) patch.emergency_contact = updates.emergencyContact
    if (updates.type !== undefined) patch.type = updates.type
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.tags !== undefined) patch.tags = updates.tags
    if (updates.isActive !== undefined) patch.is_active = updates.isActive
    if (updates.promotionId !== undefined) patch.promotion_id = updates.promotionId
    if (updates.reference !== undefined) patch.reference = updates.reference
    await supabaseAdmin.from('participants').update(patch).eq('id', id)
    set(s => ({
      participants: s.participants.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    }))
  },

  deleteParticipant: async (id) => {
    await supabaseAdmin.from('participants').delete().eq('id', id)
    set(s => ({ participants: s.participants.filter(p => p.id !== id) }))
  },

  convertLeadToParticipant: async (lead) => {
    const { data: row } = await supabaseAdmin.from('participants').insert({
      first_name: lead.firstName, last_name: lead.lastName,
      email: lead.email ?? '', phone: lead.phone, whatsapp: lead.whatsapp,
      gender: 'female',
      profession: lead.profession,
      type: 'coaching',
      notes: '',
      tags: lead.tags ?? [],
      is_active: true,
      lead_id: lead.id,
    }).select().single()
    if (row) {
      set(s => ({ participants: [mapParticipant(row), ...s.participants] }))
      await supabase.from('leads').update({ status: 'registered' }).eq('id', lead.id)
      set(s => ({ leads: s.leads.map(l => l.id === lead.id ? { ...l, status: 'registered' as const } : l) }))
      return mapParticipant(row)
    }
    return null
  },

  addPayment: async (data) => {
    const { data: row } = await supabaseAdmin.from('payments').insert({
      participant_id: data.participantId, participant_name: data.participantName,
      program_type: data.programType, program_name: data.programName,
      total_amount: data.totalAmount, amount_paid: data.amountPaid,
      remaining_amount: data.totalAmount - data.amountPaid,
      status: data.status, method: data.method, reference: data.reference,
      date: data.date, due_date: data.dueDate, notes: data.notes,
    }).select('*, installments(*)').single()
    if (row) set(s => ({ payments: [mapPayment(row), ...s.payments] }))
  },

  deletePayment: async (id) => {
    await supabaseAdmin.from('payments').delete().eq('id', id)
    set(s => ({ payments: s.payments.filter(p => p.id !== id) }))
  },

  updatePayment: async (id, updates) => {
    const patch: any = {}
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.amountPaid !== undefined) patch.amount_paid = updates.amountPaid
    if (updates.totalAmount !== undefined) patch.total_amount = updates.totalAmount
    if (updates.programName !== undefined) patch.program_name = updates.programName
    if (updates.programType !== undefined) patch.program_type = updates.programType
    if (updates.method !== undefined) patch.method = updates.method
    if (updates.date !== undefined) patch.date = updates.date
    if (updates.dueDate !== undefined) patch.due_date = updates.dueDate
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.reference !== undefined) patch.reference = updates.reference
    if (updates.session !== undefined) patch.session = updates.session
    if (updates.participantName !== undefined) patch.participant_name = updates.participantName
    if (updates.totalAmount !== undefined || updates.amountPaid !== undefined) {
      const cur = get().payments.find(p => p.id === id)
      const total = updates.totalAmount ?? cur?.totalAmount ?? 0
      const paid = updates.amountPaid ?? cur?.amountPaid ?? 0
      patch.remaining_amount = total - paid
    }
    await supabaseAdmin.from('payments').update(patch).eq('id', id)
    set(s => ({
      payments: s.payments.map(p => p.id === id ? { ...p, ...updates, remainingAmount: (updates.totalAmount ?? p.totalAmount) - (updates.amountPaid ?? p.amountPaid) } : p)
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

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
  },

  updateTask: async (id, updates) => {
    const patch: any = {}
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.priority !== undefined) patch.priority = updates.priority
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.dueDate !== undefined) patch.due_date = updates.dueDate
    await supabase.from('tasks').update(patch).eq('id', id)
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    }))
  },

  addCoachingPack: async (data) => {
    const { data: row } = await supabase.from('coaching_packs').insert({
      participant_id: data.participantId, name: data.weeklySlot ? `${data.name}\n${data.weeklySlot}` : data.name,
      total_sessions: data.totalSessions, used_sessions: data.usedSessions ?? 0,
      price: data.price, discount: data.discount ?? 0, amount_paid: data.amountPaid ?? 0,
      purchase_date: data.purchaseDate, expiration_date: data.expirationDate,
      status: data.status, coach_id: data.coachId,
    }).select().single()
    if (row) set(s => ({ coachingPacks: [mapCoachingPack(row), ...s.coachingPacks] }))
  },

  updateCoachingPack: async (id, updates) => {
    // coaching_packs has a broken UPDATE trigger (references NEW.updated_at which doesn't exist).
    // Workaround: persist changes in app_settings key "pack_overrides" and merge at read time.
    const current = get().coachingPacks.find(p => p.id === id)
    const patch: any = {}
    if (updates.name !== undefined || updates.weeklySlot !== undefined) {
      const name = updates.name ?? current?.name ?? ''
      const slot = updates.weeklySlot !== undefined ? updates.weeklySlot : (current?.weeklySlot ?? '')
      patch.name = slot ? `${name}\n${slot}` : name
    }
    if (updates.totalSessions !== undefined) patch.totalSessions = updates.totalSessions
    if (updates.usedSessions !== undefined) patch.usedSessions = updates.usedSessions
    if (updates.price !== undefined) patch.price = updates.price
    if (updates.discount !== undefined) patch.discount = updates.discount
    if (updates.amountPaid !== undefined) patch.amountPaid = updates.amountPaid
    if (updates.purchaseDate !== undefined) patch.purchaseDate = updates.purchaseDate
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.expirationDate !== undefined) patch.expirationDate = updates.expirationDate

    const { data: ovData } = await supabaseAdmin.from('app_settings').select('value').eq('key', 'pack_overrides').single()
    const overrides: Record<string, any> = ovData?.value ? JSON.parse(ovData.value) : {}
    overrides[id] = { ...overrides[id], ...patch }
    const { error } = await supabaseAdmin.from('app_settings').upsert({
      key: 'pack_overrides', value: JSON.stringify(overrides), updated_at: new Date().toISOString(),
    })
    if (error) { console.error('updateCoachingPack error:', error.message); throw new Error(error.message) }
    set(s => ({ coachingPacks: s.coachingPacks.map(p => p.id === id ? { ...p, ...updates } : p) }))
  },

  deleteCoachingPack: async (id) => {
    await supabase.from('coaching_packs').delete().eq('id', id)
    set(s => ({ coachingPacks: s.coachingPacks.filter(p => p.id !== id) }))
  },

  addCoachingSession: async (data) => {
    const { data: row } = await supabase.from('coaching_sessions').insert({
      pack_id: data.packId, participant_id: data.participantId,
      coach_id: data.coachId, date: data.date, time: data.time,
      duration: data.duration, session_number: data.sessionNumber,
      status: data.status, summary: data.summary, objectives: data.objectives,
      homework: data.homework, private_notes: data.privateNotes,
      meet_link: data.meetLink, zoom_link: data.zoomLink,
    }).select().single()
    if (row) {
      set(s => ({ coachingSessions: [mapSession(row), ...s.coachingSessions] }))
      // Auto-increment usedSessions on the linked pack when session is completed
      if (data.status === 'completed' && data.packId) {
        const pack = get().coachingPacks.find(p => p.id === data.packId)
        if (pack) await get().updateCoachingPack(data.packId, { usedSessions: (pack.usedSessions ?? 0) + 1 })
      }
    }
  },

  updateCoachingSession: async (id, updates) => {
    const prev = get().coachingSessions.find(s => s.id === id)
    const patch: any = {}
    if (updates.date !== undefined) patch.date = updates.date
    if (updates.time !== undefined) patch.time = updates.time
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.summary !== undefined) patch.summary = updates.summary
    if (updates.objectives !== undefined) patch.objectives = updates.objectives
    if (updates.homework !== undefined) patch.homework = updates.homework
    if (updates.privateNotes !== undefined) patch.private_notes = updates.privateNotes
    if (updates.meetLink !== undefined) patch.meet_link = updates.meetLink
    await supabase.from('coaching_sessions').update(patch).eq('id', id)
    set(s => ({ coachingSessions: s.coachingSessions.map(x => x.id === id ? { ...x, ...updates } : x) }))
    // Auto-increment usedSessions when session transitions to completed
    if (updates.status === 'completed' && prev?.status !== 'completed' && prev?.packId) {
      const pack = get().coachingPacks.find(p => p.id === prev.packId)
      if (pack) await get().updateCoachingPack(prev.packId, { usedSessions: (pack.usedSessions ?? 0) + 1 })
    }
    // Auto-decrement if un-completing a session
    if (prev?.status === 'completed' && updates.status && updates.status !== 'completed' && prev?.packId) {
      const pack = get().coachingPacks.find(p => p.id === prev.packId)
      if (pack) await get().updateCoachingPack(prev.packId, { usedSessions: Math.max(0, (pack.usedSessions ?? 0) - 1) })
    }
  },

  deleteCoachingSession: async (id) => {
    await supabase.from('coaching_sessions').delete().eq('id', id)
    set(s => ({ coachingSessions: s.coachingSessions.filter(x => x.id !== id) }))
  },

  updateAppointment: async (id, updates) => {
    const patch: any = {}
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.participantId !== undefined) patch.participant_id = updates.participantId
    if (updates.participantName !== undefined) patch.participant_name = updates.participantName
    if (updates.date !== undefined) patch.date = updates.date
    if (updates.startTime !== undefined) patch.start_time = updates.startTime
    if (updates.endTime !== undefined) patch.end_time = updates.endTime
    if (updates.location !== undefined) patch.location = updates.location
    if (updates.meetLink !== undefined) patch.meet_link = updates.meetLink
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.color !== undefined) patch.color = updates.color
    const { error } = await supabaseAdmin.from('appointments').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
    set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, ...updates } : a) }))
  },

  deleteAppointment: async (id) => {
    await supabaseAdmin.from('appointments').delete().eq('id', id)
    set(s => ({ appointments: s.appointments.filter(a => a.id !== id) }))
  },

  deleteTest: async (id) => {
    await supabase.from('psychometric_tests').delete().eq('id', id)
    set(s => ({ tests: s.tests.filter(t => t.id !== id) }))
  },

  fetchTests: async () => {
    const { data } = await supabase.from('psychometric_tests').select('*').order('date', { ascending: false })
    if (data) set({ tests: data.map((t: any) => ({
      id: t.id, participantId: t.participant_id, type: t.type, date: t.date,
      result: t.result, score: t.score, interpretation: t.interpretation,
      coachNotes: t.coach_notes, pdfUrl: t.pdf_url, administeredBy: t.administered_by,
      createdAt: t.created_at,
    })) })
  },

  addTest: async (data) => {
    const { data: row } = await supabase.from('psychometric_tests').insert({
      participant_id: data.participantId, type: data.type, date: data.date,
      result: data.result, score: data.score, interpretation: data.interpretation,
      coach_notes: data.coachNotes, administered_by: data.administeredBy,
    }).select().single()
    if (row) set(s => ({ tests: [{
      id: row.id, participantId: row.participant_id, type: row.type, date: row.date,
      result: row.result, score: row.score, interpretation: row.interpretation,
      coachNotes: row.coach_notes, administeredBy: row.administered_by, createdAt: row.created_at,
    }, ...s.tests] }))
  },

  addAppointment: async (data) => {
    const { data: row } = await supabase.from('appointments').insert({
      title: data.title, participant_id: data.participantId,
      participant_name: data.participantName, coach_id: data.coachId,
      coach_name: data.coachName, program_type: data.programType,
      date: data.date, start_time: data.startTime, end_time: data.endTime,
      location: data.location, meet_link: data.meetLink, zoom_link: data.zoomLink,
      notes: data.notes, status: data.status ?? 'scheduled', color: data.color ?? '#3B82F6',
    }).select().single()
    if (row) set(s => ({ appointments: [mapAppointment(row), ...s.appointments] }))
  },
}))
