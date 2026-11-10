import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RejectPatchDto } from './dto/reject-patch.dto.js';
import { SubmitPatchDto } from './dto/submit-patch.dto.js';
import { PatchesService } from './patches.service.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class PatchesController {
  constructor(private readonly patches: PatchesService) {}

  @Get('incidents/:id/patches')
  list(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patches.list(req.user, id);
  }

  @Post('incidents/:id/patches')
  submit(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitPatchDto,
  ) {
    return this.patches.submit(req.user, id, dto);
  }

  @Post('patches/:id/verify')
  @HttpCode(200)
  verify(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patches.verify(req.user, id);
  }

  @Post('patches/:id/approve')
  @HttpCode(200)
  approve(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patches.approve(req.user, id);
  }

  @Post('patches/:id/reject')
  @HttpCode(200)
  reject(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPatchDto,
  ) {
    return this.patches.reject(req.user, id, dto);
  }
}
