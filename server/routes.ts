import type { Express } from "express";
import { createServer, type Server } from "http";
import User from "./models/User";
import WorkRequest from "./models/WorkRequest";

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
        title: req.title,
        description: req.description,
        location: req.location,
        status: req.status,
        priority: req.priority,
        submittedBy: req.submittedByName,
        submittedAt: req.createdAt.toISOString(),
        assignedTo: req.assignedToName,
      }));

      return res.json(formattedRequests);
    } catch (error) {
      console.error("Get requests error:", error);
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

      const { title, description, location, priority } = req.body;

      if (!title || !description || !location) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const count = await WorkRequest.countDocuments();
      const requestId = `REQ-${String(count + 1001).padStart(4, '0')}`;

      const newRequest = await WorkRequest.create({
        requestId,
        title,
        description,
        location,
        priority: priority || 'medium',
        status: 'pending',
        submittedBy: user._id,
        submittedByName: user.name,
      });

      return res.status(201).json({
        id: newRequest.requestId,
        title: newRequest.title,
        description: newRequest.description,
        location: newRequest.location,
        status: newRequest.status,
        priority: newRequest.priority,
        submittedBy: newRequest.submittedByName,
        submittedAt: newRequest.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Create request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/requests/:id/status", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.status = status;
      await request.save();

      return res.json({
        id: request.requestId,
        status: request.status,
      });
    } catch (error) {
      console.error("Update status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/requests/:id/assign", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can assign requests" });
      }

      const { id } = req.params;
      const { technicianName } = req.body;

      if (!technicianName) {
        return res.status(400).json({ message: "Technician name is required" });
      }

      const technician = await User.findOne({ name: technicianName });
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }

      const request = await WorkRequest.findOne({ requestId: id });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      request.assignedTo = technician._id;
      request.assignedToName = technician.name;
      request.status = 'in_progress';
      await request.save();

      return res.json({
        id: request.requestId,
        assignedTo: request.assignedToName,
        status: request.status,
      });
    } catch (error) {
      console.error("Assign request error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/technicians", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== 'manager') {
        return res.status(403).json({ message: "Only managers can view technicians" });
      }

      const technicians = await User.find({ role: 'technician' }).select('name username');
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

  return httpServer;
}
