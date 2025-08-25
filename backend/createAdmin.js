import 'dotenv/config.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import adminModel from './models/adminModel.js';

const createInitialAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await adminModel.findOne({ email: 'admin@fooddelivery.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    // Create initial admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123456', salt);

    const newAdmin = new adminModel({
      name: 'System Administrator',
      email: 'admin@fooddelivery.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await newAdmin.save();
    console.log('Initial admin created successfully!');
    console.log('Email: admin@fooddelivery.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Error creating initial admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

createInitialAdmin();