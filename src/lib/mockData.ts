import type {
  User, Lead, Participant, CoachingPack, CoachingSession,
  Payment, Appointment, Task, Notification, ActivityLog,
  TrainingProgram, Cohort, PsychometricTest, DashboardStats
} from '../types'

// ─── Users ─────────────────────────────────────────────────────────────────────
export const USERS: User[] = [
  { id: 'u1', name: 'Zineb Eddaqaqi', email: 'zineb@successcompass.ma', role: 'admin', createdAt: '2024-01-01', isActive: true },
  { id: 'u2', name: 'Sofya Benali', email: 'sofya@successcompass.ma', role: 'admin', createdAt: '2024-01-01', isActive: true },
  { id: 'u3', name: 'Omar Kabbaj', email: 'omar@successcompass.ma', role: 'sales_agent', createdAt: '2024-02-01', isActive: true },
  { id: 'u4', name: 'Youssef Amrani', email: 'youssef@successcompass.ma', role: 'coach', createdAt: '2024-02-15', isActive: true },
  { id: 'u5', name: 'Admin Système', email: 'admin@successcompass.ma', role: 'super_admin', createdAt: '2024-01-01', isActive: true },
]

// ─── Leads ─────────────────────────────────────────────────────────────────────
export const LEADS: Lead[] = [
  {
    id: 'l1', firstName: 'Houda', lastName: 'Mansouri', phone: '+212661234567',
    whatsapp: '+212661234567', email: 'houda.m@gmail.com', facebookName: 'Houda Mansouri',
    source: 'Meta Ads', campaign: 'Coach de Vie - Janvier', adSet: 'Audience Femmes 25-40',
    status: 'interested', assignedTo: 'u3',
    notes: [{ id: 'n1', content: 'Très intéressée par le coaching personnel, budget ok', authorId: 'u3', authorName: 'Omar Kabbaj', createdAt: '2026-06-01T10:00:00Z' }],
    followUps: [{ id: 'f1', type: 'call', outcome: 'answered', notes: 'Rappel prévu jeudi', date: '2026-06-01T10:00:00Z', authorId: 'u3', authorName: 'Omar Kabbaj' }],
    nextFollowUpDate: '2026-06-15', createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-06-01T10:00:00Z', tags: ['coaching']
  },
  {
    id: 'l2', firstName: 'Rachid', lastName: 'Tahiri', phone: '+212662345678',
    whatsapp: '+212662345678', email: 'r.tahiri@outlook.com',
    source: 'Meta Ads', campaign: 'Coach de Vie - Janvier', adSet: 'Audience Hommes 30-45',
    status: 'callback', assignedTo: 'u3',
    notes: [], followUps: [],
    nextFollowUpDate: '2026-06-14', createdAt: '2026-06-02T09:00:00Z', updatedAt: '2026-06-02T09:00:00Z', tags: []
  },
  {
    id: 'l3', firstName: 'Fatima', lastName: 'Chraibi', phone: '+212663456789',
    source: 'Instagram', campaign: 'Life Coach Cert',
    status: 'registered', assignedTo: 'u3',
    notes: [{ id: 'n2', content: 'Inscrite formation Coach de Vie Niveau 1', authorId: 'u2', authorName: 'Sofya Benali', createdAt: '2026-06-05T14:00:00Z' }],
    followUps: [],
    createdAt: '2026-05-28T11:00:00Z', updatedAt: '2026-06-05T14:00:00Z', tags: ['formation']
  },
  {
    id: 'l4', firstName: 'Sara', lastName: 'Benchekroun', phone: '+212664567890',
    whatsapp: '+212664567890', email: 'sara.b@gmail.com',
    source: 'Meta Ads', campaign: 'Coach de Vie - Février',
    status: 'no_answer', assignedTo: 'u3',
    notes: [], followUps: [],
    nextFollowUpDate: '2026-06-13', createdAt: '2026-06-08T07:00:00Z', updatedAt: '2026-06-08T07:00:00Z', tags: []
  },
  {
    id: 'l5', firstName: 'Karim', lastName: 'Zouheir', phone: '+212665678901',
    source: 'Référence', campaign: undefined,
    status: 'new', assignedTo: 'u3',
    notes: [], followUps: [],
    createdAt: '2026-06-12T08:00:00Z', updatedAt: '2026-06-12T08:00:00Z', tags: []
  },
  {
    id: 'l6', firstName: 'Nadia', lastName: 'Filali', phone: '+212666789012',
    source: 'Meta Ads', campaign: 'Coach de Vie - Juin',
    status: 'not_interested', assignedTo: 'u3',
    notes: [{ id: 'n3', content: 'Budget insuffisant pour le moment', authorId: 'u3', authorName: 'Omar Kabbaj', createdAt: '2026-06-10T11:00:00Z' }],
    followUps: [],
    createdAt: '2026-06-09T10:00:00Z', updatedAt: '2026-06-10T11:00:00Z', tags: []
  },
  {
    id: 'l7', firstName: 'Amine', lastName: 'Saidi', phone: '+212667890123',
    whatsapp: '+212667890123', email: 'amine.s@gmail.com',
    source: 'Meta Ads', campaign: 'Life Coach Cert - Juin',
    status: 'interested', assignedTo: 'u3',
    notes: [], followUps: [],
    nextFollowUpDate: '2026-06-16', createdAt: '2026-06-11T09:00:00Z', updatedAt: '2026-06-11T09:00:00Z', tags: ['certification']
  },
  {
    id: 'l8', firstName: 'Leila', lastName: 'Moussaoui', phone: '+212668901234',
    source: 'Site Web',
    status: 'callback', assignedTo: 'u3',
    notes: [], followUps: [],
    nextFollowUpDate: '2026-06-13', createdAt: '2026-06-12T07:00:00Z', updatedAt: '2026-06-12T07:00:00Z', tags: []
  },
]

// ─── Participants ──────────────────────────────────────────────────────────────
export const PARTICIPANTS: Participant[] = [
  {
    id: 'p1', leadId: 'l3', firstName: 'Fatima', lastName: 'Chraibi',
    email: 'fatima.chraibi@gmail.com', phone: '+212663456789',
    gender: 'female', birthDate: '1988-03-15', cin: 'BE234567',
    address: 'Casablanca, Maarif', profession: 'Responsable RH', company: 'Groupe OCP',
    type: 'both', notes: 'Très motivée, profil leader', tags: ['coaching', 'formation', 'vip'],
    createdAt: '2026-06-05T14:00:00Z', updatedAt: '2026-06-05T14:00:00Z', isActive: true
  },
  {
    id: 'p2', firstName: 'Mehdi', lastName: 'Alaoui',
    email: 'mehdi.alaoui@gmail.com', phone: '+212661111222',
    gender: 'male', birthDate: '1985-07-22', cin: 'BJ123456',
    profession: 'Entrepreneur', company: 'Auto-entrepreneur',
    type: 'coaching', notes: '', tags: ['coaching'],
    createdAt: '2026-04-10T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z', isActive: true
  },
  {
    id: 'p3', firstName: 'Yasmine', lastName: 'Ouali',
    email: 'yasmine.ouali@gmail.com', phone: '+212662222333',
    gender: 'female', birthDate: '1992-11-08',
    profession: 'Professeure', type: 'training', notes: '', tags: ['formation'],
    createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z', isActive: true
  },
  {
    id: 'p4', firstName: 'Omar', lastName: 'Bennis',
    email: 'omar.bennis@gmail.com', phone: '+212663333444',
    gender: 'male', profession: 'Coach sportif',
    type: 'training', notes: '', tags: ['formation', 'certification'],
    createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z', isActive: true
  },
  {
    id: 'p5', firstName: 'Samira', lastName: 'Hasnaoui',
    email: 'samira.h@gmail.com', phone: '+212664444555',
    gender: 'female', profession: 'Médecin', company: 'Clinique Al Farabi',
    type: 'coaching', notes: 'Travail sur burn-out', tags: ['coaching', 'urgent'],
    createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z', isActive: true
  },
]

// ─── Coaching Packs ────────────────────────────────────────────────────────────
export const COACHING_PACKS: CoachingPack[] = [
  {
    id: 'cp1', participantId: 'p1', name: 'Pack Premium 10 Séances',
    totalSessions: 10, usedSessions: 4, price: 8000, discount: 500,
    amountPaid: 5000, purchaseDate: '2026-06-05', expirationDate: '2026-12-05',
    status: 'active', coachId: 'u4'
  },
  {
    id: 'cp2', participantId: 'p2', name: 'Pack Essentiel 6 Séances',
    totalSessions: 6, usedSessions: 6, price: 5400, discount: 0,
    amountPaid: 5400, purchaseDate: '2026-04-10', expirationDate: '2026-10-10',
    status: 'completed', coachId: 'u4'
  },
  {
    id: 'cp3', participantId: 'p5', name: 'Pack Burn-out 8 Séances',
    totalSessions: 8, usedSessions: 2, price: 7200, discount: 0,
    amountPaid: 3600, purchaseDate: '2026-05-01', expirationDate: '2026-11-01',
    status: 'active', coachId: 'u4'
  },
]

// ─── Coaching Sessions ─────────────────────────────────────────────────────────
export const COACHING_SESSIONS: CoachingSession[] = [
  {
    id: 's1', packId: 'cp1', participantId: 'p1', coachId: 'u4',
    date: '2026-06-10', time: '10:00', duration: 60, sessionNumber: 4,
    status: 'completed', summary: 'Travail sur la vision et les valeurs personnelles',
    objectives: 'Clarifier les objectifs professionnels', homework: 'Exercice roue de la vie',
    createdAt: '2026-06-01T10:00:00Z'
  },
  {
    id: 's2', packId: 'cp1', participantId: 'p1', coachId: 'u4',
    date: '2026-06-17', time: '10:00', duration: 60, sessionNumber: 5,
    status: 'scheduled', meetLink: 'https://meet.google.com/abc-defg-hij',
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 's3', packId: 'cp3', participantId: 'p5', coachId: 'u4',
    date: '2026-06-12', time: '14:00', duration: 90, sessionNumber: 2,
    status: 'scheduled', createdAt: '2026-06-01T10:00:00Z'
  },
]

// ─── Training Programs ─────────────────────────────────────────────────────────
export const TRAINING_PROGRAMS: TrainingProgram[] = [
  { id: 'tp1', name: 'Coach de Vie Niveau 1', description: 'Formation de base en coaching de vie', level: 'Débutant', durationDays: 30, price: 12000, maxCapacity: 20, isActive: true, color: '#3b82f6' },
  { id: 'tp2', name: 'Coach de Vie Niveau 2', description: 'Approfondissement des techniques de coaching', level: 'Intermédiaire', durationDays: 45, price: 15000, maxCapacity: 15, isActive: true, color: '#8b5cf6' },
  { id: 'tp3', name: 'Life Coach Certification', description: 'Certification internationale de coaching de vie', level: 'Avancé', durationDays: 60, price: 25000, maxCapacity: 12, isActive: true, color: '#f59e0b' },
]

// ─── Cohorts ───────────────────────────────────────────────────────────────────
export const COHORTS: Cohort[] = [
  {
    id: 'c1', programId: 'tp1', programName: 'Coach de Vie Niveau 1',
    startDate: '2026-06-15', endDate: '2026-07-15',
    trainerId: 'u4', trainerName: 'Youssef Amrani',
    location: 'Casablanca - Salle de formation', capacity: 20, enrollmentCount: 8,
    status: 'upcoming'
  },
  {
    id: 'c2', programId: 'tp3', programName: 'Life Coach Certification',
    startDate: '2026-04-01', endDate: '2026-05-31',
    trainerId: 'u2', trainerName: 'Sofya Benali',
    location: 'Casablanca - Hôtel Barceló', capacity: 12, enrollmentCount: 10,
    status: 'active'
  },
]

// ─── Payments ─────────────────────────────────────────────────────────────────
export const PAYMENTS: Payment[] = [
  {
    id: 'pay1', participantId: 'p1', participantName: 'Fatima Chraibi',
    programType: 'coaching', programName: 'Pack Premium 10 Séances',
    totalAmount: 7500, amountPaid: 5000, remainingAmount: 2500,
    status: 'partial', method: 'bank_transfer', reference: 'VIR-2026-001',
    date: '2026-06-05', dueDate: '2026-07-05',
    installments: [
      { id: 'i1', paymentId: 'pay1', amount: 5000, date: '2026-06-05', method: 'bank_transfer', reference: 'VIR-2026-001', status: 'paid' },
    ],
    createdAt: '2026-06-05T14:00:00Z'
  },
  {
    id: 'pay2', participantId: 'p2', participantName: 'Mehdi Alaoui',
    programType: 'coaching', programName: 'Pack Essentiel 6 Séances',
    totalAmount: 5400, amountPaid: 5400, remainingAmount: 0,
    status: 'paid', method: 'cash', reference: 'CASH-2026-015',
    date: '2026-04-10',
    installments: [],
    createdAt: '2026-04-10T10:00:00Z'
  },
  {
    id: 'pay3', participantId: 'p5', participantName: 'Samira Hasnaoui',
    programType: 'coaching', programName: 'Pack Burn-out 8 Séances',
    totalAmount: 7200, amountPaid: 3600, remainingAmount: 3600,
    status: 'partial', method: 'bank_transfer',
    date: '2026-05-01', dueDate: '2026-06-01',
    installments: [],
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'pay4', participantId: 'p3', participantName: 'Yasmine Ouali',
    programType: 'training', programName: 'Life Coach Certification',
    totalAmount: 25000, amountPaid: 0, remainingAmount: 25000,
    status: 'overdue', method: 'bank_transfer',
    date: '2026-04-01', dueDate: '2026-05-01',
    installments: [],
    createdAt: '2026-04-01T10:00:00Z'
  },
]

// ─── Appointments ──────────────────────────────────────────────────────────────
export const APPOINTMENTS: Appointment[] = [
  {
    id: 'apt1', title: 'Séance coaching - Fatima Chraibi',
    participantId: 'p1', participantName: 'Fatima Chraibi',
    coachId: 'u4', coachName: 'Youssef Amrani',
    programType: 'coaching', date: '2026-06-17',
    startTime: '10:00', endTime: '11:00',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    status: 'scheduled', reminderSent: false, color: '#3b82f6'
  },
  {
    id: 'apt2', title: 'Séance coaching - Samira Hasnaoui',
    participantId: 'p5', participantName: 'Samira Hasnaoui',
    coachId: 'u4', coachName: 'Youssef Amrani',
    programType: 'coaching', date: '2026-06-12',
    startTime: '14:00', endTime: '15:30',
    status: 'scheduled', reminderSent: true, color: '#8b5cf6'
  },
  {
    id: 'apt3', title: 'Entretien découverte - Houda Mansouri',
    participantId: undefined, participantName: 'Houda Mansouri',
    coachId: 'u2', coachName: 'Sofya Benali',
    date: '2026-06-14', startTime: '15:00', endTime: '16:00',
    status: 'scheduled', reminderSent: false, color: '#f59e0b'
  },
]

// ─── Tests ─────────────────────────────────────────────────────────────────────
export const PSYCHOMETRIC_TESTS: PsychometricTest[] = [
  {
    id: 't1', participantId: 'p1', type: 'DISC', date: '2026-06-08',
    result: 'Profil C/D dominant', score: 'C: 78%, D: 65%, I: 42%, S: 30%',
    interpretation: 'Profil analytique et déterminé, orienté résultats et qualité',
    administeredBy: 'u4', createdAt: '2026-06-08T10:00:00Z'
  },
  {
    id: 't2', participantId: 'p2', type: 'MBTI', date: '2026-04-15',
    result: 'ENFJ', score: 'Extraverti, Intuitif, Sentimental, Jugeant',
    interpretation: 'Le Protagoniste - Leader charismatique et inspirant',
    administeredBy: 'u4', createdAt: '2026-04-15T10:00:00Z'
  },
]

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  {
    id: 'task1', title: 'Rappeler Rachid Tahiri', description: 'Relance pour conversion',
    assignedTo: 'u3', assignedToName: 'Omar Kabbaj', createdBy: 'u2',
    priority: 'high', status: 'todo', dueDate: '2026-06-14',
    relatedTo: 'l2', relatedType: 'lead', isRecurring: false, tags: ['crm'],
    createdAt: '2026-06-12T08:00:00Z', updatedAt: '2026-06-12T08:00:00Z'
  },
  {
    id: 'task2', title: 'Préparer contrat Fatima Chraibi',
    assignedTo: 'u2', assignedToName: 'Sofya Benali', createdBy: 'u1',
    priority: 'medium', status: 'in_progress', dueDate: '2026-06-15',
    relatedTo: 'p1', relatedType: 'participant', isRecurring: false, tags: ['admin'],
    createdAt: '2026-06-10T10:00:00Z', updatedAt: '2026-06-11T09:00:00Z'
  },
  {
    id: 'task3', title: 'Relancer paiement Yasmine Ouali',
    assignedTo: 'u1', assignedToName: 'Zineb Eddaqaqi', createdBy: 'u1',
    priority: 'urgent', status: 'todo', dueDate: '2026-06-13',
    relatedTo: 'pay4', relatedType: 'payment', isRecurring: false, tags: ['paiement'],
    createdAt: '2026-06-12T07:00:00Z', updatedAt: '2026-06-12T07:00:00Z'
  },
]

// ─── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS: Notification[] = [
  { id: 'notif1', userId: 'u1', type: 'new_lead', title: 'Nouveau lead', message: 'Karim Zouheir vient d\'être ajouté depuis Meta Ads', isRead: false, link: '/crm', createdAt: '2026-06-12T08:00:00Z' },
  { id: 'notif2', userId: 'u1', type: 'payment_overdue', title: 'Paiement en retard', message: 'Le paiement de Yasmine Ouali (25 000 MAD) est en retard', isRead: false, link: '/payments', createdAt: '2026-06-11T09:00:00Z' },
  { id: 'notif3', userId: 'u1', type: 'appointment', title: 'Séance dans 2h', message: 'Séance coaching Samira Hasnaoui à 14h00', isRead: true, link: '/calendar', createdAt: '2026-06-12T12:00:00Z' },
  { id: 'notif4', userId: 'u1', type: 'task_assigned', title: 'Tâche assignée', message: 'Omar Kabbaj vous a assigné la tâche "Relancer paiement Yasmine"', isRead: false, link: '/tasks', createdAt: '2026-06-12T07:30:00Z' },
]

// ─── Activity Logs ─────────────────────────────────────────────────────────────
export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'al1', userId: 'u3', userName: 'Omar Kabbaj', action: 'Statut modifié → Intéressé', entity: 'Lead', entityId: 'l1', details: 'Fatima Chraibi', createdAt: '2026-06-12T10:30:00Z' },
  { id: 'al2', userId: 'u2', userName: 'Sofya Benali', action: 'Participant créé', entity: 'Participant', entityId: 'p1', details: 'Fatima Chraibi', createdAt: '2026-06-05T14:00:00Z' },
  { id: 'al3', userId: 'u1', userName: 'Zineb Eddaqaqi', action: 'Paiement enregistré: 5 000 MAD', entity: 'Paiement', entityId: 'pay1', details: 'Fatima Chraibi', createdAt: '2026-06-05T15:00:00Z' },
  { id: 'al4', userId: 'u4', userName: 'Youssef Amrani', action: 'Séance complétée #4', entity: 'Séance', entityId: 's1', details: 'Fatima Chraibi', createdAt: '2026-06-10T11:00:00Z' },
  { id: 'al5', userId: 'u3', userName: 'Omar Kabbaj', action: 'Note ajoutée', entity: 'Lead', entityId: 'l6', details: 'Nadia Filali', createdAt: '2026-06-10T11:00:00Z' },
  { id: 'al6', userId: 'u2', userName: 'Sofya Benali', action: 'Nouveau lead ajouté', entity: 'Lead', entityId: 'l5', details: 'Karim Zouheir', createdAt: '2026-06-12T08:00:00Z' },
]

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export const DASHBOARD_STATS: DashboardStats = {
  totalLeads: 8,
  leadsToday: 2,
  newRegistrations: 3,
  activeCoachingClients: 3,
  activeTrainingParticipants: 10,
  revenueThisMonth: 18600,
  revenueThisYear: 87400,
  pendingPayments: 31100,
  upcomingAppointments: 3,
  sessionsToday: 1,
  completionRate: 72,
  certificatesIssued: 18,
}

// ─── Revenue Chart Data ────────────────────────────────────────────────────────
export const MONTHLY_REVENUE = [
  { month: 'Jan', coaching: 12000, formation: 25000 },
  { month: 'Fév', coaching: 15000, formation: 0 },
  { month: 'Mar', coaching: 9000, formation: 45000 },
  { month: 'Avr', coaching: 18000, formation: 12000 },
  { month: 'Mai', coaching: 21000, formation: 30000 },
  { month: 'Jun', coaching: 18600, formation: 0 },
]

export const LEAD_SOURCES = [
  { name: 'Meta Ads', value: 65 },
  { name: 'Instagram', value: 18 },
  { name: 'Référence', value: 10 },
  { name: 'Site Web', value: 7 },
]

export const CONVERSION_DATA = [
  { month: 'Jan', leads: 24, converted: 8 },
  { month: 'Fév', leads: 18, converted: 6 },
  { month: 'Mar', leads: 32, converted: 12 },
  { month: 'Avr', leads: 28, converted: 10 },
  { month: 'Mai', leads: 35, converted: 14 },
  { month: 'Jun', leads: 22, converted: 9 },
]
