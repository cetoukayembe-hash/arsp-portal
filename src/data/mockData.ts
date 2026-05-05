export const enterprises = [
  { id: 'e1', name: 'Congo Build SARL', rccm: 'RCCM/KIN/2019/001', idNational: 'ID-001-2019', taxNumber: 'NIF-001', type: 'Personne Morale', sector: 'Construction', province: 'Kinshasa', city: 'Gombe', capital: 500000, congoleseCapital: 80, status: 'active', complianceScore: 92, employees: 45, founded: '2019-03-15' },
  { id: 'e2', name: 'Tech Solutions Congo', rccm: 'RCCM/KIN/2020/002', idNational: 'ID-002-2020', taxNumber: 'NIF-002', type: 'Personne Morale', sector: 'Technologie', province: 'Kinshasa', city: 'Lingwala', capital: 250000, congoleseCapital: 65, status: 'active', complianceScore: 78, employees: 22, founded: '2020-07-01' },
  { id: 'e3', name: 'Minex Services', rccm: 'RCCM/KAT/2018/003', idNational: 'ID-003-2018', taxNumber: 'NIF-003', type: 'Personne Morale', sector: 'Mines', province: 'Haut-Katanga', city: 'Lubumbashi', capital: 1000000, congoleseCapital: 55, status: 'active', complianceScore: 85, employees: 120, founded: '2018-01-10' },
  { id: 'e4', name: 'Agri Congo Plus', rccm: 'RCCM/KAS/2021/004', idNational: 'ID-004-2021', taxNumber: 'NIF-004', type: 'Personne Morale', sector: 'Agriculture', province: 'Kasai', city: 'Kananga', capital: 150000, congoleseCapital: 90, status: 'pending', complianceScore: 60, employees: 15, founded: '2021-05-20' },
  { id: 'e5', name: 'Transport Express RDC', rccm: 'RCCM/KIN/2017/005', idNational: 'ID-005-2017', taxNumber: 'NIF-005', type: 'Personne Morale', sector: 'Transport', province: 'Kinshasa', city: 'Matete', capital: 300000, congoleseCapital: 75, status: 'active', complianceScore: 88, employees: 35, founded: '2017-11-03' },
];

export const tenders = [
  { id: 't1', title: 'Construction de 50 logements sociaux', sector: 'Construction', province: 'Kinshasa', budget: '$2,500,000', deadline: '2026-06-30', status: 'open', primeId: 'e1', description: 'Construction de logements sociaux dans la commune de Kimbanseke.', requirements: ['RCCM valide', 'Experience en construction', 'Capacite financiere'] },
  { id: 't2', title: 'Fourniture de materiel informatique', sector: 'Technologie', province: 'Kinshasa', budget: '$500,000', deadline: '2026-05-15', status: 'open', primeId: 'e2', description: 'Fourniture et installation de materiel informatique.', requirements: ['Certification ISO', 'Support technique local'] },
  { id: 't3', title: 'Services de transport minier', sector: 'Mines', province: 'Haut-Katanga', budget: '$1,200,000', deadline: '2026-07-01', status: 'open', primeId: 'e3', description: 'Transport de minerais entre sites miniers.', requirements: ['Flotte de vehicules lourds', 'Permis transport'] },
  { id: 't4', title: 'Rehabilitation route nationale', sector: 'Infrastructure', province: 'Kasai', budget: '$3,000,000', deadline: '2026-08-15', status: 'open', primeId: 'e1', description: 'Travaux de rehabilitation de 120km de route nationale.', requirements: ['Equipement de genie civil', 'Experience routiere'] },
];

export const contracts = [
  { id: 'c1', reference: 'CONT-2025-001', title: 'Construction logements Kimbanseke', primeId: 'e1', subcontractorId: 'e2', value: 850000, startDate: '2025-01-15', endDate: '2025-12-31', status: 'active', progress: 65 },
  { id: 'c2', reference: 'CONT-2025-002', title: 'Installation reseau fibre optique', primeId: 'e2', subcontractorId: 'e3', value: 320000, startDate: '2025-03-01', endDate: '2025-09-30', status: 'completed', progress: 100 },
  { id: 'c3', reference: 'CONT-2025-003', title: 'Transport minerais Lubumbashi', primeId: 'e3', subcontractorId: 'e5', value: 550000, startDate: '2025-02-01', endDate: '2026-01-31', status: 'active', progress: 40 },
  { id: 'c4', reference: 'CONT-2024-015', title: 'Rehabilitation batiments administratifs', primeId: 'e1', subcontractorId: 'e4', value: 180000, startDate: '2024-06-01', endDate: '2024-12-31', status: 'disputed', progress: 75 },
];

export const disputes = [
  { id: 'd1', caseNumber: 'LIT-2025-001', contractId: 'c4', plaintiffId: 'e4', defendantId: 'e1', description: 'Non-paiement des factures pour les travaux realises entre aout et octobre 2024.', status: 'mediation', openedDate: '2025-01-15' },
  { id: 'd2', caseNumber: 'LIT-2025-002', contractId: 'c3', plaintiffId: 'e3', defendantId: 'e5', description: 'Retard de livraison et non-conformite des services de transport.', status: 'under_review', openedDate: '2025-03-20' },
  { id: 'd3', caseNumber: 'LIT-2024-008', contractId: 'c2', plaintiffId: 'e2', defendantId: 'e3', description: 'Qualite des travaux non conforme aux specifications du contrat.', status: 'resolved', openedDate: '2024-10-05' },
];export const provinces = [
  'Kinshasa',
  'Haut-Katanga',
  'Kasai',
  'Kasai-Central',
  'Kongo-Central',
  'Nord-Kivu',
  'Sud-Kivu',
  'Maniema',
  'Orientale',
  'Equateur',
  'Nord-Ubangi',
  'Sud-Ubangi',
  'Mongala',
  'Tshuapa',
  'Sankuru',
  'Lomami',
  'Tanganyika',
  'Haut-Lomami',
  'Lualaba',
  'Maindombe',
  'Kwilu',
  'Kwango',
  'Ituri',
  'Bas-Uele',
  'Haut-Uele',
  'Tshopo',
];

export const sectors = [
  'Construction',
  'Technologie',
  'Mines',
  'Agriculture',
  'Transport',
  'Infrastructure',
  'Energie',
  'Sante',
  'Education',
  'Commerce',
];export const conversations = [
  {
    id: 'conv1',
    participant: 'Congo Build SARL',
    lastMessage: 'Bonjour, pouvez-vous confirmer la livraison?',
    time: '10:30',
    unread: 2,
    avatar: 'CB',
  },
  {
    id: 'conv2',
    participant: 'Tech Solutions Congo',
    lastMessage: 'Les documents ont été envoyés.',
    time: '09:15',
    unread: 0,
    avatar: 'TS',
  },
  {
    id: 'conv3',
    participant: 'Minex Services',
    lastMessage: 'Merci pour votre réponse rapide.',
    time: 'Hier',
    unread: 1,
    avatar: 'MS',
  },
  {
    id: 'conv4',
    participant: 'Agri Congo Plus',
    lastMessage: 'Le contrat est prêt pour signature.',
    time: 'Hier',
    unread: 0,
    avatar: 'AC',
  },
];

export const messages = [
  { id: 'm1', conversationId: 'conv1', sender: 'Congo Build SARL', content: 'Bonjour, pouvez-vous confirmer la livraison?', time: '10:30', isMe: false },
  { id: 'm2', conversationId: 'conv1', sender: 'Moi', content: 'Oui, la livraison est prevue pour demain matin.', time: '10:35', isMe: true },
  { id: 'm3', conversationId: 'conv1', sender: 'Congo Build SARL', content: 'Parfait, merci beaucoup!', time: '10:36', isMe: false },
  { id: 'm4', conversationId: 'conv2', sender: 'Tech Solutions Congo', content: 'Les documents ont ete envoyes.', time: '09:15', isMe: false },
  { id: 'm5', conversationId: 'conv2', sender: 'Moi', content: 'Recu, je vais les examiner.', time: '09:20', isMe: true },
  { id: 'm6', conversationId: 'conv3', sender: 'Minex Services', content: 'Merci pour votre reponse rapide.', time: 'Hier', isMe: false },
  { id: 'm7', conversationId: 'conv4', sender: 'Agri Congo Plus', content: 'Le contrat est pret pour signature.', time: 'Hier', isMe: false },
  { id: 'm8', conversationId: 'conv4', sender: 'Moi', content: 'Je vais le signer aujourd hui.', time: 'Hier', isMe: true },
];
  

export const payments = [
  {
    id: 'p1',
    reference: 'PAY-2025-001',
    description: 'Frais d\'enregistrement annuel',
    amount: 250,
    currency: 'USD',
    status: 'pending',
    dueDate: '2025-06-30',
    type: 'registration',
  },
  {
    id: 'p2',
    reference: 'PAY-2025-002',
    description: 'Renouvellement attestation de conformité',
    amount: 150,
    currency: 'USD',
    status: 'paid',
    dueDate: '2025-03-15',
    paidDate: '2025-03-10',
    type: 'compliance',
  },
  {
    id: 'p3',
    reference: 'PAY-2024-018',
    description: 'Frais de traitement dossier',
    amount: 75,
    currency: 'USD',
    status: 'paid',
    dueDate: '2024-12-01',
    paidDate: '2024-11-28',
    type: 'processing',
  },
  {
    id: 'p4',
    reference: 'PAY-2025-003',
    description: 'Frais de médiation litige LIT-2025-001',
    amount: 500,
    currency: 'USD',
    status: 'overdue',
    dueDate: '2025-04-01',
    type: 'dispute',
  },
];