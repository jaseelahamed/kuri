import express from 'express';
import Payment from '../models/Payment.js';
import KuriGroup from '../models/KuriGroup.js';
import KuriMember from '../models/KuriMember.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/payment/request
// @desc    Member submits a payment request (Cash or UPI)
router.post('/request', protect, async (req, res) => {
  try {
    const { groupId, memberId, month, amount, paymentMethod, transactionRef, remarks } = req.body;

    if (!groupId || !month || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'ആവശ്യമായ വിവരങ്ങൾ പൂർണ്ണമായി നൽകുക' });
    }

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Identify member record
    let targetMemberId = memberId;
    if (!targetMemberId) {
      const member = await KuriMember.findOne({
        groupId,
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!member) {
        return res.status(404).json({ message: 'നിങ്ങൾ ഈ ഗ്രൂപ്പിലെ മെമ്പർ അല്ല' });
      }
      targetMemberId = member._id;
    }

    // Check if payment already exists for this member and month
    const existingPayment = await Payment.findOne({
      groupId,
      memberId: targetMemberId,
      month,
      status: { $in: ['APPROVED', 'PENDING'] },
    });

    if (existingPayment) {
      return res.status(400).json({
        message: `മാസം #${month} ലെ പെയ്മെന്റ് ഇതിനകം ${existingPayment.status === 'APPROVED' ? 'അംഗീകരിച്ചിട്ടുണ്ട്' : 'പരിഗണനയിലാണ് (Pending)'}`,
      });
    }

    const payment = await Payment.create({
      groupId,
      memberId: targetMemberId,
      month,
      amount,
      paymentMethod,
      transactionRef: transactionRef || '',
      status: 'PENDING',
      remarks: remarks || '',
    });

    res.status(201).json({
      message: 'പെയ്മെന്റ് റിക്വസ്റ്റ് സമർപ്പിച്ചു. അഡ്മിൻ വെരിഫിക്കേഷനായി കാത്തിരിക്കുക.',
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/payment/group/:groupId
// @desc    Get payments for a group (Admin sees all; Member sees their own)
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { status, month } = req.query;

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    const isAdmin = group.admin.toString() === req.user._id.toString();

    let query = { groupId };
    if (status) query.status = status;
    if (month) query.month = parseInt(month);

    if (!isAdmin) {
      // Find current user's member ID
      const member = await KuriMember.findOne({
        groupId,
        $or: [{ user: req.user._id }, { email: req.user.email }],
      });
      if (!member) {
        return res.status(403).json({ message: 'അനുമതിയില്ല' });
      }
      query.memberId = member._id;
    }

    const payments = await Payment.find(query)
      .populate('memberId', 'name email phone kuriNumber')
      .populate('approvedBy', 'name')
      .sort({ paidAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/payment/:id/approve
// @desc    Admin approves a pending payment
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'പെയ്മെന്റ് കണ്ടെത്താനായില്ല' });
    }

    const group = await KuriGroup.findById(payment.groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'അഡ്മിന് മാത്രമേ പെയ്മെന്റ് അപ്രൂവ് ചെയ്യാൻ സാധിക്കൂ' });
    }

    payment.status = 'APPROVED';
    payment.approvedAt = new Date();
    payment.approvedBy = req.user._id;
    await payment.save();

    res.json({
      message: 'പെയ്മെന്റ് വിജയകരമായി അംഗീകരിച്ചു (Approved)',
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/payment/:id/reject
// @desc    Admin rejects a payment request
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const { remarks } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'പെയ്മെന്റ് കണ്ടെത്താനായില്ല' });
    }

    const group = await KuriGroup.findById(payment.groupId);
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'അഡ്മിന് മാത്രമേ ഇത് ചെയ്യാൻ അനുമതിയുള്ളൂ' });
    }

    payment.status = 'REJECTED';
    payment.remarks = remarks || 'അഡ്മിൻ നിരസിച്ചു';
    await payment.save();

    res.json({
      message: 'പെയ്മെന്റ് റിക്വസ്റ്റ് നിരസിച്ചു',
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
