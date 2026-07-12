import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function asyncHandler<TReq extends Request = Request>(
  handler: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as TReq, res, next)).catch(next);
  };
}

export function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
  }

  if (error.message.includes("Supabase")) {
    return res.status(503).json({
      error: error.message,
      message: "Configure Supabase environment variables before using live API routes."
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    message: error.message
  });
}
