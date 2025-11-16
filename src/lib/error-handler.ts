/**
 * Error Handler
 * Centralized error handling for API requests and application errors
 */

import { toast } from 'sonner';

export type ErrorType =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'timeout'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Parse error and determine type
 */
export function parseError(error: unknown): AppError {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
    };
  }

  // Timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'A requisição demorou muito. Tente novamente.',
    };
  }

  // HTTP errors
  if (error instanceof Error) {
    const message = error.message;

    // Extract status code if present
    const statusMatch = message.match(/HTTP (\d+):/);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

    if (statusCode === 401) {
      return {
        type: 'unauthorized',
        message: 'Sessão expirada. Faça login novamente.',
        statusCode,
      };
    }

    if (statusCode === 403) {
      return {
        type: 'forbidden',
        message: 'Você não tem permissão para realizar esta ação.',
        statusCode,
      };
    }

    if (statusCode === 404) {
      return {
        type: 'not_found',
        message: 'Recurso não encontrado.',
        statusCode,
      };
    }

    if (statusCode === 422) {
      return {
        type: 'validation',
        message: 'Dados inválidos. Verifique os campos e tente novamente.',
        statusCode,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        type: 'server',
        message: 'Erro no servidor. Tente novamente mais tarde.',
        statusCode,
      };
    }

    return {
      type: 'unknown',
      message: message || 'Ocorreu um erro inesperado.',
      statusCode,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: 'Ocorreu um erro inesperado.',
    details: error,
  };
}

/**
 * Handle error with toast notification
 */
export function handleError(error: unknown, customMessage?: string): AppError {
  const appError = parseError(error);

  // Use custom message if provided
  const message = customMessage || appError.message;

  // Show toast notification based on error type
  switch (appError.type) {
    case 'network':
      toast.error('Erro de Conexão', {
        description: message,
        duration: 5000,
      });
      break;

    case 'unauthorized':
      toast.error('Não Autorizado', {
        description: message,
        duration: 4000,
      });
      break;

    case 'forbidden':
      toast.error('Acesso Negado', {
        description: message,
        duration: 4000,
      });
      break;

    case 'not_found':
      toast.error('Não Encontrado', {
        description: message,
        duration: 3000,
      });
      break;

    case 'validation':
      toast.error('Dados Inválidos', {
        description: message,
        duration: 4000,
      });
      break;

    case 'server':
      toast.error('Erro no Servidor', {
        description: message,
        duration: 5000,
      });
      break;

    case 'timeout':
      toast.error('Tempo Esgotado', {
        description: message,
        duration: 4000,
      });
      break;

    default:
      toast.error('Erro', {
        description: message,
        duration: 4000,
      });
  }

  // Log error to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorHandler]', appError);
  }

  return appError;
}

/**
 * Handle error silently (no toast)
 */
export function handleErrorSilent(error: unknown): AppError {
  const appError = parseError(error);

  // Log error to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorHandler] Silent:', appError);
  }

  return appError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  return ['network', 'timeout', 'server'].includes(error.type);
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

/**
 * React Query error handler
 */
export function createQueryErrorHandler(customMessage?: string) {
  return (error: unknown) => {
    handleError(error, customMessage);
  };
}

/**
 * React Query retry function
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  // Don't retry more than 3 times
  if (failureCount >= 3) return false;

  // Parse error
  const appError = parseError(error);

  // Only retry network, timeout, and server errors
  return isRetryableError(appError);
}

/**
 * Format validation errors from backend
 */
export function formatValidationErrors(details: unknown): string {
  if (!details || typeof details !== 'object') {
    return 'Erro de validação';
  }

  // Handle FastAPI validation errors
  if (Array.isArray(details)) {
    return details
      .map((err: any) => {
        const field = err.loc?.join('.') || 'campo';
        return `${field}: ${err.msg}`;
      })
      .join(', ');
  }

  // Handle object validation errors
  if ('detail' in details && typeof details.detail === 'string') {
    return details.detail;
  }

  return 'Erro de validação';
}

/**
 * Create error message for specific operations
 */
export const errorMessages = {
  login: 'Falha no login. Verifique suas credenciais.',
  logout: 'Falha ao fazer logout.',
  fetch: 'Falha ao carregar dados.',
  create: 'Falha ao criar registro.',
  update: 'Falha ao atualizar registro.',
  delete: 'Falha ao excluir registro.',
  upload: 'Falha ao fazer upload do arquivo.',
  download: 'Falha ao fazer download do arquivo.',
  websocket: 'Falha na conexão WebSocket.',
};
