const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');


// @route   POST /api/tasks
// @desc    Create a task
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, priority, assignedTo } = req.body;

    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      createdBy: req.user.id, //  Injecting authenticated user ID
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Task creation failed' });
  }
});


// Get all tasks for user
// GET all tasks created by the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user.id }).populate('assignedTo', 'name email');
    res.status(200).json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// UPDATE a task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Update allowed fields only
    const { title, description, dueDate, priority, status, assignedTo } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await Task.findOneAndDelete({
      _id: taskId,
      createdBy: userId, // optional: ensures user can delete only their own task
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or not authorized' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
