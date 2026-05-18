export type Lang = 'en' | 'fr'

const dict = {
  en: {
    // Greetings
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    welcome_back: 'Welcome back to HOXA',

    // Nav — buyer
    nav_dashboard: 'Dashboard',
    nav_exchange: 'Exchange',
    nav_transactions: 'Transactions',
    nav_notifications: 'Notifications',
    nav_saved_sellers: 'Saved Sellers',
    nav_profile: 'Profile',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    buyer_account: 'Buyer Account',

    // Nav — seller
    nav_listings: 'Listings',
    nav_requests: 'Pending Requests',
    nav_analytics: 'Analytics',
    seller_account: 'Seller Account',
    seller_badge: 'SELLER',
    buyer_badge: 'BUYER',
    switch_to_buyer: 'Switch to Buyer',
    switch_to_seller: 'Switch to Seller',
    collapse: 'Collapse',

    // Hero / overview card
    exchange_activity: "Here's your exchange activity",
    completed: 'Completed',
    exchanges: 'exchanges',
    active: 'Active',
    in_progress: 'in progress',
    avg_speed: 'Avg Speed',
    minutes: 'minutes',
    no_data: 'no data',
    awaiting_verification: 'awaiting verification',
    start_exchange: 'Start Exchange',
    track_active: 'Track Active',

    // Quick Exchange widget
    quick_exchange: 'Quick Exchange',
    find_best_rate: 'Find the best rate instantly',
    you_send: 'You send',
    you_receive: 'You receive',
    amount_optional: 'Amount (optional)',
    escrow_protected: 'All exchanges are escrow-protected by HOXA',
    find_sellers: 'Find Sellers',

    // Recommended sellers
    recommended_sellers: 'Recommended Sellers',
    ranked_by: 'Ranked by reputation & speed',
    see_all: 'See all',
    no_active_sellers: 'No active sellers yet',
    sellers_appear_soon: 'Sellers will appear here once approved and live.',

    // Active transactions
    active_transactions: 'Active Transactions',
    view_all: 'View all',

    // Recent activity
    recent_activity: 'Recent Activity',
    no_activity: 'No activity yet',
    no_activity_sub: 'Your completed exchanges will appear here.',
    start_an_exchange: 'Start an Exchange',

    // Status labels
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
    status_timed_out: 'Timed Out',
    status_disputed: 'Disputed',
    status_proof_sent: 'Proof Sent',
    status_verified: 'Verified',
    status_accepted: 'Accepted',
    status_awaiting: 'Awaiting',
    status_pending: 'Pending',
    status_rejected: 'Rejected',
    status_unknown: 'Unknown',

    // Escrow trust
    escrow_title: 'HOXA Escrow Protection',
    escrow_body: 'Funds are verified before seller fulfilment begins. Every exchange is protected.',

    // Become seller
    become_seller: 'Become a Seller',
    become_seller_sub: 'List your liquidity and earn from every exchange on HOXA.',
    apply_now: 'Apply Now',
    application_review: 'Application Under Review',
    application_review_sub: "We'll notify you once your seller application is approved.",
    approved_seller: "You're an Approved Seller",
    go_seller_dashboard: 'Go to Seller Dashboard',

    // Wallet card (seller)
    available_liquidity: 'Available Liquidity',
    pending_settlements: 'Pending Settlements',
    daily_volume: 'Daily Volume',
    add_listing: 'Add Listing',
    pause_all: 'Pause All',

    // Reputation card (seller)
    reputation: 'Reputation',
    seller_tier: 'Seller Tier',
    completion_rate: 'Completion Rate',
    verified_seller: 'Verified Seller',
    fast_responder: 'Fast Responder',
    performance: 'Performance',
    response_rate: 'Response Rate',
    acceptance_rate: 'Acceptance Rate',
    timeout_rate: 'Timeout Rate',

    // Seller tiers
    tier_gold: 'Gold Seller',
    tier_silver: 'Silver Seller',
    tier_bronze: 'Bronze Seller',

    // Pending requests (seller)
    pending_requests: 'Pending Requests',
    time_left: 'Time left',
    sends: 'Sends',
    you_give: 'You give',
    rate: 'Rate',
    pair: 'Pair',
    accept: 'Accept Request',
    reject: 'Reject',
    request_accepted: 'Request Accepted',
    request_rejected: 'Request Rejected',
    transaction_active: 'Transaction is now active',
    transaction_declined: 'Transaction declined',
    expired: 'Expired',
    retry: 'Retry',

    // Seller listings
    my_listings: 'My Listings',
    your_listings: 'Your Listings',
    create_listing: 'Create Listing',
    new_listing: 'New Listing',
    edit_listing: 'Edit Listing',
    update_listing: 'Update Listing',
    no_listings: 'No listings yet',
    no_listings_sub: 'Create your first listing to appear in the marketplace',
    pending_approval: 'Pending Approval',
    available: 'Available',
    paused: 'Paused',
    edit: 'Edit',
    pause: 'Pause',
    resume: 'Resume',
    saving: 'Saving...',
    cancel: 'Cancel',
    total: 'total',
    liquidity: 'Liquidity',
    min: 'Min',
    max: 'Max',

    // Create listing modal
    currency_pair: 'Currency Pair',
    min_amount: 'Min Amount',
    max_amount: 'Max Amount',
    available_liquidity_label: 'Available Liquidity',
    payment_methods: 'Payment Methods',
    select_currency_pair: 'Select a currency pair',
    select_payment_method: 'Select at least one payment method',
    invalid_rate: 'Enter a valid rate greater than zero',
    invalid_min: 'Enter a valid minimum amount',
    invalid_max: 'Enter a valid maximum amount',
    min_exceeds_max: 'Minimum cannot exceed maximum amount',
    invalid_liquidity: 'Enter a valid liquidity amount',

    // Transactions page
    transaction_history: 'Transaction History',
    total_transactions: 'total transactions',
    no_transactions: 'No transactions found',
    change_filter: 'Try changing the filter above.',
    all: 'All',
    rejected: 'Rejected',
    fulfil: 'Fulfil',
    buyer: 'Buyer',
    amount: 'Amount',
    you_send_col: 'You Send',
    status: 'Status',
    date: 'Date',

    // Dashboard stats
    todays_trades: "Today's Trades",
    total_today: 'total today',
    all_time: 'All time',
    avg_response: 'Avg Response',
    all_time_avg: 'All time average',
    total_trades: 'Total Trades',
    timeouts: 'timeouts',

    // Dashboard sections
    no_pending: 'No pending requests',
    no_pending_sub: 'New requests will appear here when buyers initiate exchanges.',
    no_listings_dash: 'No listings yet',
    no_listings_dash_sub: 'Create your first listing to start receiving exchange requests.',
    recent_transactions: 'Recent Transactions',
    no_transactions_yet: 'No transactions yet',
    active_listings: 'Active Listings',
    live: 'live',
    manage: 'Manage',

    // Dashboard table headers
    th_txn_id: 'TXN ID',
    th_buyer: 'Buyer',
    th_pair: 'Pair',
    th_amount: 'Amount',
    th_status: 'Status',
    th_time: 'Time',

    // Notifications
    notifications: 'Notifications',
    unread: 'unread',
    all_caught_up: 'All caught up',
    mark_all_read: 'Mark all read',
    no_notifications: 'No notifications',
    no_notifications_sub: "You'll be notified when buyers initiate exchanges, payments are verified, and more.",
    just_now: 'Just now',

    // Analytics
    analytics_title: 'Analytics & Reports',
    analytics_sub: 'Performance overview for your seller account',
    total_volume: 'Total Volume',
    disputed: 'Disputed',
    monthly_volume: 'Monthly Volume',
    key_metrics: 'Key Metrics',
    top_pairs: 'Top Currency Pairs',
    no_completed_yet: 'No completed transactions yet.',
    total_active_liquidity: 'Total Active Liquidity',
    across_listings: 'Across {count} active listings',

    // Profile
    personal_info: 'Personal Information',
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    save_changes: 'Save Changes',
    saved: 'Saved!',
    saving_profile: 'Saving...',
    name_required: 'Name is required',
    choose_language: 'Choose your preferred language for the dashboard.',

    // Settings
    settings_sub: 'Manage your seller account preferences',
    display_language: 'Dashboard display language',
    notification_settings: 'Notifications',
    notification_sub: 'Email and push preferences',
    notification_soon: 'Notification settings coming soon.',
    security: 'Security',
    security_sub: 'Password and 2FA',
    security_soon: 'Security settings coming soon.',

    // Availability
    online: 'Online',
    busy: 'Busy',
    offline: 'Offline',

    // Errors
    something_wrong: 'Something went wrong',
    unexpected_error: 'An unexpected error occurred. Please try again.',
    try_again: 'Try again',
    listings_unavailable: 'Listings will be available once your account is approved.',
    no_seller_record: 'No seller record found.',
    pending_approval_msg: 'Your seller account is pending approval.',

    // Misc
    trades: 'trades',
    waiting_response: 'waiting for response',
    rejections: 'Rejections',
    requests_short: 'Requests',

    // Language
    language: 'Language',
    lang_en: 'English',
    lang_fr: 'French',
  },

  fr: {
    // Greetings
    good_morning: 'Bonjour',
    good_afternoon: 'Bon après-midi',
    good_evening: 'Bonsoir',
    welcome_back: 'Bienvenue sur HOXA',

    // Nav — buyer
    nav_dashboard: 'Tableau de bord',
    nav_exchange: 'Change',
    nav_transactions: 'Transactions',
    nav_notifications: 'Notifications',
    nav_saved_sellers: 'Changeurs favoris',
    nav_profile: 'Profil',
    nav_settings: 'Paramètres',
    nav_logout: 'Déconnexion',
    buyer_account: 'Compte acheteur',

    // Nav — seller (P2P exchange domain terms)
    nav_listings: 'Offres',
    nav_requests: 'Demandes en attente',
    nav_analytics: 'Statistiques',
    seller_account: 'Compte changeur',
    seller_badge: 'CHANGEUR',
    buyer_badge: 'ACHETEUR',
    switch_to_buyer: 'Espace acheteur',
    switch_to_seller: 'Espace changeur',
    collapse: 'Réduire',

    // Hero / overview card
    exchange_activity: 'Votre activité de change',
    completed: 'Terminés',
    exchanges: 'opérations',
    active: 'En cours',
    in_progress: 'en cours',
    avg_speed: 'Délai moyen',
    minutes: 'minutes',
    no_data: 'aucune donnée',
    awaiting_verification: 'en attente de vérification',
    start_exchange: 'Lancer un change',
    track_active: 'Suivre',

    // Quick Exchange widget
    quick_exchange: 'Change rapide',
    find_best_rate: 'Trouvez le meilleur taux instantanément',
    you_send: 'Vous envoyez',
    you_receive: 'Vous recevez',
    amount_optional: 'Montant (facultatif)',
    escrow_protected: 'Toutes les opérations sont protégées par l\'escrow HOXA',
    find_sellers: 'Trouver des changeurs',

    // Recommended sellers
    recommended_sellers: 'Changeurs recommandés',
    ranked_by: 'Classés par réputation et rapidité',
    see_all: 'Voir tout',
    no_active_sellers: 'Aucun changeur actif',
    sellers_appear_soon: 'Les changeurs apparaîtront ici une fois approuvés.',

    // Active transactions
    active_transactions: 'Transactions en cours',
    view_all: 'Voir tout',

    // Recent activity
    recent_activity: 'Activité récente',
    no_activity: 'Aucune activité',
    no_activity_sub: 'Vos opérations terminées apparaîtront ici.',
    start_an_exchange: 'Lancer un change',

    // Status labels
    status_completed: 'Terminé',
    status_cancelled: 'Annulé',
    status_timed_out: 'Expiré',
    status_disputed: 'En litige',
    status_proof_sent: 'Preuve envoyée',
    status_verified: 'Vérifié',
    status_accepted: 'Accepté',
    status_awaiting: 'En attente',
    status_pending: 'En attente',
    status_rejected: 'Refusé',
    status_unknown: 'Inconnu',

    // Escrow trust
    escrow_title: 'Protection escrow HOXA',
    escrow_body: 'Les fonds sont vérifiés avant la livraison par le changeur. Chaque opération est sécurisée.',

    // Become seller
    become_seller: 'Devenir changeur',
    become_seller_sub: 'Proposez votre liquidité et gagnez sur chaque opération HOXA.',
    apply_now: 'Postuler',
    application_review: 'Candidature en cours d\'examen',
    application_review_sub: 'Nous vous notifierons dès que votre candidature sera approuvée.',
    approved_seller: 'Vous êtes un changeur approuvé',
    go_seller_dashboard: 'Accéder au tableau de bord',

    // Wallet card (seller)
    available_liquidity: 'Liquidité disponible',
    pending_settlements: 'Règlements en attente',
    daily_volume: 'Volume du jour',
    add_listing: 'Ajouter une offre',
    pause_all: 'Tout suspendre',

    // Reputation card (seller)
    reputation: 'Réputation',
    seller_tier: 'Niveau',
    completion_rate: 'Taux de complétion',
    verified_seller: 'Changeur vérifié',
    fast_responder: 'Réponse rapide',
    performance: 'Performance',
    response_rate: 'Taux de réponse',
    acceptance_rate: 'Taux d\'acceptation',
    timeout_rate: 'Taux d\'expiration',

    // Seller tiers
    tier_gold: 'Changeur Or',
    tier_silver: 'Changeur Argent',
    tier_bronze: 'Changeur Bronze',

    // Pending requests (seller)
    pending_requests: 'Demandes en attente',
    time_left: 'Temps restant',
    sends: 'Envoie',
    you_give: 'Vous donnez',
    rate: 'Taux',
    pair: 'Paire',
    accept: 'Accepter',
    reject: 'Refuser',
    request_accepted: 'Demande acceptée',
    request_rejected: 'Demande refusée',
    transaction_active: 'La transaction est maintenant active',
    transaction_declined: 'Transaction refusée',
    expired: 'Expiré',
    retry: 'Réessayer',

    // Seller listings
    my_listings: 'Mes offres',
    your_listings: 'Vos offres',
    create_listing: 'Créer une offre',
    new_listing: 'Nouvelle offre',
    edit_listing: 'Modifier l\'offre',
    update_listing: 'Mettre à jour',
    no_listings: 'Aucune offre',
    no_listings_sub: 'Créez votre première offre pour apparaître sur le marché',
    pending_approval: 'En attente d\'approbation',
    available: 'Disponible',
    paused: 'Suspendu',
    edit: 'Modifier',
    pause: 'Suspendre',
    resume: 'Reprendre',
    saving: 'Enregistrement...',
    cancel: 'Annuler',
    total: 'au total',
    liquidity: 'Liquidité',
    min: 'Min',
    max: 'Max',

    // Create listing modal
    currency_pair: 'Paire de devises',
    min_amount: 'Montant min',
    max_amount: 'Montant max',
    available_liquidity_label: 'Liquidité disponible',
    payment_methods: 'Méthodes de paiement',
    select_currency_pair: 'Sélectionnez une paire de devises',
    select_payment_method: 'Sélectionnez au moins une méthode de paiement',
    invalid_rate: 'Entrez un taux valide supérieur à zéro',
    invalid_min: 'Entrez un montant minimum valide',
    invalid_max: 'Entrez un montant maximum valide',
    min_exceeds_max: 'Le minimum ne peut pas dépasser le maximum',
    invalid_liquidity: 'Entrez un montant de liquidité valide',

    // Transactions page
    transaction_history: 'Historique des transactions',
    total_transactions: 'transactions au total',
    no_transactions: 'Aucune transaction trouvée',
    change_filter: 'Essayez de changer le filtre ci-dessus.',
    all: 'Tout',
    rejected: 'Refusé',
    fulfil: 'Livrer',
    buyer: 'Acheteur',
    amount: 'Montant',
    you_send_col: 'Vous envoyez',
    status: 'Statut',
    date: 'Date',

    // Dashboard stats
    todays_trades: 'Opérations du jour',
    total_today: 'au total aujourd\'hui',
    all_time: 'Global',
    avg_response: 'Réponse moy.',
    all_time_avg: 'Moyenne globale',
    total_trades: 'Total opérations',
    timeouts: 'expirations',

    // Dashboard sections
    no_pending: 'Aucune demande en attente',
    no_pending_sub: 'Les nouvelles demandes apparaîtront ici lorsque les acheteurs lanceront des changes.',
    no_listings_dash: 'Aucune offre',
    no_listings_dash_sub: 'Créez votre première offre pour recevoir des demandes de change.',
    recent_transactions: 'Transactions récentes',
    no_transactions_yet: 'Aucune transaction',
    active_listings: 'Offres actives',
    live: 'en ligne',
    manage: 'Gérer',

    // Dashboard table headers
    th_txn_id: 'ID TXN',
    th_buyer: 'Acheteur',
    th_pair: 'Paire',
    th_amount: 'Montant',
    th_status: 'Statut',
    th_time: 'Date',

    // Notifications
    notifications: 'Notifications',
    unread: 'non lues',
    all_caught_up: 'Tout est à jour',
    mark_all_read: 'Tout marquer lu',
    no_notifications: 'Aucune notification',
    no_notifications_sub: 'Vous serez notifié lorsque des acheteurs lancent des changes, des paiements sont vérifiés, etc.',
    just_now: 'À l\'instant',

    // Analytics
    analytics_title: 'Statistiques & Rapports',
    analytics_sub: 'Vue d\'ensemble des performances de votre compte',
    total_volume: 'Volume total',
    disputed: 'En litige',
    monthly_volume: 'Volume mensuel',
    key_metrics: 'Indicateurs clés',
    top_pairs: 'Paires les plus échangées',
    no_completed_yet: 'Aucune transaction terminée.',
    total_active_liquidity: 'Liquidité active totale',
    across_listings: 'Sur {count} offres actives',

    // Profile
    personal_info: 'Informations personnelles',
    full_name: 'Nom complet',
    email: 'Email',
    phone: 'Téléphone',
    country: 'Pays',
    save_changes: 'Enregistrer',
    saved: 'Enregistré !',
    saving_profile: 'Enregistrement...',
    name_required: 'Le nom est requis',
    choose_language: 'Choisissez la langue d\'affichage du tableau de bord.',

    // Settings
    settings_sub: 'Gérez les préférences de votre compte',
    display_language: 'Langue d\'affichage',
    notification_settings: 'Notifications',
    notification_sub: 'Préférences email et push',
    notification_soon: 'Paramètres de notification bientôt disponibles.',
    security: 'Sécurité',
    security_sub: 'Mot de passe et 2FA',
    security_soon: 'Paramètres de sécurité bientôt disponibles.',

    // Availability
    online: 'En ligne',
    busy: 'Occupé',
    offline: 'Hors ligne',

    // Errors
    something_wrong: 'Une erreur est survenue',
    unexpected_error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    try_again: 'Réessayer',
    listings_unavailable: 'Les offres seront disponibles une fois votre compte approuvé.',
    no_seller_record: 'Aucun compte changeur trouvé.',
    pending_approval_msg: 'Votre compte changeur est en attente d\'approbation.',

    // Misc
    trades: 'opérations',
    waiting_response: 'en attente de réponse',
    rejections: 'Refus',
    requests_short: 'Demandes',

    // Language
    language: 'Langue',
    lang_en: 'Anglais',
    lang_fr: 'Français',
  },
} as const

type Dict = typeof dict.en
export type TKey = keyof Dict

export function t(lang: Lang, key: TKey): string {
  return (dict[lang] as Dict)[key] ?? (dict.en as Dict)[key] ?? key
}

export function getGreeting(lang: Lang, hour: number): string {
  if (hour < 12) return t(lang, 'good_morning')
  if (hour < 17) return t(lang, 'good_afternoon')
  return t(lang, 'good_evening')
}
