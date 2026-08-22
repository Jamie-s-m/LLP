import User from '../models/User.js';

// Ошибки по спецификации Payme JSON-RPC 2.0
const PAYME_ERRORS = {
  TRANSPORT_ERROR: { code: -32300, message: { ru: 'Ошибка транспорта', uz: 'Transport xatoligi', en: 'Transport error' } },
  AUTH_ERROR: { code: -32504, message: { ru: 'Недостаточно прав для выполнения операции', uz: 'Ruxsat yetarli emas', en: 'Insufficient privileges' } },
  INVALID_AMOUNT: { code: -31001, message: { ru: 'Неверная сумма', uz: 'Noto'g'ri summa', en: 'Invalid amount' } },
  USER_NOT_FOUND: { code: -31050, message: { ru: 'Пользователь не найден', uz: 'Foydalanuvchi topilmadi', en: 'User not found' } },
  TRANSACTION_NOT_FOUND: { code: -31003, message: { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' } },
  CANT_CANCEL: { code: -31007, message: { ru: 'Невозможно отменить транзакцию', uz: 'Tranzaksiyani bekor qilib bo'lmaydi', en: 'Cannot cancel transaction' } },
};

// Функция проверки HTTP Basic Auth заголовка
const checkAuth = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Basic ')) return false;

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const paymeKey = process.env.PAYME_KEY;
  return username === 'Paycom' && password === paymeKey;
};

export const handlePaymeRequest = async (req, res) => {
  // 1. Проверка авторизации
  if (!checkAuth(req)) {
    return res.json({
      error: PAYME_ERRORS.AUTH_ERROR,
      id: req.body?.id || null,
    });
  }

  const { method, params, id } = req.body;

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        const userId = params?.account?.userId || params?.account?.user_id;
        const user = await User.findById(userId);

        if (!user) {
          return res.json({ error: PAYME_ERRORS.USER_NOT_FOUND, id });
        }

        // Сумма в Payme передается в тийинах (1 сум = 100 тийинов)
        if (!params.amount || params.amount <= 0) {
          return res.json({ error: PAYME_ERRORS.INVALID_AMOUNT, id });
        }

        return res.json({
          result: { allow: true },
          id,
        });
      }

      case 'CreateTransaction': {
        // Здесь обрабатывается создание транзакции в вашей базе данных
        return res.json({
          result: {
            create_time: Date.now(),
            transaction: params.id,
            state: 1,
          },
          id,
        });
      }

      case 'PerformTransaction': {
        // Здесь транзакция отмечается как оплаченная и пользователю начисляется подписка/баланс
        return res.json({
          result: {
            transaction: params.id,
            perform_time: Date.now(),
            state: 2,
          },
          id,
        });
      }

      case 'CheckTransaction': {
        return res.json({
          result: {
            create_time: Date.now(),
            perform_time: Date.now(),
            cancel_time: 0,
            transaction: params.id,
            state: 2,
            reason: null,
          },
          id,
        });
      }

      case 'CancelTransaction': {
        return res.json({
          result: {
            transaction: params.id,
            cancel_time: Date.now(),
            state: -1,
          },
          id,
        });
      }

      case 'GetStatement': {
        return res.json({
          result: { transactions: [] },
          id,
        });
      }

      default:
        return res.json({
          error: { code: -32601, message: 'Method not found' },
          id,
        });
    }
  } catch (error) {
    console.error('Payme Handling Error:', error);
    return res.json({
      error: PAYME_ERRORS.TRANSPORT_ERROR,
      id,
    });
  }
};