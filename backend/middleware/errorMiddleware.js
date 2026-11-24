export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || (err.code === 11000 ? 'This value already exists.' : 'Something went wrong.') });
};
