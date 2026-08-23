import Buffer from 'node:buffer';

const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY; // Secret Key from Payme Cabinet

/**
 * 1. Create Checkout Session (Generates a Payme Checkout Link)
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, amountInUzS } = req.body;
    const userId = req.user._id;

    // Convert UZS to Tiyin (1 UZS = 100 tiyin)
    const amountInTiyin = amountInUzS * 100;
    
    // Construct Payme merchant URL params
    const merchantId = process.env.PAYME_MERCHANT_ID;
    const params = `m=${merchantId};ac.user_id=${userId};ac.plan_id=${planId};a=${amountInTiyin}`;
    const encodedParams = Buffer.Buffer.from(params).toString('base64');
    
    const checkoutUrl = `https://checkout.paycom.uz/${encodedParams}`;

    return res.status(200).json({ url: checkoutUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 2. Basic Auth Guard for incoming Payme requests
 */
const validatePaymeAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const credentials = Buffer.Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
  const [login, password] = credentials.split(':');

  return login === 'Paycom' && password === PAYME_MERCHANT_KEY;
};

/**
 * 3. Handle Payme JSON-RPC 2.0 Requests
 */
export const handlePaymeRequest = async (req, res) => {
  if (!validatePaymeAuth(req)) {
    return res.json({
      error: { code: -32504, message: { ru: 'Неавторизован', en: 'Unauthorized' } },
      id: req.body?.id || null,
    });
  }

  const { method, params, id } = req.body;

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        // Verify account exists & amount matches expected plan price
        return res.json({ result: { allow: true }, id });

      case 'CreateTransaction':
        // Save transaction to DB with state = 1 (created)
        return res.json({
          result: {
            create_time: Date.now(),
            transaction: 'YOUR_INTERNAL_TRANSACTION_ID',
            state: 1,
          },
          id,
        });

      case 'PerformTransaction':
        // Mark transaction complete, grant user access/subscription
        return res.json({
          result: {
            perform_time: Date.now(),
            transaction: 'YOUR_INTERNAL_TRANSACTION_ID',
            state: 2,
          },
          id,
        });

      case 'CancelTransaction':
        // Handle payment cancellation
        return res.json({
          result: {
            cancel_time: Date.now(),
            transaction: 'YOUR_INTERNAL_TRANSACTION_ID',
            state: -1,
          },
          id,
        });

      case 'CheckTransaction':
        // Return status of a specific transaction
        return res.json({
          result: {
            create_time: Date.now(),
            perform_time: Date.now(),
            cancel_time: 0,
            transaction: 'YOUR_INTERNAL_TRANSACTION_ID',
            state: 2,
            reason: null,
          },
          id,
        });

      default:
        return res.json({
          error: { code: -32601, message: { ru: 'Метод не найден', en: 'Method not found' } },
          id,
        });
    }
  } catch (err) {
    return res.json({
      error: { code: -31008, message: { ru: err.message, en: err.message } },
      id,
    });
  }
};