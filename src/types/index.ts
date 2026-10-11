// ─── User & Auth ───────────────────────────────────────────────────────────────
export type Role = 'super_admin' | 'admin' | 'sales_agent' | 'coach' | 'crm_manager' | 'digital'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  createdAt: string
  isActive: boolean
}

// ─── Lead (CRM) ────────────────────────────────────────────────────────────────
export type LeadStatus = 'new' | 'to_contact' | 'contacted' | 'no_answer' | 'callback' | 'interested' | 'appointment' | 'pending_payment' | 'registered' | 'not_interested'

export interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  whatsapp?: string
  email?: string
  facebookName?: string
  instagram?: string
  source: string
  campaign?: string
  adSet?: string
  city?: string
  profession?: string
  programInterest?: string
  interestLevel?: 'low' | 'medium' | 'high'
  status: LeadStatus
  assignedTo?: string
  notes: LeadNote[]
  followUps: FollowUp[]
  nextFollowUpDate?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  // Affectation & suivi
  assignedToName?: string      // nom de la personne assignée
  lastTouchedBy?: string       // nom de la dernière personne à avoir modifié
  lastTouchedAt?: string       // date de la dernière modification
  // Meta Ads fields
  metaLeadId?: string          // id depuis l'export Meta (l:XXXXXXXXX)
  horairePreference?: string   // disponibilité (quand disponible)
  delaiAction?: string         // sous combien de temps passer à l'action
  // Inscription form fields
  genre?: string
  dateNaissance?: string
  adresse?: string
  cin?: string
  modaliteParticipation?: string
  modalitePaiement?: string
  montantVerse?: number
  prixFormation?: number
  dateVersement2?: string
  dateVersement3?: string
  inscriptionId?: string
  // Programme
  programTag?: 'coaching_adulte' | 'classes_avenir'
  // Classes de l'Avenir — infos enfant
  childName?: string
  childAge?: string
  childSchool?: string
  childLevel?: string
}

export interface LeadNote {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

export interface FollowUp {
  id: string
  type: 'call' | 'whatsapp' | 'email' | 'meeting'
  outcome: string
  notes?: string
  date: string
  authorId: string
  authorName: string
}

// ─── Participant ────────────────────────────────────────────────────────────────
export type ParticipantType = 'coaching' | 'training' | 'both'

export interface Participant {
  id: string
  leadId?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  whatsapp?: string
  gender: 'male' | 'female'
  birthDate?: string
  cin?: string
  address?: string
  profession?: string
  company?: string
  emergencyContact?: string
  type: ParticipantType
  avatar?: string
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  reference?: string
  promotionId?: string
}

// ─── Coaching ──────────────────────────────────────────────────────────────────
export interface CoachingPack {
  id: string
  participantId: string
  name: string
  weeklySlot?: string
  totalSessions: number
  usedSessions: number
  price: number
  discount: number
  amountPaid: number
  purchaseDate: string
  expirationDate?: string
  status: 'active' | 'completed' | 'expired' | 'paused'
  coachId: string
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'missed'

export interface CoachingSession {
  id: string
  packId: string
  participantId: string
  coachId: string
  date: string
  time: string
  duration: number
  sessionNumber: number
  status: SessionStatus
  summary?: string
  objectives?: string
  homework?: string
  privateNotes?: string
  meetLink?: string
  zoomLink?: string
  createdAt: string
}

// ─── Training ──────────────────────────────────────────────────────────────────
export interface TrainingProgram {
  id: string
  name: string
  description?: string
  level?: string
  durationDays: number
  price: number
  maxCapacity: number
  isActive: boolean
  color?: string
}

export interface CohortSession {
  date: string
  startTime: string
  endTime: string
  status: 'completed' | 'scheduled' | 'cancelled'
}

export interface Cohort {
  id: string
  programId: string
  programName: string
  startDate: string
  endDate: string
  trainerId: string
  trainerName: string
  location: string
  capacity: number
  enrollmentCount: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  sessions?: CohortSession[]
}

export interface TrainingEnrollment {
  id: string
  participantId: string
  cohortId: string
  enrollmentDate: string
  attendancePercent: number
  status: 'enrolled' | 'completed' | 'dropped' | 'certified'
  certificateIssued: boolean
  certificateDate?: string
  certificateNumber?: string
  amountPaid: number
  totalAmount: number
}

// ─── Payments ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'virement'

export interface Payment {
  id: string
  participantId: string
  participantName: string
  programType: 'coaching' | 'training'
  programName: string
  session?: string
  totalAmount: number
  amountPaid: number
  remainingAmount: number
  status: PaymentStatus
  method: PaymentMethod
  reference?: string
  date: string
  dueDate?: string
  notes?: string
  installments: Installment[]
  createdAt: string
}

export interface Installment {
  id: string
  paymentId: string
  amount: number
  date: string
  method: PaymentMethod
  reference?: string
  status: 'paid' | 'pending'
}

// ─── Calendar ──────────────────────────────────────────────────────────────────
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

export interface Appointment {
  id: string
  title: string
  participantId?: string
  participantName?: string
  coachId: string
  coachName: string
  programType?: 'coaching' | 'training'
  date: string
  startTime: string
  endTime: string
  location?: string
  meetLink?: string
  zoomLink?: string
  notes?: string
  status: AppointmentStatus
  reminderSent: boolean
  color?: string
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
export type TestType = 'DISC' | 'MBTI' | 'Enneagram' | 'Life Wheel' | 'Values' | 'Ikigai' | 'Strengths' | 'LifeBook'

export interface PsychometricTest {
  id: string
  participantId: string
  type: TestType
  date: string
  result?: string
  score?: string
  interpretation?: string
  coachNotes?: string
  pdfUrl?: string
  administeredBy: string
  createdAt: string
}

// ─── Documents ─────────────────────────────────────────────────────────────────
export type DocumentType = 'contract' | 'certificate' | 'invoice' | 'pdf' | 'image' | 'word' | 'excel' | 'video' | 'other'

export interface Document {
  id: string
  participantId?: string
  name: string
  type: DocumentType
  size: number
  url: string
  uploadedBy: string
  uploadedAt: string
  version: number
  tags?: string[]
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export interface Task {
  id: string
  title: string
  description?: string
  assignedTo: string
  assignedToName: string
  createdBy: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  relatedTo?: string
  relatedType?: 'lead' | 'participant' | 'payment'
  isRecurring: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// ─── Notification ──────────────────────────────────────────────────────────────
export type NotificationType = 'appointment' | 'payment_overdue' | 'new_lead' | 'new_registration' | 'task_assigned' | 'certificate' | 'general'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

// ─── Activity Log ──────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  details?: string
  createdAt: string
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export interface DashboardStats {
  totalLeads: number
  leadsToday: number
  newRegistrations: number
  activeCoachingClients: number
  activeTrainingParticipants: number
  revenueThisMonth: number
  revenueThisYear: number
  pendingPayments: number
  upcomingAppointments: number
  sessionsToday: number
  completionRate: number
  certificatesIssued: number
}
