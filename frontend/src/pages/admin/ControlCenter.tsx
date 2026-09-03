import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBookOpen, FiCheck, FiCreditCard, FiEdit3, FiMessageSquare, FiPlus, FiTrash2, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'

type ModeratorPermissions = {
  communityModeration: boolean
  supportChat: boolean
  catalogContentQa: boolean
  limitedUserManagement: boolean
}

interface Course {
  _id: string
  title: string
  description?: string
  language: string
  level: string
  category?: string
  isPublished: boolean
  totalLessons: number
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'moderator' | 'admin'
  isActive: boolean
  isEmailVerified?: boolean
  moderatorPermissions?: ModeratorPermissions
}

interface Application {
  _id: string
  firstName: string
  lastName: string
  email: string
}

interface FamilyLinkRequest {
  _id: string
  status: 'pending' | 'approved' | 'rejected'
  parent?: { firstName: string; lastName: string; email: string }
  student?: { firstName: string; lastName: string; email: string }
}

interface BillingPlanStatus {
  key: string
  name: string
  priceLabel: string
  available: boolean
  description: string
}

interface CourseForm {
  title: string
  description: string
  language: string
  level: string
  category: string
}

interface Overview {
  totals: {
    users: number
    students: number
    teachers: number
    parents: number
    moderators: number
    admins: number
    courses: number
    publishedCourses: number
    lessons: number
    flashcards: number
    posts: number
    pinnedPosts: number
    groups: number
    pendingTeacherApplications: number
    approvedFamilyLinks: number
    chatConversations: number
    chatMessages: number
    enrollments: number
    completedEnrollments: number
  }
}

type ContentResource = 'lessons' | 'flashcards' | 'posts' | 'groups'
type ModerationResource = 'posts' | 'groups'
type Tab = 'courses' | 'users' | 'content' | 'applications' | 'moderation' | 'support' | 'billing'

type ManagedContent = {
  _id: string
  title?: string
  name?: string
  content?: string
  description?: string
  course?: string
  language?: string
  level?: string
  category?: string
  order?: number
  difficulty?: string
  isPinned?: boolean
  isPrivate?: boolean
  maxMembers?: number
  front?: { text?: string }
  back?: { text?: string }
}

type ContentForm = {
  title: string
  name: string
  description: string
  content: string
  course: string
  language: string
  level: string
  category: string
  order: string
  difficulty: string
  frontText: string
  backText: string
  maxMembers: string
  isPinned: boolean
  isPrivate: boolean
}

type UserForm = {
  role: User['role']
  isActive: boolean
  isEmailVerified: boolean
  moderatorPermissions: ModeratorPermissions
}

const emptyModeratorPermissions = (): ModeratorPermissions => ({
  communityModeration: false,
  supportChat: false,
  catalogContentQa: false,
  limitedUserManagement: false,
})

const emptyContentForm = (): ContentForm => ({
  title: '',
  name: '',
  description: '',
  content: '',
  course: '',
  language: 'English',
  level: 'Beginner',
  category: 'discussion',
  order: '1',
  difficulty: 'Easy',
  frontText: '',
  backText: '',
  maxMembers: '',
  isPinned: false,
  isPrivate: false,
})

const copy = {
  en: {
    adminLoadFailed: 'Admin data could not be loaded',
    courseSaved: 'Course saved',
    courseSaveFailed: 'Course could not be saved',
    deleteCourseConfirm: 'Delete this course and its public listing?',
    courseDeleted: 'Course deleted',
    courseDeleteFailed: 'Course could not be deleted',
    userAccessUpdated: 'User access updated',
    userUpdateFailed: 'User could not be updated',
    userSuspended: 'User suspended',
    userReactivated: 'User reactivated',
    deleteUserConfirm: 'Delete {email}? This cannot be undone.',
    userDeleted: 'User deleted',
    userDeleteFailed: 'User could not be deleted',
    contentLoadFailed: 'Content could not be loaded',
    contentSaved: 'Content saved',
    contentSaveFailed: 'Content could not be saved',
    deleteContentConfirm: 'Delete this content item?',
    contentDeleted: 'Content deleted',
    contentDeleteFailed: 'Content could not be deleted',
    postPinned: 'Post pinned',
    postUnpinned: 'Post unpinned',
    postUpdateFailed: 'Post could not be updated',
    applicationsLoadFailed: 'Applications could not be loaded',
    billingLoadFailed: 'Billing plans could not be loaded',
    applicantApproved: 'Applicant promoted to teacher',
    applicantRejected: 'Application rejected',
    applicationReviewFailed: 'Application could not be reviewed',
    familyApproved: 'Family link approved',
    familyRejected: 'Family link rejected',
    familyReviewFailed: 'Family link request could not be reviewed',
    tabCourses: 'Courses',
    tabUsers: 'People',
    tabContent: 'Content',
    tabApplications: 'Applications',
    tabModeration: 'Moderation',
    tabSupport: 'Support',
    tabBilling: 'Billing',
    kicker: 'Operations desk',
    title: 'Command the learning operation.',
    text: 'Manage people, curriculum, and community from one focused control center.',
    usersStat: 'Users',
    coursesStat: 'Courses',
    publishedStat: 'Published',
    messagesStat: 'Messages',
    moderatorsStat: 'Moderators',
    pendingTeachersStat: 'Pending teachers',
    contentInventory: 'Content inventory',
    newCourse: 'New Course',
    loadingCurriculum: 'Loading curriculum...',
    lessonsCount: '{count} lessons',
    published: 'Published',
    draft: 'Draft',
    emptyCourses: 'No courses yet. Create your first course to populate the catalog.',
    peopleRoles: 'People & roles',
    searchUsers: 'Search name, email, or role',
    scopedAccess: 'scoped access',
    active: 'Active',
    suspended: 'Suspended',
    suspend: 'Suspend',
    reactivate: 'Reactivate',
    noUsersMatch: 'No users match this search yet.',
    noUsersPage: 'No users on this page.',
    usersCount: '{count} users',
    previous: 'Previous',
    next: 'Next',
    contentLibrary: 'Content library',
    addItem: 'Add item',
    noItems: 'No items in this collection.',
    teacherApplications: 'Teacher applications',
    familyLinkRequests: 'Family link requests',
    noTeacherApplications: 'No pending teacher applications.',
    noFamilyLinks: 'No pending family link requests.',
    communityModeration: 'Community moderation',
    untitledItem: 'Untitled item',
    pinned: 'Pinned',
    noModerationItems: 'No moderation items.',
    supportKicker: 'Support coverage',
    supportTitle: 'Support and chat operations',
    supportText: 'Users opening support conversations are routed to active admin and moderator support staff. Use the chat workspace to respond.',
    currentChatVolume: 'Current chat volume',
    currentChatVolumeText: 'Total support and conversation messages in the platform.',
    operationalAction: 'Operational action',
    operationalActionText: 'Use the chat workspace to reply to support conversations and keep resolution times low.',
    openSupportChat: 'Open support chat',
    billingKicker: 'Commercial controls',
    billingTitle: 'Payme & Click billing operation',
    billingText: 'Monitor plan readiness, account mix, and go-live billing actions from one place.',
    potentialLearnerSeats: 'Potential learner seats',
    potentialLearnerSeatsText: 'Current student accounts that could map to paid seats.',
    potentialFamilyAccounts: 'Potential family accounts',
    potentialFamilyAccountsText: 'Parent users available for family subscriptions.',
    potentialTeachingWorkspaces: 'Potential teaching workspaces',
    potentialTeachingWorkspacesText: 'Teacher accounts that could map to team or academy plans.',
    configured: 'configured',
    missingPriceId: 'Payme/Click not configured',
    noStripePlans: 'No plan metadata loaded yet.',
    billingTask1: 'Set PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY, CLICK_SERVICE_ID, CLICK_MERCHANT_ID, and CLICK_SECRET_KEY in the backend environment.',
    billingTask2: 'Neither Payme nor Click has a self-serve customer portal - cancellations and plan changes are handled by the learner simply paying again for a different plan.',
    billingTask3: 'Define refunds, failed-payment handling, and cancellation policy ownership.',
    billingTask4: 'Add finance monitoring, support ownership, and billing incident alerts.',
    editCourse: 'Edit course',
    newCourseModal: 'New course',
    closeCourseModal: 'Close course modal',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    languageLabel: 'Language',
    levelLabel: 'Level',
    categoryLabel: 'Category',
    cancel: 'Cancel',
    saveCourse: 'Save course',
    createCourse: 'Create course',
    manageUserAccess: 'Manage user access',
    closeUserModal: 'Close user modal',
    roleLabel: 'Role',
    activeAccount: 'Active account',
    emailVerified: 'Email verified',
    moderatorScopes: 'Moderator scopes',
    scopeCommunity: 'Community moderation',
    scopeSupport: 'Support and chat',
    scopeCatalog: 'Catalog and content QA',
    scopeUsers: 'Limited user management',
    saveAccess: 'Save access',
    editContentItem: 'Edit content item',
    createContentItem: 'Create content item',
    closeContentModal: 'Close content modal',
    courseId: 'Course ID',
    order: 'Order',
    titleField: 'Title',
    descriptionField: 'Description',
    contentField: 'Content',
    difficulty: 'Difficulty',
    frontText: 'Front text',
    backText: 'Back text',
    pinPost: 'Pin this post',
    groupName: 'Group name',
    maxMembers: 'Max members',
    privateGroup: 'Private group',
    saveItem: 'Save item',
    createItem: 'Create item',
    selectAll: 'Select all',
    selectedCount: '{count} selected',
    clearSelection: 'Clear selection',
    bulkSuspend: 'Suspend',
    bulkReactivate: 'Reactivate',
    bulkVerify: 'Verify email',
    bulkDelete: 'Delete',
    bulkPublish: 'Publish',
    bulkUnpublish: 'Unpublish',
    bulkDeleteUsersConfirm: 'Delete {count} selected users? This cannot be undone.',
    bulkDeleteCoursesConfirm: 'Delete {count} selected courses? This cannot be undone.',
    bulkDeleteContentConfirm: 'Delete {count} selected items? This cannot be undone.',
    bulkActionSuccess: 'Bulk action completed',
    bulkActionFailed: 'Bulk action failed',
    filterAll: 'All',
    filterPublished: 'Published',
    filterDraft: 'Draft',
  },
  ru: {
    adminLoadFailed: 'Не удалось загрузить данные администратора',
    courseSaved: 'Курс сохранён',
    courseSaveFailed: 'Не удалось сохранить курс',
    deleteCourseConfirm: 'Удалить этот курс и его публичную страницу?',
    courseDeleted: 'Курс удалён',
    courseDeleteFailed: 'Не удалось удалить курс',
    userAccessUpdated: 'Доступ пользователя обновлён',
    userUpdateFailed: 'Не удалось обновить пользователя',
    userSuspended: 'Пользователь приостановлен',
    userReactivated: 'Пользователь восстановлен',
    deleteUserConfirm: 'Удалить {email}? Это действие необратимо.',
    userDeleted: 'Пользователь удалён',
    userDeleteFailed: 'Не удалось удалить пользователя',
    contentLoadFailed: 'Не удалось загрузить контент',
    contentSaved: 'Контент сохранён',
    contentSaveFailed: 'Не удалось сохранить контент',
    deleteContentConfirm: 'Удалить этот элемент контента?',
    contentDeleted: 'Контент удалён',
    contentDeleteFailed: 'Не удалось удалить контент',
    postPinned: 'Пост закреплён',
    postUnpinned: 'Пост откреплён',
    postUpdateFailed: 'Не удалось обновить пост',
    applicationsLoadFailed: 'Не удалось загрузить заявки',
    billingLoadFailed: 'Не удалось загрузить тарифы',
    applicantApproved: 'Заявитель повышен до преподавателя',
    applicantRejected: 'Заявка отклонена',
    applicationReviewFailed: 'Не удалось обработать заявку',
    familyApproved: 'Семейная связь одобрена',
    familyRejected: 'Семейная связь отклонена',
    familyReviewFailed: 'Не удалось обработать запрос семейной связи',
    tabCourses: 'Курсы',
    tabUsers: 'Люди',
    tabContent: 'Контент',
    tabApplications: 'Заявки',
    tabModeration: 'Модерация',
    tabSupport: 'Поддержка',
    tabBilling: 'Биллинг',
    kicker: 'Операционный центр',
    title: 'Управляйте обучающей системой.',
    text: 'Управляйте людьми, программой и сообществом из одного центра.',
    usersStat: 'Пользователи',
    coursesStat: 'Курсы',
    publishedStat: 'Опубликовано',
    messagesStat: 'Сообщения',
    moderatorsStat: 'Модераторы',
    pendingTeachersStat: 'Ожидают преподаватели',
    contentInventory: 'Каталог контента',
    newCourse: 'Новый курс',
    loadingCurriculum: 'Загрузка программы...',
    lessonsCount: '{count} уроков',
    published: 'Опубликован',
    draft: 'Черновик',
    emptyCourses: 'Курсов пока нет. Создайте первый, чтобы наполнить каталог.',
    peopleRoles: 'Люди и роли',
    searchUsers: 'Искать по имени, email или роли',
    scopedAccess: 'ограниченный доступ',
    active: 'Активен',
    suspended: 'Заблокирован',
    suspend: 'Приостановить',
    reactivate: 'Восстановить',
    noUsersMatch: 'По этому запросу пользователи не найдены.',
    noUsersPage: 'На этой странице нет пользователей.',
    usersCount: '{count} пользователей',
    previous: 'Назад',
    next: 'Далее',
    contentLibrary: 'Библиотека контента',
    addItem: 'Добавить элемент',
    noItems: 'В этой коллекции нет элементов.',
    teacherApplications: 'Заявки преподавателей',
    familyLinkRequests: 'Семейные запросы',
    noTeacherApplications: 'Нет ожидающих заявок преподавателей.',
    noFamilyLinks: 'Нет ожидающих семейных запросов.',
    communityModeration: 'Модерация сообщества',
    untitledItem: 'Элемент без названия',
    pinned: 'Закреплено',
    noModerationItems: 'Нет элементов для модерации.',
    supportKicker: 'Покрытие поддержки',
    supportTitle: 'Операции поддержки и чата',
    supportText: 'Пользователи, открывающие обращения, направляются к активным администраторам и модераторам поддержки. Используйте чат для ответа.',
    currentChatVolume: 'Текущий объём чата',
    currentChatVolumeText: 'Общее число сообщений поддержки и диалогов на платформе.',
    operationalAction: 'Операционное действие',
    operationalActionText: 'Используйте рабочее пространство чата, чтобы отвечать на обращения и сокращать время решения.',
    openSupportChat: 'Открыть чат поддержки',
    billingKicker: 'Коммерческие настройки',
    billingTitle: 'Операции Payme и Click',
    billingText: 'Отслеживайте готовность тарифов, состав аккаунтов и действия перед запуском из одного места.',
    potentialLearnerSeats: 'Потенциальные места учеников',
    potentialLearnerSeatsText: 'Текущие студенческие аккаунты, которые могут стать платными местами.',
    potentialFamilyAccounts: 'Потенциальные семейные аккаунты',
    potentialFamilyAccountsText: 'Пользователи-родители, доступные для семейных подписок.',
    potentialTeachingWorkspaces: 'Потенциальные преподавательские пространства',
    potentialTeachingWorkspacesText: 'Аккаунты преподавателей, которые могут перейти на командные или академические тарифы.',
    configured: 'настроено',
    missingPriceId: 'Payme/Click не настроены',
    noStripePlans: 'Метаданные тарифов ещё не загружены.',
    billingTask1: 'Задайте PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY, CLICK_SERVICE_ID, CLICK_MERCHANT_ID и CLICK_SECRET_KEY в окружении backend.',
    billingTask2: 'Ни Payme, ни Click не имеют клиентского портала самообслуживания — отмена и смена тарифа происходят простой повторной оплатой другого тарифа.',
    billingTask3: 'Определите возвраты, обработку неуспешных платежей и ответственность за политику отмен.',
    billingTask4: 'Добавьте финансовый мониторинг, владельца поддержки и оповещения о сбоях биллинга.',
    editCourse: 'Редактировать курс',
    newCourseModal: 'Новый курс',
    closeCourseModal: 'Закрыть окно курса',
    titleLabel: 'Название',
    descriptionLabel: 'Описание',
    languageLabel: 'Язык',
    levelLabel: 'Уровень',
    categoryLabel: 'Категория',
    cancel: 'Отмена',
    saveCourse: 'Сохранить курс',
    createCourse: 'Создать курс',
    manageUserAccess: 'Управление доступом пользователя',
    closeUserModal: 'Закрыть окно пользователя',
    roleLabel: 'Роль',
    activeAccount: 'Активный аккаунт',
    emailVerified: 'Email подтверждён',
    moderatorScopes: 'Права модератора',
    scopeCommunity: 'Модерация сообщества',
    scopeSupport: 'Поддержка и чат',
    scopeCatalog: 'Каталог и контроль качества контента',
    scopeUsers: 'Ограниченное управление пользователями',
    saveAccess: 'Сохранить доступ',
    editContentItem: 'Редактировать элемент',
    createContentItem: 'Создать элемент',
    closeContentModal: 'Закрыть окно контента',
    courseId: 'ID курса',
    order: 'Порядок',
    titleField: 'Название',
    descriptionField: 'Описание',
    contentField: 'Содержимое',
    difficulty: 'Сложность',
    frontText: 'Текст лицевой стороны',
    backText: 'Текст обратной стороны',
    pinPost: 'Закрепить этот пост',
    groupName: 'Название группы',
    maxMembers: 'Макс. участников',
    privateGroup: 'Приватная группа',
    saveItem: 'Сохранить элемент',
    createItem: 'Создать элемент',
    selectAll: 'Выбрать всё',
    selectedCount: 'Выбрано: {count}',
    clearSelection: 'Снять выделение',
    bulkSuspend: 'Приостановить',
    bulkReactivate: 'Восстановить',
    bulkVerify: 'Подтвердить email',
    bulkDelete: 'Удалить',
    bulkPublish: 'Опубликовать',
    bulkUnpublish: 'Снять с публикации',
    bulkDeleteUsersConfirm: 'Удалить {count} выбранных пользователей? Это действие необратимо.',
    bulkDeleteCoursesConfirm: 'Удалить {count} выбранных курсов? Это действие необратимо.',
    bulkDeleteContentConfirm: 'Удалить {count} выбранных элементов? Это действие необратимо.',
    bulkActionSuccess: 'Массовое действие выполнено',
    bulkActionFailed: 'Не удалось выполнить массовое действие',
    filterAll: 'Все',
    filterPublished: 'Опубликованные',
    filterDraft: 'Черновики',
  },
  uz: {
    adminLoadFailed: 'Admin ma’lumotlarini yuklab bo‘lmadi',
    courseSaved: 'Kurs saqlandi',
    courseSaveFailed: 'Kursni saqlab bo‘lmadi',
    deleteCourseConfirm: 'Bu kurs va uning ommaviy sahifasi o‘chirilsinmi?',
    courseDeleted: 'Kurs o‘chirildi',
    courseDeleteFailed: 'Kursni o‘chirib bo‘lmadi',
    userAccessUpdated: 'Foydalanuvchi kirishi yangilandi',
    userUpdateFailed: 'Foydalanuvchini yangilab bo‘lmadi',
    userSuspended: 'Foydalanuvchi to‘xtatildi',
    userReactivated: 'Foydalanuvchi qayta faollashtirildi',
    deleteUserConfirm: '{email} o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi.',
    userDeleted: 'Foydalanuvchi o‘chirildi',
    userDeleteFailed: 'Foydalanuvchini o‘chirib bo‘lmadi',
    contentLoadFailed: 'Kontentni yuklab bo‘lmadi',
    contentSaved: 'Kontent saqlandi',
    contentSaveFailed: 'Kontentni saqlab bo‘lmadi',
    deleteContentConfirm: 'Bu kontent elementi o‘chirilsinmi?',
    contentDeleted: 'Kontent o‘chirildi',
    contentDeleteFailed: 'Kontentni o‘chirib bo‘lmadi',
    postPinned: 'Post mahkamlandi',
    postUnpinned: 'Post yechildi',
    postUpdateFailed: 'Postni yangilab bo‘lmadi',
    applicationsLoadFailed: 'So‘rovlarni yuklab bo‘lmadi',
    billingLoadFailed: 'To‘lov tariflarini yuklab bo‘lmadi',
    applicantApproved: 'Nomzod ustozga ko‘tarildi',
    applicantRejected: 'Ariza rad etildi',
    applicationReviewFailed: 'Arizani ko‘rib chiqib bo‘lmadi',
    familyApproved: 'Oilaviy ulanish tasdiqlandi',
    familyRejected: 'Oilaviy ulanish rad etildi',
    familyReviewFailed: 'Oilaviy ulanish so‘rovini ko‘rib chiqib bo‘lmadi',
    tabCourses: 'Kurslar',
    tabUsers: 'Odamlar',
    tabContent: 'Kontent',
    tabApplications: 'So‘rovlar',
    tabModeration: 'Moderatsiya',
    tabSupport: 'Yordam',
    tabBilling: 'To‘lovlar',
    kicker: 'Operatsion markaz',
    title: 'O‘quv tizimini boshqaring.',
    text: 'Bitta markazdan odamlar, dastur va hamjamiyatni boshqaring.',
    usersStat: 'Foydalanuvchilar',
    coursesStat: 'Kurslar',
    publishedStat: 'Chop etilgan',
    messagesStat: 'Xabarlar',
    moderatorsStat: 'Moderatorlar',
    pendingTeachersStat: 'Kutilayotgan ustozlar',
    contentInventory: 'Kontent inventari',
    newCourse: 'Yangi kurs',
    loadingCurriculum: 'Dastur yuklanmoqda...',
    lessonsCount: '{count} dars',
    published: 'Chop etilgan',
    draft: 'Qoralama',
    emptyCourses: 'Hali kurslar yo‘q. Katalogni to‘ldirish uchun birinchisini yarating.',
    peopleRoles: 'Odamlar va rollar',
    searchUsers: 'Ism, email yoki rol bo‘yicha qidiring',
    scopedAccess: 'cheklangan kirish',
    active: 'Faol',
    suspended: 'To‘xtatilgan',
    suspend: 'To‘xtatish',
    reactivate: 'Qayta faollashtirish',
    noUsersMatch: 'Bu qidiruvga mos foydalanuvchi topilmadi.',
    noUsersPage: 'Bu sahifada foydalanuvchi yo‘q.',
    usersCount: '{count} foydalanuvchi',
    previous: 'Oldingi',
    next: 'Keyingi',
    contentLibrary: 'Kontent kutubxonasi',
    addItem: 'Element qo‘shish',
    noItems: 'Bu kolleksiyada element yo‘q.',
    teacherApplications: 'Ustoz arizalari',
    familyLinkRequests: 'Oilaviy ulanish so‘rovlari',
    noTeacherApplications: 'Kutilayotgan ustoz arizalari yo‘q.',
    noFamilyLinks: 'Kutilayotgan oilaviy so‘rovlar yo‘q.',
    communityModeration: 'Hamjamiyat moderatsiyasi',
    untitledItem: 'Nomsiz element',
    pinned: 'Mahkamlangan',
    noModerationItems: 'Moderatsiya elementlari yo‘q.',
    supportKicker: 'Yordam qamrovi',
    supportTitle: 'Yordam va chat operatsiyalari',
    supportText: 'Yordam suhbatlarini ochgan foydalanuvchilar faol admin va moderator xodimlariga yo‘naltiriladi. Javob berish uchun chat ish maydonidan foydalaning.',
    currentChatVolume: 'Joriy chat hajmi',
    currentChatVolumeText: 'Platformadagi barcha yordam va suhbat xabarlari soni.',
    operationalAction: 'Operatsion harakat',
    operationalActionText: 'Yordam suhbatlariga javob berish va yechim vaqtini qisqartirish uchun chat ish maydonidan foydalaning.',
    openSupportChat: 'Yordam chatini ochish',
    billingKicker: 'Tijorat boshqaruvi',
    billingTitle: 'Payme va Click to‘lov operatsiyasi',
    billingText: 'Tariflar tayyorligi, akkountlar tarkibi va start oldi to‘lov harakatlarini bitta joydan kuzating.',
    potentialLearnerSeats: 'Potensial o‘quvchi o‘rinlari',
    potentialLearnerSeatsText: 'Pulli o‘rinlarga aylanishi mumkin bo‘lgan joriy talaba akkountlari.',
    potentialFamilyAccounts: 'Potensial oilaviy akkountlar',
    potentialFamilyAccountsText: 'Oilaviy obunalar uchun mavjud ota-ona foydalanuvchilari.',
    potentialTeachingWorkspaces: 'Potensial ustoz ish maydonlari',
    potentialTeachingWorkspacesText: 'Jamoa yoki akademiya tariflariga mos kelishi mumkin bo‘lgan ustoz akkountlari.',
    configured: 'sozlangan',
    missingPriceId: 'Payme/Click sozlanmagan',
    noStripePlans: 'Tarif metama’lumotlari hali yuklanmagan.',
    billingTask1: 'Backend muhitida PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY, CLICK_SERVICE_ID, CLICK_MERCHANT_ID va CLICK_SECRET_KEY larini sozlang.',
    billingTask2: 'Payme va Click ikkalasida ham mijoz uchun o‘z-o‘ziga xizmat portali yo‘q — tarifni bekor qilish yoki almashtirish o‘quvchining boshqa tarif uchun qayta to‘lov qilishi orqali amalga oshadi.',
    billingTask3: 'Refund, muvaffaqiyatsiz to‘lov ishlovi va bekor qilish siyosati egaligini belgilang.',
    billingTask4: 'Moliyaviy monitoring, support egaligi va billing incident alert larini qo‘shing.',
    editCourse: 'Kursni tahrirlash',
    newCourseModal: 'Yangi kurs',
    closeCourseModal: 'Kurs oynasini yopish',
    titleLabel: 'Sarlavha',
    descriptionLabel: 'Tavsif',
    languageLabel: 'Til',
    levelLabel: 'Daraja',
    categoryLabel: 'Kategoriya',
    cancel: 'Bekor qilish',
    saveCourse: 'Kursni saqlash',
    createCourse: 'Kurs yaratish',
    manageUserAccess: 'Foydalanuvchi kirishini boshqarish',
    closeUserModal: 'Foydalanuvchi oynasini yopish',
    roleLabel: 'Rol',
    activeAccount: 'Faol akkount',
    emailVerified: 'Email tasdiqlangan',
    moderatorScopes: 'Moderator vakolatlari',
    scopeCommunity: 'Hamjamiyat moderatsiyasi',
    scopeSupport: 'Yordam va chat',
    scopeCatalog: 'Katalog va kontent QA',
    scopeUsers: 'Cheklangan foydalanuvchi boshqaruvi',
    saveAccess: 'Kirishni saqlash',
    editContentItem: 'Kontent elementini tahrirlash',
    createContentItem: 'Kontent elementi yaratish',
    closeContentModal: 'Kontent oynasini yopish',
    courseId: 'Kurs ID',
    order: 'Tartib',
    titleField: 'Sarlavha',
    descriptionField: 'Tavsif',
    contentField: 'Kontent',
    difficulty: 'Qiyinlik',
    frontText: 'Old tomondagi matn',
    backText: 'Orqa tomondagi matn',
    pinPost: 'Bu postni mahkamlash',
    groupName: 'Guruh nomi',
    maxMembers: 'Maks. a’zolar',
    privateGroup: 'Yopiq guruh',
    saveItem: 'Elementni saqlash',
    createItem: 'Element yaratish',
    selectAll: 'Barchasini tanlash',
    selectedCount: '{count} ta tanlandi',
    clearSelection: 'Tanlovni bekor qilish',
    bulkSuspend: 'To‘xtatib turish',
    bulkReactivate: 'Qayta faollashtirish',
    bulkVerify: 'Emailni tasdiqlash',
    bulkDelete: 'O‘chirish',
    bulkPublish: 'Nashr qilish',
    bulkUnpublish: 'Nashrdan olish',
    bulkDeleteUsersConfirm: 'Tanlangan {count} foydalanuvchi o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi.',
    bulkDeleteCoursesConfirm: 'Tanlangan {count} kurs o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi.',
    bulkDeleteContentConfirm: 'Tanlangan {count} element o‘chirilsinmi? Bu amalni ortga qaytarib bo‘lmaydi.',
    bulkActionSuccess: 'Ommaviy amal bajarildi',
    bulkActionFailed: 'Ommaviy amalni bajarib bo‘lmadi',
    filterAll: 'Barchasi',
    filterPublished: 'Nashr qilingan',
    filterDraft: 'Qoralama',
  },
} as const

const localizedLabels = {
  roles: {
    student: { en: 'Student', ru: 'Студент', uz: 'Talaba' },
    parent: { en: 'Parent', ru: 'Родитель', uz: 'Ota-ona' },
    teacher: { en: 'Teacher', ru: 'Преподаватель', uz: 'Ustoz' },
    moderator: { en: 'Moderator', ru: 'Модератор', uz: 'Moderator' },
    admin: { en: 'Admin', ru: 'Администратор', uz: 'Admin' },
  },
  languages: {
    English: { en: 'English', ru: 'Английский', uz: 'Inglizcha' },
    Turkish: { en: 'Turkish', ru: 'Турецкий', uz: 'Turkcha' },
    Russian: { en: 'Russian', ru: 'Русский', uz: 'Ruscha' },
    Uzbek: { en: 'Uzbek', ru: 'Узбекский', uz: 'O‘zbekcha' },
  },
  levels: {
    Beginner: { en: 'Beginner', ru: 'Начальный', uz: 'Boshlang‘ich' },
    Intermediate: { en: 'Intermediate', ru: 'Средний', uz: 'O‘rta' },
    Advanced: { en: 'Advanced', ru: 'Продвинутый', uz: 'Yuqori' },
  },
  categories: {
    Conversation: { en: 'Conversation', ru: 'Разговор', uz: 'Suhbat' },
    Grammar: { en: 'Grammar', ru: 'Грамматика', uz: 'Grammatika' },
    Vocabulary: { en: 'Vocabulary', ru: 'Словарь', uz: 'Lug‘at' },
    Reading: { en: 'Reading', ru: 'Чтение', uz: 'O‘qish' },
    Writing: { en: 'Writing', ru: 'Письмо', uz: 'Yozish' },
    Listening: { en: 'Listening', ru: 'Аудирование', uz: 'Tinglash' },
    discussion: { en: 'Discussion', ru: 'Обсуждение', uz: 'Muhokama' },
    question: { en: 'Question', ru: 'Вопрос', uz: 'Savol' },
    resource: { en: 'Resource', ru: 'Ресурс', uz: 'Resurs' },
    event: { en: 'Event', ru: 'Событие', uz: 'Tadbir' },
  },
  resources: {
    lessons: { en: 'Lessons', ru: 'Уроки', uz: 'Darslar' },
    flashcards: { en: 'Flashcards', ru: 'Карточки', uz: 'Kartochkalar' },
    posts: { en: 'Forum posts', ru: 'Посты форума', uz: 'Forum postlari' },
    groups: { en: 'Groups', ru: 'Группы', uz: 'Guruhlar' },
  },
  difficulty: {
    Easy: { en: 'Easy', ru: 'Легко', uz: 'Oson' },
    Medium: { en: 'Medium', ru: 'Средне', uz: 'O‘rta' },
    Hard: { en: 'Hard', ru: 'Сложно', uz: 'Qiyin' },
  },
} as const

export default function ControlCenter() {
  const currentUser = useAuthStore((state) => state.user)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [resource, setResource] = useState<ContentResource>('lessons')
  const [content, setContent] = useState<ManagedContent[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [familyLinks, setFamilyLinks] = useState<FamilyLinkRequest[]>([])
  const [billingPlans, setBillingPlans] = useState<BillingPlanStatus[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [courseModal, setCourseModal] = useState<Course | null | false>(false)
  const [courseForm, setCourseForm] = useState<CourseForm>({ title: '', description: '', language: 'English', level: 'Beginner', category: 'Conversation' })
  const [userModal, setUserModal] = useState<User | null | false>(false)
  const [userForm, setUserForm] = useState<UserForm>({ role: 'student', isActive: true, isEmailVerified: false, moderatorPermissions: emptyModeratorPermissions() })
  const [contentModal, setContentModal] = useState<ManagedContent | null | false>(false)
  const [contentForm, setContentForm] = useState<ContentForm>(emptyContentForm())
  const [moderationResource, setModerationResource] = useState<ModerationResource>('posts')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set())
  const [bulkActionPending, setBulkActionPending] = useState(false)
  const pageSize = 8

  const toggleSelected = (set: Set<string>, setSet: (next: Set<string>) => void, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSet(next)
  }

  const isAdmin = currentUser?.role === 'admin'
  const moderatorPermissions = currentUser?.moderatorPermissions || emptyModeratorPermissions()
  const canManageUsers = isAdmin || moderatorPermissions.limitedUserManagement
  const canManageCatalog = isAdmin || moderatorPermissions.catalogContentQa
  const canModerateCommunity = isAdmin || moderatorPermissions.communityModeration
  const canHandleSupport = isAdmin || moderatorPermissions.supportChat
  const canSeeBilling = isAdmin

  const availableTabs = useMemo<Tab[]>(() => {
    const nextTabs: Tab[] = []
    if (canManageCatalog) nextTabs.push('courses', 'content')
    if (canManageUsers) nextTabs.push('users', 'applications')
    if (canModerateCommunity) nextTabs.push('moderation')
    if (canHandleSupport) nextTabs.push('support')
    if (canSeeBilling) nextTabs.push('billing')
    return Array.from(new Set(nextTabs))
  }, [canHandleSupport, canManageCatalog, canManageUsers, canModerateCommunity, canSeeBilling])

  const currentContentResource = tab === 'moderation' ? moderationResource : resource
  const localize = <T extends Record<string, Record<'en' | 'ru' | 'uz', string>>>(map: T, value?: string) =>
    (value && map[value as keyof T]?.[language]) || value || ''

  const load = async () => {
    setLoading(true)
    try {
      const requests = [
        // The public /courses endpoint only ever returns published courses - Control Center
        // needs drafts too (createCourse now defaults isPublished:false), or a newly created
        // or unpublished course becomes invisible and unpublishable from this screen. This
        // route is catalogContentQa-gated like the Courses tab itself, so skip it (matching
        // the /admin/users pattern below) for a moderator scoped to something else entirely.
        canManageCatalog ? api.get('/courses/admin/all') : Promise.resolve({ data: { data: [] } }),
        canManageUsers ? api.get('/admin/users') : Promise.resolve({ data: { data: [] } }),
        api.get('/admin/overview'),
      ]
      const [courseResponse, userResponse, overviewResponse] = await Promise.all(requests)
      setCourses(courseResponse.data.data || courseResponse.data || [])
      setUsers(userResponse.data.data || [])
      setOverview(overviewResponse.data.data || null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.adminLoadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [ui.adminLoadFailed])

  useEffect(() => {
    // goToTab, not setTab - a moderator whose scopes exclude the default 'courses' tab lands
    // here on mount, and setTab alone never triggers that tab's data fetch (only goToTab does),
    // so the page would permanently render an empty state with no error shown.
    if (!availableTabs.includes(tab) && availableTabs[0]) {
      goToTab(availableTabs[0])
    }
  }, [availableTabs, tab])

  const openCourseModal = (course?: Course) => {
    setCourseModal(course || null)
    setCourseForm({
      title: course?.title || '',
      description: course?.description || '',
      language: course?.language || 'English',
      level: course?.level || 'Beginner',
      category: course?.category || 'Conversation',
    })
  }

  const saveCourseModal = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (courseModal && typeof courseModal !== 'boolean') {
        await api.put(`/courses/${courseModal._id}`, courseForm)
      } else {
        await api.post('/courses', courseForm)
      }
      setCourseModal(false)
      await load()
      toast.success(ui.courseSaved)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.courseSaveFailed)
    }
  }

  const removeCourse = async (id: string) => {
    if (!window.confirm(ui.deleteCourseConfirm)) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses((current) => current.filter((course) => course._id !== id))
      toast.success(ui.courseDeleted)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.courseDeleteFailed)
    }
  }

  const bulkPublishCourses = async (isPublished: boolean) => {
    setBulkActionPending(true)
    try {
      await api.patch('/admin/content/courses/bulk', { ids: Array.from(selectedCourseIds), updates: { isPublished } })
      setCourses((current) => current.map((course) => selectedCourseIds.has(course._id) ? { ...course, isPublished } : course))
      setSelectedCourseIds(new Set())
      toast.success(ui.bulkActionSuccess)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.bulkActionFailed)
    } finally {
      setBulkActionPending(false)
    }
  }

  const bulkDeleteCourses = async () => {
    if (!window.confirm(ui.bulkDeleteCoursesConfirm.replace('{count}', String(selectedCourseIds.size)))) return
    setBulkActionPending(true)
    try {
      await api.post('/admin/content/courses/bulk-delete', { ids: Array.from(selectedCourseIds) })
      setCourses((current) => current.filter((course) => !selectedCourseIds.has(course._id)))
      setSelectedCourseIds(new Set())
      toast.success(ui.bulkActionSuccess)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.bulkActionFailed)
    } finally {
      setBulkActionPending(false)
    }
  }

  const openUserModal = (user: User) => {
    setUserModal(user)
    setUserForm({
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: Boolean(user.isEmailVerified),
      moderatorPermissions: {
        ...emptyModeratorPermissions(),
        ...(user.moderatorPermissions || {}),
      },
    })
  }

  const saveUserModal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userModal || typeof userModal === 'boolean') return
    try {
      await api.patch(`/admin/users/${userModal._id}`, userForm)
      setUserModal(false)
      await load()
      toast.success(ui.userAccessUpdated)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.userUpdateFailed)
    }
  }

  const toggleUser = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user._id}`, { isActive: !user.isActive })
      setUsers((current) => current.map((item) => item._id === user._id ? { ...item, isActive: !item.isActive } : item))
      toast.success(user.isActive ? ui.userSuspended : ui.userReactivated)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.userUpdateFailed)
    }
  }

  const deleteUser = async (user: User) => {
    if (!window.confirm(ui.deleteUserConfirm.replace('{email}', user.email))) return
    try {
      await api.delete(`/admin/users/${user._id}`)
      setUsers((current) => current.filter((item) => item._id !== user._id))
      toast.success(ui.userDeleted)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.userDeleteFailed)
    }
  }

  const bulkUserAction = async (action: 'suspend' | 'reactivate' | 'verify' | 'delete') => {
    if (action === 'delete' && !window.confirm(ui.bulkDeleteUsersConfirm.replace('{count}', String(selectedUserIds.size)))) return
    setBulkActionPending(true)
    try {
      const ids = Array.from(selectedUserIds)
      await api.post('/admin/users/bulk-action', { ids, action })
      if (action === 'delete') {
        setUsers((current) => current.filter((user) => !selectedUserIds.has(user._id)))
      } else {
        const patch = action === 'suspend' ? { isActive: false } : action === 'reactivate' ? { isActive: true } : { isEmailVerified: true }
        setUsers((current) => current.map((user) => selectedUserIds.has(user._id) ? { ...user, ...patch } : user))
      }
      setSelectedUserIds(new Set())
      toast.success(ui.bulkActionSuccess)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.bulkActionFailed)
    } finally {
      setBulkActionPending(false)
    }
  }

  const loadContent = async (nextResource = currentContentResource) => {
    try {
      const response = await api.get(`/admin/content/${nextResource}`)
      setContent(response.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.contentLoadFailed)
    }
  }

  const openContentModal = (item?: ManagedContent) => {
    setContentModal(item || null)
    const source: Partial<ManagedContent> = item || {}
    setContentForm({
      title: source.title || '',
      name: source.name || '',
      description: source.description || '',
      content: source.content || '',
      course: typeof source.course === 'string' ? source.course : '',
      language: source.language || 'English',
      level: source.level || 'Beginner',
      category: source.category || (currentContentResource === 'posts' ? 'discussion' : 'Conversation'),
      order: String(source.order || 1),
      difficulty: source.difficulty || 'Easy',
      frontText: source.front?.text || '',
      backText: source.back?.text || '',
      maxMembers: source.maxMembers ? String(source.maxMembers) : '',
      isPinned: Boolean(source.isPinned),
      isPrivate: Boolean(source.isPrivate),
    })
  }

  const buildContentPayload = () => {
    if (currentContentResource === 'lessons') {
      return {
        course: contentForm.course.trim(),
        title: contentForm.title.trim(),
        description: contentForm.description.trim(),
        content: contentForm.content.trim(),
        order: Number(contentForm.order) || 1,
        difficulty: contentForm.difficulty,
      }
    }
    if (currentContentResource === 'flashcards') {
      return {
        course: contentForm.course.trim(),
        language: contentForm.language,
        category: contentForm.category.trim(),
        difficulty: contentForm.difficulty,
        front: { text: contentForm.frontText.trim() },
        back: { text: contentForm.backText.trim() },
      }
    }
    if (currentContentResource === 'posts') {
      return {
        title: contentForm.title.trim(),
        content: contentForm.content.trim(),
        category: contentForm.category.trim(),
        isPinned: contentForm.isPinned,
      }
    }
    return {
      name: contentForm.name.trim(),
      description: contentForm.description.trim(),
      language: contentForm.language,
      level: contentForm.level,
      maxMembers: contentForm.maxMembers ? Number(contentForm.maxMembers) : undefined,
      isPrivate: contentForm.isPrivate,
    }
  }

  const saveContentModal = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = buildContentPayload()
      if (contentModal && typeof contentModal !== 'boolean') {
        await api.patch(`/admin/content/${currentContentResource}/${contentModal._id}`, payload)
      } else {
        await api.post(`/admin/content/${currentContentResource}`, payload)
      }
      setContentModal(false)
      await loadContent(currentContentResource)
      toast.success(ui.contentSaved)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.contentSaveFailed)
    }
  }

  const removeContent = async (id: string) => {
    if (!window.confirm(ui.deleteContentConfirm)) return
    try {
      await api.delete(`/admin/content/${currentContentResource}/${id}`)
      setContent((current) => current.filter((item) => item._id !== id))
      toast.success(ui.contentDeleted)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.contentDeleteFailed)
    }
  }

  const bulkDeleteContentItems = async () => {
    if (!window.confirm(ui.bulkDeleteContentConfirm.replace('{count}', String(selectedContentIds.size)))) return
    setBulkActionPending(true)
    try {
      await api.post(`/admin/content/${currentContentResource}/bulk-delete`, { ids: Array.from(selectedContentIds) })
      setContent((current) => current.filter((item) => !selectedContentIds.has(item._id)))
      setSelectedContentIds(new Set())
      toast.success(ui.bulkActionSuccess)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.bulkActionFailed)
    } finally {
      setBulkActionPending(false)
    }
  }

  const togglePinnedPost = async (item: ManagedContent) => {
    try {
      await api.patch(`/admin/content/posts/${item._id}`, { isPinned: !item.isPinned })
      setContent((current) => current.map((entry) => entry._id === item._id ? { ...entry, isPinned: !item.isPinned } : entry))
      toast.success(item.isPinned ? ui.postUnpinned : ui.postPinned)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.postUpdateFailed)
    }
  }

  const filteredUsers = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase()))
  const visibleUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize)
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  const loadApplications = async () => {
    try {
      const [applicationResponse, familyResponse] = await Promise.all([
        api.get('/admin/teacher-applications'),
        api.get('/family'),
      ])
      setApplications(applicationResponse.data.data || [])
      setFamilyLinks((familyResponse.data.data || []).filter((link: FamilyLinkRequest) => link.status === 'pending'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.applicationsLoadFailed)
    }
  }

  const loadBillingPlans = async () => {
    try {
      const response = await api.get('/billing/plans')
      setBillingPlans(response.data.data?.plans || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.billingLoadFailed)
    }
  }

  const reviewApplication = async (id: string, approve: boolean) => {
    try {
      await api.patch(`/admin/teacher-applications/${id}`, { approve })
      setApplications((current) => current.filter((item) => item._id !== id))
      toast.success(approve ? ui.applicantApproved : ui.applicantRejected)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.applicationReviewFailed)
    }
  }

  const reviewFamilyLink = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/family/${id}/review`, { status })
      setFamilyLinks((current) => current.filter((link) => link._id !== id))
      if (status === 'approved') {
        await load()
      }
      toast.success(status === 'approved' ? ui.familyApproved : ui.familyRejected)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.familyReviewFailed)
    }
  }

  const tabEntries = [
    canManageCatalog ? ['courses', FiBookOpen, ui.tabCourses] : null,
    canManageUsers ? ['users', FiUsers, ui.tabUsers] : null,
    canManageCatalog ? ['content', FiEdit3, ui.tabContent] : null,
    canManageUsers ? ['applications', FiUserCheck, ui.tabApplications] : null,
    canModerateCommunity ? ['moderation', FiMessageSquare, ui.tabModeration] : null,
    canHandleSupport ? ['support', FiMessageSquare, ui.tabSupport] : null,
    canSeeBilling ? ['billing', FiCreditCard, ui.tabBilling] : null,
  ].filter(Boolean) as Array<[Tab, typeof FiBookOpen, string]>

  const goToTab = (value: Tab) => {
    setTab(value)
    if (value === 'content') loadContent(resource)
    if (value === 'applications') loadApplications()
    if (value === 'moderation') loadContent(moderationResource)
    if (value === 'billing') loadBillingPlans()
  }

  const statCards: Array<{ id: string; label: string; value: number; onClick?: () => void }> = overview ? [
    { id: 'users', label: ui.usersStat, value: overview.totals.users, onClick: canManageUsers ? () => { goToTab('users'); setUserSearch(''); setUserPage(1) } : undefined },
    { id: 'courses', label: ui.coursesStat, value: overview.totals.courses, onClick: canManageCatalog ? () => { goToTab('courses'); setCourseStatusFilter('all') } : undefined },
    { id: 'published', label: ui.publishedStat, value: overview.totals.publishedCourses, onClick: canManageCatalog ? () => { goToTab('courses'); setCourseStatusFilter('published') } : undefined },
    { id: 'messages', label: ui.messagesStat, value: overview.totals.chatMessages, onClick: canHandleSupport ? () => goToTab('support') : undefined },
    { id: 'moderators', label: ui.moderatorsStat, value: overview.totals.moderators, onClick: canManageUsers ? () => { goToTab('users'); setUserSearch('moderator'); setUserPage(1) } : undefined },
    { id: 'pendingTeachers', label: ui.pendingTeachersStat, value: overview.totals.pendingTeacherApplications, onClick: canManageUsers ? () => goToTab('applications') : undefined },
  ] : []

  const filteredCourses = courses.filter((course) => (
    courseStatusFilter === 'all' ? true : courseStatusFilter === 'published' ? course.isPublished : !course.isPublished
  ))

  return (
    <div className="atlas-page mx-auto max-w-7xl px-4 py-8">
      <div className="atlas-heading mb-8">
        <p className="atlas-kicker">{ui.kicker}</p>
        <h1>{ui.title}</h1>
        <p>{ui.text}</p>
      </div>

      {overview ? (
        <div className="atlas-stat-grid mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.id}
              type="button"
              onClick={stat.onClick}
              disabled={!stat.onClick}
              className={`atlas-stat text-left ${stat.onClick ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-tabs mb-6">
        {tabEntries.map(([value, Icon, label]) => (
          <button
            key={value}
            onClick={() => goToTab(value)}
            className={tab === value ? 'active' : ''}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {tab === 'courses' ? (
        <section className="atlas-panel p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="atlas-kicker">{ui.contentInventory}</p>
              <h2 className="text-2xl text-ink dark:text-white">{ui.tabCourses}</h2>
            </div>
            <button onClick={() => openCourseModal()} className="btn btn-primary inline-flex items-center gap-2"><FiPlus /> {ui.newCourse}</button>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {(['all', 'published', 'draft'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCourseStatusFilter(value)}
                className={`status-pill ${courseStatusFilter === value ? '' : 'muted'}`}
              >
                {value === 'all' ? ui.filterAll : value === 'published' ? ui.filterPublished : ui.filterDraft}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="rounded-2xl bg-[var(--surface-strong)] p-5 text-muted dark:bg-white/5">{ui.loadingCurriculum}</div>
          ) : (
            <>
              {filteredCourses.length > 0 ? (
                <label className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.size > 0 && filteredCourses.every((course) => selectedCourseIds.has(course._id))}
                    onChange={(event) => setSelectedCourseIds(event.target.checked ? new Set(filteredCourses.map((course) => course._id)) : new Set())}
                  />
                  {ui.selectAll}
                </label>
              ) : null}
              {selectedCourseIds.size > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--accent-light)] px-4 py-3 text-sm dark:bg-white/5">
                  <span className="font-semibold text-[var(--accent)]">{ui.selectedCount.replace('{count}', String(selectedCourseIds.size))}</span>
                  <button disabled={bulkActionPending} onClick={() => bulkPublishCourses(true)} className="btn btn-outline text-sm">{ui.bulkPublish}</button>
                  <button disabled={bulkActionPending} onClick={() => bulkPublishCourses(false)} className="btn btn-outline text-sm">{ui.bulkUnpublish}</button>
                  <button disabled={bulkActionPending} onClick={bulkDeleteCourses} className="btn btn-outline text-sm text-red-600">{ui.bulkDelete}</button>
                  <button onClick={() => setSelectedCourseIds(new Set())} className="ml-auto text-sm text-muted hover:underline">{ui.clearSelection}</button>
                </div>
              ) : null}
              <div className="admin-table">
                {filteredCourses.map((course) => (
                  <div className="admin-row" key={course._id}>
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.has(course._id)}
                      onChange={() => toggleSelected(selectedCourseIds, setSelectedCourseIds, course._id)}
                    />
                    <div className="min-w-0 flex-1 break-words"><strong>{course.title}</strong><small>{localize(localizedLabels.languages, course.language)} · {localize(localizedLabels.levels, course.level)} · {ui.lessonsCount.replace('{count}', String(course.totalLessons || 0))}</small></div>
                    <span className={`status-pill ${course.isPublished ? '' : 'muted'}`}>{course.isPublished ? ui.published : ui.draft}</span>
                    <button onClick={() => openCourseModal(course)} className="icon-button" aria-label={`Edit ${course.title}`}><FiEdit3 /></button>
                    <button onClick={() => removeCourse(course._id)} className="icon-button danger" aria-label={`Delete ${course.title}`}><FiTrash2 /></button>
                  </div>
                ))}
                {filteredCourses.length === 0 ? <div className="empty-state"><FiBookOpen /><p>{ui.emptyCourses}</p></div> : null}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === 'users' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">{ui.peopleRoles}</h2>
            <input className="input max-w-sm" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1) }} placeholder={ui.searchUsers} />
          </div>
          {visibleUsers.length > 0 ? (
            <label className="mb-3 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={selectedUserIds.size > 0 && visibleUsers.every((user) => selectedUserIds.has(user._id))}
                onChange={(event) => setSelectedUserIds(event.target.checked ? new Set(visibleUsers.map((user) => user._id)) : new Set())}
              />
              {ui.selectAll}
            </label>
          ) : null}
          {selectedUserIds.size > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--accent-light)] px-4 py-3 text-sm dark:bg-white/5">
              <span className="font-semibold text-[var(--accent)]">{ui.selectedCount.replace('{count}', String(selectedUserIds.size))}</span>
              <button disabled={bulkActionPending} onClick={() => bulkUserAction('suspend')} className="btn btn-outline text-sm">{ui.bulkSuspend}</button>
              <button disabled={bulkActionPending} onClick={() => bulkUserAction('reactivate')} className="btn btn-outline text-sm">{ui.bulkReactivate}</button>
              {isAdmin ? (
                <>
                  <button disabled={bulkActionPending} onClick={() => bulkUserAction('verify')} className="btn btn-outline text-sm">{ui.bulkVerify}</button>
                  <button disabled={bulkActionPending} onClick={() => bulkUserAction('delete')} className="btn btn-outline text-sm text-red-600">{ui.bulkDelete}</button>
                </>
              ) : null}
              <button onClick={() => setSelectedUserIds(new Set())} className="ml-auto text-sm text-muted hover:underline">{ui.clearSelection}</button>
            </div>
          ) : null}
          <div className="admin-table">
            {visibleUsers.map((user) => {
              const protectedUser = user.role === 'admin' || user.role === 'moderator'
              return (
                <div className="admin-row" key={user._id}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.has(user._id)}
                    disabled={user._id === currentUser?.id}
                    onChange={() => toggleSelected(selectedUserIds, setSelectedUserIds, user._id)}
                  />
                  <div className="min-w-0 flex-1 break-words">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <small>{user.email} · {localize(localizedLabels.roles, user.role)}{user.role === 'moderator' ? ` · ${ui.scopedAccess}` : ''}</small>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`status-pill ${user.isActive ? '' : 'muted'}`}>{user.isActive ? ui.active : ui.suspended}</span>
                    {isAdmin ? (
                      <>
                        <button onClick={() => openUserModal(user)} className="icon-button" aria-label={`Manage ${user.email}`}><FiEdit3 /></button>
                        {user._id !== currentUser?.id ? <button onClick={() => deleteUser(user)} className="icon-button danger" aria-label={`Delete ${user.email}`}><FiTrash2 /></button> : null}
                      </>
                    ) : (
                      <button onClick={() => toggleUser(user)} disabled={protectedUser} className="btn btn-outline text-sm">
                        {user.isActive ? ui.suspend : ui.reactivate}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {visibleUsers.length === 0 ? <div className="empty-state"><FiUsers /><p>{filteredUsers.length === 0 ? ui.noUsersMatch : ui.noUsersPage}</p></div> : null}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm text-muted">
            <span>{ui.usersCount.replace('{count}', String(filteredUsers.length))}</span>
            <div className="flex gap-2">
              <button className="btn btn-outline" disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)}>{ui.previous}</button>
              <span className="px-3 py-2">{userPage} / {totalUserPages}</span>
              <button className="btn btn-outline" disabled={userPage === totalUserPages} onClick={() => setUserPage((page) => page + 1)}>{ui.next}</button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'content' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">{ui.contentLibrary}</h2>
            <div className="flex flex-wrap gap-3">
              <select className="input max-w-xs" value={resource} onChange={(event) => { const next = event.target.value as ContentResource; setResource(next); loadContent(next); setSelectedContentIds(new Set()) }}>
                <option value="lessons">{localizedLabels.resources.lessons[language]}</option>
                <option value="flashcards">{localizedLabels.resources.flashcards[language]}</option>
                <option value="posts">{localizedLabels.resources.posts[language]}</option>
                <option value="groups">{localizedLabels.resources.groups[language]}</option>
              </select>
              <button className="btn btn-primary inline-flex items-center gap-2" onClick={() => openContentModal()}><FiPlus /> {ui.addItem}</button>
            </div>
          </div>
          {content.length > 0 ? (
            <label className="mb-3 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={selectedContentIds.size > 0 && content.every((item) => selectedContentIds.has(item._id))}
                onChange={(event) => setSelectedContentIds(event.target.checked ? new Set(content.map((item) => item._id)) : new Set())}
              />
              {ui.selectAll}
            </label>
          ) : null}
          {selectedContentIds.size > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--accent-light)] px-4 py-3 text-sm dark:bg-white/5">
              <span className="font-semibold text-[var(--accent)]">{ui.selectedCount.replace('{count}', String(selectedContentIds.size))}</span>
              <button disabled={bulkActionPending} onClick={bulkDeleteContentItems} className="btn btn-outline text-sm text-red-600">{ui.bulkDelete}</button>
              <button onClick={() => setSelectedContentIds(new Set())} className="ml-auto text-sm text-muted hover:underline">{ui.clearSelection}</button>
            </div>
          ) : null}
          <div className="admin-table">
            {content.map((item) => (
              <div className="admin-row" key={item._id}>
                <input
                  type="checkbox"
                  checked={selectedContentIds.has(item._id)}
                  onChange={() => toggleSelected(selectedContentIds, setSelectedContentIds, item._id)}
                />
                <div className="min-w-0 flex-1 break-words"><strong>{item.title || item.name || item.content?.slice(0, 70) || ui.untitledItem}</strong><small>{localizedLabels.resources[resource][language]} · {item._id}</small></div>
                <div className="flex gap-2">
                  <button onClick={() => openContentModal(item)} className="icon-button" aria-label="Edit content"><FiEdit3 /></button>
                  <button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete content"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {content.length === 0 ? <div className="empty-state"><FiEdit3 /><p>{ui.noItems}</p></div> : null}
          </div>
        </section>
      ) : null}

      {tab === 'applications' ? (
        <section className="atlas-panel p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-2xl text-ink dark:text-white">{ui.teacherApplications}</h2>
              <div className="admin-table">
                {applications.map((applicant) => (
                  <div className="admin-row" key={applicant._id}>
                    <div><strong>{applicant.firstName} {applicant.lastName}</strong><small>{applicant.email}</small></div>
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <button onClick={() => reviewApplication(applicant._id, true)} className="icon-button" aria-label={`Approve ${applicant.email}`}><FiCheck /></button>
                        <button onClick={() => reviewApplication(applicant._id, false)} className="icon-button danger" aria-label={`Reject ${applicant.email}`}><FiX /></button>
                      </div>
                    ) : (
                      // Approving grants the 'teacher' role - a limitedUserManagement moderator
                      // can see the queue but only an admin can act on it, matching the backend.
                      <span className="status-pill muted">{ui.scopedAccess}</span>
                    )}
                  </div>
                ))}
                {applications.length === 0 ? <div className="empty-state"><FiUserCheck /><p>{ui.noTeacherApplications}</p></div> : null}
              </div>
            </div>
            <div>
              <h2 className="mb-6 text-2xl text-ink dark:text-white">{ui.familyLinkRequests}</h2>
              <div className="admin-table">
                {familyLinks.map((link) => (
                  <div className="admin-row" key={link._id}>
                    <div>
                      <strong>{link.parent?.firstName} {link.parent?.lastName}</strong>
                      <small>{link.parent?.email} → {link.student?.firstName} {link.student?.lastName} ({link.student?.email})</small>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => reviewFamilyLink(link._id, 'approved')} className="icon-button" aria-label={`Approve family link for ${link.parent?.email}`}><FiCheck /></button>
                      <button onClick={() => reviewFamilyLink(link._id, 'rejected')} className="icon-button danger" aria-label={`Reject family link for ${link.parent?.email}`}><FiX /></button>
                    </div>
                  </div>
                ))}
                {familyLinks.length === 0 ? <div className="empty-state"><FiUsers /><p>{ui.noFamilyLinks}</p></div> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'moderation' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">{ui.communityModeration}</h2>
            <div className="flex flex-wrap gap-3">
              <select className="input max-w-xs" value={moderationResource} onChange={(event) => { const next = event.target.value as ModerationResource; setModerationResource(next); loadContent(next) }}>
                <option value="posts">{localizedLabels.resources.posts[language]}</option>
                <option value="groups">{localizedLabels.resources.groups[language]}</option>
              </select>
              <button className="btn btn-primary inline-flex items-center gap-2" onClick={() => openContentModal()}><FiPlus /> {ui.addItem}</button>
            </div>
          </div>
          <div className="admin-table">
            {content.map((item) => (
              <div className="admin-row" key={item._id}>
                <div><strong>{item.title || item.name || ui.untitledItem}</strong><small>{localize(localizedLabels.categories, item.category || moderationResource)} {item.isPinned ? `· ${ui.pinned}` : ''}</small></div>
                <div className="flex gap-2">
                  {moderationResource === 'posts' ? <button onClick={() => togglePinnedPost(item)} className="icon-button" aria-label="Toggle pinned status"><FiCheck /></button> : null}
                  <button onClick={() => openContentModal(item)} className="icon-button" aria-label="Edit community item"><FiEdit3 /></button>
                  <button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete community item"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {content.length === 0 ? <div className="empty-state"><FiMessageSquare /><p>{ui.noModerationItems}</p></div> : null}
          </div>
        </section>
      ) : null}

      {tab === 'support' ? (
        <section className="atlas-panel p-6">
          <p className="atlas-kicker">{ui.supportKicker}</p>
          <h2 className="text-2xl text-ink dark:text-white">{ui.supportTitle}</h2>
          <p className="mt-2 text-muted">{ui.supportText}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface-strong)] p-5 dark:bg-white/5">
              <p className="text-sm font-semibold text-muted">{ui.currentChatVolume}</p>
              <strong className="mt-3 block text-3xl text-ink dark:text-white">{overview?.totals.chatMessages ?? 0}</strong>
              <p className="mt-2 text-sm text-muted">{ui.currentChatVolumeText}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-muted">{ui.operationalAction}</p>
              <p className="mt-2 text-sm text-muted">{ui.operationalActionText}</p>
              <Link to="/chat" className="btn btn-primary mt-4 inline-flex">{ui.openSupportChat}</Link>

              <div className="mt-6">
                <h4 className="text-sm font-semibold">Send test push</h4>
                <p className="text-xs text-muted">Send a best-effort test push to specific user IDs (comma-separated)</p>
                <div className="mt-3 flex flex-col gap-2">
                  <input placeholder="comma-separated user ids" id="push-userids" className="input" />
                  <input placeholder="Title" id="push-title" className="input" />
                  <input placeholder="Body" id="push-body" className="input" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      const u = (document.getElementById('push-userids') as HTMLInputElement).value.trim();
                      const title = (document.getElementById('push-title') as HTMLInputElement).value.trim();
                      const body = (document.getElementById('push-body') as HTMLInputElement).value.trim();
                      const userIds = u.split(',').map(s => s.trim()).filter(Boolean);
                      if (userIds.length === 0) { alert('No user ids'); return }
                      try {
                        await api.post('/admin/push/send', { userIds, payload: { title, body } })
                        alert('Push dispatched (best-effort)')
                      } catch (err: any) { alert(err?.response?.data?.message || 'Failed to send push') }
                    }} className="btn btn-primary">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'billing' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6">
            <p className="atlas-kicker">{ui.billingKicker}</p>
            <h2 className="text-2xl text-ink dark:text-white">{ui.billingTitle}</h2>
            <p className="mt-2 text-muted">{ui.billingText}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: ui.potentialLearnerSeats, value: overview?.totals.students ?? 0, note: ui.potentialLearnerSeatsText },
              { title: ui.potentialFamilyAccounts, value: overview?.totals.parents ?? 0, note: ui.potentialFamilyAccountsText },
              { title: ui.potentialTeachingWorkspaces, value: overview?.totals.teachers ?? 0, note: ui.potentialTeachingWorkspacesText },
            ].map((card) => <div key={card.title} className="rounded-2xl bg-[var(--surface-strong)] p-5 dark:bg-white/5"><p className="text-sm font-semibold text-muted">{card.title}</p><strong className="mt-3 block text-3xl text-ink dark:text-white">{card.value}</strong><p className="mt-2 text-sm text-muted">{card.note}</p></div>)}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {billingPlans.map((plan) => (
              <div key={plan.key} className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-muted">{plan.name}</p>
                    <strong className="mt-2 block text-2xl text-ink dark:text-white">{plan.priceLabel}</strong>
                  </div>
                  <span className={`status-pill ${plan.available ? '' : 'muted'}`}>{plan.available ? ui.configured : ui.missingPriceId}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{plan.description}</p>
              </div>
            ))}
            {billingPlans.length === 0 ? <div className="empty-state lg:col-span-3"><FiCreditCard /><p>{ui.noStripePlans}</p></div> : null}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ui.billingTask1,
              ui.billingTask2,
              ui.billingTask3,
              ui.billingTask4,
            ].map((item) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-muted dark:border-white/10 dark:bg-white/5">{item}</div>)}
          </div>
        </section>
      ) : null}

      {courseModal !== false ? (
        <div className="fixed inset-0 z-[170] flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--text-primary)_62%,transparent)] px-4 py-8 sm:items-center">
          <form className="atlas-panel w-full max-w-2xl p-6" onSubmit={saveCourseModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl text-ink dark:text-white">{courseModal ? ui.editCourse : ui.newCourseModal}</h2>
              <button type="button" className="icon-button" onClick={() => setCourseModal(false)} aria-label={ui.closeCourseModal}><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><label className="label">{ui.titleLabel}</label><input className="input" value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} required /></div>
              <div className="md:col-span-2"><label className="label">{ui.descriptionLabel}</label><textarea className="input min-h-28" value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} required /></div>
              <div><label className="label">{ui.languageLabel}</label><select className="input" value={courseForm.language} onChange={(event) => setCourseForm((current) => ({ ...current, language: event.target.value }))}><option value="English">{localizedLabels.languages.English[language]}</option><option value="Turkish">{localizedLabels.languages.Turkish[language]}</option><option value="Russian">{localizedLabels.languages.Russian[language]}</option><option value="Uzbek">{localizedLabels.languages.Uzbek[language]}</option></select></div>
              <div><label className="label">{ui.levelLabel}</label><select className="input" value={courseForm.level} onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value }))}><option value="Beginner">{localizedLabels.levels.Beginner[language]}</option><option value="Intermediate">{localizedLabels.levels.Intermediate[language]}</option><option value="Advanced">{localizedLabels.levels.Advanced[language]}</option></select></div>
              <div className="md:col-span-2"><label className="label">{ui.categoryLabel}</label><select className="input" value={courseForm.category} onChange={(event) => setCourseForm((current) => ({ ...current, category: event.target.value }))}><option value="Conversation">{localizedLabels.categories.Conversation[language]}</option><option value="Grammar">{localizedLabels.categories.Grammar[language]}</option><option value="Vocabulary">{localizedLabels.categories.Vocabulary[language]}</option><option value="Reading">{localizedLabels.categories.Reading[language]}</option><option value="Writing">{localizedLabels.categories.Writing[language]}</option><option value="Listening">{localizedLabels.categories.Listening[language]}</option></select></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setCourseModal(false)}>{ui.cancel}</button><button className="btn btn-primary">{courseModal ? ui.saveCourse : ui.createCourse}</button></div>
          </form>
        </div>
      ) : null}

      {userModal && isAdmin ? (
        <div className="fixed inset-0 z-[170] flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--text-primary)_62%,transparent)] px-4 py-8 sm:items-center">
          <form className="atlas-panel w-full max-w-2xl p-6" onSubmit={saveUserModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl text-ink dark:text-white">{ui.manageUserAccess}</h2>
                <p className="text-sm text-muted">{userModal.email}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setUserModal(false)} aria-label={ui.closeUserModal}><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">{ui.roleLabel}</label><select className="input" value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as User['role'] }))}><option value="student">{localizedLabels.roles.student[language]}</option><option value="parent">{localizedLabels.roles.parent[language]}</option><option value="teacher">{localizedLabels.roles.teacher[language]}</option><option value="moderator">{localizedLabels.roles.moderator[language]}</option><option value="admin">{localizedLabels.roles.admin[language]}</option></select></div>
              <div className="space-y-3 rounded-2xl bg-[var(--surface-strong)] p-4 dark:bg-white/5">
                <label className="flex items-center gap-3 text-sm text-ink dark:text-white"><input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))} /> {ui.activeAccount}</label>
                <label className="flex items-center gap-3 text-sm text-ink dark:text-white"><input type="checkbox" checked={userForm.isEmailVerified} onChange={(event) => setUserForm((current) => ({ ...current, isEmailVerified: event.target.checked }))} /> {ui.emailVerified}</label>
              </div>
            </div>
            {userForm.role === 'moderator' ? (
              <div className="mt-6 rounded-2xl border border-[var(--border)] p-5 dark:border-white/10">
                <h3 className="text-lg font-semibold text-ink dark:text-white">{ui.moderatorScopes}</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ['communityModeration', ui.scopeCommunity],
                    ['supportChat', ui.scopeSupport],
                    ['catalogContentQa', ui.scopeCatalog],
                    ['limitedUserManagement', ui.scopeUsers],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-[var(--surface-strong)] p-3 text-sm text-ink dark:text-white">
                      <input type="checkbox" checked={userForm.moderatorPermissions[key as keyof ModeratorPermissions]} onChange={(event) => setUserForm((current) => ({ ...current, moderatorPermissions: { ...current.moderatorPermissions, [key]: event.target.checked } }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setUserModal(false)}>{ui.cancel}</button><button className="btn btn-primary">{ui.saveAccess}</button></div>
          </form>
        </div>
      ) : null}

      {contentModal !== false ? (
        <div className="fixed inset-0 z-[170] flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--text-primary)_62%,transparent)] px-4 py-8 sm:items-center">
          <form className="atlas-panel w-full max-w-3xl p-6" onSubmit={saveContentModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl text-ink dark:text-white">{contentModal ? ui.editContentItem : ui.createContentItem}</h2>
                <p className="text-sm text-muted">{currentContentResource}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setContentModal(false)} aria-label={ui.closeContentModal}><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {currentContentResource === 'lessons' ? (
                <>
                  <div><label className="label">{ui.courseId}</label><input className="input" value={contentForm.course} onChange={(event) => setContentForm((current) => ({ ...current, course: event.target.value }))} required /></div>
                  <div><label className="label">{ui.order}</label><input className="input" type="number" min="1" value={contentForm.order} onChange={(event) => setContentForm((current) => ({ ...current, order: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">{ui.titleField}</label><input className="input" value={contentForm.title} onChange={(event) => setContentForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">{ui.descriptionField}</label><textarea className="input min-h-24" value={contentForm.description} onChange={(event) => setContentForm((current) => ({ ...current, description: event.target.value }))} /></div>
                  <div className="md:col-span-2"><label className="label">{ui.contentField}</label><textarea className="input min-h-32" value={contentForm.content} onChange={(event) => setContentForm((current) => ({ ...current, content: event.target.value }))} required /></div>
                  <div><label className="label">{ui.difficulty}</label><select className="input" value={contentForm.difficulty} onChange={(event) => setContentForm((current) => ({ ...current, difficulty: event.target.value }))}><option value="Easy">{localizedLabels.difficulty.Easy[language]}</option><option value="Medium">{localizedLabels.difficulty.Medium[language]}</option><option value="Hard">{localizedLabels.difficulty.Hard[language]}</option></select></div>
                </>
              ) : null}

              {currentContentResource === 'flashcards' ? (
                <>
                  <div><label className="label">{ui.courseId}</label><input className="input" value={contentForm.course} onChange={(event) => setContentForm((current) => ({ ...current, course: event.target.value }))} required /></div>
                  <div><label className="label">{ui.languageLabel}</label><select className="input" value={contentForm.language} onChange={(event) => setContentForm((current) => ({ ...current, language: event.target.value }))}><option value="English">{localizedLabels.languages.English[language]}</option><option value="Turkish">{localizedLabels.languages.Turkish[language]}</option><option value="Russian">{localizedLabels.languages.Russian[language]}</option><option value="Uzbek">{localizedLabels.languages.Uzbek[language]}</option></select></div>
                  <div className="md:col-span-2"><label className="label">{ui.frontText}</label><input className="input" value={contentForm.frontText} onChange={(event) => setContentForm((current) => ({ ...current, frontText: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">{ui.backText}</label><input className="input" value={contentForm.backText} onChange={(event) => setContentForm((current) => ({ ...current, backText: event.target.value }))} required /></div>
                  <div><label className="label">{ui.categoryLabel}</label><input className="input" value={contentForm.category} onChange={(event) => setContentForm((current) => ({ ...current, category: event.target.value }))} /></div>
                  <div><label className="label">{ui.difficulty}</label><select className="input" value={contentForm.difficulty} onChange={(event) => setContentForm((current) => ({ ...current, difficulty: event.target.value }))}><option value="Easy">{localizedLabels.difficulty.Easy[language]}</option><option value="Medium">{localizedLabels.difficulty.Medium[language]}</option><option value="Hard">{localizedLabels.difficulty.Hard[language]}</option></select></div>
                </>
              ) : null}

              {currentContentResource === 'posts' ? (
                <>
                  <div className="md:col-span-2"><label className="label">{ui.titleField}</label><input className="input" value={contentForm.title} onChange={(event) => setContentForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">{ui.contentField}</label><textarea className="input min-h-32" value={contentForm.content} onChange={(event) => setContentForm((current) => ({ ...current, content: event.target.value }))} required /></div>
                  <div><label className="label">{ui.categoryLabel}</label><select className="input" value={contentForm.category} onChange={(event) => setContentForm((current) => ({ ...current, category: event.target.value }))}><option value="discussion">{localizedLabels.categories.discussion[language]}</option><option value="question">{localizedLabels.categories.question[language]}</option><option value="resource">{localizedLabels.categories.resource[language]}</option><option value="event">{localizedLabels.categories.event[language]}</option></select></div>
                  <label className="flex items-center gap-3 rounded-2xl bg-[var(--surface-strong)] p-4 text-sm text-ink dark:text-white"><input type="checkbox" checked={contentForm.isPinned} onChange={(event) => setContentForm((current) => ({ ...current, isPinned: event.target.checked }))} /> {ui.pinPost}</label>
                </>
              ) : null}

              {currentContentResource === 'groups' ? (
                <>
                  <div className="md:col-span-2"><label className="label">{ui.groupName}</label><input className="input" value={contentForm.name} onChange={(event) => setContentForm((current) => ({ ...current, name: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">{ui.descriptionField}</label><textarea className="input min-h-24" value={contentForm.description} onChange={(event) => setContentForm((current) => ({ ...current, description: event.target.value }))} required /></div>
                  <div><label className="label">{ui.languageLabel}</label><select className="input" value={contentForm.language} onChange={(event) => setContentForm((current) => ({ ...current, language: event.target.value }))}><option value="English">{localizedLabels.languages.English[language]}</option><option value="Turkish">{localizedLabels.languages.Turkish[language]}</option><option value="Russian">{localizedLabels.languages.Russian[language]}</option><option value="Uzbek">{localizedLabels.languages.Uzbek[language]}</option></select></div>
                  <div><label className="label">{ui.levelLabel}</label><select className="input" value={contentForm.level} onChange={(event) => setContentForm((current) => ({ ...current, level: event.target.value }))}><option value="Beginner">{localizedLabels.levels.Beginner[language]}</option><option value="Intermediate">{localizedLabels.levels.Intermediate[language]}</option><option value="Advanced">{localizedLabels.levels.Advanced[language]}</option></select></div>
                  <div><label className="label">{ui.maxMembers}</label><input className="input" type="number" min="1" value={contentForm.maxMembers} onChange={(event) => setContentForm((current) => ({ ...current, maxMembers: event.target.value }))} /></div>
                  <label className="flex items-center gap-3 rounded-2xl bg-[var(--surface-strong)] p-4 text-sm text-ink dark:text-white"><input type="checkbox" checked={contentForm.isPrivate} onChange={(event) => setContentForm((current) => ({ ...current, isPrivate: event.target.checked }))} /> {ui.privateGroup}</label>
                </>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setContentModal(false)}>{ui.cancel}</button><button className="btn btn-primary">{contentModal ? ui.saveItem : ui.createItem}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
