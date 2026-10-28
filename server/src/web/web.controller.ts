import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { clientEntry } from './client-files.js';

/** Only known browser routes receive HTML. Missing APIs and assets remain real 404s. */
@Controller()
export class WebController {
  @Get(['/', '/room/:roomId'])
  page(@Res() response: Response): void {
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(clientEntry);
  }
}
