module.exports = (simulator, aiEngine, io) => {
  return {
    submitComplaint: (req, res) => {
      const { category, subject, description, busId } = req.body;
      const user = req.user ? simulator.getUserById(req.user.id) : null;

      if (!subject || !description) {
        return res.status(400).json({ success: false, message: 'Subject and description are required.' });
      }

      const complaint = {
        id: `cmp-${Date.now()}`,
        studentId: user ? user.id : 'usr-student-01',
        studentName: user ? user.name : 'Navrachana Student',
        studentRoll: user ? user.rollNumber : 'NUV23CS101',
        busId: busId || (user ? user.assignedBusId : 'bus-01'),
        category: category || 'OTHER',
        subject: subject.trim(),
        description: description.trim(),
        status: 'PENDING',
        adminNotes: '',
        createdAt: new Date().toISOString()
      };

      simulator.getComplaints().unshift(complaint);

      // Add to operations alert stream for admin visibility
      aiEngine.addAlert({
        title: `Student Issue Logged: ${subject}`,
        message: `${user ? user.name : 'Student'} reported [${category}]: ${description.slice(0, 75)}...`,
        severity: category === 'DRIVER_BEHAVIOUR' ? 'WARNING' : 'INFO',
        source: 'Passenger Feedback Center'
      });

      if (io) {
        io.emit('new_complaint_logged', complaint);
      }

      res.status(201).json({
        success: true,
        message: 'Your report has been submitted to the NUV Transport Department for investigation.',
        complaint
      });
    },

    getComplaints: (req, res) => {
      const allComplaints = simulator.getComplaints();
      const user = req.user ? simulator.getUserById(req.user.id) : null;

      if (user && user.role === 'admin') {
        return res.json({ success: true, complaints: allComplaints });
      }

      // Students see their own complaints
      const userComplaints = allComplaints.filter(c => c.studentId === (user ? user.id : 'usr-student-01'));
      res.json({ success: true, complaints: userComplaints });
    },

    resolveComplaint: (req, res) => {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const complaint = simulator.getComplaints().find(c => c.id === id);
      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found.' });
      }

      if (status) complaint.status = status;
      if (adminNotes !== undefined) complaint.adminNotes = adminNotes;

      if (io) {
        io.emit('complaint_updated', complaint);
      }

      res.json({ success: true, message: `Issue ticket updated to ${complaint.status}.`, complaint });
    }
  };
};
