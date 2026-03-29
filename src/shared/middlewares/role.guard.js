const roleGuard = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tenés permiso para realizar esta acción' })
  }
  next()
}

export default roleGuard