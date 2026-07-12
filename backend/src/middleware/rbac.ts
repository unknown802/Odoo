import type { RequestHandler } from "express";
import { ApiError } from "../errors.js";
import type { AuthenticatedRequest, Role } from "../types/index.js";

export function requireRole(roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.role)) {
      return next(new ApiError(403, "Insufficient role for this action", { allowedRoles: roles }));
    }

    return next();
  };
}
