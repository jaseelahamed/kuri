import express from 'express';
import KuriGroup from '../models/KuriGroup.js';
import KuriMember from '../models/KuriMember.js';
import Draw from '../models/Draw.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';
import { sendMemberWelcomeEmail } from '../utils/mailer.js';

const router = express.Router();

/**
 * Helper: Generate a unique 3-digit Kuri Number for this group
 * Range: 100 - 999
 */
const generateUnique3DigitNumber = async (groupId) => {
  const existingMembers = await KuriMember.find({ groupId }).select('kuriNumber');
  const existingNumbers = new Set(existingMembers.map((m) => m.kuriNumber));

  // Try sequential starting from 101 first if available
  for (let i = 101; i <= 999; i++) {
    const numStr = String(i);
    if (!existingNumbers.has(numStr)) {
      return numStr;
    }
  }

  // Fallback random attempt (just in case 101-999 is filled)
  throw new Error('പരമാവധി മെമ്പർ പരിധി കഴിഞ്ഞു. 3-അക്ക നമ്പറുകൾ ലഭ്യമല്ല.');
};

// @route   POST /api/kuri
// @desc    Create a new Kuri Group (Creator becomes Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { name, totalAmount, monthlyInstallment, totalMonths, dueDayOfMonth } = req.body;

    if (!name || !totalAmount || !monthlyInstallment || !totalMonths) {
      return res.status(400).json({ message: 'എല്ലാ വിവരങ്ങളും കൃത്യമായി നൽകുക' });
    }

    const group = await KuriGroup.create({
      name,
      admin: req.user._id,
      totalAmount,
      monthlyInstallment,
      totalMonths,
      dueDayOfMonth: dueDayOfMonth || 10,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/kuri
// @desc    Get all Kuri Groups for the logged-in user (as Admin or as Member)
router.get('/', protect, async (req, res) => {
  try {
    // 1. Groups where user is Admin
    const adminGroups = await KuriGroup.find({ admin: req.user._id }).sort({ createdAt: -1 });

    // 2. Groups where user is Member (by matching user ID or email)
    const memberRecords = await KuriMember.find({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    }).select('groupId kuriNumber hasWon');

    const memberGroupIds = memberRecords.map((m) => m.groupId);
    const memberGroups = await KuriGroup.find({
      _id: { $in: memberGroupIds, $nin: adminGroups.map((g) => g._id) },
    }).populate('admin', 'name email phone');

    res.json({
      adminGroups,
      memberGroups,
      memberRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/kuri/:id
// @desc    Get single Kuri Group details + members + past draws
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await KuriGroup.findById(req.params.id).populate('admin', 'name email phone');
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    const members = await KuriMember.find({ groupId: group._id }).sort({ kuriNumber: 1 });
    const draws = await Draw.find({ groupId: group._id })
      .populate('winnerMemberId', 'name email phone kuriNumber')
      .sort({ month: -1 });

    const isAdmin = group.admin._id.toString() === req.user._id.toString();

    res.json({
      group,
      members,
      draws,
      isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/kuri/:id/members
// @desc    Admin adds a new member -> Generates unique 3-digit number -> Sends welcome email via Nodemailer
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const groupId = req.params.id;

    if (!name || !email) {
      return res.status(400).json({ message: 'മെമ്പറുടെ പേരും ഇമെയിലും നിർബന്ധമാണ്' });
    }

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Check if requester is Admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'ഗ്രൂപ്പ് അഡ്മിന് മാത്രമേ പുതിയ മെമ്പർമാരെ ആഡ് ചെയ്യാൻ സാധിക്കൂ' });
    }

    // Check if email already added to this group
    const existing = await KuriMember.findOne({ groupId, email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'ഈ മെമ്പർ ഇതിനകം ഈ ഗ്രൂപ്പിൽ ചേർക്കപ്പെട്ടിട്ടുണ്ട്' });
    }

    // Generate unique 3-digit number (e.g. 101, 102...)
    const kuriNumber = await generateUnique3DigitNumber(groupId);

    // Check if user already has an account, or create a new user account with temporary password
    let registeredUser = await User.findOne({ email: email.toLowerCase().trim() });
    let generatedPassword = null;
    let isNewAccount = false;

    if (!registeredUser) {
      // Auto-generate temporary password for member login
      generatedPassword = `Kuri@${Math.floor(1000 + Math.random() * 9000)}`;
      registeredUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: generatedPassword,
        phone: phone ? phone.trim() : '',
      });
      isNewAccount = true;
    }

    const member = await KuriMember.create({
      groupId,
      user: registeredUser._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      kuriNumber,
    });

    // Send automated email via Nodemailer with 3-digit number & login password
    const emailResult = await sendMemberWelcomeEmail({
      email: member.email,
      name: member.name,
      groupName: group.name,
      kuriNumber: member.kuriNumber,
      monthlyInstallment: group.monthlyInstallment,
      loginPassword: generatedPassword,
      isNewAccount,
    });

    res.status(201).json({
      message: 'മെമ്പറെ വിജയകരമായി ആഡ് ചെയ്തു. കുറി നമ്പറും ലോഗിൻ വിവരങ്ങളും ഇമെയിലിലേക്ക് അയച്ചിരിക്കുന്നു.',
      member,
      generatedPassword,
      isNewAccount,
      emailSent: emailResult.success,
      emailError: emailResult.error || emailResult.reason,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/kuri/:id/members/:memberId
// @desc    Admin edits member details (name, phone, kuriNumber)
router.put('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { name, phone, kuriNumber } = req.body;
    const { id: groupId, memberId } = req.params;

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Check if requester is Admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'ഗ്രൂപ്പ് അഡ്മിന് മാത്രമേ മെമ്പർ വിവരങ്ങൾ എഡിറ്റ് ചെയ്യാൻ അനുമതിയുള്ളൂ' });
    }

    const member = await KuriMember.findOne({ _id: memberId, groupId });
    if (!member) {
      return res.status(404).json({ message: 'മെമ്പറെ കണ്ടെത്താനായില്ല' });
    }

    // If changing kuriNumber, validate 3 digits and check uniqueness in this group
    if (kuriNumber && kuriNumber !== member.kuriNumber) {
      const trimmedNo = String(kuriNumber).trim();
      if (!/^[0-9]{3}$/.test(trimmedNo)) {
        return res.status(400).json({ message: 'കുറി നമ്പർ 3 അക്കങ്ങൾ (100-999) മാത്രമായിരിക്കണം' });
      }

      const duplicate = await KuriMember.findOne({
        groupId,
        kuriNumber: trimmedNo,
        _id: { $ne: memberId },
      });
      if (duplicate) {
        return res.status(400).json({ message: `കുറി നമ്പർ #${trimmedNo} ഇതിനകം മറ്റൊരു മെമ്പർക്ക് നൽകിയിട്ടുണ്ട്` });
      }

      member.kuriNumber = trimmedNo;
    }

    if (name) member.name = name.trim();
    if (phone !== undefined) member.phone = phone.trim();

    await member.save();

    res.json({
      message: 'മെമ്പർ വിവരങ്ങൾ വിജയകരമായി പുതുക്കി',
      member,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/kuri/:id/members/:memberId
// @desc    Admin deletes a member from the group
router.delete('/:id/members/:memberId', protect, async (req, res) => {
  try {
    const { id: groupId, memberId } = req.params;

    const group = await KuriGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Check if requester is Admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'ഗ്രൂപ്പ് അഡ്മിന് മാത്രമേ മെമ്പറെ ഡിലീറ്റ് ചെയ്യാൻ അനുമതിയുള്ളൂ' });
    }

    const member = await KuriMember.findOne({ _id: memberId, groupId });
    if (!member) {
      return res.status(404).json({ message: 'മെമ്പറെ കണ്ടെത്താനായില്ല' });
    }

    // If member has already won a draw, prevent deleting to keep draw records intact
    if (member.hasWon) {
      return res.status(400).json({
        message: 'നറുക്കെടുപ്പിൽ വിജയിച്ച മെമ്പറെ ഡിലീറ്റ് ചെയ്യാൻ സാധിക്കില്ല (Winner record exists)',
      });
    }

    // Delete associated payments for this member in this group
    await Payment.deleteMany({ groupId, memberId });

    // Remove member
    await KuriMember.deleteOne({ _id: memberId, groupId });

    res.json({
      message: `മെമ്പർ ${member.name} (#${member.kuriNumber}) വിജയകരമായി ഡിലീറ്റ് ചെയ്തു`,
      deletedMemberId: memberId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/kuri/:id
// @desc    Admin edits Kuri Group details
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, totalAmount, monthlyInstallment, totalMonths, dueDayOfMonth, status } = req.body;
    const group = await KuriGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'കുറി ഗ്രൂപ്പ് കണ്ടെത്താനായില്ല' });
    }

    // Only Admin can edit
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'ഗ്രൂപ്പ് അഡ്മിന് മാത്രമേ എഡിറ്റ് ചെയ്യാൻ അനുമതിയുള്ളൂ' });
    }

    if (name) group.name = name;
    if (totalAmount) group.totalAmount = Number(totalAmount);
    if (monthlyInstallment) group.monthlyInstallment = Number(monthlyInstallment);
    if (totalMonths) group.totalMonths = Number(totalMonths);
    if (dueDayOfMonth) group.dueDayOfMonth = Number(dueDayOfMonth);
    if (status) group.status = status;

    await group.save();

    res.json({
      message: 'കുറി വിവരങ്ങൾ വിജയകരമായി പുതുക്കി',
      group,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
