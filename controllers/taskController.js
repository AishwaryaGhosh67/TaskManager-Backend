const Task = require('../models/Task'); // Ensure Task model is imported correctly
const User = require('../models/User'); // Add this to check if the user exists

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo } = req.body;

    if (!title || !description || !dueDate || !priority || !assignedTo) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ msg: 'Assigned user not found' });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      createdBy: req.user.id,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ msg: 'Error creating task' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, priority, dueDate, search } = req.query;

    const accessFilter = {
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    };

    const otherFilters = {};

    if (status) otherFilters.status = status;
    if (priority) otherFilters.priority = priority;
    if (dueDate) otherFilters.dueDate = { $lte: new Date(dueDate) };
    if (search) {
      otherFilters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const filter = { $and: [accessFilter, otherFilters] };
    const tasks = await Task.find(filter).populate('assignedTo', 'name email');
    res.status(200).json(tasks);
  } catch (err) {
    console.error('🔥 Error fetching tasks:', err);
    res.status(500).json({ msg: 'Error fetching tasks' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.createdBy.toString() !== req.user.id && task.assignedTo?.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.createdBy.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only creator can delete' });

    await task.deleteOne();
    res.status(200).json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting task' });
  }
};
