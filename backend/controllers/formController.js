import ServiceRequest from '../models/ServiceRequest.js';
import RecruitmentApplication from '../models/RecruitmentApplication.js';
import CommunityRegistration from '../models/CommunityRegistration.js';
import ContactMessage from '../models/ContactMessage.js';
import Service from '../models/Service.js';
import mongoose from 'mongoose';

export const createServiceRequest = async (req, res) => {
  const criteria = mongoose.isObjectIdOrHexString(req.params.id) ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] } : { slug: req.params.id };
  const service = await Service.findOne(criteria);
  if (!service) return res.status(404).json({ message: 'Service not found.' });
  const { fullName, phone, email, nationalId, description, formData = {} } = req.body;
  if (!fullName || !phone || !description) return res.status(400).json({ message: 'Name, phone, and description are required.' });
  const missing = service.formSchema.filter(field => field.required && !formData[field.name]);
  if (missing.length) return res.status(400).json({ message: `Please complete: ${missing.map(field => field.label?.en || field.name).join(', ')}.` });
  await ServiceRequest.create({ service: service._id, fullName, phone, email, nationalId, description, formData });
  res.status(201).json({ message: 'Your request has been submitted. A service officer will contact you with next steps.' });
};

export const createRecruitmentApplication = async (req, res, next) => { 
  try {
    const { fullName, phone, email, educationLevel, address, statement, position } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Full name and phone number are required.' }); 
    }
    const application = await RecruitmentApplication.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      educationLevel: educationLevel || 'Bachelor Degree',
      address: address ? address.trim() : 'Addis Ababa',
      statement: statement ? statement.trim() : `Application for ${position || 'Cadet Police Officer'}`,
      position: position || 'Cadet Police Officer (Regular Service)',
      status: 'pending'
    }); 
    res.status(201).json({
      message: 'Your application has been successfully submitted. Our recruitment board will review your credentials and contact you.',
      application
    }); 
  } catch (err) {
    if (next) next(err);
    else res.status(500).json({ message: err.message || 'Error processing recruitment application.' });
  }
};

export const createCommunityRegistration = async (req, res) => {
  const { program, fullName, phone, email, subCity, message } = req.body;
  if (!fullName || !phone) {
    return res.status(400).json({ message: 'Full name and phone number are required.' });
  }
  const validPrograms = ['neighborhood_watch', 'volunteer', 'youth_engagement', 'partnership'];
  const progKey = (program || 'neighborhood_watch').replace(/-/g, '_').toLowerCase();
  const selectedProgram = validPrograms.includes(progKey) ? progKey : 'neighborhood_watch';

  const registration = await CommunityRegistration.create({
    program: selectedProgram,
    fullName,
    phone,
    email,
    subCity,
    message,
  });
  res.status(201).json({
    message: 'Thank you for registering! Your local community policing officer will contact you shortly.',
    registration,
  });
};

export const createContactMessage = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message, department } = req.body;
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!message || !message.trim() || message.trim().length < 10) {
      return res.status(400).json({ message: 'Message content is required (minimum 10 characters).' });
    }

    const doc = await ContactMessage.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      subject: (subject || 'Public Inquiry').trim(),
      message: message.trim(),
      department: (department || 'General Inquiries').trim(),
      status: 'new'
    });

    res.status(201).json({
      message: 'Thank you for reaching out to the Addis Ababa Police Commission. Your message has been received, and our communications desk will respond shortly.',
      id: doc._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process your message. Please try again or call 991 in case of emergency.' });
  }
};

