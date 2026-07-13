// grubsy-backend/src/utils/validate.js
// Validation and response utilities

export function ok(res, data) {
  return res.json({
    success: true,
    data,
  });
}

export function badRequest(res, message, field = null) {
  return res.status(400).json({
    success: false,
    error: message,
    field,
  });
}

export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

export function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({
    success: false,
    error: message,
  });
}

export function notFound(res, message = 'Not found') {
  return res.status(404).json({
    success: false,
    error: message,
  });
}

export function serverError(res, message = 'Internal server error') {
  return res.status(500).json({
    success: false,
    error: message,
  });
}