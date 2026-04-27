import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * MVP API key guard.
 * Keys are stored in the API_KEYS env var as a comma-separated list.
 * Example: API_KEYS=key-abc123,key-def456
 *
 * For production with many clients, replace this with a DB lookup.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const key = req.headers['x-api-key'];
    const validKeys = process.env.API_KEYS?.split(',').map((k) => k.trim()) ?? [];

    if (!key || !validKeys.includes(key)) {
      throw new ForbiddenException({ error: 'invalid_api_key' });
    }

    return true;
  }
}
