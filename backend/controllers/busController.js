const Bus = require('../models/Bus');

// @desc    Create new bus (Admin only)
// @route   POST /api/buses
// @access  Private/Admin
exports.createBus = async (req, res) => {
  try {
    // Check if bus number already exists
    const existingBus = await Bus.findOne({ busNumber: req.body.busNumber });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: `Bus with number ${req.body.busNumber} already exists`
      });
    }

    const bus = await Bus.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      bus
    });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bus',
      error: error.message
    });
  }
};

// @desc    Get all buses (with filters)
// @route   GET /api/buses
// @access  Public
exports.getAllBuses = async (req, res) => {
  try {
    const { from, to, date, busType, status } = req.query;
    
    // Build query
    let query = {};
    
    if (from) query.from = new RegExp(from, 'i');
    if (to) query.to = new RegExp(to, 'i');
    if (busType) query.busType = busType;
    if (status) query.status = status;
    else query.status = 'active'; // Default to active buses

    const buses = await Bus.find(query).sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses',
      error: error.message
    });
  }
};

// @desc    Search buses
// @route   GET /api/buses/search
// @access  Public
exports.searchBuses = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Please provide starting location and destination'
      });
    }

    const buses = await Bus.find({
      from: new RegExp(from, 'i'),
      to: new RegExp(to, 'i'),
      status: 'active'
    }).sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: buses.length,
      searchParams: { from, to, date },
      buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

// @desc    Get single bus by ID
// @route   GET /api/buses/:id
// @access  Public
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).json({
      success: true,
      bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus',
      error: error.message
    });
  }
};

// @desc    Update bus (Admin only)
// @route   PUT /api/buses/:id
// @access  Private/Admin
exports.updateBus = async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    });
  }
};

// @desc    Delete bus (Admin only)
// @route   DELETE /api/buses/:id
// @access  Private/Admin
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    await bus.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bus',
      error: error.message
    });
  }
};

// @desc    Get available seats for a bus
// @route   GET /api/buses/:id/seats
// @access  Public
exports.getBusSeats = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).json({
      success: true,
      busName: bus.busName,
      totalSeats: bus.totalSeats,
      availableSeats: bus.availableSeats,
      seatLayout: bus.seatLayout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seat information',
      error: error.message
    });
  }
};

// @desc    Get unique routes
// @route   GET /api/buses/routes/all
// @access  Public
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Bus.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          fromLocations: { $addToSet: '$from' },
          toLocations: { $addToSet: '$to' }
        }
      }
    ]);

    if (routes.length === 0) {
      return res.status(200).json({
        success: true,
        fromLocations: [],
        toLocations: []
      });
    }

    res.status(200).json({
      success: true,
      fromLocations: routes[0].fromLocations.sort(),
      toLocations: routes[0].toLocations.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};