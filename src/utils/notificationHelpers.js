import { t } from './i18n';

/**
 * Translates a notification object based on its type and content.
 * @param {Object} notif - The notification object from the API.
 * @returns {Object} - An object with { title, message } translated.
 */
export const getNotificationTranslation = (notif) => {
  // Sınav başlığını mesajdan çıkar (Legacy format handling)
  let examTitle = '';
  if (notif.message && notif.message.includes(' sınavı')) {
    examTitle = notif.message.split(' sınavı')[0];
  } else if (notif.message && notif.message.includes(' için')) {
    examTitle = notif.message.split(' için')[0];
  } else {
    // If not found, use the message itself or title
    examTitle = notif.title;
  }

  switch (notif.type) {
    case 'new_exam':
      return {
        title: t('notifNewExam'),
        message: `${examTitle} ${t('notifNewExamMsg')}`
      };
    case 'edit_granted':
      return {
        title: t('notifEditGranted'),
        message: t('notifEditGrantedMsg').replace('{exam}', examTitle)
      };
    case 'grade_published':
      const grade = notif.message?.match(/\d+$/)?.[0] || '';
      return {
        title: t('notifGradePublished'),
        message: t('notifGradePublishedMsg').replace('{exam}', examTitle).replace('{grade}', grade)
      };
    case 'exam_started':
      return {
        title: t('notifExamStarted'),
        message: `${examTitle} ${t('notifExamStartedMsg')}`
      };
    case 'exam_reminder':
    case 'exam_reminder_30':
      return {
        title: t('notifExamReminder30'),
        message: `${examTitle} ${t('notifExamReminder30Msg')}`
      };
    case 'exam_reminder_5':
      return {
        title: t('notifExamReminder5'),
        message: `${examTitle} ${t('notifExamReminder5Msg')}`
      };
    case 'exam_ended':
      return {
        title: t('notifExamEnded'),
        message: `${examTitle} ${t('notifExamEndedMsg')}`
      };
    default:
      return {
        title: notif.title,
        message: notif.message
      };
  }
};
