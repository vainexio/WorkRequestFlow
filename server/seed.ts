import mongoose from 'mongoose';
import User from './models/User';
import WorkRequest from './models/WorkRequest';
import Asset from './models/Asset';
import PreventiveMaintenance from './models/PreventiveMaintenance';
import { MONGODB_URI } from './db';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await mongoose.connection.db?.dropCollection('users').catch(() => {});
    await mongoose.connection.db?.dropCollection('workrequests').catch(() => {});
    await mongoose.connection.db?.dropCollection('assets').catch(() => {});
    await mongoose.connection.db?.dropCollection('preventivemaintenances').catch(() => {});
    await mongoose.connection.db?.dropCollection('servicereports').catch(() => {});
    console.log('Dropped existing collections');

    const users = await User.create([
      {
        email: 'manager@workquest.com',
        username: 'manager',
        password: 'password123',
        role: 'manager',
        name: 'Manager User',
      },
      {
        email: 'tech@workquest.com',
        username: 'tech',
        password: 'password123',
        role: 'technician',
        name: 'Technician User',
      },
      {
        email: 'employee@workquest.com',
        username: 'employee',
        password: 'password123',
        role: 'employee',
        name: 'Employee User',
      },
      {
        email: 'sarah@workquest.com',
        username: 'sarah',
        password: 'password123',
        role: 'employee',
        name: 'Sarah Connor',
      },
      {
        email: 'john@workquest.com',
        username: 'john',
        password: 'password123',
        role: 'technician',
        name: 'John Smith',
      },
    ]);

    console.log('Created users:', users.map(u => u.email));

    const assets = await Asset.create([
      {
        assetId: 'EQP-001',
        name: 'Server Room AC Unit',
        category: 'equipment',
        location: 'Building A, Floor 2, Server Room',
        purchaseDate: new Date('2022-01-15'),
        purchaseCost: 15000,
        depreciationRate: 15,
        currentValue: 12000,
        healthScore: 85,
        status: 'operational',
        maintenanceHistory: [
          {
            date: new Date('2024-06-15'),
            type: 'preventive',
            description: 'Regular filter cleaning and refrigerant check',
            technicianName: 'John Smith',
            cost: 200,
          },
        ],
        lastMaintenanceDate: new Date('2024-06-15'),
      },
      {
        assetId: 'MCH-001',
        name: 'CNC Milling Machine',
        category: 'machine',
        location: 'Building C, Floor 1, Workshop',
        purchaseDate: new Date('2021-05-20'),
        purchaseCost: 85000,
        depreciationRate: 10,
        currentValue: 68000,
        healthScore: 92,
        status: 'operational',
        maintenanceHistory: [
          {
            date: new Date('2024-09-01'),
            type: 'preventive',
            description: 'Lubrication and calibration',
            technicianName: 'Technician User',
            cost: 500,
          },
        ],
        lastMaintenanceDate: new Date('2024-09-01'),
      },
      {
        assetId: 'MCH-002',
        name: 'Industrial Laser Cutter',
        category: 'machine',
        location: 'Building C, Floor 1, Workshop',
        purchaseDate: new Date('2023-02-10'),
        purchaseCost: 120000,
        depreciationRate: 12,
        currentValue: 105000,
        healthScore: 98,
        status: 'operational',
        maintenanceHistory: [],
      },
      {
        assetId: 'EQP-002',
        name: 'Main Hall Projector',
        category: 'equipment',
        location: 'Building B, Floor 1, Main Hall',
        purchaseDate: new Date('2020-08-01'),
        purchaseCost: 3500,
        depreciationRate: 20,
        currentValue: 1800,
        healthScore: 65,
        status: 'operational',
        maintenanceHistory: [
          {
            date: new Date('2024-03-10'),
            type: 'corrective',
            description: 'Replaced lamp and cleaned filters',
            technicianName: 'John Smith',
            cost: 350,
          },
        ],
        lastMaintenanceDate: new Date('2024-03-10'),
      },
      {
        assetId: 'FRN-001',
        name: 'Executive Office Chair',
        category: 'furniture',
        location: 'Building A, Floor 4, Office 401',
        purchaseDate: new Date('2022-06-15'),
        purchaseCost: 800,
        depreciationRate: 10,
        currentValue: 640,
        healthScore: 80,
        status: 'operational',
        maintenanceHistory: [],
      },
      {
        assetId: 'EQP-003',
        name: 'Conference Room LED Panels',
        category: 'equipment',
        location: 'Building B, Floor 1, Conf Room B',
        purchaseDate: new Date('2021-11-20'),
        purchaseCost: 2500,
        depreciationRate: 15,
        currentValue: 1800,
        healthScore: 70,
        status: 'operational',
        maintenanceHistory: [],
      },
    ]);

    console.log('Created assets:', assets.map(a => a.assetId));

    const employeeUser = users.find(u => u.username === 'sarah');
    const techUser = users.find(u => u.username === 'tech');
    const managerUser = users.find(u => u.username === 'manager');

    if (!employeeUser || !techUser || !managerUser) {
      throw new Error('Required users not found');
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);

    const requests = await WorkRequest.create([
      {
        requestId: 'REQ-0001',
        tswrNo: `TSWR-${currentYear}-001`,
        assetId: 'EQP-001',
        assetName: 'Server Room AC Unit',
        location: 'Building A, Floor 2, Server Room',
        workDescription: 'The AC unit in the main server room is making a loud rattling noise and not cooling effectively. Temperature is rising.',
        urgency: 'immediately',
        disruptsOperation: true,
        status: 'scheduled',
        scheduledDate: new Date(Date.now() + 86400000),
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
        approvedBy: managerUser._id,
        approvedByName: managerUser.name,
        approvedAt: new Date(),
        assignedTo: techUser._id,
        assignedToName: techUser.name,
      },
      {
        requestId: 'REQ-0002',
        tswrNo: `TSWR-${currentYear}-002`,
        assetId: 'EQP-003',
        assetName: 'Conference Room LED Panels',
        location: 'Building B, Floor 1, Conf Room B',
        workDescription: 'The overhead LED panels are flickering intermittently, causing distraction during meetings.',
        urgency: 'standstill',
        disruptsOperation: false,
        status: 'pending',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
      },
      {
        requestId: 'REQ-0003',
        tswrNo: `TSWR-${currentYear}-003`,
        assetId: 'EQP-002',
        assetName: 'Main Hall Projector',
        location: 'Building B, Floor 1, Main Hall',
        workDescription: 'HDMI port on the main projector seems loose, signal cuts out during presentations.',
        urgency: 'on_occasion',
        disruptsOperation: true,
        status: 'pending',
        submittedBy: employeeUser._id,
        submittedByName: employeeUser.name,
      },
    ]);

    console.log('Created work requests:', requests.map(r => r.requestId));

    const pmSchedules = await PreventiveMaintenance.create([
      {
        scheduleId: 'PM-001',
        assetId: assets[0]._id,
        assetCode: 'EQP-001',
        assetName: 'Server Room AC Unit',
        description: 'Monthly AC unit inspection and filter cleaning',
        frequency: 'monthly',
        nextDueDate: new Date(Date.now() + 7 * 86400000),
        assignedTo: techUser._id,
        assignedToName: techUser.name,
        tasks: [
          'Check refrigerant levels',
          'Clean or replace air filters',
          'Inspect electrical connections',
          'Check thermostat calibration',
          'Clean condenser coils',
        ],
        estimatedDuration: 120,
        isActive: true,
        createdBy: managerUser._id,
        createdByName: managerUser.name,
      },
      {
        scheduleId: 'PM-002',
        assetId: assets[1]._id,
        assetCode: 'MCH-001',
        assetName: 'CNC Milling Machine',
        description: 'Weekly CNC machine lubrication and inspection',
        frequency: 'weekly',
        nextDueDate: new Date(Date.now() + 2 * 86400000),
        assignedTo: techUser._id,
        assignedToName: techUser.name,
        tasks: [
          'Lubricate all moving parts',
          'Check spindle alignment',
          'Inspect tool holder',
          'Verify coolant levels',
          'Clean chip tray',
        ],
        estimatedDuration: 60,
        isActive: true,
        createdBy: managerUser._id,
        createdByName: managerUser.name,
      },
      {
        scheduleId: 'PM-003',
        assetId: assets[2]._id,
        assetCode: 'MCH-002',
        assetName: 'Industrial Laser Cutter',
        description: 'Quarterly laser cutter calibration and lens cleaning',
        frequency: 'quarterly',
        nextDueDate: new Date(Date.now() + 30 * 86400000),
        tasks: [
          'Clean laser lens and mirrors',
          'Calibrate laser power output',
          'Check exhaust system',
          'Inspect safety interlocks',
          'Update firmware if available',
        ],
        estimatedDuration: 180,
        isActive: true,
        createdBy: managerUser._id,
        createdByName: managerUser.name,
      },
    ]);

    console.log('Created PM schedules:', pmSchedules.map(p => p.scheduleId));

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
