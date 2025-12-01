import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI } from "@google/genai";
import User from "./models/User";
import WorkRequest from "./models/WorkRequest";
import Asset from "./models/Asset";
import ServiceReport from "./models/ServiceReport";
import PreventiveMaintenance from "./models/PreventiveMaintenance";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await User.findOne({ username: username.toLowerCase() });

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user._id.toString();
      req.session.username = user.username;
      req.session.role = user.role;

      return res.json({
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Asset Routes
  app.get("/api/assets", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const assets = await Asset.find().sort({ assetId: 1 });
      return res.json(assets);
    } catch (error) {
      console.error("Get assets error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/assets/:assetId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const asset = await Asset.findOne({ assetId: req.params.assetId });
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      return res.json(asset);
    } catch (error) {
      console.error("Get asset error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can create assets" });
      }

      const { name, category, location, purchaseDate, purchaseCost, depreciationRate } = req.body;
      
      const count = await Asset.countDocuments();
      const prefix = category === 'machine' ? 'MCH' : category === 'furniture' ? 'FRN' : 'EQP';
      const assetId = `${prefix}-${String(count + 1).padStart(3, '0')}`;

      const asset = await Asset.create({
        assetId,
        name,
        category,
        location,
        purchaseDate,
        purchaseCost,
        depreciationRate: depreciationRate || 10,
        currentValue: purchaseCost,
        healthScore: 100,
        status: 'operational',
      });

      return res.status(201).json(asset);
    } catch (error) {
      console.error("Create asset error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Work Request Routes
  app.get("/api/requests", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let query: any = {};

      if (user.role === "employee") {
        query.submittedBy = user._id;
      } else if (user.role === "technician") {
        query.assignedTo = user._id;
      }

      const requests = await WorkRequest.find(query).sort({ createdAt: -1 });

      const formattedRequests = requests.map(req => ({
        id: req.requestId,
        tswrNo: req.tswrNo,
        assetId: req.assetId,
        assetName: req.assetName,
        location: req.location,
        workDescription: req.workDescription,
        urgency: req.urgency,
        disruptsOperation: req.disruptsOperation,
        status: req.status,
        denialReason: req.denialReason,
        scheduledDate: req.scheduledDate,
        submittedBy: req.submittedByName,
        submittedById: req.submittedBy?.toString(),
        submittedAt: req.createdAt.toISOString(),
        approvedBy: req.approvedByName,
        approvedAt: req.approvedAt,
        assignedTo: req.assignedToName,
        resolvedAt: req.resolvedAt,
        closedAt: req.closedAt,
        requesterFeedback: req.requesterFeedback,
        requesterConfirmedAt: req.requesterConfirmedAt,
        turnaroundTime: req.turnaroundTime,
        serviceReportId: req.serviceReportId,
      }));

      return res.json(formattedRequests);
    } catch (error) {
      console.error("Get requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/requests/all", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'manager' && user.role !== 'technician')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const requests = await WorkRequest.find().sort({ createdAt: -1 });

      const formattedRequests = requests.map(req => ({
        id: req.requestId,
        tswrNo: req.tswrNo,
        assetId: req.assetId,
        assetName: req.assetName,
        location: req.location,
        workDescription: req.workDescription,
        urgency: req.urgency,
        disruptsOperation: req.disruptsOperation,
        status: req.status,
        denialReason: req.denialReason,
        scheduledDate: req.scheduledDate,
        submittedBy: req.submittedByName,
        submittedById: req.submittedBy?.toString(),
        submittedAt: req.createdAt.toISOString(),
        approvedBy: req.approvedByName,
        approvedAt: req.approvedAt,
        assignedTo: req.assignedToName,
        resolvedAt: req.resolvedAt,
        closedAt: req.closedAt,
        requesterFeedback: req.requesterFeedback,
        requesterConfirmedAt: req.requesterConfirmedAt,
        turnaroundTime: req.turnaroundTime,
        serviceReportId: req.serviceReportId,
      }));

      return res.json(formattedRequests);
    } catch (error) {
      console.error("Get all requests error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { assetId, workDescription, urgency, disruptsOperation, attachmentUrl } = req.body;

      if (!assetId || !workDescription) {
        return res.status(400).json({ message: "Asset ID and work description are required" });
      }

      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        return res.status(400).json({ message: "Invalid Asset ID. Asset must be registered in the system." });
      }

      const count = await WorkRequest.countDocuments();
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const requestNumber = String(count + 1).padStart(3, '0');
      const requestId = `REQ-${requestNumber}`;
      const tswrNo = `TSWR-${currentYear}-${requestNumber}`;

      const newRequest = await WorkRequest.create({
        requestId,
        tswrNo,
        assetId: asset.assetId,
        assetName: asset.name,
        location: asset.location,
        workDescription,
        urgency: urgency || 'standstill',
        disruptsOperation: disruptsOperation || false,
        attachmentUrl,
        status: 'pending',
        submittedBy: user._id,
        submittedByName: user.name,
      });

      return res.status(201).json({
        id: newRequest.requestId,
        tswrNo: newRequest.tswrNo,
        assetId: newRequest.assetId,
        assetName: newRequest.assetName,
        location: newRequest.location,
        workDescription: newRequest.workDescription,
        urgency: newRequest.urgency,
        disruptsOperation: newRequest.disruptsOperation,
        status: newRequest.status,
        submittedBy: newRequest.submittedByName,
        submittedById: newRequest.submittedBy.toString(),
        submittedAt: newRequest.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Create request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manager: Approve and schedule request
  app.patch("/api/requests/:id/approve", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can approve requests" });
      }

      const { id } = req.params;
      const { technicianId, scheduledDate, urgency } = req.body;

      if (!technicianId || !scheduledDate) {
        return res.status(400).json({ message: "Technician and scheduled date are required" });
      }

      const technician = await User.findById(technicianId);
      if (!technician || technician.role !== 'technician') {
        return res.status(400).json({ message: "Invalid technician" });
      }

      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'scheduled';
      request.approvedBy = user._id;
      request.approvedByName = user.name;
      request.approvedAt = new Date();
      request.assignedTo = technician._id;
      request.assignedToName = technician.name;
      request.scheduledDate = new Date(scheduledDate);
      if (urgency) {
        request.urgency = urgency;
      }
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
        assignedTo: request.assignedToName,
        scheduledDate: request.scheduledDate,
      });
    } catch (error) {
      console.error("Approve request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manager: Deny request
  app.patch("/api/requests/:id/deny", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can deny requests" });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Denial reason is required" });
      }

      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'denied';
      request.denialReason = reason;
      request.approvedBy = user._id;
      request.approvedByName = user.name;
      request.approvedAt = new Date();
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
        denialReason: request.denialReason,
      });
    } catch (error) {
      console.error("Deny request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Technician: Start work (ongoing)
  app.patch("/api/requests/:id/start", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only technicians can start work on requests" });
      }

      const { id } = req.params;
      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'ongoing';
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
      });
    } catch (error) {
      console.error("Start work error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Technician: Mark as resolved
  app.patch("/api/requests/:id/resolve", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only technicians can resolve requests" });
      }

      const { id } = req.params;
      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'resolved';
      request.resolvedAt = new Date();
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
        resolvedAt: request.resolvedAt,
      });
    } catch (error) {
      console.error("Resolve request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Technician: Mark as cannot resolve
  app.patch("/api/requests/:id/cannot-resolve", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only technicians can mark requests as cannot resolve" });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'cannot_resolve';
      request.denialReason = reason;
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
      });
    } catch (error) {
      console.error("Cannot resolve error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Employee: Confirm completion with feedback
  app.patch("/api/requests/:id/confirm", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { id } = req.params;
      const { feedback } = req.body;
      
      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.submittedBy.toString() !== user._id.toString() && user.role !== 'manager') {
        return res.status(403).json({ message: "Only the requester can confirm completion" });
      }

      request.requesterFeedback = feedback;
      request.requesterConfirmedAt = new Date();
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
        requesterConfirmedAt: request.requesterConfirmedAt,
      });
    } catch (error) {
      console.error("Confirm completion error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manager: Close request
  app.patch("/api/requests/:id/close", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can close requests" });
      }

      const { id } = req.params;
      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = 'closed';
      request.closedAt = new Date();
      request.closedBy = user._id;
      request.closedByName = user.name;
      
      const turnaroundTime = Math.round((request.closedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60));
      request.turnaroundTime = turnaroundTime;
      
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
        closedAt: request.closedAt,
        turnaroundTime: request.turnaroundTime,
      });
    } catch (error) {
      console.error("Close request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service Report Routes
  app.get("/api/service-reports", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let query: any = {};
      if (user.role === 'technician') {
        query.preparedBy = user._id;
      }

      const reports = await ServiceReport.find(query).sort({ createdAt: -1 });
      return res.json(reports);
    } catch (error) {
      console.error("Get service reports error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/service-reports", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Only technicians can create service reports" });
      }

      const {
        tswrNo,
        workRequestId,
        assetId,
        workDescription,
        remarks,
        urgency,
        workStartTime,
        workEndTime,
        laborCost,
        partsMaterials,
        serviceType,
        hoursDown,
        reportFindings,
        serviceDate,
      } = req.body;

      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        return res.status(400).json({ message: "Invalid Asset ID" });
      }

      const workRequest = await WorkRequest.findOne({ tswrNo });

      const startTime = new Date(workStartTime);
      const endTime = new Date(workEndTime);
      const manHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      const totalPartsCost = (partsMaterials || []).reduce((sum: number, part: any) => sum + (part.cost * part.quantity), 0);

      const count = await ServiceReport.countDocuments();
      const reportId = `SR-${String(count + 1).padStart(4, '0')}`;

      const report = await ServiceReport.create({
        reportId,
        tswrNo,
        workRequestId: workRequest?._id,
        assetId: asset.assetId,
        assetName: asset.name,
        assetCode: asset.assetId,
        location: asset.location,
        workDescription,
        remarks,
        urgency,
        workStartTime: startTime,
        workEndTime: endTime,
        manHours,
        laborCost: laborCost || 0,
        partsMaterials: partsMaterials || [],
        totalPartsCost,
        serviceType,
        hoursDown: hoursDown || 0,
        reportFindings,
        serviceDate: new Date(serviceDate),
        preparedBy: user._id,
        preparedByName: user.name,
      });

      if (workRequest) {
        workRequest.serviceReportId = report._id;
        await workRequest.save();
      }

      asset.maintenanceHistory.push({
        date: new Date(serviceDate),
        type: serviceType === 'planned' ? 'preventive' : 'corrective',
        description: workDescription,
        technicianName: user.name,
        cost: totalPartsCost + (laborCost || 0),
        partsReplaced: (partsMaterials || []).map((p: any) => p.partName),
      });
      asset.lastMaintenanceDate = new Date(serviceDate);
      await asset.save();

      return res.status(201).json(report);
    } catch (error) {
      console.error("Create service report error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Preventive Maintenance Routes
  app.get("/api/pm-schedules", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      let query: any = { isActive: true };
      if (user.role === 'technician') {
        query.assignedTo = user._id;
      }

      const schedules = await PreventiveMaintenance.find(query).sort({ nextDueDate: 1 });
      return res.json(schedules);
    } catch (error) {
      console.error("Get PM schedules error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pm-schedules", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can create PM schedules" });
      }

      const { assetId, description, frequency, nextDueDate, technicianId, tasks, estimatedDuration } = req.body;

      const asset = await Asset.findOne({ assetId });
      if (!asset) {
        return res.status(400).json({ message: "Invalid Asset ID" });
      }

      let technician = null;
      if (technicianId) {
        technician = await User.findById(technicianId);
      }

      const count = await PreventiveMaintenance.countDocuments();
      const scheduleId = `PM-${String(count + 1).padStart(3, '0')}`;

      const schedule = await PreventiveMaintenance.create({
        scheduleId,
        assetId: asset._id,
        assetCode: asset.assetId,
        assetName: asset.name,
        description,
        frequency,
        nextDueDate: new Date(nextDueDate),
        assignedTo: technician?._id,
        assignedToName: technician?.name,
        tasks: tasks || [],
        estimatedDuration: estimatedDuration || 60,
        isActive: true,
        createdBy: user._id,
        createdByName: user.name,
      });

      asset.nextScheduledMaintenance = new Date(nextDueDate);
      await asset.save();

      return res.status(201).json(schedule);
    } catch (error) {
      console.error("Create PM schedule error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/pm-schedules/:id/complete", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const schedule = await PreventiveMaintenance.findOne({ scheduleId: req.params.id });
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      schedule.lastCompletedDate = new Date();
      
      const frequencyDays: Record<string, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        semi_annual: 180,
        annual: 365,
      };
      
      const daysToAdd = frequencyDays[schedule.frequency] || 30;
      schedule.nextDueDate = new Date(Date.now() + daysToAdd * 86400000);
      await schedule.save();

      return res.json(schedule);
    } catch (error) {
      console.error("Complete PM schedule error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Management Routes
  app.get("/api/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can view all users" });
      }

      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/technicians", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const technicians = await User.find({ role: 'technician' }).select('name username _id');
      return res.json(technicians.map(t => ({
        id: t._id,
        name: t.name,
        username: t.username,
      })));
    } catch (error) {
      console.error("Get technicians error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const currentUser = await User.findById(req.session.userId);
      if (!currentUser || currentUser.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can create users" });
      }

      const { username, password, role, name } = req.body;

      if (!username || !password || !role || !name) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await User.create({
        username: username.toLowerCase(),
        password,
        role,
        name,
      });

      return res.status(201).json({
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const currentUser = await User.findById(req.session.userId);
      if (!currentUser || currentUser.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can update users" });
      }

      const { name, role, password } = req.body;
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (name) user.name = name;
      if (role) user.role = role;
      if (password) user.password = password;
      
      await user.save();

      return res.json({
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const currentUser = await User.findById(req.session.userId);
      if (!currentUser || currentUser.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can delete users" });
      }

      if (req.params.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Gemini AI Integration
  app.get("/api/ai/summary/:assetId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || (user.role !== 'technician' && user.role !== 'manager')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { assetId } = req.params;
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const reports = await ServiceReport.find({
        assetId,
        createdAt: { $gte: thirtyDaysAgo },
      }).sort({ createdAt: -1 });

      if (reports.length === 0) {
        return res.json({ 
          summary: "No service reports found for this asset in the last 30 days.",
          reportCount: 0,
        });
      }

      const workDescriptions = reports.map(r => 
        `Date: ${r.serviceDate.toLocaleDateString()}, Description: ${r.workDescription}, Findings: ${r.reportFindings}`
      ).join('\n\n');

      const prompt = `Analyze the following service report work descriptions for a piece of equipment and provide a concise summary of the maintenance activities, common issues, and overall equipment health trend over the last 30 days. Be specific and actionable.

Work Descriptions:
${workDescriptions}

Please provide:
1. Summary of maintenance activities performed
2. Common issues identified
3. Equipment health trend assessment
4. Recommendations for future maintenance`;

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ message: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const summary = response.text || 'Unable to generate summary';

      return res.json({
        summary,
        reportCount: reports.length,
        dateRange: {
          from: thirtyDaysAgo.toISOString(),
          to: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("AI summary error:", error);
      return res.status(500).json({ message: "Failed to generate AI summary" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const totalRequests = await WorkRequest.countDocuments();
      const pendingRequests = await WorkRequest.countDocuments({ status: 'pending' });
      const scheduledRequests = await WorkRequest.countDocuments({ status: 'scheduled' });
      const ongoingRequests = await WorkRequest.countDocuments({ status: 'ongoing' });
      const resolvedRequests = await WorkRequest.countDocuments({ status: 'resolved' });
      const closedRequests = await WorkRequest.countDocuments({ status: 'closed' });
      const deniedRequests = await WorkRequest.countDocuments({ status: 'denied' });
      const cannotResolveRequests = await WorkRequest.countDocuments({ status: 'cannot_resolve' });

      const totalAssets = await Asset.countDocuments();
      const operationalAssets = await Asset.countDocuments({ status: 'operational' });
      const underMaintenanceAssets = await Asset.countDocuments({ status: 'under_maintenance' });

      const technicians = await User.countDocuments({ role: 'technician' });

      const closedWithTime = await WorkRequest.find({ 
        status: 'closed', 
        turnaroundTime: { $exists: true } 
      });
      const avgTurnaround = closedWithTime.length > 0 
        ? Math.round(closedWithTime.reduce((sum, r) => sum + (r.turnaroundTime || 0), 0) / closedWithTime.length)
        : 0;

      return res.json({
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          scheduled: scheduledRequests,
          ongoing: ongoingRequests,
          resolved: resolvedRequests,
          closed: closedRequests,
          denied: deniedRequests,
          cannotResolve: cannotResolveRequests,
        },
        assets: {
          total: totalAssets,
          operational: operationalAssets,
          underMaintenance: underMaintenanceAssets,
        },
        technicians,
        avgTurnaroundHours: avgTurnaround,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
