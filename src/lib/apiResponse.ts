import { NextApiResponse } from 'next';

type ResponseData = {
  success?: boolean;
  error?: string;
  data?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export function sendResponse(
  res: NextApiResponse,
  status: number,
  data: ResponseData
) {
  const response = {
    success: status >= 200 && status < 300,
    ...data
  };

  return res.status(status).json(response);
}

export function sendError(
  res: NextApiResponse,
  status: number,
  message: string,
  details?: any
) {
  return sendResponse(res, status, {
    error: message,
    ...(details && { details })
  });
}

export function sendSuccess(
  res: NextApiResponse,
  data?: any,
  meta?: ResponseData['meta']
) {
  return sendResponse(res, 200, {
    data,
    meta
  });
}