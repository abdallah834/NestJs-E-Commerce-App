// ngrok.service.ts
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import ngrok from '@ngrok/ngrok';

@Injectable()
export class NgrokService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(NgrokService.name);
  private listener: ngrok.Listener | null = null;

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    this.listener = await ngrok.forward({
      addr: process.env.PORT,
      authtoken_from_env: true,
    });

    this.logger.log(`Public ngrok URL: ${this.listener.url()}`);
  }

  async onApplicationShutdown(signal?: string) {
    if (!this.listener) return;

    try {
      await this.listener.close();
      this.logger.log(`ngrok tunnel closed (${signal ?? 'shutdown'})`);
    } catch (err) {
      this.logger.warn(`Failed to close ngrok tunnel: ${err}`);
    } finally {
      this.listener = null;
    }
  }
}
