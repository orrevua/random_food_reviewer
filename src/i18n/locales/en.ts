import type pt from './pt'

const en: { [K in keyof typeof pt]: string } = {
  // Common
  'common.back': '← Back',
  'common.loading': 'Loading…',
  'common.saving': 'Saving…',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.add': 'Add',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.open': 'Open',
  'common.rename': 'Rename',
  'common.pleaseWait': 'Please wait…',
  'common.user': 'User',

  // App shell
  'app.signOut': 'Sign out',

  // Theme
  'theme.switchToDark': 'Dark mode',
  'theme.switchToLight': 'Light mode',

  // Login
  'login.welcomeBack': 'Welcome back — sign in to continue.',
  'login.createAccountCta': 'Create an account to start reviewing.',
  'login.emailLabel': 'Email',
  'login.emailPlaceholder': 'you@example.com',
  'login.passwordLabel': 'Password',
  'login.passwordPlaceholder': '••••••••',
  'login.signIn': 'Sign in',
  'login.createAccount': 'Create account',
  'login.noAccount': "Don't have an account?",
  'login.haveAccount': 'Already have an account?',
  'login.signUp': 'Sign up',
  'login.checkEmail': 'Check your email to confirm your account (if confirmation is enabled).',

  // Dashboard
  'dashboard.myCategories': 'My categories',
  'dashboard.sharedCategories': 'Shared with me',
  'dashboard.newCategoryPlaceholder': 'New category',
  'dashboard.emptyOwned': 'No categories yet.',
  'dashboard.emptyJoined': 'No shared categories.',
  'dashboard.invitePlaceholder': 'Paste invite UUID',
  'dashboard.join': 'Join',
  'dashboard.confirmDeleteCategory': 'Delete category "{{name}}"? This will remove establishments and reviews.',
  'dashboard.badgeOwner': 'owner',
  'dashboard.badgeMember': 'member',

  // Join
  'join.title': 'Joining category…',
  'join.processing': 'Processing invite…',

  // Profile
  'profile.title': 'Profile',
  'profile.displayNameLabel': 'Display name',
  'profile.displayNamePlaceholder': 'How you appear on reviews',
  'profile.emailLabel': 'Email: {{email}}',
  'profile.saved': 'Profile saved.',

  // CategoryDetail
  'category.fallbackTitle': 'Category',
  'category.share': 'Share',
  'category.copied': 'Copied!',
  'category.shareWarning': 'Link copied. Anyone with this link can view and add to this category.',
  'category.manageTopics': 'Manage topics',
  'category.rollDice': '🎲 Roll the dice',
  'category.allReviewed': 'All reviewed — add more!',
  'category.goTo': 'Go to: ',
  'category.newEstablishmentPlaceholder': 'New establishment',
  'category.addressPlaceholder': 'Address (optional)',
  'category.instagramPlaceholder': 'Instagram @ (optional)',
  'category.emptyEstablishments': 'No establishments yet.',
  'category.reviewsCount': '{{n}} reviews',
  'category.reviewOne': 'Review',
  'category.editReview': 'Edit review',
  'category.confirmDeleteEstablishment': 'Delete establishment "{{name}}"?',
  'category.topics.empty': 'No topics yet.',
  'category.topics.newPlaceholder': 'New topic',
  'category.topics.add': 'Add topic',
  'category.topics.confirmDelete': 'Delete this topic? Historical scores for it will be erased.',
  'category.members': 'Members ({{n}})',
  'category.membersEmpty': 'Nobody has joined yet.',
  'category.editName': 'Edit name',
  'category.nameEmpty': 'Name cannot be empty.',
  'category.memberJoined': 'Joined {{date}}',
  'category.memberReviews': 'Reviews in this category ({{n}})',
  'category.memberNoReviews': 'No reviews in this category yet.',

  // EstablishmentDetail
  'establishment.notFound': 'Establishment not found.',
  'establishment.editInfo': 'Edit info',
  'establishment.addedBy': 'Added by {{name}} on {{date}}',
  'establishment.noReviewsYet': 'No reviews yet. Be the first to review.',
  'establishment.editMyReview': 'Edit my review',
  'establishment.mapAlt': 'Map: {{address}}',
  'establishment.namePlaceholder': 'Name',
  'establishment.saveChanges': 'Save changes',

  // ReviewPage
  'review.editTitle': 'Edit review: {{name}}',
  'review.createTitle': 'Review: {{name}}',

  // ReviewForm
  'reviewForm.pickForEachTopic': 'Pick a score for each topic.',
  'reviewForm.noTopics': 'No topics configured — ask the category owner to add topics.',
  'reviewForm.notesPlaceholder': 'Notes',
  'reviewForm.photoLabel': 'Food photo (optional)',
  'reviewForm.currentPhotoAlt': 'Current photo',
  'reviewForm.previewAlt': 'Preview',
  'reviewForm.removeCurrentPhoto': 'Remove current photo',
  'reviewForm.saveReview': 'Save review',

  // ReviewRow
  'reviewRow.you': 'You',
  'reviewRow.youSuffix': ' (you)',
  'reviewRow.topicRemoved': '(topic removed)',
  'reviewRow.photoAlt': 'Food photo',

  // LocationPreview
  'location.openInMaps': 'Open in Google Maps',
}

export default en
