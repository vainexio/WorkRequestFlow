import mongoose from 'mongoose';
import User from './models/User';
import WorkRequest from './models/WorkRequest';

const MONGODB_URI = 'mongodb+srv://pandazbot:107697@cluster1.udu4e.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await mongoose.connection.db?.dropCollection('users').catch(() => {});
    await mongoose.connection.db?.dropCollection('workrequests').catch(() => {});
    console.log('Dropped existing collections');

    const users = await User.create([
      {
        username: 'manager',
        password: 'password123',
        role: 'manager',
        name: 'Manager User',
      },
      {
        username: 'tech',
        password: 'password123',
        role: 'technician',
        name: 'Technician User',
      },
      {
        username: 'employee',
        password: 'password123',
        role: 'employee',
        name: 'Employee User',
      },
      {
        username: 'sarah',
        password: 'password123',
        role: 'employee',
        name: 'Sarah Connor',
      },
      {
        username: 'john',
        password: 'password123',
        role: 'technician',
        name: 'John Smith',
      },
    ]);

    console.log('Created users:', users.map(u => u.username));

    const employeeUser = users.find(u => u.username === 'sarah');
    const techUser = users.find(u => u.username === 'tech');

    if (!employeeUser || !techUser) {
      throw new Error('Required users not found');
    }

    const requests = await WorkRequest.create([
      {
        requestId: 'REQ-1001',
        title: 'AC Unit Malfunction in Server Room',
        description: 'The AC unit in the main server room is making a loud rattling noise and not cooling effectively. Temperature is rising.',
        location: 'Building A, Floor 2, Server Room',
        status: 'in_progress',
        priority: 'critical',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
        assignedTo: techUser._id,
        assignedToName: techUser.name,
      },
      {
        requestId: 'REQ-1002',
        title: 'Flickering Lights in Conference Room B',
        description: 'The overhead LED panels are flickering intermittently, causing distraction during meetings.',
        location: 'Building B, Floor 1, Conf Room B',
        status: 'pending',
        priority: 'medium',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
      },
      {
        requestId: 'REQ-1003',
        title: 'Leaking Faucet in Kitchenette',
        description: 'The hot water tap is dripping constantly.',
        location: 'Building A, Floor 3, Kitchen',
        status: 'completed',
        priority: 'low',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
        assignedTo: techUser._id,
        assignedToName: techUser.name,
      },
      {
        requestId: 'REQ-1004',
        title: 'Broken Office Chair',
        description: 'Gas lift mechanism is broken, chair sinks when sat on.',
        location: 'Building C, Floor 2, Desk 42',
        status: 'rejected',
        priority: 'low',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
      },
      {
        requestId: 'REQ-1005',
        title: 'Projector Connection Issue',
        description: 'HDMI port on the main projector seems loose, signal cuts out.',
        location: 'Building B, Floor 1, Main Hall',
        status: 'pending',
        priority: 'high',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
      },
    ]);

    console.log('Created work requests:', requests.map(r => r.requestId));

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
