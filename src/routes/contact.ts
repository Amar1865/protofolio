import { Router } from 'express';
import { createContactInquiry, logActivity } from '../db/queries.ts';

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (typeof subject !== 'string' || subject.trim().length < 3) {
      return res
        .status(400)
        .json({ error: 'Please enter a subject (at least 3 characters).' });
    }
    if (typeof message !== 'string' || message.trim().length < 10) {
      return res
        .status(400)
        .json({ error: 'Please enter a message of at least 10 characters.' });
    }

    const inquiry = await createContactInquiry({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await logActivity({
      userId: null,
      actorEmail: inquiry.email,
      action: 'CONTACT_SUBMITTED',
      entityType: 'contact',
      details: `Contact inquiry received: ${inquiry.subject}`,
    });

    return res.status(201).json({
      message: 'Your inquiry has been received. Our team will respond within one business day.',
      inquiryId: inquiry.id,
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'Failed to submit contact form.' });
  }
});

export default router;
