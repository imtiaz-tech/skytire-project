import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FingerprintService {
  private readonly secretKey = process.env.FINGERPRINT_SECRET_KEY;

  constructor(private readonly httpService: HttpService) {}

  async getEventData(eventId: string): Promise<any> {
    if (!this.secretKey) {
      console.warn('FINGERPRINT_SECRET_KEY is not defined. Ensure it is set in .env');
      // If we don't have a key, we might mock this or fail. Let's just throw.
      throw new HttpException('Server misconfiguration: Fingerprint key missing', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const url = `https://api.fpjs.io/events/${eventId}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Auth-API-Key': this.secretKey,
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      console.error('Fingerprint SDK error:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to verify fingerprint event',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
