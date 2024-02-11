const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

// Delete One Document
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const Doc = await Model.findByIdAndDelete(req.params.id);

    if (!Doc) {
      // return: we used return here for immidietly go to the in "globa-error-handler" and don't run after this code!
      return next(new AppError("Invalid Document Id", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// Update One Document
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const Doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!Doc) {
      // return: we used return here for immidietly go to the in "globa-error-handler" and don't run after this code!
      return next(new AppError("Invalid Document Id", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        Doc,
      },
    });
  });

// Create One Document
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: newDoc,
      },
    });
  });

// Reading One Document
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const Doc = await query;

    if (!Doc) {
      // return: we used return here for immidietly go to the in "globa-error-handler" and don't run after this code!
      return next(new AppError("Invalid Documents Id", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: Doc,
      },
    });
  });

// Reading all Document
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const Doc = await features.query.explain();
    const Doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: Doc.length,
      data: {
        Doc,
      },
    });
  });
