import express from 'express';
import KuriGroup from '../models/KuriGroup.js';
import KuriMember from '../models/KuriMember.js';
import Draw from '../models/Draw.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';
import { sendWinnerNotificationEmail } from '../utils/mailer.js';

const router = express.Router();

// @route   GET /api/draw/eligible/:groupId
// @desc    Get all eligible members for draw (who haven't won yet) & check all member payments approval status
router.get('/eligible/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Verify Admin rights - members should not see draw details
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'അഡ്മിന് മാത്രമേ നറുക്കെടുപ്പ് വിവരങ്ങൾ കാണാൻ അനുമതിയുള്ളൂ' });
    }

    // All group members
    const allMembers = await KuriMember.find({ groupId }).select('name email phone kuriNumber hasWon');

    // Only members with hasWon: false
    const eligibleMembers = allMembers.filter((m) => !m.hasWon);

    // Verify payments for the current month
    const targetMonth = group.currentMonth;
    const approvedPayments = await Payment.find({
      groupId,
      month: targetMonth,
      status: 'APPROVED',
    });

    const approvedMemberIdSet = new Set(approvedPayments.map((p) => p.memberId.toString()));
    const unpaidMembers = allMembers.filter((m) => !approvedMemberIdSet.has(m._id.toString()));
    const allPaidAndApproved = allMembers.length > 0 && unpaidMembers.length === 0;

    res.json({
      totalMembers: allMembers.length,
      approvedCount: approvedPayments.length,
      unpaidCount: unpaidMembers.length,
      allPaidAndApproved,
      unpaidMembers: unpaidMembers.map((m) => ({
        _id: m._id,
        name: m.name,
        kuriNumber: m.kuriNumber,
        phone: m.phone,
      })),
      totalEligible: eligibleMembers.length,
      currentMonth: group.currentMonth,
      eligibleMembers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/draw/execute
// @desc    Admin executes random draw -> selects winner -> records draw -> auto-sends winner email
router.post('/execute', protect, async (req, res) => {
  try {
    const { groupId, month } = req.body;

    if (!groupId || !month) {
      return res.status(400).json({ message: 'ഗ്രൂപ്പ് ഐഡിയും മാസവും ആവശ്യമാണ്' });
    }

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Verify Admin rights
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'അഡ്മിന് മാത്രമേ നറുക്കെടുപ്പ് നടത്താൻ അനുമതിയുള്ളൂ' });
    }

    // Check if draw already performed for this month
    const existingDraw = await Draw.findOne({ groupId, month });
    if (existingDraw) {
      return res.status(400).json({ message: `മാസം #${month} ലെ നറുക്കെടുപ്പ് ഇതിനകം കഴിഞ്ഞിരിക്കുന്നു` });
    }

    // Strict validation: Verify that ALL members in the group have an APPROVED payment for this month!
    const allMembers = await KuriMember.find({ groupId });
    if (allMembers.length === 0) {
      return res.status(400).json({ message: 'ഈ ഗ്രൂപ്പിൽ മെമ്പർമാർ ആരുമില്ല' });
    }

    const approvedPayments = await Payment.find({
      groupId,
      month: Number(month),
      status: 'APPROVED',
    });

    const approvedMemberIdSet = new Set(approvedPayments.map((p) => p.memberId.toString()));
    const unpaidMembers = allMembers.filter((m) => !approvedMemberIdSet.has(m._id.toString()));

    if (unpaidMembers.length > 0) {
      const unpaidList = unpaidMembers.map((m) => `${m.name} (#${m.kuriNumber})`).join(', ');
      return res.status(400).json({
        message: `മാസം #${month} ലെ നറുക്കെടുപ്പ് നടത്താൻ സാധ്യമല്ല! എല്ലാ മെമ്പർമാരും ഈ മാസത്തെ തുക നൽകുകയും അഡ്മിൻ അത് അംഗീകരിക്കുകയും (Approved) ചെയ്യണം. പണം നൽകാത്ത / അപ്രൂവ് ചെയ്യാത്ത അംഗങ്ങൾ (${unpaidMembers.length}): ${unpaidList}`,
        allPaidAndApproved: false,
        unpaidCount: unpaidMembers.length,
        unpaidMembers: unpaidMembers.map((m) => ({
          _id: m._id,
          name: m.name,
          kuriNumber: m.kuriNumber,
          phone: m.phone,
        })),
      });
    }

    // Find all eligible members (hasWon === false)
    const eligibleMembers = allMembers.filter((m) => !m.hasWon);

    if (eligibleMembers.length === 0) {
      return res.status(400).json({ message: 'നറുക്കെടുപ്പിനായി യോഗ്യരായ മെമ്പർമാർ ആരുമില്ല' });
    }

    // Random winner selection algorithm
    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const winner = eligibleMembers[randomIndex];

    // Mark winner
    winner.hasWon = true;
    winner.wonMonth = month;
    await winner.save();

    // Calculate Prize Amount
    const prizeAmount = group.totalAmount;

    // Create Draw Record
    const draw = await Draw.create({
      groupId,
      month,
      winnerMemberId: winner._id,
      kuriNumber: winner.kuriNumber,
      prizeAmount,
      conductedBy: req.user._id,
    });

    // Advance current month if applicable
    if (group.currentMonth <= month && group.currentMonth < group.totalMonths) {
      group.currentMonth = Number(month) + 1;
      await group.save();
    } else if (group.currentMonth >= group.totalMonths) {
      group.status = 'COMPLETED';
      await group.save();
    }

    // Trigger Automated Email via Nodemailer
    const emailResult = await sendWinnerNotificationEmail({
      email: winner.email,
      name: winner.name,
      groupName: group.name,
      kuriNumber: winner.kuriNumber,
      month,
      prizeAmount,
    });

    const emailErrorMsg = emailResult.error || emailResult.reason || null;

    res.status(200).json({
      message: emailResult.success
        ? `അഭിനന്ദനങ്ങൾ! കുറി നമ്പർ #${winner.kuriNumber} വിജയിച്ചിരിക്കുന്നു. ഇമെയിൽ അയച്ചു.`
        : `അഭിനന്ദനങ്ങൾ! കുറി നമ്പർ #${winner.kuriNumber} വിജയിച്ചിരിക്കുന്നു. (ഇമെയിൽ അയക്കാൻ കഴിഞ്ഞില്ല - WhatsApp വഴി സന്ദേശം അയക്കുക).`,
      winner: {
        _id: winner._id,
        name: winner.name,
        email: winner.email,
        phone: winner.phone,
        kuriNumber: winner.kuriNumber,
      },
      draw,
      emailSent: emailResult.success,
      emailError: emailErrorMsg,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
